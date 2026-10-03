const { VERIFY_TOKEN } = require('../config/jwt.config')
const USER_MODEL = require('../models/user.model')

// ----------------------
// ISAUTH MIDDLEWARE
// ----------------------
// THIS MIDDLEWARE CHECKS IF THE REQUEST HAS A VALID AUTHORIZATION TOKEN
// IT VALIDATES THE JWT AND ATTACHES THE USER TO req.user
const isAuth = async (req, res, next) => {
  // ----------------------
  // EXTRACT TOKEN FROM HEADERS
  // ----------------------
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) {
    return res.status(401).json({ message: 'Necesitas iniciar sesión.' })
  }

  // ----------------------
  // VERIFY TOKEN
  // ----------------------
  let payload
  try {
    payload = VERIFY_TOKEN(token)
  } catch {
    return res.status(401).json({ message: 'La sesión ha caducado. Inicia sesión de nuevo.' })
  }

  // ----------------------
  // FETCH USER FROM DATABASE
  // ----------------------
  const user = await USER_MODEL.findById(payload.id).select('-password')
  if (!user) {
    return res.status(401).json({ message: 'El usuario no existe.' })
  }

  // ----------------------
  // ATTACH USER TO REQUEST
  // ----------------------
  req.user = user
  next() // USER IS AUTHENTICATED, PROCEED TO NEXT MIDDLEWARE
}

// ----------------------
// OPTIONAL AUTH: ATTACHES req.user IF A VALID TOKEN IS SENT, NEVER BLOCKS
// ----------------------
const optionalAuth = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (token) {
    try {
      const payload = VERIFY_TOKEN(token)
      req.user = await USER_MODEL.findById(payload.id).select('-password')
    } catch {
      req.user = null
    }
  }
  next()
}

// ----------------------
// EXPORT
// ----------------------
module.exports = { isAuth, optionalAuth }
