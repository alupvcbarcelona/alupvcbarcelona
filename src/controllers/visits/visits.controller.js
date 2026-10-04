const VISIT_MODEL = require("../../models/visit.model");
const { GET_REQUEST_INFO, MASK_IP } = require("../../utils/request-info");
const MESSAGE_MODEL = require("../../models/message.model");
const { LOCATE } = require("../../utils/geolocation");

const BOT_REGEX = /bot|crawler|spider|crawling|headless|lighthouse|preview|facebookexternalhit|slurp/i;
const TZ = "Europe/Madrid";

const REFERRER_HOST = (referrer) => {
  try {
    return referrer ? new URL(referrer).hostname.replace(/^www\./, "") : "";
  } catch {
    return "";
  }
};

//======================================================
// PUBLIC: TRACK A PAGE VIEW
//======================================================
const TRACK_VISIT = async (req, res) => {
  // BOTS Y PANEL: SE DESCARTAN ANTES DE CONSULTAR LA GEOLOCALIZACIÓN
  if (BOT_REGEX.test(req.headers["user-agent"] || "")) return res.status(204).end();
  const path = String(req.body.path || "/").slice(0, 300);
  if (path.startsWith("/admin")) return res.status(204).end();

  const info = await GET_REQUEST_INFO(req);

  const consent = req.body.consent === true;
  const referrer = REFERRER_HOST(req.body.referrer);
  const ownHost = REFERRER_HOST(req.headers.origin);

  await VISIT_MODEL.create({
    path,
    referrer: referrer && referrer !== ownHost ? referrer : "",
    ip: consent ? info.ip : MASK_IP(info.ip),
    consent,
    visitorId: info.visitorId,
    country: info.country,
    region: info.region,
    city: info.city,
    device: info.device,
    browser: info.browser,
    os: info.os,
  });

  return res.status(204).end();
};

//======================================================
// ADMIN: STATS (?days=30)
// VISITS ARE GROUPED IN NODE: A SMALL BUSINESS SITE STAYS FAR BELOW ANY LIMIT
//======================================================
const DAY = new Intl.DateTimeFormat("en-CA", { timeZone: TZ });
const HOUR = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", hourCycle: "h23" });

// TOP VALUES OF A FIELD: [{ name, views, visitors }]
const TOP = (visits, key, limit = 10) => {
  const groups = new Map();
  visits.forEach((visit) => {
    const name = typeof key === "function" ? key(visit) : visit[key];
    if (!name) return;
    const group = groups.get(name) || { name, views: 0, ids: new Set() };
    group.views += 1;
    group.ids.add(visit.visitorId);
    groups.set(name, group);
  });
  return [...groups.values()]
    .sort((a, b) => b.views - a.views)
    .slice(0, limit)
    .map(({ name, views, ids }) => ({ name, views, visitors: ids.size }));
};

const UNIQUE = (visits) => new Set(visits.map((v) => v.visitorId)).size;

const GET_STATS = async (req, res) => {
  const days = Math.min(Math.max(Number(req.query.days) || 30, 1), 395);
  const now = new Date();
  const from = new Date(now.getTime() - days * 86_400_000);
  const previousFrom = new Date(from.getTime() - days * 86_400_000);

  const [visits, previous, recent] = await Promise.all([
    VISIT_MODEL.find({ createdAt: { $gte: from } })
      .select("createdAt visitorId path referrer country city device browser os -_id")
      .lean(),
    VISIT_MODEL.find({ createdAt: { $gte: previousFrom, $lt: from } }).select("visitorId -_id").lean(),
    VISIT_MODEL.find().sort({ createdAt: -1 }).limit(50).select("-visitorId").lean(),
  ]);

  // TIMELINE BY DAY (EMPTY DAYS INCLUDED) AND BY HOUR (MADRID TIME)
  const perDay = new Map();
  const byHour = Array.from({ length: 24 }, (_, hour) => ({ hour, views: 0 }));
  visits.forEach((visit) => {
    const date = DAY.format(visit.createdAt);
    const entry = perDay.get(date) || { views: 0, ids: new Set() };
    entry.views += 1;
    entry.ids.add(visit.visitorId);
    perDay.set(date, entry);
    byHour[Number(HOUR.format(visit.createdAt))].views += 1;
  });

  const byDay = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = DAY.format(new Date(now.getTime() - i * 86_400_000));
    const entry = perDay.get(date);
    byDay.push({ date, views: entry?.views || 0, visitors: entry?.ids.size || 0 });
  }

  const cities = TOP(visits, (v) => v.city && `${v.city}|${v.country}`).map((c) => {
    const [name, country] = c.name.split("|");
    return { ...c, name, country };
  });

  return res.status(200).json({
    success: true,
    data: {
      days,
      totals: { views: visits.length, visitors: UNIQUE(visits) },
      previous: { views: previous.length, visitors: UNIQUE(previous) },
      byDay,
      byHour,
      countries: TOP(visits, "country"),
      cities,
      pages: TOP(visits, "path"),
      referrers: TOP(visits, "referrer", 8),
      devices: TOP(visits, "device", 5),
      browsers: TOP(visits, "browser", 6),
      os: TOP(visits, "os", 6),
      recent,
    },
  });
};

//======================================================
// ADMIN: CORREGIR LA UBICACIÓN DE VISITAS YA GUARDADAS
// Vuelve a geolocalizar las IPs de las visitas de Rumanía o sin país (máx. 150 IPs por llamada)
//======================================================
const RELOCATE_VISITS = async (req, res) => {
  const countries = Array.isArray(req.body.countries) && req.body.countries.length ? req.body.countries : ["RO", "", null];
  const ips = (await VISIT_MODEL.distinct("ip", { country: { $in: countries }, ip: { $nin: [null, ""] } })).slice(0, 150);

  let updated = 0;
  let unchanged = 0;
  for (const ip of ips) {
    const location = await LOCATE(ip.endsWith(".0") ? ip.replace(/\.0$/, ".1") : ip);
    if (!location.country || location.provider === "geoip-lite" || location.provider === "vercel") {
      unchanged += 1;
      continue;
    }
    const { modifiedCount } = await VISIT_MODEL.updateMany(
      { ip, country: { $in: countries } },
      { $set: { country: location.country, region: location.region, city: location.city } },
    );
    updated += modifiedCount;
    await MESSAGE_MODEL.updateMany(
      { "meta.ip": ip, "meta.country": { $in: countries } },
      { $set: { "meta.country": location.country, "meta.city": location.city } },
    );
  }

  const remaining = (await VISIT_MODEL.distinct("ip", { country: { $in: countries }, ip: { $nin: [null, ""] } })).length;
  return res.status(200).json({
    success: true,
    message: ips.length
      ? `${updated} visitas corregidas (${ips.length - unchanged} de ${ips.length} IPs reubicadas).`
      : "No hay visitas pendientes de corregir.",
    data: { ips: ips.length, updated, unchanged, remaining },
  });
};

module.exports = { TRACK_VISIT, GET_STATS, RELOCATE_VISITS };
