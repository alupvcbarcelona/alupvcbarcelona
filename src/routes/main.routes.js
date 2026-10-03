const express = require("express");
const MAIN_ROUTES = express.Router();

// ----------------------
// IMPORT ROUTES
// ----------------------
const USER = require("./users.routes");
const REVIEWS = require("./reviews.routes");
const { DOCUMENT_ROUTES, LEGACY_QUOTE_ROUTES } = require("./documents.routes");
const MESSAGES = require("./messages.routes");
const POSTS = require("./posts.routes");
const MEDIA = require("./media.routes");
const VISITS = require("./visits.routes");
const SETTINGS = require("./settings.routes");
const { MAIL_ROUTES, CALENDAR_ROUTES } = require("./google.routes");

// ----------------------
// MAIN ROUTES
// ----------------------
MAIN_ROUTES.get("/health", (req, res) => res.json({ ok: true }));
MAIN_ROUTES.use("/user", USER);
MAIN_ROUTES.use("/reviews", REVIEWS);
MAIN_ROUTES.use("/documents", DOCUMENT_ROUTES);
MAIN_ROUTES.use("/quote", LEGACY_QUOTE_ROUTES);
MAIN_ROUTES.use("/contact", MESSAGES);
MAIN_ROUTES.use("/posts", POSTS);
MAIN_ROUTES.use("/media", MEDIA);
MAIN_ROUTES.use("/visits", VISITS);
MAIN_ROUTES.use("/settings", SETTINGS);
MAIN_ROUTES.use("/mail", MAIL_ROUTES);
MAIN_ROUTES.use("/calendar", CALENDAR_ROUTES);

module.exports = MAIN_ROUTES;
