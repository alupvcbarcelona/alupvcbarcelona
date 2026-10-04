const SETTINGS_MODEL = require("../../models/settings.model");

const FIELDS = [
  "name", "owner", "nif", "address", "postalCode", "city", "phone", "email",
  "website", "logo", "iban", "quoteConditions", "invoiceNotes", "defaultIva", "googleMapsUrl", "googleReviewUrl", "instagramUrl",
];

// PUBLIC FIELDS (USED BY THE WEBSITE: FOOTER, CONTACT, LEGAL PAGES)
const PUBLIC_FIELDS = ["name", "owner", "nif", "address", "postalCode", "city", "phone", "email", "website", "logo", "googleMapsUrl", "googleReviewUrl", "instagramUrl"];

const COMPANY = require("../../config/company");

const GET_PUBLIC_SETTINGS = async (req, res) => {
  const settings = await SETTINGS_MODEL.get();
  // LOS AJUSTES CREADOS ANTES DE AÑADIR UN CAMPO NO LO TIENEN: SE USA EL VALOR POR DEFECTO
  const data = Object.fromEntries(PUBLIC_FIELDS.map((f) => [f, settings[f] ?? COMPANY[f]]));
  return res.status(200).json({ success: true, data });
};

const GET_SETTINGS = async (req, res) => {
  const settings = (await SETTINGS_MODEL.get()).toObject();
  FIELDS.forEach((f) => settings[f] === undefined && COMPANY[f] !== undefined && (settings[f] = COMPANY[f]));
  return res.status(200).json({ success: true, data: settings });
};

// "@usuario", "usuario" o "instagram.com/usuario" -> "https://www.instagram.com/usuario/"
const NORMALIZE_INSTAGRAM = (value) => {
  const text = String(value || "").trim();
  if (!text) return "";
  if (/^https?:\/\//i.test(text)) return text;
  const handle = text.replace(/^@/, "").replace(/^(www\.)?instagram\.com\//i, "").replace(/\/+$/, "");
  return handle ? `https://www.instagram.com/${handle}/` : "";
};

const UPDATE_SETTINGS = async (req, res) => {
  const update = Object.fromEntries(FIELDS.filter((f) => req.body[f] !== undefined).map((f) => [f, req.body[f]]));
  if (update.instagramUrl !== undefined) {
    update.instagramUrl = NORMALIZE_INSTAGRAM(update.instagramUrl);
    if (update.instagramUrl && !/^https:\/\/(www\.)?instagram\.com\//i.test(update.instagramUrl)) {
      return res.status(400).json({ success: false, message: "El enlace de Instagram debe ser de instagram.com." });
    }
  }
  await SETTINGS_MODEL.get();
  const settings = await SETTINGS_MODEL.findOneAndUpdate({ key: "company" }, update, { new: true, runValidators: true });
  return res.status(200).json({ success: true, message: "Ajustes guardados.", data: settings });
};

module.exports = { GET_PUBLIC_SETTINGS, GET_SETTINGS, UPDATE_SETTINGS };
