const puppeteer = require("puppeteer");
const mongoose = require("mongoose");
const cardLinkSchema = require("./Schemas/cardLinkSchema.js");
const CardLink = mongoose.model("CardLink", cardLinkSchema);
const moment = require("moment");
//const moment = require("moment-timezone");
mongoose.connect("mongodb://localhost/cards", { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true });

getImage().then(function () {
  console.log("done");
});
async function getImage() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    userDataDir: `./userdata/DimeMonitors`,
    args: ["--window-size=1920,1080"],
  });

  const page = await browser.newPage();

  await page.setViewport({
    width: 1920,
    height: 1080,
    deviceScaleFactor: 0.75,
  });

  CardLink.find({}, async function (err, cards) {
    for (let i = 0; i < cards.length; i++) {
      console.log(i);
      if (cards[i].imageLink) continue;
      await page.goto(cards[i].link);
      await page.waitForXPath("//ul//li/img");
      let image = await page.$x("//ul//li/img");
      //console.log(image);

      let imageLink = await page.evaluate((element) => element.src, image[3]);

      cards[i].imageLink = imageLink;
      cards[i].save(function (err) {
        if (err) return console.log(err);
        console.log("image link saved");
      });
      await page.waitForTimeout(5000);
    }
  });
}
