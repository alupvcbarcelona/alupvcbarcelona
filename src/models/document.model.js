// models/document.model.js
const mongoose = require("mongoose");

// ----------------------
// DOCUMENT LINE
// ----------------------
const itemSchema = new mongoose.Schema(
  {
    quantity: { type: Number, required: true, min: 0, default: 1 },
    unit: { type: String, default: "ud", trim: true }, // ud, m, m², h, partida...
    description: { type: String, required: true, trim: true },
    unitPrice: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0, max: 100 }, // %
    subtotal: Number,
    iva: { type: Number, default: 21 }, // 21, 10, 4, 0
    ivaAmount: Number,
    total: Number,
  },
  { _id: false },
);

const partySchema = {
  name: { type: String, trim: true },
  nif: { type: String, trim: true },
  address: { type: String, trim: true },
  postalCode: { type: String, trim: true },
  city: { type: String, trim: true },
  phone: { type: String, trim: true },
  email: { type: String, trim: true, lowercase: true },
};

// ----------------------
// DOCUMENT SCHEMA (PRESUPUESTO / FACTURA)
// ----------------------
const documentSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["presupuesto", "factura"],
      required: true,
    },
    number: { type: String, unique: true },
    year: Number,
    title: { type: String, trim: true }, // SHORT DESCRIPTION OF THE WORK
    issueDate: { type: Date, default: Date.now },
    expiryDate: Date, // QUOTE VALID UNTIL
    dueDate: Date, // INVOICE DUE DATE
    status: {
      type: String,
      enum: [
        "borrador",
        "enviado",
        "aceptado",
        "rechazado",
        "pendiente",
        "pagado",
        "vencido",
        "anulado",
      ],
      default: "borrador",
    },

    // COMPANY SNAPSHOT AT CREATION TIME (KEEPS OLD DOCUMENTS UNCHANGED)
    company: {
      logo: String,
      name: String,
      owner: String,
      nif: String,
      address: String,
      postalCode: String,
      city: String,
      phone: String,
      email: String,
      website: String,
      iban: String,
    },

    client: {
      ...partySchema,
      name: { type: String, required: true, trim: true },
    },
    workAddress: { type: String, trim: true }, // ADDRESS OF THE WORK (OBRA)

    items: [itemSchema],

    observations: String,
    conditions: String,
    paymentMethod: String,

    subtotal: Number,
    totalIVA: Number,
    taxBreakdown: [{ _id: false, rate: Number, base: Number, amount: Number }],
    irpf: { type: Number, default: 0 }, // % RETENTION
    irpfAmount: { type: Number, default: 0 },
    grandTotal: Number,

    relatedDocument: { type: mongoose.Schema.Types.ObjectId, ref: "Document" },
    sentAt: Date,
    paidAt: Date,
  },
  { timestamps: true },
);

documentSchema.index({ type: 1, createdAt: -1 });

module.exports = mongoose.model("Document", documentSchema);
