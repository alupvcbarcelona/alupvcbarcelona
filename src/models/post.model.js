const mongoose = require("mongoose");
const { Schema } = mongoose;

// ----------------------
// POST SCHEMA (WORKS / PROJECTS PUBLISHED BY THE ADMIN)
// ----------------------
const imageSchema = new Schema(
  {
    url: { type: String, required: true },
    publicId: String, // CLOUDINARY ID (TO DELETE)
    alt: String,
  },
  { _id: false },
);

const postSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    slug: { type: String, required: true, unique: true, trim: true },
    category: { type: String, trim: true, default: "Ventanas" },
    location: { type: String, trim: true },
    excerpt: { type: String, trim: true, maxlength: 300 },
    content: { type: String, default: "" },
    images: [imageSchema],
    published: { type: Boolean, default: false },
    featured: { type: Boolean, default: false },
    workDate: Date,
    publishedAt: Date,
  },
  { collection: "posts", timestamps: true },
);

postSchema.index({ published: 1, publishedAt: -1 });

module.exports = mongoose.model("posts", postSchema);
