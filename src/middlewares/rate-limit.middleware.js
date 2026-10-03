const { GET_IP } = require("../utils/request-info");

// ----------------------
// SIMPLE IN-MEMORY RATE LIMIT (PER IP AND ROUTE)
// ENOUGH FOR PUBLIC FORMS (CONTACT, REVIEWS, VISITS)
// ----------------------
const RATE_LIMIT = ({ windowMs = 60_000, max = 10, message } = {}) => {
  const HITS = new Map();

  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of HITS) if (entry.reset < now) HITS.delete(key);
  }, windowMs).unref();

  return (req, res, next) => {
    const key = `${GET_IP(req)}|${req.baseUrl}${req.path}`;
    const now = Date.now();
    const entry = HITS.get(key);

    if (!entry || entry.reset < now) {
      HITS.set(key, { count: 1, reset: now + windowMs });
      return next();
    }

    entry.count += 1;
    if (entry.count > max) {
      return res.status(429).json({
        success: false,
        message: message || "Demasiadas solicitudes. Inténtalo de nuevo en unos minutos.",
      });
    }
    next();
  };
};

module.exports = { RATE_LIMIT };
