const express = require("express");
const REVIEW_ROUTES = express.Router();

// ----------------------
// CONTROLLERS
// ----------------------
const {
  CREATE_REVIEW,
  GET_REVIEWS,
} = require("../../controllers/reviews/reviews.controller");

// ----------------------
// REVIEW ROUTES
// ----------------------

/**
 * @route   POST /create-reviews
 * @desc    CREATE A NEW REVIEW
 * @access  PUBLIC
 */
REVIEW_ROUTES.post("/create-review", CREATE_REVIEW);

/**
 * @route   GET /profile
 * @desc    UPDATE AUTHENTICATED USER PROFILE
 * @access  PRIVATE (AUTHENTICATED USER)
 */
REVIEW_ROUTES.get("/", GET_REVIEWS);

module.exports = REVIEW_ROUTES;
