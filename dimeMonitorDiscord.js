const Discord = require("discord.js");
const client = new Discord.Client();
const config = require("./config.json");
const fs = require("fs");
const mongoose = require("mongoose");
const marketLinkSchema = require("./Schemas/marketLinkSchema.js");
const MarketLink = mongoose.model("MarketLink", marketLinkSchema);
const soldCardSchema = require("./Schemas/soldCardSchema.js");
const SoldCard = mongoose.model("Card", soldCardSchema);
const { GraphQLClient, request, gql } = require("graphql-request");
const graphClient = new GraphQLClient("https://public-api.nbatopshot.com/graphql");
graphClient.setHeader("User-Agent", "https://twitter.com/DimeMonitors");
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

    this.allStarsChannel = await client.channels.fetch("822552376471715892");
    this.graphsChannel = await client.channels.fetch("818844774516654080");

    this.snipes = [];
  }

  async sendCard(card) {
    try {
      let thumbnail = new Discord.MessageAttachment("./kobe.jpg", "kobe.jpg");

      let logo = new Discord.MessageAttachment("./DimeMonitorLogo.png", "DimeMonitorLogo.png");

      const embed = new Discord.MessageEmbed()
        .setTitle(card.name)

        .setURL(card.momentLink ? card.momentLink : "https://nbatopshot.com")
        .setAuthor("NBA Topshot")

        .setThumbnail(card.imageLink ? card.imageLink : "attachment://kobe.jpg")

        .setFooter(
          `Powered by Dime Monitors | ${Date.now() - card.listTime} ms | TS: ${card.getEvents + card.cadence} ms | Check: ${
            card.checkForSnipes
          }`,
          client.user.displayAvatarURL()
        )

        .setColor("#008000")
        .setTimestamp()
        .addFields(
          { name: "All listings", value: `[View](${card.link})` },
          {
            name: "Set",
            value: `${card.set} (Series ${card.setSeries}) (${card.playCategory})`,
          },
          {
            name: `Price`,
            value: `$${parseInt(card.price)}`,
          },
          {
            name: `Average Price`,

            value: `$${parseInt(card.serialAverage)}`,
          },
          {
            name: `Lowest Ask`,
            value: `Fetching..`,
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
            name: "Graph",
            value: `Fetching..`,
            inline: true,
          },
          {
            name: "Serial Number",
            value: `${card.serialNumber} / ${card.serialMax}`,
          }
        );
      let messages = [];
      if (card.test) {
        let msg = this.testChannel.send(embed).catch((err) => {
          console.log(err);
          fs.appendFileSync("./error.txt", "\n" + err);
        });

        messages.push({ message: msg, channel: this.testChannel });

        this.updateCard(card, messages);
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

      if (card.set == "2021 All-Star Game") {
        console.log("Cool cats");
        let msg = this.allStarsChannel.send(embed).catch((err) => {
          console.log(err);
          fs.appendFileSync("./error.txt", "\n" + err);
        });
        messages.push({ message: msg, channel: this.allStarsChannel });
      }

      if (
        (card.serialMax &&
          card.serialMax.includes("+") &&
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

      if (card.averageSerialProfit >= 10) {
        let msg = this.tenPlus.send(embed).catch((err) => {
          console.log(err);
          fs.appendFileSync("./error.txt", "\n" + err);
        });
        messages.push({ message: msg, channel: this.tenPlus });
      }

      if (card.averageSerialProfit >= 20) {
        let msg = this.twentyPlus.send(embed).catch((err) => {
          console.log(err);
          fs.appendFileSync("./error.txt", "\n" + err);
        });

        messages.push({ message: msg, channel: this.twentyPlus });
      }

      if (card.averageSerialProfit >= 40) {
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

      console.log("All channel");
      let msg = this.allChannel.send(embed).catch((err) => {
        console.log(err);
        fs.appendFileSync("./error.txt", "\n" + err);
      });

      messages.push({ message: msg, channel: this.allChannel });

      this.updateCard(card, messages);
      this.snipes.push({ card: card, messages: messages });
      this.checkSnipes();
      console.log("SNIPES ARRAY LENGTH " + this.snipes.length);
    } catch (err) {
      console.log(err);
      fs.appendFileSync("./error.txt", "\n" + err);
    }
  }

  async checkSnipes() {
    if (this.snipes.length > 0) {
      for (let i = 0; i < this.snipes.length; i++) {
        let index = this.snipes.indexOf(this.snipes[i]);
        if (Date.now() - this.snipes[i].card.timestamp > 300000) {
          this.snipes.splice(index, 1);
          continue;
        }

        let messages = this.snipes[i].messages;
        let card = this.snipes[i].card;
        let time = 3600000;
        let self = this;
        SoldCard.findOne(
          {
            blockHeight: { $gt: card.blockHeight },
            price: card.price,
            set: card.set,
            setID: card.setID,
            playID: card.playID,
            name: card.name,
            playCategory: card.playCategory,
            setSeries: card.setSeries,
            serialNumber: card.serialNumber,
            timestamp: { $gt: Date.now() - 300000 },
          },
          async function (err, soldCard) {
            if (!soldCard) {
              console.log("Card not purchased yet");
              return;
            }
            console.log(soldCard);
            console.log(card);

            let purchaseSpeed = (soldCard.blockHeight - card.blockHeight) * 3.5;
            if (purchaseSpeed <= 0) {
              console.log(soldCard);
              console.log(card);
              process.exit();
            }
            let userName = await self.getUserName(card.momentDetails.serialUUID);
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

                    embed.color = "#FF0000";

                    let getPrice = embed.fields.find(function (element) {
                      return element.name.includes("Price");
                    });

                    getPrice.name = `~~Price~~ Sold`;
                    getPrice.value = `$${soldCard.price} (Purchased by ${userName ? userName : ""} in ${purchaseSpeed} seconds)`;

                    m.edit(embed);
                  })
                  .catch((err) => {
                    console.log(err);
                  });
              });
            }
            self.snipes.splice(index, 1); //Remove snipe from array after updating that it was sold
          }
        )
          .select({
            set: 1,
            timestamp: 1,
            setID: 1,
            playID: 1,
            name: 1,
            playCategory: 1,
            setSeries: 1,
            price: 1,
            serialNumber: 1,
            blockHeight: 1,
          })
          .lean();
      }
    }
  }
  async updateCard(card, messages) {
    let chart = new QuickChart();
    chart
      .setConfig({
        type: "line",
        data: {
          datasets: [
            {
              label: `${card.name} Serial Range ${card.serialNumber} out of ${card.serialMax} (${card.monthSales.length})`,
              fill: false,

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
                  unit: "day",
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

    card.lowestAskStart = Date.now();
    let lowestAsk = await this.getLowestAsk(card.momentDetails); //Getting lowest ask of card

    if (lowestAsk) {
      card.lowestAsk = lowestAsk.price;
      card.lowestAskRequest = lowestAsk.graphql;
    }

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

            let getGraph = embed.fields.find(function (element) {
              return element.name == "Graph";
            });

            getGraph.value = `[Sales (Past Month)](${graphMsg.url})`;

            let getLowestAsk = embed.fields.find(function (element) {
              return element.name == "Lowest Ask";
            });

            getLowestAsk.value = `$${card.lowestAsk ? parseInt(card.lowestAsk) : ""}`;

            m.edit(embed);
          })
          .catch((err) => {
            console.log(err);
          });
      });
    }
  }

  //Fetches lowest ask using GraphQL
  async getLowestAsk(momentLink) {
    let marketLink;
    if (!marketLink) return;
    if (momentLink) {
      marketLink = await MarketLink.findOne({ setID: momentLink.setID, playID: momentLink.playID }).select({
        setID: 1,
        playID: 1,
        lowestAsk: 1,
      });
    }

    if (marketLink && marketLink.lowestAsk && Date.now() - marketLink.lowestAsk.lastRequest < 1800000 * 2) {
      console.log("db data returned");
      return { price: marketLink.lowestAsk.price, graphql: false };
    }

    const query = gql`
      query GetUserMomentListingsDedicated($input: GetUserMomentListingsInput!) {
        getUserMomentListings(input: $input) {
          data {
            circulationCount
            flowRetired
            version
            set {
              id
              flowName
              flowSeriesNumber
              __typename
            }
            play {
              ... on Play {
                ...PlayDetails
                __typename
              }
              __typename
            }
            assetPathPrefix
            priceRange {
              min
              max
              __typename
            }
            momentListings {
              id
              moment {
                id
                price
                flowSerialNumber
                owner {
                  dapperID
                  username
                  profileImageUrl
                  __typename
                }
                setPlay {
                  ID
                  flowRetired
                  __typename
                }
                __typename
              }
              __typename
            }
            momentListingCount
            __typename
          }
          __typename
        }
      }

      fragment PlayDetails on Play {
        id
        description
        stats {
          playerID
          playerName
          primaryPosition
          currentTeamId
          dateOfMoment
          jerseyNumber
          awayTeamName
          awayTeamScore
          teamAtMoment
          homeTeamName
          homeTeamScore
          totalYearsExperience
          teamAtMomentNbaId
          height
          weight
          currentTeam
          birthplace
          birthdate
          awayTeamNbaId
          draftYear
          nbaSeason
          draftRound
          draftSelection
          homeTeamNbaId
          draftTeam
          draftTeamNbaId
          playCategory
          homeTeamScoresByQuarter {
            quarterScores {
              type
              number
              sequence
              points
              __typename
            }
            __typename
          }
          awayTeamScoresByQuarter {
            quarterScores {
              type
              number
              sequence
              points
              __typename
            }
            __typename
          }
          __typename
        }
        statsPlayerGameScores {
          blocks
          points
          steals
          assists
          minutes
          rebounds
          turnovers
          plusMinus
          flagrantFouls
          personalFouls
          playerPosition
          technicalFouls
          twoPointsMade
          blockedAttempts
          fieldGoalsMade
          freeThrowsMade
          threePointsMade
          defensiveRebounds
          offensiveRebounds
          pointsOffTurnovers
          twoPointsAttempted
          assistTurnoverRatio
          fieldGoalsAttempted
          freeThrowsAttempted
          twoPointsPercentage
          fieldGoalsPercentage
          freeThrowsPercentage
          threePointsAttempted
          threePointsPercentage
          __typename
        }
        statsPlayerSeasonAverageScores {
          minutes
          blocks
          points
          steals
          assists
          rebounds
          turnovers
          plusMinus
          flagrantFouls
          personalFouls
          technicalFouls
          twoPointsMade
          blockedAttempts
          fieldGoalsMade
          freeThrowsMade
          threePointsMade
          defensiveRebounds
          offensiveRebounds
          pointsOffTurnovers
          twoPointsAttempted
          assistTurnoverRatio
          fieldGoalsAttempted
          freeThrowsAttempted
          twoPointsPercentage
          fieldGoalsPercentage
          freeThrowsPercentage
          threePointsAttempted
          threePointsPercentage
          __typename
        }
        __typename
      }
    `;

    const variables = {
      input: {
        setID: `${momentLink.setUUID}`,
        playID: `${momentLink.playUUID}`,
      },
    };

    try {
      console.log("Requesting..");
      let data = await graphClient.request(query, variables);
      let price = data.getUserMomentListings.data.priceRange.min;
      marketLink.lowestAsk = { price: price, lastRequest: Date.now() };
      marketLink.save(function (err) {
        if (err) {
          console.log(err);
          return;
        }
        console.log("Lowest ask saved");
        console.log(marketLink);
      });
      return { price: price, graphql: true };
    } catch (err) {
      console.log(err);
    }
  }

  async getUserName(serialUUID) {
    const query = gql`
      query GetMintedMoment($momentId: ID!) {
        getMintedMoment(momentId: $momentId) {
          data {
            ...MomentDetails
            play {
              ... on Play {
                ...PlayDetails
                __typename
              }
              __typename
            }
            __typename
          }
          __typename
        }
      }

      fragment MomentDetails on MintedMoment {
        id
        version
        sortID
        set {
          id
          flowName
          flowSeriesNumber
          setVisualId
          __typename
        }
        setPlay {
          ID
          flowRetired
          circulationCount
          __typename
        }
        assetPathPrefix
        play {
          id
          stats {
            playerID
            playerName
            primaryPosition
            teamAtMomentNbaId
            teamAtMoment
            dateOfMoment
            playCategory
            __typename
          }
          __typename
        }
        price
        listingOrderID
        flowId
        owner {
          dapperID
          username
          profileImageUrl
          __typename
        }
        flowSerialNumber
        forSale
        __typename
      }

      fragment PlayDetails on Play {
        id
        description
        stats {
          playerID
          playerName
          primaryPosition
          currentTeamId
          dateOfMoment
          jerseyNumber
          awayTeamName
          awayTeamScore
          teamAtMoment
          homeTeamName
          homeTeamScore
          totalYearsExperience
          teamAtMomentNbaId
          height
          weight
          currentTeam
          birthplace
          birthdate
          awayTeamNbaId
          draftYear
          nbaSeason
          draftRound
          draftSelection
          homeTeamNbaId
          draftTeam
          draftTeamNbaId
          playCategory
          homeTeamScoresByQuarter {
            quarterScores {
              type
              number
              sequence
              points
              __typename
            }
            __typename
          }
          awayTeamScoresByQuarter {
            quarterScores {
              type
              number
              sequence
              points
              __typename
            }
            __typename
          }
          __typename
        }
        statsPlayerGameScores {
          blocks
          points
          steals
          assists
          minutes
          rebounds
          turnovers
          plusMinus
          flagrantFouls
          personalFouls
          playerPosition
          technicalFouls
          twoPointsMade
          blockedAttempts
          fieldGoalsMade
          freeThrowsMade
          threePointsMade
          defensiveRebounds
          offensiveRebounds
          pointsOffTurnovers
          twoPointsAttempted
          assistTurnoverRatio
          fieldGoalsAttempted
          freeThrowsAttempted
          twoPointsPercentage
          fieldGoalsPercentage
          freeThrowsPercentage
          threePointsAttempted
          threePointsPercentage
          __typename
        }
        statsPlayerSeasonAverageScores {
          minutes
          blocks
          points
          steals
          assists
          rebounds
          turnovers
          plusMinus
          flagrantFouls
          personalFouls
          technicalFouls
          twoPointsMade
          blockedAttempts
          fieldGoalsMade
          freeThrowsMade
          threePointsMade
          defensiveRebounds
          offensiveRebounds
          pointsOffTurnovers
          twoPointsAttempted
          assistTurnoverRatio
          fieldGoalsAttempted
          freeThrowsAttempted
          twoPointsPercentage
          fieldGoalsPercentage
          freeThrowsPercentage
          threePointsAttempted
          threePointsPercentage
          __typename
        }
        __typename
      }
    `;
    const variables = {
      momentId: `${serialUUID}`,
    };

    let data = await graphClient.request(query, variables);

    if (data) return data.getMintedMoment.data.owner.username;
  }
}

module.exports = discordBot;
