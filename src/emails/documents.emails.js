const { sendMail } = require("../config/nodemailer");
const { ESCAPE_HTML, ESCAPE_MULTILINE } = require("../utils/escape");
const { LAYOUT, BRAND, H1, P } = require("./layout");

const PRICE = (value) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(value || 0);

const DATE = (date) => (date ? new Date(date).toLocaleDateString("es-ES") : "");

const LABEL = { presupuesto: "Presupuesto", factura: "Factura" };

// ----------------------
// DOCUMENT BODY (SHARED BY QUOTES AND INVOICES)
// ----------------------
const DOCUMENT_HTML = (doc) => {
  const td = `padding:10px 8px;border-bottom:1px solid ${BRAND.line};font-size:13px;vertical-align:top;`;
  const th = `padding:8px;border-bottom:1px solid ${BRAND.ink};font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:${BRAND.muted};font-weight:600;`;

  const rows = doc.items
    .map(
      (item) => `
      <tr>
        <td style="${td}color:${BRAND.ink};">${ESCAPE_MULTILINE(item.description)}</td>
        <td align="right" style="${td}white-space:nowrap;">${item.quantity} ${ESCAPE_HTML(item.unit || "")}</td>
        <td align="right" style="${td}white-space:nowrap;">${PRICE(item.unitPrice)}${item.discount ? `<br><span style="color:${BRAND.muted};">-${item.discount}%</span>` : ""}</td>
        <td align="right" style="${td}">${item.iva}%</td>
        <td align="right" style="${td}white-space:nowrap;color:${BRAND.ink};">${PRICE(item.subtotal)}</td>
      </tr>`,
    )
    .join("");

  const totalRow = (label, value, strong) => `
    <tr>
      <td style="padding:6px 0;font-size:${strong ? 16 : 13}px;color:${strong ? BRAND.ink : BRAND.muted};${strong ? `border-top:1px solid ${BRAND.ink};padding-top:10px;font-weight:600;` : ""}">${label}</td>
      <td align="right" style="padding:6px 0;font-size:${strong ? 16 : 13}px;color:${BRAND.ink};${strong ? `border-top:1px solid ${BRAND.ink};padding-top:10px;font-weight:600;` : ""}">${value}</td>
    </tr>`;

  const taxes = (doc.taxBreakdown?.length ? doc.taxBreakdown : [{ rate: 21, amount: doc.totalIVA }])
    .map((t) => totalRow(`IVA ${t.rate}%`, PRICE(t.amount)))
    .join("");

  const client = doc.client || {};
  const dateRows = [
    ["Fecha", DATE(doc.issueDate)],
    doc.type === "presupuesto" && doc.expiryDate ? ["Válido hasta", DATE(doc.expiryDate)] : null,
    doc.type === "factura" && doc.dueDate ? ["Vencimiento", DATE(doc.dueDate)] : null,
  ].filter(Boolean);

  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
    <tr>
      <td valign="top" style="font-size:13px;line-height:1.6;color:${BRAND.text};">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:${BRAND.muted};margin-bottom:4px;">Cliente</div>
        <strong style="color:${BRAND.ink};">${ESCAPE_HTML(client.name)}</strong><br>
        ${client.nif ? `NIF: ${ESCAPE_HTML(client.nif)}<br>` : ""}
        ${[client.address, [client.postalCode, client.city].filter(Boolean).join(" ")].filter(Boolean).map(ESCAPE_HTML).join("<br>")}
      </td>
      <td valign="top" align="right" style="font-size:13px;line-height:1.6;color:${BRAND.text};">
        ${dateRows.map(([l, v]) => `<span style="color:${BRAND.muted};">${l}:</span> ${v}`).join("<br>")}
      </td>
    </tr>
  </table>
  ${doc.title ? `<p style="margin:0 0 8px;font-size:14px;color:${BRAND.ink};"><strong>${ESCAPE_HTML(doc.title)}</strong></p>` : ""}
  ${doc.workAddress ? `<p style="margin:0 0 16px;font-size:13px;color:${BRAND.muted};">Obra: ${ESCAPE_HTML(doc.workAddress)}</p>` : ""}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
    <tr>
      <th align="left" style="${th}">Concepto</th>
      <th align="right" style="${th}">Cant.</th>
      <th align="right" style="${th}">Precio</th>
      <th align="right" style="${th}">IVA</th>
      <th align="right" style="${th}">Importe</th>
    </tr>
    ${rows}
  </table>
  <table role="presentation" cellpadding="0" cellspacing="0" style="width:260px;margin:20px 0 0 auto;">
    ${totalRow("Base imponible", PRICE(doc.subtotal))}
    ${taxes}
    ${doc.irpf ? totalRow(`Retención IRPF ${doc.irpf}%`, `-${PRICE(doc.irpfAmount)}`) : ""}
    ${totalRow("Total", PRICE(doc.grandTotal), true)}
  </table>
  ${doc.observations ? `<div style="margin-top:28px;font-size:13px;"><div style="font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:${BRAND.muted};margin-bottom:4px;">Observaciones</div>${ESCAPE_MULTILINE(doc.observations)}</div>` : ""}
  ${doc.conditions ? `<div style="margin-top:20px;font-size:12px;color:${BRAND.muted};"><div style="font-size:11px;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px;">Condiciones</div>${ESCAPE_MULTILINE(doc.conditions)}</div>` : ""}
  ${doc.type === "factura" && doc.company?.iban ? `<div style="margin-top:20px;font-size:13px;"><span style="color:${BRAND.muted};">Pago por transferencia a:</span> <strong>${ESCAPE_HTML(doc.company.iban)}</strong></div>` : ""}
  `;
};

// ----------------------
// SEND QUOTE / INVOICE TO CLIENT
// ----------------------
const emailDocument = async (doc, message) => {
  const label = LABEL[doc.type] || "Documento";
  const company = doc.company || {};
  const intro =
    message ||
    (doc.type === "presupuesto"
      ? `Gracias por confiar en ${company.name}. Te enviamos el presupuesto solicitado. Si tienes cualquier duda o quieres aceptarlo, solo tienes que responder a este correo.`
      : `Te enviamos la factura correspondiente a los trabajos realizados. Gracias por confiar en ${company.name}.`);

  const body = `
    ${H1(`${label} ${doc.number}`)}
    ${P(`Hola ${ESCAPE_HTML(doc.client.name)},`)}
    ${P(ESCAPE_MULTILINE(intro))}
    ${DOCUMENT_HTML(doc)}
    <p style="margin:32px 0 0;font-size:14px;">Un saludo,<br><strong>${ESCAPE_HTML(company.owner || company.name)}</strong><br>${ESCAPE_HTML(company.name)}</p>
  `;

  return sendMail(
    doc.client.email,
    company.email ? [company.email] : [],
    `${label} ${doc.number} · ${company.name}`,
    LAYOUT({ title: `${label} ${doc.number}`, preheader: `${label} ${doc.number} por ${PRICE(doc.grandTotal)}`, body, company }),
    { replyTo: company.email, fromName: company.name },
  );
};

module.exports = { emailDocument };
