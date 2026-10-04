const SETTINGS_MODEL = require("../../models/settings.model");

const FIELDS = [
  "name", "owner", "nif", "address", "postalCode", "city", "phone", "email",
  "website", "logo", "iban", "quoteConditions", "invoiceNotes", "defaultIva", "googleMapsUrl", "googleReviewUrl",
];

// PUBLIC FIELDS (USED BY THE WEBSITE: FOOTER, CONTACT, LEGAL PAGES)
const PUBLIC_FIELDS = ["name", "owner", "nif", "address", "postalCode", "city", "phone", "email", "website", "logo", "googleMapsUrl", "googleReviewUrl"];

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

const UPDATE_SETTINGS = async (req, res) => {
  const update = Object.fromEntries(FIELDS.filter((f) => req.body[f] !== undefined).map((f) => [f, req.body[f]]));
  await SETTINGS_MODEL.get();
  const settings = await SETTINGS_MODEL.findOneAndUpdate({ key: "company" }, update, { new: true, runValidators: true });
  return res.status(200).json({ success: true, message: "Ajustes guardados.", data: settings });
};

module.exports = { GET_PUBLIC_SETTINGS, GET_SETTINGS, UPDATE_SETTINGS };
