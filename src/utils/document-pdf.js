const PDFDocument = require("pdfkit");

// ----------------------
// PDF DE PRESUPUESTOS Y FACTURAS (A4)
// Mismo diseño que la vista del panel: logo, empresa, cliente, conceptos, IVA, total y condiciones
// ----------------------
const C = {
  ink: "#12151a",
  text: "#3d424a",
  muted: "#6b7079",
  line: "#e4e4df",
  soft: "#f6f6f3",
  accent: "#1f2f6b",
  danger: "#b42318",
};

const MARGIN = 48;
const PAGE_W = 595.28;
const CONTENT_W = PAGE_W - MARGIN * 2;
const BOTTOM = 842 - 70; // DEJA SITIO AL PIE DE PÁGINA

const LABEL = { presupuesto: "Presupuesto", factura: "Factura" };

const money = (v) =>
  `${new Intl.NumberFormat("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: "always" }).format(Number(v) || 0)} €`;
const date = (d) => (d ? new Date(d).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" }) : "");
const qty = (v) => new Intl.NumberFormat("es-ES", { maximumFractionDigits: 2 }).format(Number(v) || 0);

// LOGO: VENTANA CON MANETA (MISMO DIBUJO QUE EN LA WEB, VIEWBOX 48x48)
const DRAW_LOGO = (pdf, x, y, size) => {
  const s = size / 48;
  pdf.save().translate(x, y).scale(s);
  pdf.roundedRect(4, 4, 40, 40, 7).lineWidth(3.5).strokeColor(C.accent).stroke();
  pdf.roundedRect(10, 10, 12, 28, 2.5).fillOpacity(0.16).fill(C.accent);
  pdf.roundedRect(26, 10, 12, 28, 2.5).fill(C.accent);
  pdf.fillOpacity(1);
  pdf.roundedRect(26, 10, 12, 28, 2.5).lineWidth(2).strokeColor(C.accent).stroke();
  pdf.moveTo(24, 8).lineTo(24, 40).lineWidth(2.5).lineCap("round").strokeColor(C.accent).stroke();
  pdf.circle(29.5, 24, 2.2).fill(C.accent);
  pdf.roundedRect(28.4, 24, 2.2, 8, 1.1).fill(C.accent);
  pdf.restore();
};

const LABEL_TEXT = (pdf, text, x, y, opts = {}) =>
  pdf.font("Helvetica-Bold").fontSize(7.5).fillColor(C.muted).text(text.toUpperCase(), x, y, { characterSpacing: 0.8, ...opts });

// ----------------------
// BUILD: DEVUELVE UN BUFFER CON EL PDF
// ----------------------
const BUILD_DOCUMENT_PDF = (doc) =>
  new Promise((resolve, reject) => {
    const pdf = new PDFDocument({ size: "A4", margin: MARGIN, bufferPages: true, info: {
      Title: `${LABEL[doc.type]} ${doc.number}`,
      Author: doc.company?.name || "AluPVC Barcelona",
    } });
    const chunks = [];
    pdf.on("data", (c) => chunks.push(c));
    pdf.on("end", () => resolve(Buffer.concat(chunks)));
    pdf.on("error", reject);

    const company = doc.company || {};
    const client = doc.client || {};
    const isQuote = doc.type === "presupuesto";
    const cancelled = (doc.type === "factura" && doc.status === "anulado") || (isQuote && doc.status === "rechazado");

    // ---------- CABECERA
    DRAW_LOGO(pdf, MARGIN, MARGIN - 4, 40);
    pdf.font("Helvetica-Bold").fontSize(17).fillColor(C.ink).text("AluPVC", MARGIN + 50, MARGIN, { lineBreak: false });
    pdf.font("Helvetica-Bold").fontSize(7.5).fillColor(C.accent).text("BARCELONA", MARGIN + 50, MARGIN + 21, { characterSpacing: 2.2, lineBreak: false });

    const companyLines = [
      company.owner,
      company.nif ? `NIF ${company.nif}` : "",
      [company.address, [company.postalCode, company.city].filter(Boolean).join(" ")].filter(Boolean).join(", "),
      [company.phone, company.email].filter(Boolean).join(" · "),
    ].filter(Boolean);
    pdf.font("Helvetica-Bold").fontSize(10).fillColor(C.ink).text(company.name || "", MARGIN, MARGIN - 2, { width: CONTENT_W, align: "right" });
    pdf.font("Helvetica").fontSize(8.5).fillColor(C.text);
    companyLines.forEach((line) => pdf.text(line, MARGIN + CONTENT_W / 2, pdf.y + 1, { width: CONTENT_W / 2, align: "right" }));

    let y = Math.max(pdf.y, MARGIN + 44) + 14;
    pdf.moveTo(MARGIN, y).lineTo(MARGIN + CONTENT_W, y).lineWidth(1).strokeColor(C.ink).stroke();

    // ---------- TÍTULO + DATOS
    y += 22;
    pdf.font("Helvetica-Bold").fontSize(24).fillColor(C.ink).text(LABEL[doc.type], MARGIN, y);
    const meta = [
      ["Número", doc.number],
      ["Fecha", date(doc.issueDate)],
      isQuote && doc.expiryDate ? ["Válido hasta", date(doc.expiryDate)] : null,
      !isQuote && doc.dueDate ? ["Vencimiento", date(doc.dueDate)] : null,
    ].filter(Boolean);
    meta.forEach(([label, value], i) => {
      const my = y + 2 + i * 13;
      pdf.font("Helvetica").fontSize(9).fillColor(C.muted).text(label, MARGIN + CONTENT_W - 190, my, { width: 90, align: "right" });
      pdf.font(i === 0 ? "Helvetica-Bold" : "Helvetica").fillColor(C.ink).text(value, MARGIN + CONTENT_W - 95, my, { width: 95, align: "right" });
    });
    y = Math.max(pdf.y, y + 2 + meta.length * 13) + 18;

    // ---------- CLIENTE / TRABAJO
    const colW = CONTENT_W / 2 - 12;
    LABEL_TEXT(pdf, "Cliente", MARGIN, y);
    pdf.font("Helvetica-Bold").fontSize(10).fillColor(C.ink).text(client.name || "", MARGIN, y + 12, { width: colW });
    pdf.font("Helvetica").fontSize(9).fillColor(C.text);
    [
      client.nif ? `NIF ${client.nif}` : "",
      client.address,
      [client.postalCode, client.city].filter(Boolean).join(" "),
      [client.email, client.phone].filter(Boolean).join(" · "),
    ].filter(Boolean).forEach((line) => pdf.text(line, MARGIN, pdf.y + 1, { width: colW }));
    let leftEnd = pdf.y;

    let rightEnd = y;
    if (doc.title || doc.workAddress) {
      const rx = MARGIN + CONTENT_W / 2 + 12;
      LABEL_TEXT(pdf, "Trabajo", rx, y);
      if (doc.title) pdf.font("Helvetica-Bold").fontSize(10).fillColor(C.ink).text(doc.title, rx, y + 12, { width: colW });
      if (doc.workAddress) pdf.font("Helvetica").fontSize(9).fillColor(C.text).text(`Obra: ${doc.workAddress}`, rx, pdf.y + 1, { width: colW });
      rightEnd = pdf.y;
    }
    y = Math.max(leftEnd, rightEnd) + 22;

    // ---------- TABLA DE CONCEPTOS
    const cols = [
      { key: "description", label: "Concepto", w: CONTENT_W - 320, align: "left" },
      { key: "qty", label: "Cant.", w: 60, align: "right" },
      { key: "price", label: "Precio", w: 70, align: "right" },
      { key: "discount", label: "Dto.", w: 40, align: "right" },
      { key: "iva", label: "IVA", w: 40, align: "right" },
      { key: "amount", label: "Importe", w: 110, align: "right" },
    ];

    const tableHeader = () => {
      let x = MARGIN;
      cols.forEach((c) => {
        LABEL_TEXT(pdf, c.label, x + (c.align === "right" ? 0 : 0), y, { width: c.w - 6, align: c.align });
        x += c.w;
      });
      y += 14;
      pdf.moveTo(MARGIN, y).lineTo(MARGIN + CONTENT_W, y).lineWidth(1).strokeColor(C.ink).stroke();
      y += 8;
    };
    tableHeader();

    (doc.items || []).forEach((item) => {
      const cells = {
        description: item.description || "",
        qty: `${qty(item.quantity)} ${item.unit || ""}`.trim(),
        price: money(item.unitPrice),
        discount: item.discount ? `${qty(item.discount)}%` : "—",
        iva: `${item.iva}%`,
        amount: money(item.subtotal ?? item.quantity * item.unitPrice),
      };
      pdf.font("Helvetica").fontSize(9);
      const h = Math.max(...cols.map((c) => pdf.heightOfString(cells[c.key], { width: c.w - 6 }))) + 12;
      if (y + h > BOTTOM) {
        pdf.addPage();
        y = MARGIN;
        tableHeader();
      }
      let x = MARGIN;
      cols.forEach((c) => {
        pdf.font("Helvetica").fontSize(9).fillColor(c.key === "amount" || c.key === "description" ? C.ink : C.text)
          .text(cells[c.key], x, y, { width: c.w - 6, align: c.align });
        x += c.w;
      });
      y += h;
      pdf.moveTo(MARGIN, y - 6).lineTo(MARGIN + CONTENT_W, y - 6).lineWidth(0.6).strokeColor(C.line).stroke();
    });

    // ---------- TOTALES
    const taxes = doc.taxBreakdown?.length ? doc.taxBreakdown : [{ rate: 21, base: doc.subtotal, amount: doc.totalIVA }];
    const rows = [
      ["Base imponible", money(doc.subtotal)],
      ...taxes.map((t) => [`IVA ${t.rate}%${taxes.length > 1 ? ` (base ${money(t.base)})` : ""}`, money(t.amount)]),
      doc.irpf ? [`Retención IRPF ${doc.irpf}%`, `-${money(doc.irpfAmount)}`] : null,
    ].filter(Boolean);
    const totalsH = rows.length * 16 + 34;
    if (y + totalsH > BOTTOM) {
      pdf.addPage();
      y = MARGIN;
    }
    y += 8;
    const tx = MARGIN + CONTENT_W - 250;
    rows.forEach(([label, value]) => {
      pdf.font("Helvetica").fontSize(9.5).fillColor(C.text).text(label, tx, y, { width: 150 });
      pdf.fillColor(C.ink).text(value, tx + 150, y, { width: 100, align: "right" });
      y += 16;
    });
    y += 2;
    pdf.moveTo(tx, y).lineTo(MARGIN + CONTENT_W, y).lineWidth(1).strokeColor(C.ink).stroke();
    y += 8;
    pdf.font("Helvetica-Bold").fontSize(13).fillColor(C.ink).text("Total", tx, y, { width: 120 });
    pdf.text(money(doc.grandTotal), tx + 110, y, { width: 140, align: "right" });
    y += 30;

    // ---------- NOTAS
    const block = (title, text, bold) => {
      if (!text) return;
      pdf.font("Helvetica").fontSize(9);
      const h = pdf.heightOfString(text, { width: CONTENT_W }) + 18;
      if (y + h > BOTTOM) {
        pdf.addPage();
        y = MARGIN;
      }
      LABEL_TEXT(pdf, title, MARGIN, y);
      pdf.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(9).fillColor(bold ? C.ink : C.text).text(text, MARGIN, y + 12, { width: CONTENT_W, lineGap: 1.5 });
      y = pdf.y + 14;
    };
    block("Observaciones", doc.observations);
    block(isQuote ? "Condiciones" : "Forma de pago", doc.conditions);
    if (!isQuote && company.iban) block("Cuenta para transferencia", company.iban, true);

    // ---------- FIRMA (PRESUPUESTOS)
    if (isQuote) {
      if (y + 70 > BOTTOM) {
        pdf.addPage();
        y = MARGIN;
      }
      y += 10;
      LABEL_TEXT(pdf, "Aceptación del cliente", MARGIN, y);
      pdf.moveTo(MARGIN, y + 48).lineTo(MARGIN + 220, y + 48).lineWidth(0.8).strokeColor("#cfcfc8").stroke();
      pdf.font("Helvetica").fontSize(8).fillColor(C.muted).text("Firma y fecha", MARGIN, y + 53);
    }

    // ---------- SELLO ANULADO + PIE EN TODAS LAS PÁGINAS
    const range = pdf.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      pdf.switchToPage(i);
      // EL PIE QUEDA BAJO EL MARGEN INFERIOR: SIN ESTO PDFKIT ABRIRÍA UNA PÁGINA NUEVA
      const bottomMargin = pdf.page.margins.bottom;
      pdf.page.margins.bottom = 0;
      if (cancelled) {
        pdf.save().rotate(-18, { origin: [PAGE_W / 2, 420] });
        pdf.font("Helvetica-Bold").fontSize(90).fillColor(C.danger).fillOpacity(0.12)
          .text(isQuote ? "CANCELADO" : "ANULADA", 0, 380, { width: PAGE_W, align: "center", lineBreak: false });
        pdf.restore();
        pdf.fillOpacity(1);
      }
      const fy = 842 - 46;
      pdf.moveTo(MARGIN, fy - 8).lineTo(MARGIN + CONTENT_W, fy - 8).lineWidth(0.6).strokeColor(C.line).stroke();
      pdf.font("Helvetica").fontSize(7.5).fillColor(C.muted)
        .text(`${company.name || ""} · ${(company.website || "").replace(/^https?:\/\//, "")}`, MARGIN, fy, { width: CONTENT_W - 80, lineBreak: false })
        .text(`${doc.number} · ${i + 1}/${range.count}`, MARGIN + CONTENT_W - 120, fy, { width: 120, align: "right", lineBreak: false });
      pdf.page.margins.bottom = bottomMargin;
    }

    pdf.end();
  });

const PDF_FILENAME = (doc) => `${LABEL[doc.type] || "Documento"}-${doc.number}.pdf`;

module.exports = { BUILD_DOCUMENT_PDF, PDF_FILENAME };
