const puppeteer = require("puppeteer");
const mongoose = require("mongoose");
const cardLinkSchema = require("./Schemas/cardLinkSchema.js");
const CardLink = mongoose.model("CardLink", cardLinkSchema);
const soldCardSchema = require("./Schemas/soldCardSchema.js");
const SoldCard = mongoose.model("Card", soldCardSchema);
const moment = require("moment");
//const moment = require("moment-timezone");
mongoose.connect("mongodb://localhost/cards", { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true });
let browser;
getCardLink();
async function getCardLink() {
  browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    userDataDir: `./userdata/DimeMonitors`,
    args: ["--window-size=1920,1080"],
  });
  console.log("finding");
  await SoldCard.find({ dateOfMoment: { $exists: true } }, async (err, cards) => {
    const page = await browser.newPage();

    await page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 0.75,
    });
    console.log("length");
    console.log(cards.length);
    for (let i = cards.length - 1; i >= 0; i--) {
      console.log("yo");
      try {
        let card = cards[i];
        console.log(card.setID + " " + card.playID);
        let checkCards = CardLink.find({ setID: card.setID, playID: card.playID }).exec();
        await checkCards.then(function (cards) {
          if (cards.length > 0) {
            console.log("Done finding true");
            console.log(cards);
            checkCardsArray = true;
            return;
          }

          checkCardsArray = false;
          console.log("Done finding");
        });

        console.log("YOO " + checkCardsArray);
        console.log(cards.length + " " + i + "current card");
        if (checkCardsArray) {
          continue;
          console.log("next card");
        }
        console.log("Going to card");
        await goToCard(card, page);
        console.log("starting next goToCard");
      } catch (err) {
        console.log(err);
        break;
      }
    }
  }).lean();
}

async function goToCard(card, page) {
  console.log("next function call");
  await page.goto(`https://www.nbatopshot.com/search?`, {
    waitUntil: "networkidle2",
  });
  let checkCardsArray = false;
  console.log(card.setID + " " + card.playID);
  console.log("CHECK CARDS ARRAY" + checkCardsArray);
  await page.waitForXPath("//button[contains(@data-testid, 'filter-button')]");

  let searchBar = await page.$x('//div[text() = "Search by players, teams, and sets"]');
  console.log("typing " + card.name);
  await searchBar[0].click();
  //console.log(card.name);
  let getName;
  if (card.name.indexOf(card.name.split(" ")[2]) > 0) getName = card.name.slice(0, card.name.indexOf(card.name.split(" ")[2])).trim(); //Checks if there's a 2nd space in between a name, then removes that part (For example Lonnie Walker IV)
  //console.log(card.name);
  await searchBar[0].type(card.name, { delay: 250 });
  await page.keyboard.press("Enter");
  let date = card.dateOfMoment;
  let title = moment(new Date(date)).format("MMM D YYYY") + `, ${card.set} (Series ${card.setSeries})`;

  console.log("title " + title);
  await page.waitForTimeout(3000);

  await page.evaluate(async (_) => {
    for (let i = 0; i < 5; i++) {
      const timer = (ms) => new Promise((res) => setTimeout(res, ms));
      window.scrollBy(0, 1000 * (i + 1));
      await timer(2500);
    }
  });

  console.log(title);
  await page.waitForXPath(`//p[contains(text(), "${title}")]`);

  console.log(`//p[contains(text(), "${title}")]`);
  let cardLinkButton = await page.$x(`//p[contains(text(), "${title}")]`);

  await cardLinkButton[0].click();

  await page.waitForNavigation({
    waitUntil: "networkidle2",
  });

  let cardLink = new CardLink({
    setID: card.setID,
    playID: card.playID,
    set: card.set,
    name: card.name,
    jersey: card.jersey,
    team: card.team,
    dateOfMoment: card.dateOfMoment,
    playCategory: card.playCategory,
    setSeries: card.setSeries,
    link: await page.url(),
  });
  console.log("yo");
  await page.waitForXPath('//div/div/button[contains(@class, "CollectibleDetails")]/span');
  let image = await page.$x("//ul//li/img");
  //console.log(image);
  let serialMax = await page.$x('//div/div/button[contains(@class, "CollectibleDetails")]/span');
  let serialMaxText = await page.evaluate((element) => element.innerHTML, serialMax[0]);
  cardLink.serialMax = serialMaxText;
  console.log(serialMaxText);
  let imageLink = await page.evaluate((element) => element.src, image[3]);
  ('//div/div/button[contains(@class, "CollectibleDetails")]/span');
  cardLink.imageLink = imageLink;
  cardLink.save(function (err) {
    if (err) return console.log(err);

    console.log("Link saved");
  });
  return;
}
