const express = require('express')
const MAIN_ROUTES = express.Router()

// ----------------------
// IMPORT ROUTES
// GET POST UPDATE DELETE
// ----------------------
const USER = require('./users.routes/users.routes')


// ----------------------
// MAIN ROUTES
// ----------------------

MAIN_ROUTES.use('/user', WEB_VIEW)

module.exports = MAIN_ROUTES
