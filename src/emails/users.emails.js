const { sendMail } = require("../config/nodemailer");
const { ESCAPE_HTML } = require("../utils/escape");
const { LAYOUT, H1, P, DETAILS, NOTE } = require("./layout");

const DATE_TIME = (date) =>
  new Date(date).toLocaleString("es-ES", { timeZone: "Europe/Madrid", dateStyle: "long", timeStyle: "short" });

// ----------------------
// NEW LOGIN ALERT
// ----------------------
const emailWelcome = async (user, loginInfo) => {
  const body = `
    ${H1("Nuevo inicio de sesión")}
    ${P(`Hola ${ESCAPE_HTML(user.name)}, se ha iniciado sesión en el panel de administración.`)}
    ${DETAILS([
      ["Fecha", ESCAPE_HTML(DATE_TIME(loginInfo.loginAt || new Date()))],
      ["IP", ESCAPE_HTML(loginInfo.ip)],
      ["Ubicación", ESCAPE_HTML([loginInfo.city, loginInfo.region, loginInfo.country].filter(Boolean).join(", ") || "No disponible")],
      ["Dispositivo", ESCAPE_HTML(loginInfo.device)],
      ["Sistema", ESCAPE_HTML(`${loginInfo.os} ${loginInfo.osVersion}`.trim())],
      ["Navegador", ESCAPE_HTML(`${loginInfo.browser} ${loginInfo.browserVersion}`.trim())],
    ])}
    ${NOTE("Si no has sido tú, cambia tu contraseña desde <strong>Ajustes</strong> lo antes posible.")}
  `;

  await sendMail(
    user.email,
    [],
    "Nuevo inicio de sesión en el panel",
    LAYOUT({ title: "Nuevo inicio de sesión", preheader: `Acceso desde ${loginInfo.city || loginInfo.ip}`, body }),
  );
};

// ----------------------
// PASSWORD CHANGED
// ----------------------
const emailNewPassword = async (user) => {
  const body = `
    ${H1("Contraseña actualizada")}
    ${P(`Hola ${ESCAPE_HTML(user.name)}, te confirmamos que la contraseña de tu cuenta se ha actualizado correctamente.`)}
    ${NOTE("Si no reconoces este cambio, contacta con el soporte técnico inmediatamente.")}
  `;

  await sendMail(
    user.email,
    [],
    "Tu contraseña se ha actualizado",
    LAYOUT({ title: "Contraseña actualizada", preheader: "Confirmación de cambio de contraseña", body }),
  );
};

module.exports = { emailWelcome, emailNewPassword };
