const puppeteer = require("puppeteer");
const mongoose = require("mongoose");
const cardLinkSchema = require("./Schemas/cardLinkSchema.js");
const CardLink = mongoose.model("CardLink", cardLinkSchema);
const directLinkSchema = require("./Schemas/directLinkSchema.js");
const DirectLink = mongoose.model("DirectLink", directLinkSchema);
const marketLinkSchema = require("./Schemas/marketLinkSchema.js");
const MarketLink = mongoose.model("MarketLink", marketLinkSchema);
const moment = require("moment");
const momentLinkSchema = require("./Schemas/momentLinkSchema.js");
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

  DirectLink.find({ set: "Metallic Gold LE", setSeries: "2" }, async function (err, sets) {
    MarketLink.find({}, async function (err, marketLinks) {
      let array = [];
      for (let i = 0; i < sets.length; i++) {
        for (let j = 0; j < sets[i].plays.length; j++) {
          let check = false;
          for (let k = 0; k < marketLinks.length; k++) {
            console.log(marketLinks[k].setID + " " + sets[i].setID);
            if (marketLinks[k].setID == sets[i].setID && marketLinks[k].playID == sets[i].plays[j].playID) {
              console.log("true");
              console.log(marketLinks[k] + " " + sets[i].plays[j] + " " + sets[i].setID);
              check = true;
              console.log(check);
            }
          }

          if (!check) {
            array.push({ set: sets[i], play: sets[i].plays[j] });
            console.log(check);
          }
        }
      }

      //return console.log(array.length);

      //console.log(sets[i]);

      for (let i = 0; i < array.length; i++) {
        try {
          console.log(array[i]);

          let set = array[i].set;
          let play = array[i].play;
          await page.goto(`https://nbatopshot.com/listings/p2p/${set.setUUID}+${play.playUUID}`);
          await page.waitForXPath("//ul//li/img");

          let image = await page.$x("//ul//li/img");
          //console.log(image);
          let serialMax = await page.$x('//div/div/button[contains(@class, "CollectibleDetails")]/span');
          let serialMaxText = await page.evaluate((element) => element.innerHTML, serialMax[0]);

          console.log(serialMaxText);

          let imageLink = await page.evaluate((element) => element.src, image[3]);

          const marketLink = new MarketLink({
            setID: set.setID,
            setUUID: set.setUUID,
            set: set.set,
            playID: play.playID,
            playUUID: play.playUUID,

            link: `https://nbatopshot.com/listings/p2p/${set.setUUID}+${play.playUUID}`,
            imageLink: imageLink,
            serialMax: serialMaxText,
          });

          await marketLink.save(function (err) {
            if (err) console.log(err);
            console.log("saved " + marketLink);
          });
          await page.waitForTimeout(1000);
        } catch (err) {
          console.log(err);
        }
      }

      console.log(array);
    });
  });

  /*DirectLink.find({}, async function (err, sets) {
    MarketLink.find({}, async function (err, marketLinks) {
      for (let i = sets.length - 1; i >= 0; i--) {
        try {
          //console.log(sets[i]);
          for (let j = 0; j < sets[i].plays.length; j++) {
            let check = true;
            for (let k = 0; k < marketLinks.length; k++) {
              console.log(marketLinks[k].setID + " " + sets[i].setID);
              if (marketLinks[k].setID == sets[i].setID && marketLinks[k].playID == sets[i].plays[j].playID) {
                console.log("Market link already saved");
                check = false;
              }
            }
            console.log("Checking");
            if (!check) {
              console.log("Market link already saved");
              continue;
            }
            console.log(j + " " + sets[i].plays[j] + " " + sets[i].plays.length);
            console.log(sets[i].set + " " + sets[i].plays[j].playerName);
            console.log(
              `https://nbatopshot.com/listings/p2p/${sets[i].setUUID}+${sets[i].plays[j].playUUID} ${sets[i].plays[j].playerName}`
            );
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
  });*/
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
