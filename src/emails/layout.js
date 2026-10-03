const { ESCAPE_HTML } = require("../utils/escape");
const COMPANY = require("../config/company");

// ----------------------
// BRAND
// ----------------------
const BRAND = {
  ink: "#111827",
  text: "#374151",
  muted: "#6b7280",
  line: "#e5e7eb",
  soft: "#f9fafb",
  accent: "#1f2f6b",
  font: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif",
};

// ----------------------
// EMAIL LAYOUT (TABLES + INLINE STYLES FOR GMAIL / OUTLOOK COMPATIBILITY)
// ----------------------
const LAYOUT = ({ preheader = "", title = "", body = "", company = COMPANY }) => `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${ESCAPE_HTML(title)}</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.soft};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${ESCAPE_HTML(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.soft};">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border:1px solid ${BRAND.line};border-radius:8px;">
        <tr>
          <td style="padding:28px 32px;border-bottom:1px solid ${BRAND.line};">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-family:${BRAND.font};font-size:16px;font-weight:700;color:${BRAND.ink};letter-spacing:.5px;">
                  ${company.logo ? `<img src="${ESCAPE_HTML(company.logo)}" alt="${ESCAPE_HTML(company.name)}" height="40" style="display:block;height:40px;width:auto;border:0;">` : ESCAPE_HTML(company.name)}
                </td>
                <td align="right" style="font-family:${BRAND.font};font-size:12px;color:${BRAND.muted};">${ESCAPE_HTML(company.website?.replace(/^https?:\/\//, "") || "")}</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;font-family:${BRAND.font};font-size:15px;line-height:1.6;color:${BRAND.text};">
            ${body}
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px;border-top:1px solid ${BRAND.line};font-family:${BRAND.font};font-size:12px;line-height:1.6;color:${BRAND.muted};">
            <strong style="color:${BRAND.ink};">${ESCAPE_HTML(company.name)}</strong><br>
            ${[company.address, company.city].filter(Boolean).map(ESCAPE_HTML).join(", ")}<br>
            ${[company.phone, company.email].filter(Boolean).map(ESCAPE_HTML).join(" · ")}
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;

// ----------------------
// SMALL BUILDING BLOCKS
// ----------------------
const H1 = (text) =>
  `<h1 style="margin:0 0 16px;font-size:20px;line-height:1.3;font-weight:600;color:${BRAND.ink};">${ESCAPE_HTML(text)}</h1>`;

const P = (html) => `<p style="margin:0 0 16px;">${html}</p>`;

const BUTTON = (href, label) => `
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
  <tr><td style="background:${BRAND.accent};border-radius:6px;">
    <a href="${ESCAPE_HTML(href)}" style="display:inline-block;padding:12px 22px;font-family:${BRAND.font};font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;">${ESCAPE_HTML(label)}</a>
  </td></tr>
</table>`;

// KEY / VALUE TABLE
const DETAILS = (rows) => `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 24px;border:1px solid ${BRAND.line};border-radius:6px;">
  ${rows
    .filter(([, value]) => value)
    .map(
      ([label, value], i) => `
  <tr>
    <td style="padding:10px 14px;width:38%;font-size:13px;color:${BRAND.muted};${i ? `border-top:1px solid ${BRAND.line};` : ""}">${ESCAPE_HTML(label)}</td>
    <td style="padding:10px 14px;font-size:14px;color:${BRAND.ink};${i ? `border-top:1px solid ${BRAND.line};` : ""}">${value}</td>
  </tr>`,
    )
    .join("")}
</table>`;

const NOTE = (html) =>
  `<div style="margin:24px 0;padding:14px 16px;background:${BRAND.soft};border-left:3px solid ${BRAND.accent};font-size:14px;">${html}</div>`;

module.exports = { BRAND, LAYOUT, H1, P, BUTTON, DETAILS, NOTE };
