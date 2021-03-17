const mongoose = require("mongoose");

const directLinkSchema = new mongoose.Schema({
  setID: Number,
  setUUID: String,
  set: String,
  setSeries: String,
  plays: [
    {
      playUUID: String,
      playID: Number,
      playerName: String,
      serials: [
        {
          serialUUID: String,
          serialNumber: String,
        },
      ],
    },
  ],
});

//directLinkSchema.index({ setID: 1, playID: 1, dateOfMoment: 1, link: 1 }, { unique: true });

module.exports = directLinkSchema;
