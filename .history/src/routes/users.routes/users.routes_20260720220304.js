const express = require('express')
const USER_ROUTES = express.Router()

// ----------------------
// CONTROLLERS
// ----------------------
const {
  CREATE_USER,
  LOGIN_USER,
  GET_PROFILE
} = require('../../controllers/user.controllers/user.controllers')

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
USER_ROUTES.put('/profile', isAuth, UPDATE_USER)



module.exports = USER_ROUTES