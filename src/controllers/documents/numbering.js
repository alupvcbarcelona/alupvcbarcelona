const Counter = require("../../models/Counter");

const PREFIX = { presupuesto: "P", factura: "F" };

// ----------------------
// NEXT CORRELATIVE NUMBER PER TYPE AND YEAR (ATOMIC)
// P-2026-0001 / F-2026-0001
// ----------------------
const NEXT_NUMBER = async (type, date = new Date()) => {
  const year = new Date(date).getFullYear();
  const key = `${type}-${year}`;

  // CONTINUE THE OLD QUOTE NUMBERING ({ year, sequence } WITHOUT KEY) IF IT EXISTS
  if (type === "presupuesto" && !(await Counter.exists({ key }))) {
    const legacy = await Counter.findOne({ year, key: { $exists: false } });
    if (legacy) {
      await Counter.updateOne(
        { key },
        { $setOnInsert: { key, year, sequence: legacy.sequence } },
        { upsert: true },
      );
    }
  }

  const counter = await Counter.findOneAndUpdate(
    { key },
    { $inc: { sequence: 1 }, $setOnInsert: { year } },
    { upsert: true, new: true },
  );

  return `${PREFIX[type]}-${year}-${String(counter.sequence).padStart(4, "0")}`;
};

module.exports = { NEXT_NUMBER };
