const mongoose = require("mongoose");
const { Schema } = mongoose;

// ----------------------
// USER SCHEMA
// ----------------------
const reviewSchema = new Schema(
  {
    // PERSONAL INFORMATION
    username: { type: String, required: true }, // FIRST NAME
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
    stars: { type: Number, required: true, min: 1, max: 5 },
  },
  {
    collection: "reviews", // COLLECTION NAME IN MONGODB
    timestamps: true, // CREATION AND UPDATE TIMESTAMPS
  },
);

// ----------------------
// MODEL EXPORT
// ----------------------
const REVIEW_MODEL = mongoose.model("reviews", reviewSchema);
module.exports = REVIEW_MODEL;
