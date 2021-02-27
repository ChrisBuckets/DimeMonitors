const mongoose = require("mongoose");

const cardLinkSchema = new mongoose.Schema({
  setID: Number,
  playID: Number,
  set: String,
  name: String,
  jersey: String,
  team: String,
  dateOfMoment: String,
  playCategory: String,
  setSeries: String,
  link: String,
  imageLink: String,

  serialMax: String,
});
cardLinkSchema.index({ setID: 1, playID: 1, dateOfMoment: 1, link: 1 }, { unique: true });

module.exports = cardLinkSchema;
