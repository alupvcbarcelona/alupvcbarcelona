const express = require("express");
const QUOTE_ROUTES = express.Router();

// ----------------------
// CONTROLLERS
// ----------------------
const {
  CREATE_QUOTE,
} = require("../../controllers/quotes/quotes.controller");

// ----------------------
// QUOTE ROUTES
// ----------------------

/**
 * @route   POST /create-quote
 * @desc    CREATE A NEW QUOTE
 * @access  PUBLIC
 */
QUOTE_ROUTES.post("/create-quote", CREATE_QUOTE);

module.exports = QUOTE_ROUTES;
