const RESOLVE_DNS = require("./src/config/resolve.dns"); // DNS RESOLUTION CONFIG
RESOLVE_DNS(); // Function to resolve DNS issues in certain environments

require("dotenv").config();
const EXPRESS = require("express");
const CORS = require("cors");
const HELMET = require("helmet");

// ----------------------
// CONFIGS
// ----------------------
const ENV = require("./src/config/env.config"); // ENVIRONMENT VARIABLES
const CONNECT_DDBB = require("./src/config/database.config"); // DATABASE CONNECTION

// ----------------------
// INITIALIZE EXPRESS APP
// ----------------------
const APP = EXPRESS();
APP.set("trust proxy", true);

// ----------------------
// MIDDLEWARES
// ----------------------
const ORIGINS = ENV.CORS_ORIGIN.split(",").map((o) => o.trim()).filter(Boolean);
APP.use(HELMET({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
APP.use(CORS(ORIGINS.length ? { origin: ORIGINS } : undefined));
APP.use(EXPRESS.json({ limit: "1mb" })); // PARSE JSON REQUESTS
APP.use(EXPRESS.urlencoded({ extended: true })); // PARSE URL-ENCODED REQUESTS

// ----------------------
// DATABASE CONNECTION
// ----------------------
CONNECT_DDBB();

// ----------------------
// MAIN ROUTES
// ----------------------
const ROUTES = require("./src/routes/main.routes");
APP.use("/api", ROUTES); // PREFIX ALL ROUTES WITH /API */

// ----------------------
// ERROR HANDLING
// ----------------------
APP.use((req, res, next) => {
  // HANDLE 404 ERRORS
  const error = new Error("La ruta no existe.");
  error.status = 404;
  next(error);
});

APP.use((error, req, res, next) => {
  // HANDLE GENERAL ERRORS
  let status = error.status || 500;
  let message = error.message;

  if (error.name === "ValidationError") {
    status = 400;
    message = Object.values(error.errors).map((e) => e.message).join(" ");
  } else if (error.name === "CastError") {
    status = 400;
    message = "Identificador no válido.";
  } else if (String(error.config?.url || "").includes("googleapis.com")) {
    // GOOGLE API ERRORS (GMAIL / CALENDAR / OAUTH). config.url ES UN OBJETO URL
    const googleStatus = error.response?.status || error.status;
    const detail = error.response?.data?.error_description || error.response?.data?.error?.message || error.message;
    status = googleStatus === 404 ? 404 : 502;
    if (/invalid_grant/i.test(detail) || /invalid_grant/i.test(error.message)) {
      message = "El refresh token de Google ha caducado o no es válido. Genera uno nuevo (OAUTH_REFRESH_TOKEN).";
    } else if (/invalid_client|unauthorized_client/i.test(error.message)) {
      message = "Google no reconoce el cliente OAuth. Revisa OAUTH_CLIENTID y OAUTH_CLIENT_SECRET, y que el refresh token se generó con ese mismo cliente.";
    } else if (/has not been used|is disabled|accessNotConfigured/i.test(detail)) {
      message = `La API de Google no está activada en el proyecto de Google Cloud. ${detail}`;
    } else if (googleStatus === 403 || /insufficient/i.test(detail)) {
      message = "El token de Google no tiene permisos suficientes. Genera un refresh token con los permisos de Gmail y Calendar.";
    } else {
      message = `Error de Google: ${detail}`;
    }
  } else if (error.code === 11000) {
    status = 409;
    message = "Ya existe un registro con esos datos.";
  }

  if (status >= 500) console.error("Error: ", error.message, error.response?.data ? JSON.stringify(error.response.data) : "");
  return res.status(status).json({
    success: false,
    message:
      status === 500
        ? "Ha ocurrido un problema en el servidor. Inténtalo de nuevo más tarde."
        : message,
  });
});

// ----------------------
// START SERVER
// ----------------------
if (require.main === module) {
  APP.listen(ENV.PORT, () => {
    console.log(`Server running on port ${ENV.PORT}`);
  });
}

module.exports = APP;
