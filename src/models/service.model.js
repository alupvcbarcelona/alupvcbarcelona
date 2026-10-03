const mongoose = require("mongoose");
const { Schema } = mongoose;

// ----------------------
// SERVICE SCHEMA (SERVICIOS QUE SE MUESTRAN EN LA WEB)
// ----------------------
const serviceSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 80 },
    slug: { type: String, required: true, unique: true, trim: true },
    icon: { type: String, default: "Wrench" },
    short: { type: String, trim: true, maxlength: 300 },
    points: [{ type: String, trim: true, maxlength: 140 }],
    image: { url: String, publicId: String },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { collection: "services", timestamps: true },
);

serviceSchema.index({ active: 1, order: 1 });

module.exports = mongoose.model("services", serviceSchema);
