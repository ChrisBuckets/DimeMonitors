const puppeteer = require("puppeteer");
const mongoose = require("mongoose");
const cardLinkSchema = require("./Schemas/cardLinkSchema.js");
const CardLink = mongoose.model("CardLink", cardLinkSchema);
const directLinkSchema = require("./Schemas/directLinkSchema.js");
const DirectLink = mongoose.model("DirectLink", directLinkSchema);
const marketLinkSchema = require("./Schemas/marketLinkSchema.js");
const MarketLink = mongoose.model("MarketLink", marketLinkSchema);
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

  DirectLink.find({}, async function (err, sets) {
    for (let i = 0; i < sets.length; i++) {
      try {
        //console.log(sets[i]);
        for (let j = 0; j < sets[i].plays.length; j++) {
          console.log(j + " " + sets[i].plays[j] + " " + sets[i].plays.length);
          console.log(`https://nbatopshot.com/listings/p2p/${sets[i].setUUID}+${sets[i].plays[j].playUUID} ${sets[i].plays[j].playerName}`);
          await page.goto(`https://nbatopshot.com/listings/p2p/${sets[i].setUUID}+${sets[i].plays[j].playUUID}`);
          await page.waitForXPath("//ul//li/img");

          let image = await page.$x("//ul//li/img");
          //console.log(image);
          let serialMax = await page.$x('//div/div/button[contains(@class, "CollectibleDetails")]/span');
          let serialMaxText = await page.evaluate((element) => element.innerHTML, serialMax[0]);
          let setPlay = sets[i].plays[j];

          console.log(serialMaxText);

          let imageLink = await page.evaluate((element) => element.src, image[3]);

          const marketLink = new MarketLink({
            setID: sets[i].setID,
            setUUID: sets[i].setUUID,
            set: sets[i].set,
            playID: setPlay.playID,
            playUUID: setPlay.playUUID,

            link: `https://nbatopshot.com/listings/p2p/${sets[i].setUUID}+${sets[i].plays[j].playUUID}`,
            imageLink: imageLink,
            serialMax: serialMaxText,
          });

          await marketLink.save(function (err) {
            if (err) console.log(err);
            console.log("saved " + marketLink);
          });
          await page.waitForTimeout(1000);
        }
      } catch (err) {
        console.log(err);
        continue;
      }
    }
  });
}

/*CardLink.find({}, async function (err, cards) {
    for (let i = 0; i < cards.length; i++) {
      try {
        console.log(i);
        if (cards[i].imageLink) continue;
        if (cards[i].serialMax) continue;
        console.log(cards[i]);
        await page.goto(cards[i].link);
        await page.waitForXPath("//ul//li/img");
        let image = await page.$x("//ul//li/img");
        //console.log(image);
        let serialMax = await page.$x('//div/div/button[contains(@class, "CollectibleDetails")]/span');
        let serialMaxText = await page.evaluate((element) => element.innerHTML, serialMax[0]);
        cards[i].serialMax = serialMaxText;
        console.log(serialMaxText);
        let imageLink = await page.evaluate((element) => element.src, image[3]);
        ('//div/div/button[contains(@class, "CollectibleDetails")]/span');
        cards[i].imageLink = imageLink;
        cards[i].save(function (err) {
          if (err) return console.log(err);
          console.log("image link saved");
        });
        await page.waitForTimeout(5000);
      } catch (err) {
        console.log(err);
        continue;
      }
    }
  });
}*/
