// models/Counter.js
const mongoose = require("mongoose");

// ----------------------
// COUNTER SCHEMA (CORRELATIVE NUMBERING PER DOCUMENT TYPE AND YEAR)
// LEGACY DOCUMENTS ONLY HAVE { year, sequence } (OLD QUOTE NUMBERING)
// ----------------------
const counterSchema = new mongoose.Schema({
  key: { type: String, index: true, sparse: true },
  year: Number,
  sequence: { type: Number, default: 0 },
});

module.exports = mongoose.model("Counter", counterSchema);
