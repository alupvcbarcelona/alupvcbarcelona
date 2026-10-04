const MESSAGE_MODEL = require("../../models/message.model");
const SETTINGS_MODEL = require("../../models/settings.model");
const { ADMIN_EMAIL } = require("../../config/env.config");
const { GET_REQUEST_INFO } = require("../../utils/request-info");
const {
  emailNewMessage,
  emailMessageReceived,
  emailReply,
} = require("../../emails/messages.emails");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STATUS = ["nuevo", "leido", "respondido", "archivado"];

const NOT_FOUND = (res) => res.status(404).json({ success: false, message: "Mensaje no encontrado." });

//======================================================
// CREATE (PUBLIC CONTACT FORM)
//======================================================
const CREATE_MESSAGE = async (req, res) => {
  const { name, email, phone, city, service, message, privacyAccepted, website } = req.body;

  // HONEYPOT: BOTS FILL THE HIDDEN "website" FIELD
  if (website) return res.status(201).json({ success: true, message: "Mensaje enviado." });

  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return res.status(400).json({ success: false, message: "Nombre, email y mensaje son obligatorios." });
  }
  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).json({ success: false, message: "El email no es válido." });
  }
  if (privacyAccepted !== true) {
    return res.status(400).json({ success: false, message: "Debes aceptar la política de privacidad." });
  }

  const info = await GET_REQUEST_INFO(req);
  const created = await MESSAGE_MODEL.create({
    name,
    email,
    phone,
    city,
    service,
    message,
    privacyAccepted: true,
    meta: {
      ip: info.ip,
      country: info.country,
      city: info.city,
      device: info.device,
      browser: info.browser,
      os: info.os,
    },
  });

  // THE MESSAGE IS ALREADY SAVED IN THE DASHBOARD, EMAILS NEVER MAKE THE REQUEST FAIL
  // (AWAITED: SERVERLESS PLATFORMS STOP THE FUNCTION AFTER THE RESPONSE)
  const company = await SETTINGS_MODEL.get();
  await Promise.all([
    emailNewMessage(created, company, ADMIN_EMAIL || company.email),
    emailMessageReceived(created, company),
  ]);

  return res.status(201).json({
    success: true,
    message: "Mensaje enviado. Te responderemos lo antes posible.",
  });
};

//======================================================
// GET ALL (ADMIN) - FILTERS: status, q
//======================================================
const GET_MESSAGES = async (req, res) => {
  const { status, q } = req.query;
  const filter = {};
  if (STATUS.includes(status)) filter.status = status;
  else filter.status = { $ne: "archivado" };
  if (status === "todos") delete filter.status;
  if (q) {
    const regex = new RegExp(String(q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ name: regex }, { email: regex }, { message: regex }, { phone: regex }];
  }

  const [messages, unread] = await Promise.all([
    MESSAGE_MODEL.find(filter).sort({ createdAt: -1 }).limit(500),
    MESSAGE_MODEL.countDocuments({ status: "nuevo" }),
  ]);

  return res.status(200).json({ success: true, unread, total: messages.length, data: messages });
};

//======================================================
// GET ONE (ADMIN) - MARKS AS READ
//======================================================
const GET_MESSAGE = async (req, res) => {
  const message = await MESSAGE_MODEL.findById(req.params.id);
  if (!message) return NOT_FOUND(res);
  if (message.status === "nuevo") {
    message.status = "leido";
    await message.save();
  }
  return res.status(200).json({ success: true, data: message });
};

//======================================================
// UPDATE STATUS / NOTES (ADMIN)
//======================================================
const UPDATE_MESSAGE = async (req, res) => {
  const message = await MESSAGE_MODEL.findById(req.params.id);
  if (!message) return NOT_FOUND(res);

  const { status, notes } = req.body;
  if (status !== undefined) {
    if (!STATUS.includes(status)) return res.status(400).json({ success: false, message: "Estado no válido." });
    message.status = status;
  }
  if (notes !== undefined) message.notes = notes;
  await message.save();

  return res.status(200).json({ success: true, message: "Mensaje actualizado.", data: message });
};

//======================================================
// REPLY BY EMAIL (ADMIN)
//======================================================
const REPLY_MESSAGE = async (req, res) => {
  const message = await MESSAGE_MODEL.findById(req.params.id);
  if (!message) return NOT_FOUND(res);

  const company = await SETTINGS_MODEL.get();
  const body = String(req.body.body || "").trim();
  if (!body) return res.status(400).json({ success: false, message: "Escribe una respuesta." });

  const reply = {
    subject: req.body.subject?.trim() || `Re: tu solicitud a ${company.name}`,
    body,
  };

  const sent = await emailReply(message, reply, company);
  if (!sent) {
    return res.status(502).json({ success: false, message: "No se pudo enviar el email. Revisa la configuración de correo." });
  }

  message.replies.push({ ...reply, sentAt: new Date() });
  message.status = "respondido";
  await message.save();

  return res.status(200).json({ success: true, message: "Respuesta enviada.", data: message });
};

//======================================================
// DELETE (ADMIN)
//======================================================
const DELETE_MESSAGE = async (req, res) => {
  const message = await MESSAGE_MODEL.findByIdAndDelete(req.params.id);
  if (!message) return NOT_FOUND(res);
  return res.status(200).json({ success: true, message: "Mensaje eliminado." });
};

module.exports = {
  CREATE_MESSAGE,
  GET_MESSAGES,
  GET_MESSAGE,
  UPDATE_MESSAGE,
  REPLY_MESSAGE,
  DELETE_MESSAGE,
};
