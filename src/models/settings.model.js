const mongoose = require("mongoose");
const { Schema } = mongoose;
const COMPANY = require("../config/company");

// ----------------------
// SETTINGS SCHEMA (SINGLE DOCUMENT WITH COMPANY DATA)
// ----------------------
const settingsSchema = new Schema(
  {
    key: { type: String, default: "company", unique: true },
    name: { type: String, default: COMPANY.name },
    owner: { type: String, default: COMPANY.owner },
    nif: { type: String, default: COMPANY.nif },
    address: { type: String, default: COMPANY.address },
    postalCode: { type: String, default: COMPANY.postalCode },
    city: { type: String, default: COMPANY.city },
    phone: { type: String, default: COMPANY.phone },
    email: { type: String, default: COMPANY.email },
    website: { type: String, default: COMPANY.website },
    logo: { type: String, default: COMPANY.logo },
    iban: { type: String, default: COMPANY.iban },
    instagramUrl: { type: String, default: COMPANY.instagramUrl, trim: true },
    googleMapsUrl: { type: String, default: COMPANY.googleMapsUrl },
    googleReviewUrl: { type: String, default: COMPANY.googleReviewUrl },
    quoteConditions: { type: String, default: COMPANY.quoteConditions },
    invoiceNotes: { type: String, default: COMPANY.invoiceNotes },
    defaultIva: { type: Number, default: COMPANY.defaultIva },
  },
  { collection: "settings", timestamps: true },
);

// GET (OR CREATE) THE SETTINGS DOCUMENT
settingsSchema.statics.get = async function () {
  return this.findOneAndUpdate(
    { key: "company" },
    { $setOnInsert: { key: "company" } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
};

module.exports = mongoose.model("settings", settingsSchema);
