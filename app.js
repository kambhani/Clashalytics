const express = require("express");
const exphbs = require("express-handlebars");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const fetch = require("node-fetch")
const Handlebars = require("handlebars");
const serveStatic = require("serve-static");
const { template } = require("handlebars");

const app = express();

// Map global Promises
mongoose.Promise = global.Promise;

// Mongoose Connection
mongoose.connect("mongodb://localhost/clashalytics-dev", {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => {
    console.log("Connected");
  })
  .catch((err) => {
    console.log("Failure");
  });

// Load MongoDB Models
require("./models/Battle");
const Battle = mongoose.model("Battle");
require("./models/Tracked_Player");
const Tracked_Player = mongoose.model("Tracked_Player");

// How middleware works
app.use((req, res, next) => {
  //req.name = "Anish";
  next();
});

// Handlebars Middleware and Embedded Custom Helpers
app.engine("handlebars", exphbs({
  defaultLayout: "main",
  helpers: require("./views/helpers/handlebars.js").helpers
}));
app.set("view engine", "handlebars");

// Body Parser Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Serving static files
app.use(express.static("static_files"));

// Global Variables that I declarded
const auth = "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiIsImtpZCI6IjI4YTMxOGY3LTAwMDAtYTFlYi03ZmExLTJjNzQzM2M2Y2NhNSJ9.eyJpc3MiOiJzdXBlcmNlbGwiLCJhdWQiOiJzdXBlcmNlbGw6Z2FtZWFwaSIsImp0aSI6IjFhMDI4NjAzLWY2OTUtNGUxMC04N2MxLTc1ZjFmMGZkMzUwMiIsImlhdCI6MTYwNjE1NTY5Miwic3ViIjoiZGV2ZWxvcGVyLzZmMDliMjM1LWViMDUtMzhjOS04ZTEyLTMxYjViMjJkM2VkNCIsInNjb3BlcyI6WyJyb3lhbGUiXSwibGltaXRzIjpbeyJ0aWVyIjoiZGV2ZWxvcGVyL3NpbHZlciIsInR5cGUiOiJ0aHJvdHRsaW5nIn0seyJjaWRycyI6WyIxODQuMTcwLjE2Ni4xNzMiXSwidHlwZSI6ImNsaWVudCJ9XX0.itwXBlkJmcVuB3dZm-FPXrHMNgpy5o75t9mJZha3Sn8rFpObsj2YTXZLlX5IkCQ7r_LoRm-SkTz2mXBwrPcbLQ";

// Root Index
app.get("/", (req, res) => {
  const title = "Welcome!"
  res.render("index", {
    title: title
  });
});

// Players Page
app.get("/players", (req, res) => {
  res.render("players");
});

app.post("/players", (req, res) => {
  //console.log(req.body);
  let errors = [];
  if (!req.body.tag) {
    errors.push({text: "Please enter a tag"});
  } else {
    // Pound sign (#) is not removed because that will be cleared on server end
    let pattern = new RegExp(/[\s~`!@#$%\^&*+=\-\[\]\\';,/{}|\\":<>\?()\._]/);
    if (pattern.test(req.body.tag)) {
      errors.push({text: "Please remove special characters from the search string, including the initial pound (#) sign"});
    }
  }
  if (errors.length > 0) {
    res.render("players", {
      errors: errors,
      tag: req.body.tag
    });
  } else {
    res.redirect(`/players/${req.body.tag.toUpperCase()}`);
  }
});

// Player Stat Pages
app.get("/players/:tag", (req, res) => {
  const tag = req.params.tag.toUpperCase();
  const url1 = "https://api.clashroyale.com/v1/players/%23" + tag;
  const url2 = url1 + "/battlelog";
  const url3 = url1 + "/upcomingchests";
  let playerInfo = [0, 0, 0];
  let playerInfoLogicalSize = 0;
  let errors = [];

  let playerIsTracked;
  let trackedBattles;
  // Check if player is being tracked with my system
  (async function () {
    playerIsTracked = await Tracked_Player.exists({player: tag});
    if (playerIsTracked) {
      (async function () {
        trackedBattles = await Battle.find({player_tag: tag}).lean();
      }) ();
    }
  }) ();
  

  fetch(url1, {
    headers: {
      Accept: "application/json",
      Authorization: auth
    }
  })
    .then(res => res.json())
    .then((json) => {
      playerInfo[0] = json;
      playerInfoLogicalSize++;
      if (playerInfoLogicalSize === 3) {
        if (playerInfo[2].reason === "notFound") {
          res.render("playerNotFound", {
            tag: tag
          });
        } else {
          res.render("playerInfo", {
            playerStats: playerInfo[0],
            playerBattles: playerInfo[1],
            playerChests: playerInfo[2],
            isTracked: playerIsTracked,
            trackedBattles: trackedBattles
          });
        }
      }
    })
    .catch((err) => {
      errors.push(err);
    });

  fetch(url2, {
    headers: {
      Accept: "application/json",
      Authorization: auth
    }
  })
    .then(res => res.json())
    .then((json) => {
      playerInfo[1] = json;
      playerInfoLogicalSize++;
      if (playerInfoLogicalSize === 3) {
        if (playerInfo[2].reason === "notFound") {
          res.render("playerNotFound", {
            tag: tag
          });
        } else {
          //res.send(json);
          res.render("playerInfo", {
            playerStats: playerInfo[0],
            playerBattles: playerInfo[1],
            playerChests: playerInfo[2],
            isTracked: playerIsTracked,
            trackedBattles: trackedBattles
          });
        }
      }
    })
    .catch((err) => {
      errors.push(err);
    });

  fetch(url3, {
    headers: {
      Accept: "application/json",
      Authorization: auth
    }
  })
    .then(res => res.json())
    .then((json) => {
      playerInfo[2] = json;
      playerInfoLogicalSize++;
      if (playerInfoLogicalSize === 3) {
        if (playerInfo[2].reason === "notFound") {
          res.render("playerNotFound", {
            tag: tag
          });
        } else {
          res.render("playerInfo", {
            playerStats: playerInfo[0],
            playerBattles: playerInfo[1],
            playerChests: playerInfo[2],
            isTracked: playerIsTracked,
            trackedBattles: trackedBattles
          });
        }
      }
    })
    .catch((err) => {
      errors.push(err);
    });

  if(errors.length > 0) {
    res.send("ERROR");
  }
});

app.post("/players/:tag", (req, res) => {
  const tag = req.params.tag.toUpperCase();
  const toAdd = {
    player: tag
  }
  new Tracked_Player(toAdd)
    .save()
    .then(idea => {
      //console.log(idea);
      res.redirect("/players/" + tag);
    });
  
});


// This area is where I try to keep track of player battles and update the db every ~hour
// The "doEveryHour" code is taken from https://stackoverflow.com/a/58767632
const updateBattleLog = async function () {
  let players = await Tracked_Player.find({}, "player -_id").exec();
  //console.log(players);
  let errors = [];
  players.forEach(playerObject => {
    let player = playerObject.player;
    //console.log(player);
    let url = "https://api.clashroyale.com/v1/players/%23" + player + "/battlelog";
    fetch(url, {
      headers: {
        Accept: "application/json",
        Authorization: auth
      }
    })
      .then(res => res.json())
      .then((json) => {
        //console.log(json[10]);
        jsonLoop:
        for (let i = 0; i < json.length; i++) {
          try {
            let test = json[i].team[1].tag;
          } catch (error) {
            // This code executes only if the battle was not 2v2
            // I only log 1v1 battles (no boat battles)
            function getRealLevel(apiLevel, apiMaxLevel) {
              return 13 - apiMaxLevel + apiLevel;
            }
            let pastDate = json[i].battleTime;
            let battleTime = new Date(Date.UTC(pastDate.substring(0, 4), pastDate.substring(4, 6) - 1, pastDate.substring(6, 8), pastDate.substring(9, 11),pastDate.substring(11, 13), pastDate.substring(13, 15)));
            let timeDifference = Date.now() - battleTime.getTime();
            if (timeDifference > 3600000) {
              break jsonLoop;
            }
            if (json[i].type !== "boatBattle") {
              let deckUsed = [];
              let deckFaced = [];
              let levelDifference = 0;
              for (let j = 0; j < 8; j++) {
                deckUsed.push(json[i].team[0].cards[j].name);
                deckFaced.push(json[i].opponent[0].cards[j].name);
                levelDifference += getRealLevel(json[i].team[0].cards[j].level, json[i].team[0].cards[j].maxLevel);
                levelDifference -= getRealLevel(json[i].opponent[0].cards[j].level, json[i].opponent[0].cards[j].maxLevel);;
              }
              levelDifference /= 8;
              deckUsed.sort();
              deckFaced.sort();
              let victor = json[i].team[0].crowns - json[i].opponent[0].crowns;
              if (victor > 0) {
                victor = "Victory";
              } else if (victor < 0) {
                victor = "Defeat";
              } else {
                victor = "Draw"
              }

              const toAdd = {
                player_tag: json[i].team[0].tag.substring(1),
                deck_used: deckUsed,
                deck_faced: deckFaced,
                level_difference: levelDifference,
                opponent_tag: json[i].opponent[0].tag.substring(1),
                battle_outcome: victor,
                time: battleTime,
                battle_type: json[i].gameMode.name
              }

              async function addBattle () {
                let battleExists = await Battle.exists({player_tag: json[i].team[0].tag.substring(1), time: battleTime});
                if (!battleExists) {
                  new Battle(toAdd)
                    .save()
                    .then(idea => {
                      //console.log(idea);
                    });
                }
              }
              addBattle();
            }
          }
        }
      });
      /*.catch((err) => {
        errors.push(err);
      });*/
    //console.log(player);
  });
}

const doEveryHour = (something) => {
  let running = true;
  let nextHour = () => {
    return 3600000 - new Date().getTime() % 3600000;
  }
  let nextCall = setTimeout(() => {
    something();
    doEveryHour(something);
  }, nextHour());
  return {
    next() { return running ? nextHour() : -1 },
    exec() { something() },
    stop() {
      clearTimeout(nextCall);
      running = false;
    },
    start() {
      clearTimeout(nextCall);
      nextCall = setTimeout(() => {
        something();
        doEveryHour(something);
      }, nextHour());
      running = true;
    }
  }
}

let updatingBattleLog = doEveryHour(updateBattleLog);
updatingBattleLog.exec();

const port = 5000;

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});