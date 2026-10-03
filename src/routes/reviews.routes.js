const express = require("express");
const REVIEW_ROUTES = express.Router();

const {
  CREATE_REVIEW,
  GET_REVIEWS,
  GET_ALL_REVIEWS,
  UPDATE_REVIEW,
  DELETE_REVIEW,
} = require("../controllers/reviews/reviews.controller");
const { isAuth } = require("../middlewares/is-auth.middleware");
const { RATE_LIMIT } = require("../middlewares/rate-limit.middleware");

// PUBLIC
REVIEW_ROUTES.get("/", GET_REVIEWS);
REVIEW_ROUTES.post("/create-review", RATE_LIMIT({ windowMs: 60 * 60_000, max: 3 }), CREATE_REVIEW);

// ADMIN
REVIEW_ROUTES.get("/admin/all", isAuth, GET_ALL_REVIEWS);
REVIEW_ROUTES.patch("/:id", isAuth, UPDATE_REVIEW);
REVIEW_ROUTES.delete("/:id", isAuth, DELETE_REVIEW);

module.exports = REVIEW_ROUTES;
