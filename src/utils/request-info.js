const crypto = require("crypto");
const UAParser = require("ua-parser-js");
const geoip = require("geoip-lite");
const { JWT_SECRET } = require("../config/env.config");

// ----------------------
// CLIENT IP
// ----------------------
const GET_IP = (req) => {
  const raw =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.ip ||
    req.socket?.remoteAddress ||
    "";
  return raw.replace("::ffff:", "");
};

// ----------------------
// MASK IP (LAST OCTET / LAST BLOCKS) FOR VISITORS WITHOUT ANALYTICS CONSENT
// ----------------------
const MASK_IP = (ip) => {
  if (!ip) return "";
  if (ip.includes(".")) return ip.split(".").slice(0, 3).concat("0").join(".");
  return ip.split(":").slice(0, 3).join(":") + "::";
};

// ----------------------
// ANONYMOUS DAILY VISITOR ID (NO COOKIES): HASH(IP + UA + DAY)
// ----------------------
const VISITOR_ID = (ip, ua) => {
  const day = new Date().toISOString().slice(0, 10);
  return crypto
    .createHash("sha256")
    .update(`${ip}|${ua}|${day}|${JWT_SECRET || ""}`)
    .digest("hex")
    .slice(0, 24);
};

// ----------------------
// FULL REQUEST INFO: IP, LOCATION AND DEVICE
// ----------------------
const GET_REQUEST_INFO = (req) => {
  const ip = GET_IP(req);
  const userAgent = req.headers["user-agent"] || "";
  const ua = new UAParser(userAgent).getResult();
  const location = geoip.lookup(ip);

  return {
    ip,
    country: location?.country || "",
    region: location?.region || "",
    city: location?.city || "",
    browser: ua.browser.name || "Desconocido",
    browserVersion: ua.browser.version || "",
    os: ua.os.name || "Desconocido",
    osVersion: ua.os.version || "",
    device: ua.device.type || "desktop",
    userAgent,
    visitorId: VISITOR_ID(ip, userAgent),
  };
};

module.exports = { GET_IP, MASK_IP, GET_REQUEST_INFO };
