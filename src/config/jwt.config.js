const JWT = require('jsonwebtoken')
const { JWT_SECRET } = require('./env.config')

const CREATE_TOKEN = (id) => {
  if (!id) {
    throw new Error('ID inválido')
  }
  return JWT.sign({ id }, JWT_SECRET, { expiresIn: '365d' })
}

const VERIFY_TOKEN = (token) => {
  if (!token || typeof token !== 'string') {
    throw new Error('Token inválido')
  }
  return JWT.verify(token, JWT_SECRET)
}
module.exports = { CREATE_TOKEN, VERIFY_TOKEN }