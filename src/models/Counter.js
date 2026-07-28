// models/Counter.js

const mongoose = require("mongoose");

const counterSchema = new mongoose.Schema({
    year: Number,
    sequence: Number
});

module.exports = mongoose.model("Counter", counterSchema);