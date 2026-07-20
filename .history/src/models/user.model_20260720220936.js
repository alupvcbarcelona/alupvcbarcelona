const mongoose = require('mongoose')
const { Schema } = mongoose
const bcrypt = require('bcrypt')

// ----------------------
// USER SCHEMA
// ----------------------
const userSchema = new Schema(
  {
    // PERSONAL INFORMATION
    name: { type: String, trim: true, required: true }, // FIRST NAME
    lastname: { type: String, trim: true, required: true }, // LAST NAME
    phone: { type: String, trim: true, required: true }, // PHONE NUMBER
    email: {
      type: String,
      unique: true,
      trim: true,
      lowercase: true,
      required: true,
    }, // EMAIL ADDRESS

    // ADDRESS INFORMATION
    address: { type: String, trim: true }, // STREET ADDRESS
    postal_code: { type: String, trim: true }, // POSTAL CODE
    city: { type: String, trim: true }, // CITY
    province: { type: String, trim: true }, // PROVINCE
    country: { type: String, trim: true }, // COUNTRY

    // GEOLOCATION
    location: {
      type: {
        type: String,
        enum: ['Point'], // GEOJSON TYPE
      },
      coordinates: {
        type: [Number], // [LONGITUDE, LATITUDE]
      },
    },

    // TAX IDENTIFICATION
    taxId: { type: String, trim: true, default: null }, // NIT / CIF / RUC

    // AUTHENTICATION
    password: { type: String, minlength: 6 }, // USER PASSWORD (HASHED)

    // PROFILE INFORMATION
    avatar: {
      type: String,
      default:
        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRDwmG52pVI5JZfn04j9gdtsd8pAGbqjjLswg&s',
    }, // PROFILE AVATAR
    roles: {
      type: [String],
      enum: ['user', 'admin'],
      default: ['user'],
    }, // USER ROLES
  },
  {
    collection: 'users', // COLLECTION NAME IN MONGODB
    timestamps: true, // CREATION AND UPDATE TIMESTAMPS
  },
)

// CREATE 2DSPHERE INDEX FOR GEOLOCATION QUERIES
userSchema.index({ location: '2dsphere' })

// ----------------------
// HASH PASSWORD BEFORE SAVE
// ----------------------
userSchema.pre('save', async function () {
  // Comprobamos si el password ya viene en texto plano y ha sido modificado
  if (this.isModified('password') || this.isNew) {
    // Solo hasheamos si NO empieza por el prefijo típico de bcrypt ($2b$)
    if (!this.password.startsWith('$2b$')) {
      const bcrypt = require('bcrypt')
      this.password = await bcrypt.hash(this.password, 8)
    }
  }
})

// ----------------------
// MODEL EXPORT
// ----------------------
const USER_MODEL = mongoose.model('users', userSchema)
module.exports = USER_MODEL