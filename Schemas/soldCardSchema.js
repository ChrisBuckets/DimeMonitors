const mongoose = require("mongoose");

const cardSchema = new mongoose.Schema({
  blockHeight: Number,
  id: Number,
  setID: Number,
  playID: Number,
  set: String,
  name: String,
  jersey: String,
  team: String,
  dateOfMoment: String,
  playCategory: String,
  serialNumber: String,
  setSeries: String,
  price: String,
  timestamp: Number,

  seller: String,
  buyer: String,
});

cardSchema.index({ blockHeight: 1, id: 1, price: 1 }, { unique: true });

cardSchema.index({
  set: 1,
  setID: 1,
  playID: 1,
  name: 1,
  playCategory: 1,
  setSeries: 1,
  timestamp: 1,
});

module.exports = cardSchema;
