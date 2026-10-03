const SERVICE_MODEL = require("../../models/service.model");
const DEFAULT_SERVICES = require("../../config/services");

const SLUGIFY = (text) =>
  String(text)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "servicio";

const PICK = (body) => {
  const fields = ["title", "icon", "short", "points", "image", "order", "active"];
  const data = Object.fromEntries(fields.filter((f) => body[f] !== undefined).map((f) => [f, body[f]]));
  if (Array.isArray(data.points)) data.points = data.points.map((p) => String(p).trim()).filter(Boolean);
  return data;
};

// CREA LOS SERVICIOS INICIALES SI LA COLECCIÓN ESTÁ VACÍA
const SEED = async () => {
  if (await SERVICE_MODEL.estimatedDocumentCount()) return;
  await SERVICE_MODEL.insertMany(DEFAULT_SERVICES.map((s, i) => ({ ...s, order: i })));
};

//======================================================
// PUBLIC: ACTIVE SERVICES
//======================================================
const GET_PUBLIC_SERVICES = async (req, res) => {
  await SEED();
  const services = await SERVICE_MODEL.find({ active: true }).sort({ order: 1, createdAt: 1 });
  return res.status(200).json({ success: true, data: services });
};

//======================================================
// ADMIN
//======================================================
const GET_SERVICES = async (req, res) => {
  await SEED();
  const services = await SERVICE_MODEL.find().sort({ order: 1, createdAt: 1 });
  return res.status(200).json({ success: true, data: services });
};

const CREATE_SERVICE = async (req, res) => {
  if (!req.body.title?.trim()) {
    return res.status(400).json({ success: false, message: "El nombre del servicio es obligatorio." });
  }
  const base = SLUGIFY(req.body.title);
  let slug = base;
  for (let i = 2; await SERVICE_MODEL.exists({ slug }); i++) slug = `${base}-${i}`;
  const last = await SERVICE_MODEL.findOne().sort({ order: -1 });

  const service = await SERVICE_MODEL.create({ order: (last?.order ?? -1) + 1, ...PICK(req.body), slug });
  return res.status(201).json({ success: true, message: "Servicio creado.", data: service });
};

const UPDATE_SERVICE = async (req, res) => {
  const service = await SERVICE_MODEL.findByIdAndUpdate(req.params.id, PICK(req.body), { new: true, runValidators: true });
  if (!service) return res.status(404).json({ success: false, message: "Servicio no encontrado." });
  return res.status(200).json({ success: true, message: "Servicio actualizado.", data: service });
};

// REORDER: { ids: [id1, id2, ...] }
const REORDER_SERVICES = async (req, res) => {
  const ids = Array.isArray(req.body.ids) ? req.body.ids : [];
  await Promise.all(ids.map((id, order) => SERVICE_MODEL.updateOne({ _id: id }, { order })));
  return res.status(200).json({ success: true, message: "Orden guardado." });
};

const DELETE_SERVICE = async (req, res) => {
  const service = await SERVICE_MODEL.findByIdAndDelete(req.params.id);
  if (!service) return res.status(404).json({ success: false, message: "Servicio no encontrado." });
  return res.status(200).json({ success: true, message: "Servicio eliminado." });
};

module.exports = {
  GET_PUBLIC_SERVICES,
  GET_SERVICES,
  CREATE_SERVICE,
  UPDATE_SERVICE,
  REORDER_SERVICES,
  DELETE_SERVICE,
};
