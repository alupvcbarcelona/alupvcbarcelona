const mongoose = require("mongoose");
const { Schema } = mongoose;

// ----------------------
// CONTACT MESSAGE SCHEMA
// ----------------------
const replySchema = new Schema(
  {
    subject: String,
    body: String,
    sentAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const messageSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 160 },
    phone: { type: String, trim: true, maxlength: 40 },
    city: { type: String, trim: true, maxlength: 80 },
    service: { type: String, trim: true, maxlength: 80 },
    message: { type: String, required: true, trim: true, maxlength: 5000 },
    status: {
      type: String,
      enum: ["nuevo", "leido", "respondido", "archivado"],
      default: "nuevo",
    },
    notes: { type: String, default: "" }, // INTERNAL NOTES
    replies: [replySchema],
    meta: {
      ip: String,
      country: String,
      city: String,
      device: String,
      browser: String,
      os: String,
    },
    privacyAccepted: { type: Boolean, required: true },
  },
  { collection: "messages", timestamps: true },
);

messageSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("messages", messageSchema);
