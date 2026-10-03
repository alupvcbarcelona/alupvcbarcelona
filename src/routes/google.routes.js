const express = require("express");
const { isAuth } = require("../middlewares/is-auth.middleware");
const {
  GET_THREADS,
  GET_THREAD,
  GET_ATTACHMENT,
  SEND_EMAIL,
  MODIFY_THREAD,
} = require("../controllers/mail/mail.controller");
const {
  GET_EVENTS,
  CREATE_EVENT,
  UPDATE_EVENT,
  DELETE_EVENT,
} = require("../controllers/calendar/calendar.controller");

// ----------------------
// GMAIL INBOX (ADMIN)
// ----------------------
const MAIL_ROUTES = express.Router();
MAIL_ROUTES.use(isAuth);
MAIL_ROUTES.get("/", GET_THREADS); // ?folder=inbox|unread|sent|starred|trash&q=&pageToken=
MAIL_ROUTES.post("/send", SEND_EMAIL);
MAIL_ROUTES.get("/:id", GET_THREAD);
MAIL_ROUTES.patch("/:id", MODIFY_THREAD);
MAIL_ROUTES.get("/attachment/:messageId/:attachmentId", GET_ATTACHMENT);

// ----------------------
// GOOGLE CALENDAR (ADMIN)
// ----------------------
const CALENDAR_ROUTES = express.Router();
CALENDAR_ROUTES.use(isAuth);
CALENDAR_ROUTES.get("/events", GET_EVENTS); // ?from=&to=
CALENDAR_ROUTES.post("/events", CREATE_EVENT);
CALENDAR_ROUTES.put("/events/:id", UPDATE_EVENT);
CALENDAR_ROUTES.delete("/events/:id", DELETE_EVENT);

module.exports = { MAIL_ROUTES, CALENDAR_ROUTES };
