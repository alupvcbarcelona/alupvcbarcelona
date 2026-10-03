const ROUND = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const VALID_IVA = [0, 4, 10, 21];

// ----------------------
// VALIDATE LINES AND CALCULATE TOTALS
// THROWS AN ERROR WITH status 400 IF A LINE IS INVALID
// ----------------------
const CALCULATE_TOTALS = (items = [], irpf = 0, defaultIva = 21) => {
  const fail = (message) => {
    const error = new Error(message);
    error.status = 400;
    throw error;
  };

  if (!Array.isArray(items) || items.length === 0) fail("Debes añadir al menos un concepto.");

  const breakdown = new Map();
  let subtotal = 0;

  const documentItems = items.map((item, index) => {
    const line = index + 1;
    const quantity = Number(item.quantity);
    const unitPrice = Number(item.unitPrice);
    const discount = Number(item.discount || 0);
    const iva = item.iva === undefined || item.iva === "" ? defaultIva : Number(item.iva);

    if (!String(item.description || "").trim()) fail(`El concepto de la línea ${line} no tiene descripción.`);
    if (!(quantity > 0)) fail(`La cantidad de la línea ${line} debe ser mayor que cero.`);
    if (!(unitPrice >= 0)) fail(`El precio de la línea ${line} no es correcto.`);
    if (discount < 0 || discount > 100) fail(`El descuento de la línea ${line} debe estar entre 0 y 100.`);
    if (!VALID_IVA.includes(iva)) fail(`El IVA de la línea ${line} debe ser 0, 4, 10 o 21%.`);

    const lineSubtotal = ROUND(quantity * unitPrice * (1 - discount / 100));
    const ivaAmount = ROUND((lineSubtotal * iva) / 100);

    subtotal += lineSubtotal;
    const current = breakdown.get(iva) || { rate: iva, base: 0, amount: 0 };
    current.base = ROUND(current.base + lineSubtotal);
    current.amount = ROUND(current.amount + ivaAmount);
    breakdown.set(iva, current);

    return {
      quantity,
      unit: item.unit || "ud",
      description: String(item.description).trim(),
      unitPrice,
      discount,
      subtotal: lineSubtotal,
      iva,
      ivaAmount,
      total: ROUND(lineSubtotal + ivaAmount),
    };
  });

  subtotal = ROUND(subtotal);
  const taxBreakdown = [...breakdown.values()].sort((a, b) => b.rate - a.rate);
  const totalIVA = ROUND(taxBreakdown.reduce((sum, t) => sum + t.amount, 0));
  const irpfRate = Number(irpf || 0);
  const irpfAmount = ROUND((subtotal * irpfRate) / 100);

  return {
    items: documentItems,
    subtotal,
    taxBreakdown,
    totalIVA,
    irpf: irpfRate,
    irpfAmount,
    grandTotal: ROUND(subtotal + totalIVA - irpfAmount),
  };
};

module.exports = { CALCULATE_TOTALS, ROUND };
