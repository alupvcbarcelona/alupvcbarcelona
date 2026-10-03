const DOCUMENT_MODEL = require("../../models/document.model");
const SETTINGS_MODEL = require("../../models/settings.model");
const { NEXT_NUMBER } = require("./numbering");
const { CALCULATE_TOTALS } = require("./totals");
const { emailDocument } = require("../../emails/documents.emails");

const TYPES = ["presupuesto", "factura"];
const STATUS = {
  presupuesto: ["borrador", "enviado", "pendiente", "aceptado", "rechazado", "vencido"],
  factura: ["borrador", "pendiente", "enviado", "pagado", "vencido", "anulado"],
};

const COMPANY_SNAPSHOT = (settings) => ({
  logo: settings.logo,
  name: settings.name,
  owner: settings.owner,
  nif: settings.nif,
  address: settings.address,
  postalCode: settings.postalCode,
  city: settings.city,
  phone: settings.phone,
  email: settings.email,
  website: settings.website,
  iban: settings.iban,
});

const ADD_DAYS = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

// FIELDS THE CLIENT CAN SEND (NUMBER, TOTALS AND COMPANY ARE CALCULATED HERE)
const PICK = (body) => {
  const fields = [
    "title",
    "issueDate",
    "expiryDate",
    "dueDate",
    "status",
    "client",
    "workAddress",
    "observations",
    "conditions",
    "paymentMethod",
  ];
  return Object.fromEntries(fields.filter((f) => body[f] !== undefined).map((f) => [f, body[f]]));
};

const NOT_FOUND = (res) =>
  res.status(404).json({ success: false, message: "Documento no encontrado." });

//======================================================
// CREATE
//======================================================
const CREATE_DOCUMENT = async (req, res) => {
  const type = req.body.type || "presupuesto";
  if (!TYPES.includes(type)) {
    return res.status(400).json({ success: false, message: "Tipo de documento no válido." });
  }
  if (!req.body.client?.name?.trim()) {
    return res.status(400).json({ success: false, message: "El nombre del cliente es obligatorio." });
  }
  if (type === "factura" && !req.body.client?.nif?.trim()) {
    return res.status(400).json({ success: false, message: "El NIF del cliente es obligatorio en una factura." });
  }

  const settings = await SETTINGS_MODEL.get();
  const totals = CALCULATE_TOTALS(req.body.items, req.body.irpf, settings.defaultIva);
  const issueDate = req.body.issueDate ? new Date(req.body.issueDate) : new Date();

  const document = await DOCUMENT_MODEL.create({
    ...PICK(req.body),
    type,
    issueDate,
    number: await NEXT_NUMBER(type, issueDate),
    year: issueDate.getFullYear(),
    company: COMPANY_SNAPSHOT(settings),
    status: STATUS[type].includes(req.body.status) ? req.body.status : type === "factura" ? "pendiente" : "borrador",
    expiryDate: type === "presupuesto" ? req.body.expiryDate || ADD_DAYS(issueDate, 30) : undefined,
    dueDate: type === "factura" ? req.body.dueDate || ADD_DAYS(issueDate, 15) : undefined,
    conditions:
      req.body.conditions ?? (type === "presupuesto" ? settings.quoteConditions : settings.invoiceNotes),
    relatedDocument: req.body.relatedDocument || undefined,
    ...totals,
  });

  let emailSent = false;
  if (req.body.send && document.client.email) {
    emailSent = Boolean(await emailDocument(document, req.body.message));
    if (emailSent) {
      document.sentAt = new Date();
      if (document.status === "borrador") document.status = "enviado";
      await document.save();
    }
  }

  return res.status(201).json({
    success: true,
    message: emailSent ? "Documento creado y enviado." : "Documento creado correctamente.",
    emailSent,
    data: document,
  });
};

//======================================================
// GET ALL (FILTERS: type, status, q, year)
//======================================================
const GET_DOCUMENTS = async (req, res) => {
  const { type, status, q, year } = req.query;
  const filter = {};
  if (TYPES.includes(type)) filter.type = type;
  if (status) filter.status = status;
  if (year) filter.year = Number(year);
  if (q) {
    const regex = new RegExp(String(q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ number: regex }, { "client.name": regex }, { "client.email": regex }, { title: regex }];
  }

  const documents = await DOCUMENT_MODEL.find(filter)
    .sort({ issueDate: -1, createdAt: -1 })
    .select("-company -items");

  return res.status(200).json({ success: true, total: documents.length, data: documents });
};

//======================================================
// GET ONE
//======================================================
const GET_DOCUMENT = async (req, res) => {
  const document = await DOCUMENT_MODEL.findById(req.params.id).populate("relatedDocument", "number type status");
  if (!document) return NOT_FOUND(res);
  return res.status(200).json({ success: true, data: document });
};

//======================================================
// UPDATE
//======================================================
const UPDATE_DOCUMENT = async (req, res) => {
  const document = await DOCUMENT_MODEL.findById(req.params.id);
  if (!document) return NOT_FOUND(res);

  if (document.type === "factura" && ["pagado", "anulado"].includes(document.status) && req.body.items) {
    return res.status(400).json({
      success: false,
      message: "No se puede modificar el contenido de una factura pagada o anulada.",
    });
  }

  const update = PICK(req.body);
  if (update.status && !STATUS[document.type].includes(update.status)) {
    return res.status(400).json({ success: false, message: "Estado no válido." });
  }

  if (req.body.items) {
    Object.assign(update, CALCULATE_TOTALS(req.body.items, req.body.irpf ?? document.irpf));
  }
  if (update.status === "pagado" && !document.paidAt) update.paidAt = new Date();

  document.set(update);
  await document.save();

  return res.status(200).json({ success: true, message: "Documento actualizado.", data: document });
};

//======================================================
// DELETE (INVOICES CAN ONLY BE DELETED WHILE DRAFT, OTHERWISE CANCEL THEM)
//======================================================
const DELETE_DOCUMENT = async (req, res) => {
  const document = await DOCUMENT_MODEL.findById(req.params.id);
  if (!document) return NOT_FOUND(res);

  if (document.type === "factura" && document.status !== "borrador") {
    return res.status(400).json({
      success: false,
      message: "Las facturas emitidas no se pueden eliminar. Márcala como anulada.",
    });
  }

  await document.deleteOne();
  return res.status(200).json({ success: true, message: "Documento eliminado." });
};

//======================================================
// SEND BY EMAIL
//======================================================
const SEND_DOCUMENT = async (req, res) => {
  const document = await DOCUMENT_MODEL.findById(req.params.id);
  if (!document) return NOT_FOUND(res);

  const email = req.body.email || document.client.email;
  if (!email) {
    return res.status(400).json({ success: false, message: "El cliente no tiene email." });
  }
  document.client.email = email;

  const sent = await emailDocument(document, req.body.message);
  if (!sent) {
    return res.status(502).json({ success: false, message: "No se pudo enviar el email. Revisa la configuración de correo." });
  }

  document.sentAt = new Date();
  if (["borrador", "pendiente"].includes(document.status)) document.status = "enviado";
  await document.save();

  return res.status(200).json({ success: true, message: `Enviado a ${email}.`, data: document });
};

//======================================================
// CONVERT QUOTE -> INVOICE
//======================================================
const CONVERT_TO_INVOICE = async (req, res) => {
  const quote = await DOCUMENT_MODEL.findById(req.params.id);
  if (!quote) return NOT_FOUND(res);
  if (quote.type !== "presupuesto") {
    return res.status(400).json({ success: false, message: "Solo se pueden facturar presupuestos." });
  }

  const existing = await DOCUMENT_MODEL.findOne({ relatedDocument: quote._id, type: "factura", status: { $ne: "anulado" } });
  if (existing) {
    return res.status(409).json({ success: false, message: `Este presupuesto ya tiene la factura ${existing.number}.`, data: existing });
  }

  const settings = await SETTINGS_MODEL.get();
  const issueDate = new Date();

  const invoice = await DOCUMENT_MODEL.create({
    type: "factura",
    number: await NEXT_NUMBER("factura", issueDate),
    year: issueDate.getFullYear(),
    issueDate,
    dueDate: ADD_DAYS(issueDate, 15),
    status: "pendiente",
    title: quote.title,
    company: COMPANY_SNAPSHOT(settings),
    client: quote.client,
    workAddress: quote.workAddress,
    items: quote.items,
    subtotal: quote.subtotal,
    taxBreakdown: quote.taxBreakdown,
    totalIVA: quote.totalIVA,
    irpf: quote.irpf,
    irpfAmount: quote.irpfAmount,
    grandTotal: quote.grandTotal,
    observations: `Según presupuesto ${quote.number}.${quote.observations ? `\n${quote.observations}` : ""}`,
    conditions: settings.invoiceNotes,
    relatedDocument: quote._id,
  });

  if (quote.status !== "aceptado") {
    quote.status = "aceptado";
    await quote.save();
  }

  return res.status(201).json({ success: true, message: `Factura ${invoice.number} creada.`, data: invoice });
};

module.exports = {
  CREATE_DOCUMENT,
  GET_DOCUMENTS,
  GET_DOCUMENT,
  UPDATE_DOCUMENT,
  DELETE_DOCUMENT,
  SEND_DOCUMENT,
  CONVERT_TO_INVOICE,
};
