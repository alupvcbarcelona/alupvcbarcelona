const express = require('express')
const MAIN_ROUTES = express.Router()

// ----------------------
// IMPORT ROUTES
// GET POST
// ----------------------
const USER = require('./users.routes/users.routes')
const REVIEWS = require('./reviews.routes/reviews.routes')
const QUOTE = require('./quote.routes/quote.routes')


// ----------------------
// MAIN ROUTES
// ----------------------

MAIN_ROUTES.use('/user', USER)
MAIN_ROUTES.use('/reviews', REVIEWS)
MAIN_ROUTES.use('/quote', QUOTE)
module.exports = MAIN_ROUTES
