const express = require("express");
const QUOTE_ROUTES = express.Router();

// ----------------------
// CONTROLLERS
// ----------------------
const {
  CREATE_QUOTE,
  GET_QUOTES,
  GET_QUOTE,
  UPDATE_QUOTE,
  DELETE_QUOTE,
} = require("../../controllers/quotes/quotes.controller");

// ----------------------
// MIDDLEWARES
// ----------------------
const { isAuth } = require("../../middlewares/is-auth.middleware"); // CHECKS IF USER IS AUTHENTICATED

// ----------------------
// QUOTE ROUTES
// ----------------------

/**
 * @route   POST /create-quote
 * @desc    CREATE A NEW QUOTE
 * @access  PUBLIC
 */
QUOTE_ROUTES.post("/create-quote", isAuth, CREATE_QUOTE);

/**
 * @route   GET /get-quotes
 * @desc    GET ALL QUOTES
 * @access  PUBLIC
 */
QUOTE_ROUTES.get("/get-quotes", isAuth, GET_QUOTES);

/**
 * @route   GET /get-quote/:id
 * @desc    GET SINGLE QUOTE
 * @access  PUBLIC
 */
QUOTE_ROUTES.get("/get-quote/:id", isAuth, GET_QUOTE);

/**
 * @route   PUT /update-quote/:id
 * @desc    UPDATE QUOTE
 * @access  PUBLIC
 */
QUOTE_ROUTES.put("/update-quote/:id", isAuth, UPDATE_QUOTE);

/**
 * @route   DELETE /delete-quote/:id
 * @desc    DELETE QUOTE
 * @access  PUBLIC
 */
QUOTE_ROUTES.delete("/delete-quote/:id", isAuth, DELETE_QUOTE);

module.exports = QUOTE_ROUTES;
