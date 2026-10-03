const express = require("express");
const MESSAGE_ROUTES = express.Router();

const {
  CREATE_MESSAGE,
  GET_MESSAGES,
  GET_MESSAGE,
  UPDATE_MESSAGE,
  REPLY_MESSAGE,
  DELETE_MESSAGE,
} = require("../controllers/messages/messages.controller");
const { isAuth } = require("../middlewares/is-auth.middleware");
const { RATE_LIMIT } = require("../middlewares/rate-limit.middleware");

/**
 * @route   POST /api/contact
 * @desc    PUBLIC CONTACT FORM (MAX 5 PER 10 MINUTES PER IP)
 */
MESSAGE_ROUTES.post("/", RATE_LIMIT({ windowMs: 10 * 60_000, max: 5 }), CREATE_MESSAGE);

// ADMIN
MESSAGE_ROUTES.get("/", isAuth, GET_MESSAGES);
MESSAGE_ROUTES.get("/:id", isAuth, GET_MESSAGE);
MESSAGE_ROUTES.patch("/:id", isAuth, UPDATE_MESSAGE);
MESSAGE_ROUTES.post("/:id/reply", isAuth, REPLY_MESSAGE);
MESSAGE_ROUTES.delete("/:id", isAuth, DELETE_MESSAGE);

module.exports = MESSAGE_ROUTES;
