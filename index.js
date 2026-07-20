const RESOLVE_DNS = require('./src/config/resolve.dns') // DNS RESOLUTION CONFIG
RESOLVE_DNS() // Function to resolve DNS issues in certain environments

require('dotenv').config();
const EXPRESS = require('express')
const CORS = require('cors')

// ----------------------
// CONFIGS
// ----------------------
const ENV = require('./src/config/env.config') // ENVIRONMENT VARIABLES
const CONNECT_DDBB = require('./src/config/database.config') // DATABASE CONNECTION

// ----------------------
// INITIALIZE EXPRESS APP
// ----------------------
const APP = EXPRESS()

// ----------------------
// MIDDLEWARES
// ----------------------
APP.use(CORS()) // ENABLE CORS
APP.use(EXPRESS.json()) // PARSE JSON REQUESTS
APP.use(EXPRESS.urlencoded({ extended: true })) // PARSE URL-ENCODED REQUESTS

// ----------------------
// DATABASE CONNECTION
// ----------------------
CONNECT_DDBB()

// ----------------------
// MAIN ROUTES
// ----------------------
const ROUTES = require('./src/routes/main.routes')
APP.use('/api', ROUTES) // PREFIX ALL ROUTES WITH /API */

// ----------------------
// ERROR HANDLING
// ----------------------
APP.use((req, res, next) => {
  // HANDLE 404 ERRORS
  const error = new Error('Route does not exist. Please contact support.')
  error.status = 404
  next(error)
})

APP.use((error, req, res, next) => {
  // HANDLE GENERAL ERRORS
  console.error('Error: ', error.message)
  return res.status(error.status || 500).json({
    message:
      error.message ||
      'There was a problem with the server. Please try again later.',
  })
})

// ----------------------
// START SERVER
// ----------------------
APP.listen(ENV.PORT, () => {
  console.log(`Server running on port ${ENV.PORT}`)
})
