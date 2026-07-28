// models/Document.js

const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
  {
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    subtotal: Number,

    iva: {
      type: Number,
      default: 21,
    },

    ivaAmount: Number,

    total: Number,
  },
  { _id: false },
);

const documentSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["presupuesto"],
      required: true,
    },

    number: {
      type: String,
      unique: true,
    },

    year: Number,

    issueDate: {
      type: Date,
      default: Date.now,
    },

    expiryDate: Date,

    status: {
      type: String,
      enum: [
        "borrador",
        "enviado",
        "aceptado",
        "rechazado",
        "pendiente",
        "pagado",
      ],
      default: "borrador",
    },

    company: {
      logo: {
        type: String,
        default:
          "https://res.cloudinary.com/bunzti4y/image/upload/v1785271487/logo_2_a6lvkk.png",
      },

      name: {
        type: String,
        default: "AluPVCBarcelona",
      },

      owner: {
        type: String,
        default: "Keiner José Castañeda Navarro",
      },

      nif: {
        type: String,
        default: "60428129E",
      },

      address: {
        type: String,
        default: "Calle Bergantí Caupolicán, número 30, El Masnou, Barcelona",
      },

      phone: {
        type: String,
        default: "631957378",
      },

      email: {
        type: String,
        default: "alupvcbarcelona@gmail.com",
      },

      website: {
        type: String,
        default: "https://alupvcbarcelona.es",
      },
    },

    client: {
      name: {
        type: String,
        required: true,
      },

      address: String,

      postalCode: String,

      nif: String,

      email: String,
    },

    items: [itemSchema],

    observations: String,

    subtotal: Number,

    totalIVA: Number,

    grandTotal: Number,
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Document", documentSchema);
