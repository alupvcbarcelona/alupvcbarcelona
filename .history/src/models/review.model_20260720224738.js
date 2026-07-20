const mongoose = require("mongoose");
const { Schema } = mongoose;

// ----------------------
// USER SCHEMA
// ----------------------
const reviewSchema = new Schema(
  {
    // PERSONAL INFORMATION
    user: { type: String, trim: true, required: true }, // FIRST NAME
    title: {
      type: String,
      lowercase: true,
      required: true,
    },
    description: {
      type: String,
      lowercase: true,
      required: true,
    },
  },
  {
    collection: "reviews", // COLLECTION NAME IN MONGODB
    timestamps: true, // CREATION AND UPDATE TIMESTAMPS
  },
);

// ----------------------
// MODEL EXPORT
// ----------------------
const REVIEW_MODEL = mongoose.model("users", reviewSchema);
module.exports = REVIEW_MODEL;
