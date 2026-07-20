const { VERIFY_TOKEN } = require('../config/jwt.config')
const USER_MODEL = require('../models/user.model')

// ----------------------
// ISAUTH MIDDLEWARE
// ----------------------
// THIS MIDDLEWARE CHECKS IF THE REQUEST HAS A VALID AUTHORIZATION TOKEN
// IT VALIDATES THE JWT AND ATTACHES THE USER TO req.user
const isAuth = async (req, res, next) => {
  try {
    // ----------------------
    // EXTRACT TOKEN FROM HEADERS
    // ----------------------
    const token =
      req.headers.authorization && req.headers.authorization?.split(' ')[1]
    if (!token) {
      return res.status(401).json({ message: 'Authorization token required.' })
    }

    // ----------------------
    // VERIFY TOKEN
    // ----------------------
    const isToken = VERIFY_TOKEN(token)

    // ----------------------
    // FETCH USER FROM DATABASE
    // ----------------------
    const user = await USER_MODEL.findById(isToken.id).select('-password')
    if (!user) {
      return res.status(401).json({ message: 'User does not exist.' })
    }

    // ----------------------
    // ATTACH USER TO REQUEST
    // ----------------------
    req.user = user
    next() // USER IS AUTHENTICATED, PROCEED TO NEXT MIDDLEWARE
  } catch (error) {
    console.error('MIDDLEWARE_isAuth error:', error)
    next(error)
  }
}

// ----------------------
// EXPORT
// ----------------------
module.exports = { isAuth }