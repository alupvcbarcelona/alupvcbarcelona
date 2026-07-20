const express = require('express')
const MAIN_ROUTES = express.Router()

// ----------------------
// IMPORT ROUTES
// GET POST
// ----------------------
const USER = require('./users.routes/users.routes')


// ----------------------
// MAIN ROUTES
// ----------------------

MAIN_ROUTES.use('/user', USER)

module.exports = MAIN_ROUTES
