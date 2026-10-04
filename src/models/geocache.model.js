const mongoose = require("mongoose");
const { Schema } = mongoose;

// ----------------------
// GEOLOCATION CACHE (ONE ENTRY PER IP, EXPIRES AFTER 30 DAYS)
// ----------------------
const geocacheSchema = new Schema(
  {
    ip: { type: String, required: true, unique: true },
    country: String,
    region: String,
    city: String,
    org: String,
    provider: String,
    createdAt: { type: Date, default: Date.now },
  },
  { collection: "geocache", versionKey: false },
);

geocacheSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

module.exports = mongoose.model("geocache", geocacheSchema);
