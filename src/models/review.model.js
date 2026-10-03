const mongoose = require("mongoose");
const { Schema } = mongoose;

// ----------------------
// REVIEW SCHEMA
// ----------------------
const reviewSchema = new Schema(
  {
    username: { type: String, required: true, trim: true, maxlength: 80 },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    stars: { type: Number, required: true, min: 1, max: 5 },
    location: { type: String, trim: true, maxlength: 80 },
    // NEW REVIEWS WAIT FOR ADMIN APPROVAL. LEGACY REVIEWS (WITHOUT FIELD) ARE PUBLIC
    approved: { type: Boolean, default: false },
  },
  {
    collection: "reviews",
    timestamps: true,
  },
);

const REVIEW_MODEL = mongoose.model("reviews", reviewSchema);
module.exports = REVIEW_MODEL;
