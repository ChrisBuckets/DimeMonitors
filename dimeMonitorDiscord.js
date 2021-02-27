const Discord = require("discord.js");
const client = new Discord.Client();
const config = require("./config.json");
const fs = require("fs");
const mongoose = require("mongoose");
const soldCardSchema = require("./Schemas/soldCardSchema.js");
const SoldCard = mongoose.model("Card", soldCardSchema);
class discordBot {
  async init() {
    mongoose.connect("mongodb://localhost/cards", { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true });
    const db = mongoose.connection;
    db.on("error", console.error.bind(console, "connection error:"));
    db.once("open", function () {
      console.log("db for discord connected!");
    });

    client.on("ready", async () => {
      console.log("Dime Monitors Discord Bot is online!");
    });

    client.on("message", (message) => {
      if (!message.content.startsWith("!") || message.author.bot) return;

      const args = message.content.slice(1).trim().split(" ");
    });

    await client.login(config.token);
  }

  sendCard(card) {
    try {
      let thumbnail = new Discord.MessageAttachment("./kobe.jpg", "kobe.jpg");

      let logo = new Discord.MessageAttachment("./DimeMonitorLogo.png", "DimeMonitorLogo.png");

      const embed = new Discord.MessageEmbed()
        .setTitle(card.name)
        .setURL(card.link ? card.link : "https://nbatopshot.com")
        .setAuthor("NBA Topshot")

        .setThumbnail(card.imageLink ? card.imageLink : "attachment://kobe.jpg")

        //.attachFiles(logo)
        .setFooter(`Powered by Dime Monitors | ${Date.now() - card.listTime} ms`, client.user.displayAvatarURL())
        /*.setFooter(
          `Powered by Dime Monitors | ${Date.now() - card.listTime} ms | Cadence: ${card.cadence} | Discord: ${
            Date.now() - card.discordPost
          } | Snipe Check: ${card.checkForSnipes} | Count: ${card.count} | getEvents: ${card.getEvents}`,
          client.user.displayAvatarURL()
        )*/

        .setColor("#00AAFF")
        .setTimestamp()
        .addFields(
          {
            name: "Set",
            value: `${card.set} (Series ${card.setSeries})`,
          },
          {
            name: `Price`,
            value: `$${parseInt(card.price)}`,
          },
          /*{
            name: "Average Price",
  
            value: `$${card.averagePrice}`,
          },
          {
            name: "Profit",
            value: `${card.averagePriceProfit}%`,
            inline: true,
          },*/
          {
            name: `Average Price`,

            value: `$${parseInt(card.serialAverage)}`, //`$${parseInt(card.serialAverage)} (${card.averageLength}) (${card.rate})`
          },
          {
            name: "Undervalued",
            value: `${parseInt(card.averageSerialProfit)}%`,
            inline: true,
          },
          {
            name: "Play Category",
            value: card.playCategory,
            inline: true,
          },
          {
            name: "Serial Number",
            value: `${card.serialNumber} / ${card.serialMax}`,
          }
          /*{
            name: "Sales",
            value: card.array.join(),
          }*/
        );

      if (card.test) {
        let channel = client.channels.cache.get("814674606396538890");
        return channel.send(embed);
      }
      if (card.set == "The Gift") {
        console.log("Cool cats");
        let channel = client.channels.cache.get("810283537097687051");
        channel.send(embed);
      }

      if (card.set == "Cool Cats") {
        console.log("Cool cats");
        let channel = client.channels.cache.get("811102592460783636");
        channel.send(embed);
      }

      if (parseInt(card.price) == 1) {
        console.log("Dollar");
        let channel = client.channels.cache.get("805659301128437801");
        channel.send(embed);
      }

      console.log("normal channel");
      let channel = client.channels.cache.get(card.channel);
      channel.send(embed);
      console.log("All channel");
      let allChannel = client.channels.cache.get("804935899640365056");
      allChannel.send(embed);
    } catch (err) {
      console.log(err);
      fs.appendFileSync("./error.txt", "\n" + err);
    }
  }
}

module.exports = discordBot;
