const sdk = require("@onflow/sdk");
const fcl = require("@onflow/fcl");
const types = require("@onflow/types");
const puppeteer = require("puppeteer");
const discordBot = require("./dimeMonitorDiscord.js");
const mongoose = require("mongoose");
const soldCardSchema = require("./Schemas/soldCardSchema.js");
const SoldCard = mongoose.model("Card", soldCardSchema);
mongoose.connect("mongodb://localhost/cards", { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true });

saveSales().then(function () {
  console.log("Done");
});
function latestBlock() {
  return fcl.send([fcl.getLatestBlock(true)]).then(fcl.decode);
}
async function saveSales() {
  fcl.config().put("accessNode.api", "https://access-mainnet-beta.onflow.org"); // connect to Flow mainnet
  let key = "A.c1e4f4f4c4257510.Market.MomentPurchased";
  let momentDepositedKey = "A.0b2a3299cc857e29.TopShot.Deposit";
  /*let block = await fcl.latestBlock();

  console.log(await fcl.getCollection(block.collectionGuarantees[0].collectionId));*/

  let hwm = (await latestBlock()).height - 1;
  while (1) {
    try {
      let end = (await latestBlock()).height;
      await new Promise((r) => setTimeout(r, 1_000));
      console.log("checking");
      if (hwm >= end) {
        console.log("hwm is the same", hwm, end);
        continue;
      }
      let events = await fcl.send([fcl.getEvents(key, hwm, end)]).then(fcl.decode);
      let depositEvents = await fcl.send([fcl.getEvents(momentDepositedKey, hwm, end)]).then(fcl.decode);
      console.log("getting events");
      for (let i = 0; i < events.length; i++) {
        let data = events[i].data;
        //console.log(events[i]);
        console.log(data);
        for (let j = 0; j < depositEvents.length; j++) {
          if (data.id == depositEvents[j].data.id) {
            console.log(i + " " + j);
            console.log(events.length) + " Moment purchased length ";
            console.log(depositEvents.length + " Moment deposited length");
            console.log(data);
            console.log(depositEvents[j].data);
            let seller = data.seller;
            let address = depositEvents[j].data.to;
            let momentIDs = [parseInt(depositEvents[j].data.id)];

            saveCard(data, hwm, i, seller, address, momentIDs);
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

async function saveCard(data, hwm, i, seller, address, momentIDs) {
  try {
    console.log("Sending script..");
    const resp = await fcl.send([
      fcl.script`
              import TopShot from 0x0b2a3299cc857e29
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
              let collectionRef = acct.getCapability(/public/MomentCollection)!
                            .borrow<&{TopShot.MomentCollectionPublic}>()!
                var moments: [Moment] = []
                for momentID in momentIDs {
                  moments.append(Moment(collectionRef.borrowMoment(id: momentID)))
                }
                
                return moments
            }  `,
      await fcl.args([fcl.arg(momentIDs, types.Array(types.UInt64))]),
    ]);
    fcl.decode(resp).then((r) => {
      console.log("sending");
      let cardDetails = r[0];
      let card = {
        id: cardDetails.id,
        setID: cardDetails.meta.setID,
        playID: cardDetails.meta.playID,
        set: cardDetails.setName,
        name: cardDetails.play.FullName,
        jersey: cardDetails.play.JerseyNumber,
        team: cardDetails.play.TeamAtMoment,
        dateOfMoment: cardDetails.play.DateOfMoment,
        playCategory: cardDetails.play.PlayCategory,
        serialNumber: cardDetails.serialNumber,
        setSeries: cardDetails.setSeries == 0 ? 1 : cardDetails.setSeries,
        price: data.price,
        seller: seller,
        buyer: address,
      };

      const soldCard = new SoldCard({
        blockHeight: hwm,
        id: card.id,
        setID: card.setID,
        playID: card.playID,
        set: card.set,
        name: card.name,
        jersey: card.jersey,
        team: card.team,
        dateOfMoment: card.dateOfMoment,
        playCategory: card.playCategory,
        serialNumber: card.serialNumber,
        setSeries: card.setSeries,

        price: card.price,
        timestamp: Date.now(),

        seller: card.seller,
        buyer: card.buyer,
      });

      soldCard.save(function (err) {
        if (err) return console.error(err);
        console.log("sold card saved");
        console.log(i);
      });
      console.log("Yoo");
      //console.log(r[0]);
      console.log(card);
    });
  } catch (err) {
    console.log(err);
  }
}
/*const soldCard = new Card({
    mint: sales.id,
    set: cardDetails.set ? cardDetails.set : null,
    name: cardDetails.name ? cardDetails.name : null,
    jersey: cardDetails.jersey ? cardDetails.jersey : null,
    team: cardDetails.team ? cardDetails.team : null,
    playCategory: cardDetails.playCategory ? cardDetails.playCategory : null,
    number: cardDetails.number ? cardDetails.number : null,

    price: parseInt(sales.price),
  });
  dime.sendCard(cardDetails);
  soldCard.save(function (err, card) {
    if (err) return console.error(err);
    console.log("card saved");
  });*/
