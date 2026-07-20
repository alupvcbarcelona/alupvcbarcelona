const express = require('express')
const USER_ROUTES = express.Router()

// ----------------------
// CONTROLLERS
// ----------------------
const {
  CREATE_USER,
  LOGIN_USER,
} = require('../../controllers/user.controllers/user.controllers')

// ----------------------
// MIDDLEWARES
// ----------------------
const { isAuth } = require('../../middlewares/is-auth.middleware') // CHECKS IF USER IS AUTHENTICATED
const { userAvatar } = require('../../middlewares/check-avatar.middleware')

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
 * @route   PUT /update-profile
 * @desc    UPDATE AUTHENTICATED USER PROFILE
 * @access  PRIVATE (AUTHENTICATED USER)
 */
USER_ROUTES.put('/update-profile', isAuth, UPDATE_USER)

/**
 * @route   GET /profile
 * @desc    GET AUTHENTICATED USER PROFILE
 * @access  PRIVATE (AUTHENTICATED USER)
 */
USER_ROUTES.get('/profile', isAuth, PROFILE_USER)

/**
 * @route   PUT /update-avatar
 * @desc    UPDATE AUTHENTICATED USER AVATAR
 * @access  PRIVATE (AUTHENTICATED USER)
 */
USER_ROUTES.put('/update-avatar', isAuth, userAvatar.single('vcd_avatar'), UPDATE_AVATAR)


module.exports = USER_ROUTES