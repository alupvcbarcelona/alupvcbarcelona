const mongoose = require('mongoose')
const ENV = require('./env.config')

const CONNECT_DDBB = async () => { 
  try {
    await mongoose.connect(ENV.MONGODB_URI)
    console.log(`Connect: MongoDB`)
  } catch (error) {
    console.error('CONNECT_DDBB Error:', error.message)
    process.exit(1)
  }
}

module.exports = CONNECT_DDBB
