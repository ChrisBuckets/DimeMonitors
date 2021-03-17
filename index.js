const sdk = require("@onflow/sdk");
const fcl = require("@onflow/fcl");
const types = require("@onflow/types");
const puppeteer = require("puppeteer");
const discordBot = require("./dimeMonitorDiscord.js");
const mongoose = require("mongoose");
const soldCardSchema = require("./Schemas/soldCardSchema.js");
const SoldCard = mongoose.model("Card", soldCardSchema);
const cardLinkSchema = require("./Schemas/cardLinkSchema.js");
const CardLink = mongoose.model("CardLink", cardLinkSchema);

const momentLinkSchema = require("./Schemas/momentLinkSchema.js");
const MomentLink = mongoose.model("MomentLink", momentLinkSchema);
const fs = require("fs");

const moment = require("moment");
mongoose.connect("mongodb://localhost/cards", { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true });
let dime = new discordBot();
async function startDime() {
  await dime.init();
}

//startDime();
SoldCard.find({ name: "Lonnie Walker IV", set: "Base Set", setSeries: "2" }, async function (err, cards) {
  await startDime();

  let card = cards[0];
  card.serialNumber = "12255";
  card.price = 1;
  card.test = true;

  checkForSnipes(card, 86400000);
});
// Push to queue, if can get data from cryptoslam send to discord, if not just save to DB
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function () {
  console.log("db connected!");
});

let sales = [];

/*pollListings().then(function () {
  console.log("Done");
});*/

/*saveSales().then(function () {
  console.log("Done");
});
async function saveSales() {
  while (true) {
    await new Promise((r) => setTimeout(r, 600000));
    console.log("process sales");
    processSales(sales);
  }
}*/

function latestBlock() {
  return fcl.send([fcl.getLatestBlock(true)]).then(fcl.decode);
}
async function pollListings(sales) {
  fcl.config().put("accessNode.api", "https://access-mainnet-beta.onflow.org"); // connect to Flow mainnet
  let key = "A.c1e4f4f4c4257510.Market.MomentListed";
  let momentDepositedKey = "A.0b2a3299cc857e29.TopShot.Deposit";
  let hwm = (await latestBlock()).height;
  while (1) {
    try {
      await new Promise((r) => setTimeout(r, 400));

      let startTime = Date.now();

      var end = (await latestBlock()).height;
      console.log(hwm, end);
      if (hwm >= end) {
        console.log("hwm is the same", hwm, end);
        continue;
      }
      let getEvents = Date.now();
      console.log("Sending");
      var events = await fcl.send([fcl.getEvents(key, hwm, end + 1)]).then(fcl.decode);
      var depositEvents = await fcl.send([fcl.getEvents(momentDepositedKey, hwm, end + 1)]).then(fcl.decode);
      getEvents = Date.now() - startTime;
      console.log(getEvents);
      console.log(events.length);
      //console.log("DEPOSITED EVENTS");
      //console.log(depositEvents);

      //get listed events
      let cards = [];
      for (let i = 0; i < events.length; i++) {
        let data = events[i].data;
        //if (data.price < 500) continue;
        console.log(data);
        for (let j = 0; j < depositEvents.length; j++) {
          if (data.id == depositEvents[j].data.id) {
            console.log(events.length);
            console.log(depositEvents.length);
            console.log(data);
            console.log(depositEvents[j].data);
            let address = depositEvents[j].data.to;
            let momentIDs = [parseInt(depositEvents[j].data.id)];
            console.log(momentIDs);

            getCard(data, address, momentIDs, hwm, startTime, j, depositEvents.length, getEvents);
            console.log("SENT GET CARD");
          }
        }
      }

      console.log(`Events from ${hwm} to ${end}`);

      hwm = end + 1;
    } catch (err) {
      console.log(err);
    }
  }
}

async function getCard(data, address, momentIDs, hwm, startTime, j, length, getEvents) {
  try {
    let cadence = Date.now();
    const resp = await fcl.send([
      fcl.script`
        import TopShot from 0x0b2a3299cc857e29
        import Market from 0xc1e4f4f4c4257510
        pub struct Moment {
          pub var id: UInt64?
          pub var playId: UInt32?
          pub var meta: TopShot.MomentData?
          pub var play: {String: String}?
          pub var setId: UInt32?
          pub var setName: String?
          pub var serialNumber: UInt32?

          pub var setSeries: UInt32?
          init(_ moment: &TopShot.NFT?) {
            self.id = moment?.id
            self.meta = moment?.data
            self.playId = moment?.data?.playID
            self.play = nil
            self.play = TopShot.getPlayMetaData(playID: self.playId!)
            self.setId = moment?.data?.setID
            self.setName = nil
            self.setName = TopShot.getSetName(setID: self.setId!)
            self.setSeries = TopShot.getSetSeries(setID: self.setId!)
            self.serialNumber = nil
            self.serialNumber = moment?.data?.serialNumber
          
          }
        }
        pub fun main(momentIDs: [UInt64]): [Moment] {
        let acct = getAccount(${address})
        let collectionRef = acct.getCapability(/public/topshotSaleCollection)!
                      .borrow<&{Market.SalePublic}>()!
          var moments: [Moment] = []
          for momentID in momentIDs {
            moments.append(Moment(collectionRef.borrowMoment(id: momentID)))
          }
          
          return moments
      }  `,
      await fcl.args([fcl.arg(momentIDs, types.Array(types.UInt64))]),
    ]);
    await fcl.decode(resp).then((r) => {
      console.log("sending");
      //console.log(r[0]);
      let cardDetails = r[0];
      let card = {
        blockHeight: hwm,
        id: cardDetails.id,
        setID: cardDetails.meta.setID,
        playID: cardDetails.meta.playID,
        set: cardDetails.setName,
        name: cardDetails.play.FullName,
        jersey: cardDetails.play.JerseyNumber,
        team: cardDetails.play.TeamAtMoment,
        playCategory: cardDetails.play.PlayCategory,
        serialNumber: cardDetails.serialNumber,
        setSeries: cardDetails.setSeries == 0 ? 1 : cardDetails.setSeries,
        price: data.price,
      };
      card.cadence = Date.now() - cadence;
      card.listTime = startTime;

      card.count = j + "/" + length;
      card.getEvents = getEvents;
      card.timestamp = Date.now();
      checkForSnipes(card, 86400000); //259200000
    });
  } catch (err) {
    console.log(err);
  }
}
function checkForSnipes(card, time) {
  card.checkForSnipes = Date.now();
  console.log(time);
  console.log(Date.now() - 259200000);
  SoldCard.find(
    {
      set: card.set,
      setID: card.setID,
      playID: card.playID,
      name: card.name,
      playCategory: card.playCategory,
      setSeries: card.setSeries,
      timestamp: { $gt: Date.now() - time }, //get sales within a week604800000*/
    },
    (err, cards) => {
      if (err) console.log(err);

      //Getting total average price
      let totalAvg = 0;
      for (let i = 0; i < cards.length; i++) {
        totalAvg += parseInt(cards[i].price);
      }
      //Getting serial number average price
      let totalSerialRange = 0;
      let cardsWithinRange = 0;
      let array = [];
      //console.log(cards);
      //console.log(cards.length);
      card.range = 1000;

      if (card.serialNumber < 5000) card.range = 500;
      if (card.serialNumber < 2000) card.range = 200;
      if (card.serialNumber < 1000) card.range = 250;

      if (card.serialNumber < 500) card.range = 100;
      if (card.serialNumber < 250) card.range = 50;
      if (card.serialNumber < 125) card.range = 25;
      if (card.serialNumber < 50) card.range = 13;
      for (let i = 0; i < cards.length; i++) {
        if (
          parseInt(cards[i].serialNumber) <= parseInt(card.serialNumber) + card.range &&
          parseInt(cards[i].serialNumber) >= parseInt(card.serialNumber) - card.range
        ) {
          console.log(cards[i]);
          array.push(cards[i]);
          totalSerialRange += parseInt(cards[i].price);
          cardsWithinRange += 1;
        }

        console.log("DONE PUSHING ARRAY");
      }
      console.log("ARRAY" + array.length);
      if (array.length < 5 && time <= 604800000) {
        //If timestamp of sales check is less then or equal to a week, run function again to check all sales

        /*fs.appendFileSync(
          "./error.txt",
          "\n" + "Not enough cards listed for " + card.name + " " + " " + card.serialNumber + " " + card.set + " " + card.price
        );*/

        if (time == 86400000) {
          checkForSnipes(card, 259200000);
          return;
        }

        if (time == 259200000) {
          console.log("getting all sales"); //First get sales within last day, then 3 days, then last week, then all time
          checkForSnipes(card, 604800000);
          return;
        }

        if (time == 604800000) {
          checkForSnipes(card, Date.now());
          return;
        }

        //checkForSnipes(card, Date.now());
      }

      /*if (array.length == 0) { 
        checkForSnipes(card, Date.now());    Caused memory leak?
        return;
      }*/
      //Check for outlier and remove it, post new average
      let originalAverage = Math.floor(totalSerialRange / cardsWithinRange);

      if (card.serialNumber < 250) array.sort((b, a) => b.timestamp - a.timestamp);
      if (card.serialNumber > 250) array.sort((a, b) => b.price - a.price);

      console.log(array);
      console.log(array.length);
      /*card.array = array
        .map((obj) => {
          return obj.price;
        })
        .splice(0, 5);*/

      if (array.length >= 5) {
        let amount = Math.floor(array.length * 0.2);
        array.splice(0, amount);
      }
      console.log(array);
      let newAverage = 0;
      for (let i = 0; i < array.length; i++) {
        //console.log(parseInt(array[i].price));
        newAverage += parseInt(array[i].price);
      }
      //console.log(newAverage);
      newAverage = Math.round(newAverage / array.length);
      //console.log(newAverage);
      card.averageLength = array.length;
      card.rate = originalAverage / newAverage;
      card.serialAverage = originalAverage; // Set card's serial average to the original, if the new one is 3 times lower then set it to the new one.
      if (card.rate >= 1.4 || card.serialNumber < 250) {
        card.serialAverage = newAverage;
      }

      /*if (card.serialNumber < 2000) {
      for (let i = 0; i < cards.length; i++) {
        if (cards[i].serialNumber < 2000) {
          totalRanged += parseInt(cards[i].price);
          cardsWithinRange += 1;
        }
      }
    }
    
    if (card.serialNumber > 2000) {
      for (let i = 0; i < cards.length; i++) {
        if (cards[i].serialNumber >= card.serialNumber + 1500 && cards[i].serialNumber <= card.serialNumber - 1500) {
          totalRanged += parseInt(cards[i].price);
          cardsWithinRange += 1;
        }
      }
    }*/

      //let average = Math.floor(totalAvg / cards.length);

      //let totalDifference = parseInt(card.price) / average;
      let rangedDifference = parseInt(card.price) / card.serialAverage; //parseInt(card.price) / serialAverage;
      //console.log(array);
      //console.log("AVERAGE PRICE " + average);
      //console.log(array[0].timestamp + " timestamp ");

      console.log("card serial average" + card.serialAverage + " average difference " + card.rate);
      console.log(
        "SERIAL AVERAGE " +
          totalSerialRange +
          " Cards within range: " +
          cardsWithinRange +
          " original average: " +
          originalAverage +
          " new average: " +
          newAverage +
          " ranged difference" +
          rangedDifference +
          " time range: " +
          time
      );
      console.log("TOTAL RANGED DIFFERENCE " + rangedDifference);

      //card.serialAverage = serialAverage;
      card.averageSerialProfit = parseFloat((1.0 - rangedDifference).toFixed(2)) * 100;

      if (parseInt(card.serialNumber) == 1) postCard(card); //If serial number is 1, post in channel
      if (/*totalDifference <= 0.9 || */ rangedDifference <= 0.9) {
        //card.averagePrice = average;

        //card.averagePriceProfit = parseFloat((1.0 - totalDifference).toFixed(2)); // convert string to integer, get number with only 2 decimals and parse back into a float

        //console.log(card);
        card.checkForSnipes = Date.now() - card.checkForSnipes + " " + cards.length;
        postCard(card);
      }
    }
  )
    .select({ set: 1, timestamp: 1, setID: 1, playID: 1, name: 1, playCategory: 1, setSeries: 1, price: 1, serialNumber: 1 })
    .lean();
}

function postCard(card) {
  card.discordPost = Date.now();
  SoldCard.find(
    {
      set: card.set,
      setID: card.setID,
      playID: card.playID,
      name: card.name,
      playCategory: card.playCategory,
      setSeries: card.setSeries,
      timestamp: { $gt: Date.now() - 2629800000 }, //get sales within a week604800000*/
    },
    function (err, cards) {
      let weekVolume = [];
      let monthVolume = [];
      for (let i = 0; i < cards.length; i++) {
        if (
          parseInt(cards[i].serialNumber) <= parseInt(card.serialNumber) + card.range &&
          parseInt(cards[i].serialNumber) >= parseInt(card.serialNumber) - card.range
        ) {
          if (cards[i].timestamp > Date.now() - 604800000) weekVolume.push(cards[i]);
          monthVolume.push({ x: moment(new Date(cards[i].timestamp)).format("MM DD YYYY HH:mm"), y: cards[i].price });
          //console.log(array.length);
        }
      }
      //console.log(array.length + "yo");
      card.volume = weekVolume.length;
      card.monthSales = monthVolume;

      CardLink.findOne({ setID: card.setID, playID: card.playID }, function (err, cardLink) {
        if (err) console.log(err);
        if (cardLink) {
          card.link = `${cardLink.link}?serialNumber=${card.serialNumber}`;

          card.imageLink = cardLink.imageLink;
          card.serialMax = cardLink.serialMax;
        }

        card.findLink = Date.now();
        MomentLink.findOne({ setID: card.setID, playID: card.playID, serialNumber: card.serialNumber }, function (err, momentLink) {
          if (momentLink) {
            card.momentLink = `https://nbatopshot.com/moment/${momentLink.serialUUID}`;
          }
          //console.log("posting card");
          //getDiscordChannel(card);
          //console.log("posting card");
          card.delay = false;
          if (card.serialAverage - card.price >= 350) card.delay = true;
          //console.log("sending card");
          dime.sendCard(card);
        });
      }).lean();
    }
  )
    .select({ set: 1, timestamp: 1, setID: 1, playID: 1, name: 1, playCategory: 1, setSeries: 1, price: 1, serialNumber: 1 })
    .lean();
}

function getDiscordChannel(card) {
  //console.log(card.averagePriceProfit + " AVERAGE PRICE PROFIT");
  if (/*card.averagePriceProfit >= 0.1 ||*/ card.averageSerialProfit >= 10) {
    card.channel = "805658697556557824";
    if (/*card.averagePriceProfit >= 0.2 || */ card.averageSerialProfit >= 20) {
      card.channel = "805659038708006935";
      if (/*card.averagePriceProfit >= 0.5 ||*/ card.averageSerialProfit >= 40) {
        console.log("channel sent");
        card.channel = "805658965235990538";
      }
    }

    //if (card.serialNumber <= 50) card.channel = "805658965235990538";
  }

  if (parseInt(card.serialNumber) == 1) {
    console.log("1 serial number");
    card.channel = "813534856423800836";
  }
}
/*async function test2(sales) {
  var key = "A.c1e4f4f4c4257510.Market.MomentPurchased";
  await poll(sales);
  //checkCards();
  /*try {
    var height = (await fcl.latestBlock()).height;
    let test = await fcl.send([fcl.getEvents(key, height - 100, height - 1)]).then(fcl.decode);
    console.log(test);
  } catch (err) {
    console.log(err);
  }
  while (false) {
    //console.log(block);
    const { block } = await sdk.send(await sdk.build([await sdk.getLatestBlock()]), { node: "https://access-mainnet-beta.onflow.org" });
    let height = block.height;
    console.log(height);
    const response = await sdk.send(await sdk.build([sdk.getEvents("A.c1e4f4f4c4257510.Market.MomentPurchased", height - 2, height - 1)]), {
      node: "https://access-mainnet-beta.onflow.org",
    });
    //console.log(response.events.map(e => JSON.stringify(e.payload.value.fields)));
    /*console.log(response.events[response.events.length - 1]);
      let [id, price, seller] = response.events[response.events.length - 1].payload.value.fields;
      id = id.value.value;
      price = price.value.value;
      seller = seller.value.value.value;
      console.log(id);
      console.log(seller);
      console.log(price);
      await getCardDetails(id);
      return;
    for (const ev of response.events) {
      console.log(response.events.length);
      //console.log(response.events);
      //console.log(ev.payload);
      if (ev.payload.type != "Event") {
        throw new Error(`${ev.payload.type} Not an event?`);
      }
      let [id, price, seller] = ev.payload.value.fields;
      //console.log(ev.payload.value);
      //console.log(ev.payload.value.fields);
      id = id.value.value;
      price = price.value.value;
      seller = seller.value.value.value;
      console.log(id);
      console.log(seller);
      console.log(price);
      /*let cardDetails = await getCardDetails(id);
      console.log(cardDetails);*/
/*console.log("ID: " + id);
        console.log("Price: " + price);
        console.log("Seller: " + seller);
        console.log();
    }
  }
}*/

async function getCardDetails(mint) {
  const browser = await puppeteer.launch({
    headless: false,
    //defaultViewport: null,
    //userDataDir: `./userdata/DimeMonitors`,
  });

  try {
    const page = await browser.newPage();
    await page.goto(`https://www.cryptoslam.io/nba-top-shot/mint/${mint}`, {
      waitUntil: "networkidle2",
    });
    let set = await page.$x('//h4[text() = "Set: "]');
    if (set.length <= 0) return false;
    let setValue = await page.evaluate((element) => {
      return element.textContent.split(":")[1].trim();
    }, set[0]);

    let name = await page.$x('//h4[text() = "Name: "]');
    console.log("checking name");
    let nameValue = await page.evaluate((element) => {
      return element.textContent.split(":")[1].trim();
    }, name[0]);

    let jersey = await page.$x('//h4[text() = "Jersey Number: "]');
    console.log("checking jersey");
    let jerseyValue = await page.evaluate((element) => {
      return element.textContent.split(":")[1].trim();
    }, jersey[0]);
    let team = await page.$x('//h4[text() = "Team: "]');
    console.log("checking team");
    let teamValue = await page.evaluate((element) => {
      return element.textContent.split(":")[1].trim();
    }, team[0]);

    let playCategory = await page.$x('//h4[text() = "Play Category: "]');
    console.log("checking category");
    let playCategoryValue = await page.evaluate((element) => {
      return element.textContent.split(":")[1].trim();
    }, playCategory[0]);

    let number = await page.$x('//h4[text() = "Serial Number: "]');
    console.log("checking number");
    let numberValue = await page.evaluate((element) => {
      return element.textContent.split(":")[1].trim();
    }, number[0]);

    let card = {
      set: setValue,
      name: nameValue,
      jersey: jerseyValue,
      team: teamValue,
      playCategory: playCategoryValue,
      number: `${numberValue}`,
    };
    await browser.close();

    return card;
  } catch (err) {
    await browser.close();
    return null;
    console.log(err);
  }
}
