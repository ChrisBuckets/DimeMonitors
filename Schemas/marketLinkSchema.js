const mongoose = require("mongoose");

const marketLinkSchema = new mongoose.Schema({
  setID: Number,
  setUUID: String,
  playID: Number,
  playUUID: String,
  set: String,

  link: String,
  imageLink: String,

  serialMax: String,
});
marketLinkSchema.index({ setID: 1, playID: 1, link: 1, imageLink: 1 }, { unique: true });

module.exports = marketLinkSchema;
