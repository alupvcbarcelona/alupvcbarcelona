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
    email: {
      type: String,
      unique: true,
      trim: true,
      lowercase: true,
      required: true,
    }, // EMAIL ADDRESS
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