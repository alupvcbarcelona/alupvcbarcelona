const mongoose = require("mongoose");
const { Schema } = mongoose;

// ----------------------
// VISIT SCHEMA (WEB ANALYTICS)
// ----------------------
const visitSchema = new Schema(
  {
    path: { type: String, maxlength: 300 },
    referrer: { type: String, maxlength: 300 },
    // FULL IP ONLY WITH ANALYTICS CONSENT, OTHERWISE MASKED (x.x.x.0)
    ip: String,
    consent: { type: Boolean, default: false },
    visitorId: { type: String, index: true },
    country: String,
    region: String,
    city: String,
    device: String,
    browser: String,
    os: String,
    createdAt: { type: Date, default: Date.now },
  },
  { collection: "visits", versionKey: false },
);

// DELETE VISITS AUTOMATICALLY AFTER 13 MONTHS (DATA MINIMISATION)
visitSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 395 });

module.exports = mongoose.model("visits", visitSchema);
