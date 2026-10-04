const Counter = require("../../models/Counter");
const DOCUMENT_MODEL = require("../../models/document.model");

const PREFIX = { presupuesto: "P", factura: "F" };

const FORMAT = (type, year, sequence) => `${PREFIX[type]}-${year}-${String(sequence).padStart(4, "0")}`;

// CONTINUE THE OLD QUOTE NUMBERING ({ year, sequence } WITHOUT KEY) IF IT EXISTS
const SEED_LEGACY = async (type, year, key) => {
  if (type !== "presupuesto" || (await Counter.exists({ key }))) return;
  const legacy = await Counter.findOne({ year, key: { $exists: false } });
  if (legacy) {
    await Counter.updateOne({ key }, { $setOnInsert: { key, year, sequence: legacy.sequence } }, { upsert: true });
  }
};

// ----------------------
// NEXT CORRELATIVE NUMBER PER TYPE AND YEAR (ATOMIC)
// P-2026-0001 / F-2026-0001
// ----------------------
const NEXT_NUMBER = async (type, date = new Date()) => {
  const year = new Date(date).getFullYear();
  const key = `${type}-${year}`;
  await SEED_LEGACY(type, year, key);

  const counter = await Counter.findOneAndUpdate(
    { key },
    { $inc: { sequence: 1 }, $setOnInsert: { year } },
    { upsert: true, new: true },
  );

  return FORMAT(type, year, counter.sequence);
};

// ----------------------
// HIGHEST NUMBER ALREADY USED BY A DOCUMENT OF THAT TYPE AND YEAR (P-2026-0007 -> 7)
// ----------------------
const MAX_USED = async (type, year) => {
  const prefix = `${PREFIX[type]}-${year}-`;
  const docs = await DOCUMENT_MODEL.find({ type, number: { $regex: `^${prefix}\\d+$` } }).select("number -_id").lean();
  return docs.reduce((max, d) => Math.max(max, Number(d.number.slice(prefix.length)) || 0), 0);
};

// ----------------------
// CURRENT STATE: LAST NUMBER USED AND THE NEXT ONE
// ----------------------
const GET_STATE = async (type, year) => {
  const key = `${type}-${year}`;
  await SEED_LEGACY(type, year, key);
  const counter = await Counter.findOne({ key }).lean();
  const last = Math.max(counter?.sequence || 0, await MAX_USED(type, year));
  return { type, year, last, next: last + 1, nextNumber: FORMAT(type, year, last + 1), minNext: (await MAX_USED(type, year)) + 1 };
};

// ----------------------
// SET THE NEXT NUMBER (ONLY FORWARD FROM THE LAST DOCUMENT ISSUED, TO AVOID DUPLICATES)
// ----------------------
const SET_NEXT = async (type, year, next) => {
  const minNext = (await MAX_USED(type, year)) + 1;
  if (!Number.isInteger(next) || next < 1 || next > 9999) {
    const error = new Error("El número debe ser un entero entre 1 y 9999.");
    error.status = 400;
    throw error;
  }
  if (next < minNext) {
    const error = new Error(`Ya existe el documento ${FORMAT(type, year, minNext - 1)}. El siguiente número debe ser como mínimo ${minNext}.`);
    error.status = 400;
    throw error;
  }
  await Counter.findOneAndUpdate({ key: `${type}-${year}` }, { $set: { sequence: next - 1, year } }, { upsert: true });
  return GET_STATE(type, year);
};

module.exports = { NEXT_NUMBER, GET_STATE, SET_NEXT, PREFIX };
