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
const marketLinkSchema = require("./Schemas/marketLinkSchema.js");
const MarketLink = mongoose.model("MarketLink", marketLinkSchema);
const fs = require("fs");
const { request, gql } = require("graphql-request");
const moment = require("moment");
mongoose.connect("mongodb://localhost/cards", { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true });
let dime = new discordBot();

//Start the Discord Bot
startDime();

//Connect to MongoDB
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function () {
  console.log("db connected!");
});

//Begin checking for cards to snipe (Runs until you close the program)
pollListings().then(function () {
  console.log("Done");
});

async function startDime() {
  await dime.init();
}
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
      //Check for the latest block
      console.log("new loop start");
      await new Promise((r) => setTimeout(r, 2500));
      console.log("set timeout finished");
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

      //Get listed events from latest block
      let cards = [];
      for (let i = 0; i < events.length; i++) {
        let data = events[i].data;

        console.log(data);
        for (let j = 0; j < depositEvents.length; j++) {
          //Checks to see if card found in block was listed for sale, if so, send it to the function that grabs the details
          if (data.id == depositEvents[j].data.id) {
            let address = depositEvents[j].data.to;
            let momentIDs = [parseInt(depositEvents[j].data.id)];
            console.log(momentIDs);

            getCard(data, address, momentIDs, { hwm: hwm, end: end }, startTime, j, depositEvents.length, getEvents);
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

async function getCard(data, address, momentIDs, blockHeight, startTime, j, length, getEvents) {
  try {
    let cadence = Date.now();
    //Fetches the details of the card to get things like price, serial number, name, etc.
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
    //Decodes the data and send the card object to be checked if it is a snipe
    await fcl.decode(resp).then((r) => {
      console.log("sending");
      //console.log(r[0]);
      let cardDetails = r[0];
      let card = {
        blockHeight: (blockHeight.hwm + blockHeight.end) / 2,
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
      checkForSnipes(card, 86400000); //259200000 86400000
    });
  } catch (err) {
    console.log(err);
  }
}
function checkForSnipes(card, time) {
  card.checkForSnipes = Date.now();
  console.log(time);
  console.log(Date.now() - 259200000);

  /* Fetches all data stored in the MongoDB so we can get things like the serial range price, average price, lowest listed, etc.

     Sometimes card sales were so rare for certain cards so I'd have to fetch sales data from weeks ago, most cards though
     depend on getting the sales data from the past day or 3 days because the prices fluctuate so often that older data isn't
     as accurate.

     Another problem was people would sell cards that are normally worth a few dollars for thousands, my guess is it was to transfer
     money to a different account, so these outliers had to be weeded out because it would greatly affected the average sale price
     and make it inaccurate.
  */
  SoldCard.find(
    {
      set: card.set,
      setID: card.setID,
      playID: card.playID,
      name: card.name,
      playCategory: card.playCategory,
      setSeries: card.setSeries,
      timestamp: { $gt: Date.now() - time },
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

      card.range = 4000;
      if (card.serialNumber < 15000) card.range = 2000;
      if (card.serialNumber < 8000) card.range = 1000;
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
        //First get sales within last day, then 3 days, then last week, then all time
        //If timestamp of sales check is less then or equal to a week, run function again to check all sales

        if (time <= 86400000) {
          checkForSnipes(card, 259200000);
          return;
        }

        if (time == 259200000) {
          console.log("getting all sales");
          checkForSnipes(card, 604800000);
          return;
        }

        if (time == 604800000) {
          checkForSnipes(card, Date.now());
          return;
        }
      }

      //Check for outlier and remove it, post new average
      let originalAverage = Math.floor(totalSerialRange / cardsWithinRange);

      if (card.serialNumber < 250) array.sort((b, a) => b.timestamp - a.timestamp);
      if (card.serialNumber > 250) array.sort((a, b) => b.price - a.price);

      if (array.length >= 5) {
        let amount = Math.floor(array.length * 0.2);
        array.splice(0, amount);
      }
      console.log(array);
      let newAverage = 0;
      for (let i = 0; i < array.length; i++) {
        newAverage += parseInt(array[i].price);
      }

      newAverage = Math.round(newAverage / array.length);

      card.averageLength = array.length;
      card.rate = originalAverage / newAverage;
      card.serialAverage = originalAverage; // Set card's serial average to the original, if the new one is 3 times lower then set it to the new one.
      if (card.rate >= 1.4 || card.serialNumber < 250) {
        card.serialAverage = newAverage;
      }

      let rangedDifference = parseInt(card.price) / card.serialAverage; //parseInt(card.price) / serialAverage;

      card.averageSerialProfit = parseFloat((1.0 - rangedDifference).toFixed(2)) * 100;

      if (parseInt(card.serialNumber) == 1) postCard(card); //If serial number is 1, post in channel
      if (rangedDifference <= 0.8) {
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
      timestamp: { $gt: Date.now() - 2629800000 },
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
      MarketLink.findOne({ setID: card.setID, playID: card.playID }, function (err, marketLink) {
        if (err) console.log(err);
        if (marketLink) {
          card.link = `${marketLink.link}?serialNumber=${card.serialNumber}`;

          card.imageLink = marketLink.imageLink;
          card.serialMax = marketLink.serialMax;
        }

        card.findLink = Date.now();
        MomentLink.findOne({ setID: card.setID, playID: card.playID, serialNumber: card.serialNumber }, async function (err, momentLink) {
          if (momentLink) {
            card.momentLink = `https://nbatopshot.com/moment/${momentLink.serialUUID}`;
            card.link = `https://nbatopshot.com/listings/p2p/${momentLink.setUUID}+${momentLink.playUUID}`;
            card.momentDetails = momentLink;
          }

          card.delay = false;
          if (card.serialAverage - card.price >= 350) card.delay = true;

          console.log("Sending");

          dime.sendCard(card);
        });
      }).lean();
    }
  )
    .select({ set: 1, timestamp: 1, setID: 1, playID: 1, name: 1, playCategory: 1, setSeries: 1, price: 1, serialNumber: 1 })
    .lean();
}
