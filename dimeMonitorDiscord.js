const Discord = require("discord.js");
const client = new Discord.Client();
const config = require("./config.json");
const fs = require("fs");
const mongoose = require("mongoose");
const soldCardSchema = require("./Schemas/soldCardSchema.js");
const SoldCard = mongoose.model("Card", soldCardSchema);
const QuickChart = require("quickchart-js");
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
    this.testChannel = await client.channels.fetch("814674606396538890");
    this.seeingStarsChannel = await client.channels.fetch("817144155645673523");
    this.coolCatsChannel = await client.channels.fetch("811102592460783636");
    this.allChannel = await client.channels.fetch("804935899640365056");
    this.serialOneChannel = await client.channels.fetch("813534856423800836");
    this.fortyPlus = await client.channels.fetch("805658965235990538");
    this.twentyPlus = await client.channels.fetch("805659038708006935");
    this.tenPlus = await client.channels.fetch("805658697556557824");
    this.newBaseSetTwo = await client.channels.fetch("817885102100447233");
    this.doubleDigit = await client.channels.fetch("817884290946826282");
    this.dollar = await client.channels.fetch("805659301128437801");
    this.coolCats = await client.channels.fetch("811102592460783636");
    this.risingStarsChannel = await client.channels.fetch("818696831524405268");

    this.graphsChannel = await client.channels.fetch("818844774516654080");
  }

  async sendCard(card) {
    try {
      let thumbnail = new Discord.MessageAttachment("./kobe.jpg", "kobe.jpg");

      let logo = new Discord.MessageAttachment("./DimeMonitorLogo.png", "DimeMonitorLogo.png");

      const embed = new Discord.MessageEmbed()
        .setTitle(card.name)
        .setURL(card.link ? card.link : "https://nbatopshot.com")
        .setAuthor("NBA Topshot")

        .setThumbnail(card.imageLink ? card.imageLink : "attachment://kobe.jpg")

        //.attachFiles(logo)
        .setFooter(
          `Powered by Dime Monitors | ${Date.now() - card.listTime} ms | TS: ${card.getEvents + card.cadence} ms`,
          client.user.displayAvatarURL()
        )
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
            value: `${card.set} (Series ${card.setSeries}) (${card.playCategory})`,
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
            name: "Sales Volume (Week)",
            value: card.volume,
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
      let messages = [];
      if (card.test) {
        let msg = this.testChannel.send(embed).catch((err) => {
          console.log(err);
          fs.appendFileSync("./error.txt", "\n" + err);
        });

        messages.push({ message: msg, channel: this.testChannel });
      }
      if (card.delay) {
        let msg = this.testChannel.send(embed).catch((err) => {
          console.log(err);
          fs.appendFileSync("./error.txt", "\n" + err);
        });

        messages.push({ message: msg, channel: this.testChannel });
      }

      if (card.delay) await new Promise((r) => setTimeout(r, 3500));

      if (card.set == "Seeing Stars") {
        let msg = this.seeingStarsChannel.send(embed).catch((err) => {
          console.log(err);
          fs.appendFileSync("./error.txt", "\n" + err);
        });

        messages.push({ message: msg, channel: this.seeingStarsChannel });
      }

      if (card.set == "Cool Cats") {
        console.log("Cool cats");

        let msg = this.coolCats.send(embed).catch((err) => {
          console.log(err);
          fs.appendFileSync("./error.txt", "\n" + err);
        });

        messages.push({ message: msg, channel: this.coolCats });
      }

      if (parseInt(card.price) == 1) {
        console.log("Dollar");
        let msg = this.dollar.send(embed).catch((err) => {
          console.log(err);
          fs.appendFileSync("./error.txt", "\n" + err);
        });

        messages.push({ message: msg, channel: this.dollar });
      }

      if (parseInt(card.serialNumber) < 100) {
        console.log("Dollar");
        let msg = this.doubleDigit.send(embed).catch((err) => {
          console.log(err);
          fs.appendFileSync("./error.txt", "\n" + err);
        });
        messages.push({ message: msg, channel: this.doubleDigit });
      }

      if (card.set == "Rising Stars") {
        console.log("Cool cats");
        let msg = this.risingStarsChannel.send(embed).catch((err) => {
          console.log(err);
          fs.appendFileSync("./error.txt", "\n" + err);
        });
        messages.push({ message: msg, channel: this.risingStarsChannel });
      }

      if (
        (card.serialMax.includes("+") &&
          parseInt(card.serialMax.replace("+", "")) > 30000 &&
          card.set == "Base Set" &&
          card.setSeries == "2") ||
        parseInt(card.serialMax > 30000)
      ) {
        console.log("Dollar");
        let msg = this.newBaseSetTwo.send(embed).catch((err) => {
          console.log(err);
          fs.appendFileSync("./error.txt", "\n" + err);
        });
        messages.push({ message: msg, channel: this.newBaseSetTwo });
      }

      if (/*card.averagePriceProfit >= 0.1 ||*/ card.averageSerialProfit >= 10) {
        let msg = this.tenPlus.send(embed).catch((err) => {
          console.log(err);
          fs.appendFileSync("./error.txt", "\n" + err);
        });
        messages.push({ message: msg, channel: this.tenPlus });
      }

      if (/*card.averagePriceProfit >= 0.2 || */ card.averageSerialProfit >= 20) {
        let msg = this.twentyPlus.send(embed).catch((err) => {
          console.log(err);
          fs.appendFileSync("./error.txt", "\n" + err);
        });

        messages.push({ message: msg, channel: this.twentyPlus });
      }

      if (/*card.averagePriceProfit >= 0.5 ||*/ card.averageSerialProfit >= 40) {
        let msg = this.fortyPlus.send(embed).catch((err) => {
          console.log(err);
          fs.appendFileSync("./error.txt", "\n" + err);
        });

        messages.push({ message: msg, channel: this.fortyPlus });
      }

      if (card.serialNumber == 1) {
        let msg = this.serialOneChannel.send(embed).catch((err) => {
          console.log(err);
          fs.appendFileSync("./error.txt", "\n" + err);
        });
        messages.push({ message: msg, channel: this.serialOneChannel });
      }

      console.log("normal channel");
      /*let channel = client.channels.cache.get(card.channel);
      channel.send(embed);*/
      console.log("All channel");
      let msg = this.allChannel.send(embed).catch((err) => {
        console.log(err);
        fs.appendFileSync("./error.txt", "\n" + err);
      });

      messages.push({ message: msg, channel: this.allChannel });

      this.postGraph(card, messages);
    } catch (err) {
      console.log(err);
      fs.appendFileSync("./error.txt", "\n" + err);
    }
  }

  async postGraph(card, messages) {
    let chart = new QuickChart(); //Make array of all the send message promises, use promise all to add graph link to each message
    chart
      .setConfig({
        type: "line",
        data: {
          datasets: [
            {
              label: `${card.name} Serial Range ${card.serialNumber} out of ${card.serialMax}`,
              fill: false,
              /*lineTension: 0.5,*/
              radius: 0.1,

              data: card.monthSales,
            },
          ],
        },
        options: {
          scales: {
            xAxes: [
              {
                type: "time",
                time: {
                  parser: "MM/DD/YYYY HH:mm",
                },
                scaleLabel: {
                  display: true,
                  labelString: "Date",
                },
                gridLines: {
                  color: "rgba(255, 255, 255, 0.25)",
                  zeroLineColor: "rgba(255, 255, 255, 0.25)",
                  display: true,
                },
              },
            ],
            yAxes: [
              {
                scaleLabel: {
                  display: true,
                  labelString: "Price",
                },
                ticks: {
                  callback: (val) => {
                    return "$" + val.toString();
                  },
                },
                gridLines: {
                  color: "rgba(255, 255, 255, 0.25)",
                  zeroLineColor: "rgba(255, 255, 255, 0.25)",
                  display: true,
                },
              },
            ],
          },
        },
      })
      .setWidth(900)
      .setHeight(500)
      .setBackgroundColor("#23272a");
    card.url = await chart.getShortUrl();
    console.log(card.url);

    const chartEmbed = new Discord.MessageEmbed();
    chartEmbed.setTitle(`${card.name}`);
    chartEmbed.setImage(card.url);
    chartEmbed.setDescription(`${card.set} ${card.playCategory}`);
    console.log(chartEmbed);
    let graphMsg = await this.graphsChannel.send(chartEmbed).catch((err) => {
      console.log(err);
    });

    for (let i = 0; i < messages.length; i++) {
      let msg = messages[i].message;
      console.log(msg + " yo");
      msg.then(function (result) {
        console.log(result.channel.id);
        let channel = messages[i].channel;
        channel.messages
          .fetch(result.id)
          .then(function (m) {
            let embed = m.embeds[0];
            //console.log(embed);
            embed.fields.splice(embed.fields.length - 1, 0, {
              value: `[Sales (Past Month)](${graphMsg.url})`,
              name: "Graph",
              inline: true,
            });
            //embed.fields.push({ value: `[Yo](${graphMsg.url})`, name: "Graph", inline: true });
            m.edit(embed);
            //console.log(m.embeds[0].fields);
          })
          .catch((err) => {
            console.log(err);
          });
      });
    }
  }
}

module.exports = discordBot;
