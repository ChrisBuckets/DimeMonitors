const { request, gql } = require("graphql-request");
const mongoose = require("mongoose");
const directLinkSchema = require("./Schemas/directLinkSchema.js");
const DirectLink = mongoose.model("DirectLink", directLinkSchema);
const momentLinkSchema = require("./Schemas/momentLinkSchema.js");
const MomentLink = mongoose.model("MomentLink", momentLinkSchema);
mongoose.connect("mongodb://localhost/cards", { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true });

/*DirectLink.findOne({ set: "Holo Icon" }, async function (err, set) {
  return console.log(set.plays[0].serials);
  let findPlay = set.plays.find((element) => element.playerName == "Zion Williamson");
  for (let i = 0; i < findPlay.serials.length; i++) {
    let findSerial = findPlay.serials.find((element) => element.serialNumber == 500);
    console.log(`https://nbatopshot.com/moment/${findSerial.serialUUID}`);
  }
});
return;*/

async function getSerials() {
  DirectLink.find({}, async function (err, sets) {
    //for (let i = 0; i < sets.length; i++) {
    for (let i = sets.length - 1; i >= 0; i--) {
      let cursorPosition = "";
      console.log(i + " " + sets[i]);
      for (let j = 0; j < sets[i].plays.length; j++) {
        console.log("Executed before await done " + j);
        await getMoreSerials(sets[i], sets[i].plays[j], sets[i].setUUID, sets[i].plays[j].playUUID, "");
      }
      console.log(i + "Current set");
    }
  });
}
getSerials();
async function getMoreSerials(set, setPlay, setID, playID, cursorPosition) {
  const query = gql`
    query SearchMintedMomentsForSerialNumberModal(
      $sortBy: MintedMomentSortType
      $byOwnerDapperID: [String]
      $bySets: [ID]
      $bySetVisuals: [VisualIdType]
      $byPlayers: [ID]
      $byPlays: [ID]
      $byTeams: [ID]
      $byForSale: ForSaleFilter
      $searchInput: BaseSearchInput!
    ) {
      searchMintedMoments(
        input: {
          sortBy: $sortBy
          filters: {
            byOwnerDapperID: $byOwnerDapperID
            bySets: $bySets
            bySetVisuals: $bySetVisuals
            byPlayers: $byPlayers
            byPlays: $byPlays
            byTeams: $byTeams
            byForSale: $byForSale
          }
          searchInput: $searchInput
        }
      ) {
        data {
          sortBy
          filters {
            byOwnerDapperID
            bySets
            bySetVisuals
            byPlayers
            byPlays
            byTeams
            byForSale
            __typename
          }
          searchSummary {
            count {
              count
              __typename
            }
            pagination {
              leftCursor
              rightCursor
              __typename
            }
            data {
              ... on MintedMoments {
                size
                data {
                  ...MomentDetails
                  packListingID
                  __typename
                }
                __typename
              }
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
  `;
  const variables = {
    sortBy: "RARITY_DESC",
    byOwnerDapperID: [],
    bySets: [setID],
    bySeries: [],
    bySetVisuals: [],
    byPlayers: [],
    byPlays: [playID],
    byTeams: [],
    byForSale: null,
    searchInput: {
      pagination: {
        cursor: cursorPosition,
        direction: "RIGHT",
        limit: 5000,
      },
    },
  };
  try {
    console.log("Requesting..");
    await request("https://api.nbatopshot.com/marketplace/graphql?SearchMintedMomentsForSerialNumberModal", query, variables).then(
      async (data) => {
        //console.log(data.searchMintedMoments.data);

        let cursorPosition = data.searchMintedMoments.data.searchSummary.pagination.rightCursor;
        if (data.searchMintedMoments.data.searchSummary.data.data.length <= 0) {
          console.log("data array empty");
          return;
        }
        await DirectLink.findOne({ setUUID: setID }, async function (err, set) {
          console.log(setID + " " + playID + " " + data.searchMintedMoments.data.searchSummary.data.data.length);
          console.log(set);
          for (let i = 0; i < data.searchMintedMoments.data.searchSummary.data.data.length; i++) {
            let serialData = data.searchMintedMoments.data.searchSummary.data.data;
            /*let findSet = set.plays.find((element) => element.playUUID == playID);
            if (!findSet.serials) {
              console.log("Serial plays not found");
              set.plays.serials = [];
            }*/
            /*await MomentLink.findOne(
              { setUUID: setID, playUUID: playID, serialNumber: serialData[i].flowSerialNumber },
              async function (err, moment) {
                if (moment) {
                  console.log("Already added " + serialData[i].flowSerialNumber + " " + setPlay.playerName);
                  return;
                }*/

            const momentLink = new MomentLink({
              setID: set.setID,
              setUUID: setID,
              set: serialData[i].set.flowName,
              playID: setPlay.playID,
              playUUID: playID,
              serialUUID: serialData[i].id,
              serialNumber: serialData[i].flowSerialNumber,
              setSeries: serialData[i].set.flowSeriesNumber,
            });

            await momentLink.save(function (err) {
              if (err) console.log(err);
              console.log("saved " + serialData[i].flowSerialNumber + " " + setPlay.playerName);
            });
            /*}
            )
              .select({ setUUID: 1, playUUID: 1, serialNumber: 1 })
              .lean();*/
          }

          /*set.save(function (err) {
            if (err) return console.log(err);
            console.log("serial saved " + set.set);
          });*/

          /*if (data.searchMintedMoments.data.searchSummary.pagination.rightCursor != "") {
          getMoreSerials(set, setID, playID, cursorPosition);
          console.log(
            "Getting more serials " +
              set.set +
              " " +
              data.searchMintedMoments.data.searchSummary.pagination.rightCursor +
              " " +
              cursorPosition
          );
        }*/
        });
        console.log("Getting more serials");
        await getMoreSerials(set, setPlay, setID, playID, cursorPosition);
        //console.log(data.searchMintedMoments.data.searchSummary.data.data)
      }
    );
  } catch (err) {
    console.log(err);

    if (!set.attempts) set.attempts = 1;
    set.attempts += 1;
    console.log(set.set + " " + "attempt " + set.attempts);
    await getMoreSerials(set, setID, playID, cursorPosition);
  }
}

function getSets() {
  const query = gql`
    query {
      searchSets(input: { searchInput: { pagination: { direction: RIGHT, cursor: "", limit: 100 } } }) {
        searchSummary {
          pagination {
            rightCursor
          }
          data {
            ... on Sets {
              data {
                id
                sortID
                version
                flowId
                flowName
                flowSeriesNumber
                flowLocked
                setVisualId

                plays {
                  id
                  version
                  flowID
                  status
                  stats {
                    playerID
                    playerName
                    playCategory
                    jerseyNumber
                    awayTeamScore
                    homeTeamScore
                    birthdate
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  request("https://api.nbatopshot.com/marketplace/graphql?", query).then((data) => {
    //console.log(data.searchSets.searchSummary.data.data);
    let dataLength = data.searchSets.searchSummary.data.data.length;
    console.log(dataLength);
    for (let i = 0; i < dataLength; i++) {
      console.log("getting");
      let setData = data.searchSets.searchSummary.data.data[i];
      //return console.log(setData);
      for (let i = 0; i < setData.plays.length; i++) {
        delete setData.plays[i]["version"];
        delete setData.plays[i]["status"];

        setData.plays[i].playUUID = setData.plays[i].id;
        setData.plays[i].playID = setData.plays[i].flowID;
        setData.plays[i].playerName = setData.plays[i].stats.playerName;

        delete setData.plays[i]["stats"];
      }
      const directLink = new DirectLink({
        setID: setData.flowId,
        setUUID: setData.id,
        set: setData.flowName,
        setSeries: setData.flowSeriesNumber,
        plays: setData.plays,
      });
      console.log(directLink);
      directLink.save(function (err) {
        if (err) console.log(err);
        console.log("saved");
      });
    }
  });
}
//getSets();
