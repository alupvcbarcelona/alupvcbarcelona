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
  } else if (error.response && error.config?.url?.includes("googleapis.com")) {
    // GOOGLE API ERRORS (GMAIL / CALENDAR)
    const googleStatus = error.response.status;
    status = googleStatus === 404 ? 404 : 502;
    message =
      googleStatus === 401 || googleStatus === 403 || error.message?.includes("invalid_grant")
        ? "Google rechazó la conexión. Genera un nuevo refresh token con permisos de Gmail y Calendar."
        : `Error de Google: ${error.response.data?.error?.message || error.message}`;
  } else if (error.message?.includes("invalid_grant")) {
    status = 502;
    message = "El token de Google ha caducado o no es válido. Genera un nuevo refresh token.";
  } else if (error.code === 11000) {
    status = 409;
    message = "Ya existe un registro con esos datos.";
  }

  if (status >= 500) console.error("Error: ", error.message);
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
