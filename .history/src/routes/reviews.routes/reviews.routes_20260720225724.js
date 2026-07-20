const express = require('express')
const REVIEW_ROUTES = express.Router()

// ----------------------
// CONTROLLERS
// ----------------------
const {
  CREATE_REVIEW,
  GET_REVIEW,
} = require('../../controllers/reviews/reviews.controller')


// ----------------------
// REVIEW ROUTES
// ----------------------

/**
 * @route   POST /create-reviews
 * @desc    CREATE A NEW REVIEW
 * @access  PUBLIC
 */
USER_ROUTES.post('/create-review', CREATE_REVIEW)

/**
 * @route   GET /profile
 * @desc    UPDATE AUTHENTICATED USER PROFILE
 * @access  PRIVATE (AUTHENTICATED USER)
 */
USER_ROUTES.get('/', isAuth, GET_REVIEW)




module.exports = REVIEW_ROUTES