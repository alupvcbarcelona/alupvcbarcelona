const geoip = require("geoip-lite");
const GEOCACHE_MODEL = require("../models/geocache.model");

// ----------------------
// GEOLOCALIZACIÓN DE IPs
// Orden: caché -> ipinfo.io (IPINFO_TOKEN) -> ipapi.co -> cabeceras de Vercel -> geoip-lite
// geoip-lite y otras bases gratuitas sitúan rangos españoles de DIGI (79.116.x.x...) en Rumanía,
// por eso se priorizan proveedores con datos actualizados.
// ----------------------
const TIMEOUT_MS = 1500;
const MEMORY = new Map();
const MEMORY_MAX = 1000;

const IS_PRIVATE = (ip) =>
  !ip ||
  ip === "::1" ||
  /^(10\.|127\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|fc|fd|fe80)/i.test(ip);

const DECODE = (value) => {
  try {
    return value ? decodeURIComponent(String(value)) : "";
  } catch {
    return String(value || "");
  }
};

const FETCH_JSON = async (url) => {
  const response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS), headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
};

const PROVIDERS = [
  {
    name: "ipinfo",
    enabled: () => Boolean(process.env.IPINFO_TOKEN),
    lookup: async (ip) => {
      const d = await FETCH_JSON(`https://ipinfo.io/${encodeURIComponent(ip)}/json?token=${process.env.IPINFO_TOKEN}`);
      if (d.bogon || !d.country) return null;
      return { country: d.country, region: d.region || "", city: d.city || "", org: d.org || "" };
    },
  },
  {
    name: "ipapi",
    enabled: () => process.env.GEO_DISABLE_IPAPI !== "true",
    lookup: async (ip) => {
      const d = await FETCH_JSON(`https://ipapi.co/${encodeURIComponent(ip)}/json/`);
      if (d.error || !d.country_code) return null;
      return { country: d.country_code, region: d.region || "", city: d.city || "", org: d.org || "" };
    },
  },
];

const REMEMBER = (ip, value) => {
  if (MEMORY.size >= MEMORY_MAX) MEMORY.delete(MEMORY.keys().next().value);
  MEMORY.set(ip, value);
};

// UBICACIÓN DE UNA IP (headers: cabeceras de la petición, para usar las de Vercel como respaldo)
const LOCATE = async (ip, headers = {}) => {
  const empty = { country: "", region: "", city: "", provider: "" };
  if (IS_PRIVATE(ip)) return empty;
  if (MEMORY.has(ip)) return MEMORY.get(ip);

  try {
    const cached = await GEOCACHE_MODEL.findOne({ ip }).lean();
    if (cached) {
      const value = { country: cached.country, region: cached.region, city: cached.city, provider: cached.provider };
      REMEMBER(ip, value);
      return value;
    }
  } catch {
    /* sin caché: se sigue con los proveedores */
  }

  for (const provider of PROVIDERS.filter((p) => p.enabled())) {
    try {
      const result = await provider.lookup(ip);
      if (result) {
        const value = { country: String(result.country).toUpperCase(), region: result.region, city: result.city, provider: provider.name };
        REMEMBER(ip, value);
        GEOCACHE_MODEL.updateOne({ ip }, { $set: { ...value, org: result.org, createdAt: new Date() } }, { upsert: true }).catch(() => {});
        return value;
      }
    } catch (error) {
      console.warn(`Geolocation ${provider.name} failed: ${error.message}`);
    }
  }

  // RESPALDO SIN CACHÉ (PUEDE SER IMPRECISO): VERCEL Y LUEGO GEOIP-LITE
  if (headers["x-vercel-ip-country"]) {
    return {
      country: String(headers["x-vercel-ip-country"]).toUpperCase(),
      region: DECODE(headers["x-vercel-ip-country-region"]),
      city: DECODE(headers["x-vercel-ip-city"]),
      provider: "vercel",
    };
  }
  const location = geoip.lookup(ip);
  return location ? { country: location.country, region: location.region, city: location.city, provider: "geoip-lite" } : empty;
};

module.exports = { LOCATE, IS_PRIVATE, PROVIDERS };
