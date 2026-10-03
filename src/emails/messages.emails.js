const { sendMail } = require("../config/nodemailer");
const { ESCAPE_HTML, ESCAPE_MULTILINE } = require("../utils/escape");
const { LAYOUT, H1, P, DETAILS, NOTE, BUTTON } = require("./layout");
const { SITE_URL } = require("../config/env.config");

// ----------------------
// NEW CONTACT REQUEST -> ADMIN
// ----------------------
const emailNewMessage = async (message, company, to) => {
  const body = `
    ${H1("Nueva solicitud de contacto")}
    ${P(`Has recibido un mensaje desde la web de <strong>${ESCAPE_HTML(message.name)}</strong>.`)}
    ${DETAILS([
      ["Nombre", ESCAPE_HTML(message.name)],
      ["Email", `<a href="mailto:${ESCAPE_HTML(message.email)}" style="color:#1f2f6b;">${ESCAPE_HTML(message.email)}</a>`],
      ["Teléfono", message.phone ? `<a href="tel:${ESCAPE_HTML(message.phone)}" style="color:#1f2f6b;">${ESCAPE_HTML(message.phone)}</a>` : ""],
      ["Localidad", ESCAPE_HTML(message.city)],
      ["Servicio", ESCAPE_HTML(message.service)],
    ])}
    ${NOTE(ESCAPE_MULTILINE(message.message))}
    ${BUTTON(`${SITE_URL}/admin/mensajes/${message._id}`, "Ver en el panel")}
  `;

  return sendMail(
    to,
    [],
    `Nueva solicitud: ${message.service || "Contacto"} · ${message.name}`,
    LAYOUT({ title: "Nueva solicitud de contacto", preheader: message.message.slice(0, 90), body, company }),
    { replyTo: message.email, fromName: "Web " + company.name },
  );
};

// ----------------------
// CONFIRMATION -> CLIENT
// ----------------------
const emailMessageReceived = async (message, company) => {
  const body = `
    ${H1("Hemos recibido tu solicitud")}
    ${P(`Hola ${ESCAPE_HTML(message.name)}, gracias por contactar con ${ESCAPE_HTML(company.name)}.`)}
    ${P("Revisaremos tu mensaje y te responderemos lo antes posible.")}
    ${NOTE(ESCAPE_MULTILINE(message.message))}
    ${P(`Si es urgente, puedes llamarnos al <strong>${ESCAPE_HTML(company.phone)}</strong>.`)}
  `;

  return sendMail(
    message.email,
    [],
    `Hemos recibido tu solicitud · ${company.name}`,
    LAYOUT({ title: "Solicitud recibida", preheader: "Te responderemos lo antes posible", body, company }),
    { replyTo: company.email, fromName: company.name },
  );
};

// ----------------------
// REPLY FROM THE DASHBOARD -> CLIENT
// ----------------------
const emailReply = async (message, reply, company) => {
  const body = `
    ${P(ESCAPE_MULTILINE(reply.body))}
    <p style="margin:32px 0 0;font-size:14px;">Un saludo,<br><strong>${ESCAPE_HTML(company.owner || company.name)}</strong><br>${ESCAPE_HTML(company.name)} · ${ESCAPE_HTML(company.phone)}</p>
    <div style="margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280;">
      Tu mensaje del ${new Date(message.createdAt).toLocaleDateString("es-ES")}:<br>${ESCAPE_MULTILINE(message.message)}
    </div>
  `;

  return sendMail(
    message.email,
    [],
    reply.subject,
    LAYOUT({ title: reply.subject, preheader: reply.body.slice(0, 90), body, company }),
    { replyTo: company.email, fromName: company.name },
  );
};

module.exports = { emailNewMessage, emailMessageReceived, emailReply };
