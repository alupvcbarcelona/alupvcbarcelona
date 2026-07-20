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
// MIDDLEWARES
// ----------------------
const { isAuth } = require('../../middlewares/is-auth.middleware') // CHECKS IF USER IS AUTHENTICATED

// ----------------------
// USER ROUTES
// ----------------------

/**
 * @route   POST /create-user
 * @desc    CREATE A NEW USER
 * @access  PUBLIC
 */
USER_ROUTES.post('/create-user', CREATE_USER)

/**
 * @route   POST /login
 * @desc    LOGIN USER
 * @access  PUBLIC
 */
USER_ROUTES.post('/login', LOGIN_USER)

/**
 * @route   GET /profile
 * @desc    UPDATE AUTHENTICATED USER PROFILE
 * @access  PRIVATE (AUTHENTICATED USER)
 */
USER_ROUTES.get('/profile', isAuth, GET_PROFILE)

/**
 * @route   POST /review
 * @desc    UPDATE AUTHENTICATED USER PROFILE
 * @access  PRIVATE (AUTHENTICATED USER)
 */
USER_ROUTES.get('/review', REVIEW)



module.exports = REVIEW_ROUTES