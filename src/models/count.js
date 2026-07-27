const mongoose = require("mongoose");
const { Schema } = mongoose;

// ----------------------
// INVOICE SCHEMA
// ----------------------
const invoiceSchema = new Schema(
  {
    count: { type: Number, default: 6 }, // COUNT VALUE
  },
  {
    collection: "invoices", // COLLECTION NAME IN MONGODB
    timestamps: true, // CREATION AND UPDATE TIMESTAMPS
  },
);

// ----------------------
// MODEL EXPORT
// ----------------------
const INVOICE_MODEL = mongoose.model("count", invoiceSchema);
module.exports = COUNT_MODEL;


/**
 * Nombre
 * Apellido
 * DNI - NIE
 * telefono
 * 
 * Numeros de factura -> secuencia:: 2026-004 (año-secuencia)
 * 
 */