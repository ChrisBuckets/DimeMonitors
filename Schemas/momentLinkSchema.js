const mongoose = require("mongoose");

const momentLinkSchema = new mongoose.Schema({
  setID: Number,
  setUUID: String,
  set: String,
  setSeries: String,
  playID: Number,
  playUUID: String,
  serialUUID: { type: String, unique: true },
  serialNumber: String,
});

momentLinkSchema.index({
  setID: 1,
  serialNumber: 1,
  playID: 1,
});
//directLinkSchema.index({ setID: 1, playID: 1, dateOfMoment: 1, link: 1 }, { unique: true });

module.exports = momentLinkSchema;
