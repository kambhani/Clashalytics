"use strict";

var express = require("express");

var exphbs = require("express-handlebars");

var bodyParser = require("body-parser");

var mongoose = require("mongoose");

var fetch = require("node-fetch");

var Handlebars = require("handlebars");

var serveStatic = require("serve-static");

var _require = require("handlebars"),
    template = _require.template;

var app = express(); // Map global Promises

mongoose.Promise = global.Promise; // Mongoose Connection

mongoose.connect("mongodb://localhost/clashalytics-dev", {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(function () {
  console.log("Connected");
})["catch"](function (err) {
  console.log("Failure");
}); // Load MongoDB Models

require("./models/Battle");

var Battle = mongoose.model("Battle");

require("./models/Tracked_Player");

var Tracked_Player = mongoose.model("Tracked_Player"); // How middleware works

app.use(function (req, res, next) {
  //req.name = "Anish";
  next();
}); // Handlebars Middleware and Embedded Custom Helpers

app.engine("handlebars", exphbs({
  defaultLayout: "main",
  helpers: require("./views/helpers/handlebars.js").helpers
}));
app.set("view engine", "handlebars"); // Body Parser Middleware

app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(bodyParser.json()); // Serving static files

app.use(express["static"]("static_files")); // Global Variables that I declarded

var auth = "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiIsImtpZCI6IjI4YTMxOGY3LTAwMDAtYTFlYi03ZmExLTJjNzQzM2M2Y2NhNSJ9.eyJpc3MiOiJzdXBlcmNlbGwiLCJhdWQiOiJzdXBlcmNlbGw6Z2FtZWFwaSIsImp0aSI6IjFhMDI4NjAzLWY2OTUtNGUxMC04N2MxLTc1ZjFmMGZkMzUwMiIsImlhdCI6MTYwNjE1NTY5Miwic3ViIjoiZGV2ZWxvcGVyLzZmMDliMjM1LWViMDUtMzhjOS04ZTEyLTMxYjViMjJkM2VkNCIsInNjb3BlcyI6WyJyb3lhbGUiXSwibGltaXRzIjpbeyJ0aWVyIjoiZGV2ZWxvcGVyL3NpbHZlciIsInR5cGUiOiJ0aHJvdHRsaW5nIn0seyJjaWRycyI6WyIxODQuMTcwLjE2Ni4xNzMiXSwidHlwZSI6ImNsaWVudCJ9XX0.itwXBlkJmcVuB3dZm-FPXrHMNgpy5o75t9mJZha3Sn8rFpObsj2YTXZLlX5IkCQ7r_LoRm-SkTz2mXBwrPcbLQ"; // Root Index

app.get("/", function (req, res) {
  var title = "Welcome!";
  res.render("index", {
    title: title
  });
}); // Players Page

app.get("/players", function (req, res) {
  res.render("players");
});
app.post("/players", function (req, res) {
  //console.log(req.body);
  var errors = [];

  if (!req.body.tag) {
    errors.push({
      text: "Please enter a tag"
    });
  } else {
    // Pound sign (#) is not removed because that will be cleared on server end
    var pattern = new RegExp(/[\s~`!@#$%\^&*+=\-\[\]\\';,/{}|\\":<>\?()\._]/);

    if (pattern.test(req.body.tag)) {
      errors.push({
        text: "Please remove special characters from the search string, including the initial pound (#) sign"
      });
    }
  }

  if (errors.length > 0) {
    res.render("players", {
      errors: errors,
      tag: req.body.tag
    });
  } else {
    res.redirect("/players/".concat(req.body.tag.toUpperCase()));
  }
}); // Player Stat Pages

app.get("/players/:tag", function (req, res) {
  var tag = req.params.tag.toUpperCase();
  var url1 = "https://api.clashroyale.com/v1/players/%23" + tag;
  var url2 = url1 + "/battlelog";
  var url3 = url1 + "/upcomingchests";
  var playerInfo = [0, 0, 0];
  var playerInfoLogicalSize = 0;
  var errors = [];
  var playerIsTracked;
  var trackedBattles; // Check if player is being tracked with my system

  (function _callee2() {
    return regeneratorRuntime.async(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.next = 2;
            return regeneratorRuntime.awrap(Tracked_Player.exists({
              player: tag
            }));

          case 2:
            playerIsTracked = _context2.sent;

            if (playerIsTracked) {
              (function _callee() {
                return regeneratorRuntime.async(function _callee$(_context) {
                  while (1) {
                    switch (_context.prev = _context.next) {
                      case 0:
                        _context.next = 2;
                        return regeneratorRuntime.awrap(Battle.find({
                          player_tag: tag
                        }).lean());

                      case 2:
                        trackedBattles = _context.sent;

                      case 3:
                      case "end":
                        return _context.stop();
                    }
                  }
                });
              })();
            }

          case 4:
          case "end":
            return _context2.stop();
        }
      }
    });
  })();

  fetch(url1, {
    headers: {
      Accept: "application/json",
      Authorization: auth
    }
  }).then(function (res) {
    return res.json();
  }).then(function (json) {
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
  })["catch"](function (err) {
    errors.push(err);
  });
  fetch(url2, {
    headers: {
      Accept: "application/json",
      Authorization: auth
    }
  }).then(function (res) {
    return res.json();
  }).then(function (json) {
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
  })["catch"](function (err) {
    errors.push(err);
  });
  fetch(url3, {
    headers: {
      Accept: "application/json",
      Authorization: auth
    }
  }).then(function (res) {
    return res.json();
  }).then(function (json) {
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
  })["catch"](function (err) {
    errors.push(err);
  });

  if (errors.length > 0) {
    res.send("ERROR");
  }
});
app.post("/players/:tag", function (req, res) {
  var tag = req.params.tag.toUpperCase();
  var toAdd = {
    player: tag
  };
  new Tracked_Player(toAdd).save().then(function (idea) {
    //console.log(idea);
    res.redirect("/players/" + tag);
  });
}); // This area is where I try to keep track of player battles and update the db every ~hour
// The "doEveryHour" code is taken from https://stackoverflow.com/a/58767632

var updateBattleLog = function updateBattleLog() {
  var players, errors;
  return regeneratorRuntime.async(function updateBattleLog$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          _context4.next = 2;
          return regeneratorRuntime.awrap(Tracked_Player.find({}, "player -_id").exec());

        case 2:
          players = _context4.sent;
          //console.log(players);
          errors = [];
          players.forEach(function (playerObject) {
            var player = playerObject.player; //console.log(player);

            var url = "https://api.clashroyale.com/v1/players/%23" + player + "/battlelog";
            fetch(url, {
              headers: {
                Accept: "application/json",
                Authorization: auth
              }
            }).then(function (res) {
              return res.json();
            }).then(function (json) {
              var _loop = function _loop(i) {
                try {
                  var test = json[i].team[1].tag;
                } catch (error) {
                  // This code executes only if the battle was not 2v2
                  // I only log 1v1 battles (no boat battles)
                  var getRealLevel = function getRealLevel(apiLevel, apiMaxLevel) {
                    return 13 - apiMaxLevel + apiLevel;
                  };

                  var pastDate = json[i].battleTime;
                  var battleTime = new Date(Date.UTC(pastDate.substring(0, 4), pastDate.substring(4, 6) - 1, pastDate.substring(6, 8), pastDate.substring(9, 11), pastDate.substring(11, 13), pastDate.substring(13, 15)));
                  var timeDifference = Date.now() - battleTime.getTime();

                  if (timeDifference > 3600000) {
                    return "break|jsonLoop";
                  }

                  if (json[i].type !== "boatBattle") {
                    var addBattle = function addBattle() {
                      var battleExists;
                      return regeneratorRuntime.async(function addBattle$(_context3) {
                        while (1) {
                          switch (_context3.prev = _context3.next) {
                            case 0:
                              _context3.next = 2;
                              return regeneratorRuntime.awrap(Battle.exists({
                                player_tag: json[i].team[0].tag.substring(1),
                                time: battleTime
                              }));

                            case 2:
                              battleExists = _context3.sent;

                              if (!battleExists) {
                                new Battle(toAdd).save().then(function (idea) {//console.log(idea);
                                });
                              }

                            case 4:
                            case "end":
                              return _context3.stop();
                          }
                        }
                      });
                    };

                    var deckUsed = [];
                    var deckFaced = [];
                    var levelDifference = 0;

                    for (var j = 0; j < 8; j++) {
                      deckUsed.push(json[i].team[0].cards[j].name);
                      deckFaced.push(json[i].opponent[0].cards[j].name);
                      levelDifference += getRealLevel(json[i].team[0].cards[j].level, json[i].team[0].cards[j].maxLevel);
                      levelDifference -= getRealLevel(json[i].opponent[0].cards[j].level, json[i].opponent[0].cards[j].maxLevel);
                      ;
                    }

                    levelDifference /= 8;
                    deckUsed.sort();
                    deckFaced.sort();
                    var victor = json[i].team[0].crowns - json[i].opponent[0].crowns;

                    if (victor > 0) {
                      victor = "Victory";
                    } else if (victor < 0) {
                      victor = "Defeat";
                    } else {
                      victor = "Draw";
                    }

                    var toAdd = {
                      player_tag: json[i].team[0].tag.substring(1),
                      deck_used: deckUsed,
                      deck_faced: deckFaced,
                      level_difference: levelDifference,
                      opponent_tag: json[i].opponent[0].tag.substring(1),
                      battle_outcome: victor,
                      time: battleTime,
                      battle_type: json[i].gameMode.name
                    };
                    addBattle();
                  }
                }
              };

              //console.log(json[10]);
              jsonLoop: for (var i = 0; i < json.length; i++) {
                var _ret = _loop(i);

                if (_ret === "break|jsonLoop") break jsonLoop;
              }
            });
            /*.catch((err) => {
              errors.push(err);
            });*/
            //console.log(player);
          });

        case 5:
        case "end":
          return _context4.stop();
      }
    }
  });
};

var doEveryHour = function doEveryHour(something) {
  var running = true;

  var nextHour = function nextHour() {
    return 3600000 - new Date().getTime() % 3600000;
  };

  var nextCall = setTimeout(function () {
    something();
    doEveryHour(something);
  }, nextHour());
  return {
    next: function next() {
      return running ? nextHour() : -1;
    },
    exec: function exec() {
      something();
    },
    stop: function stop() {
      clearTimeout(nextCall);
      running = false;
    },
    start: function start() {
      clearTimeout(nextCall);
      nextCall = setTimeout(function () {
        something();
        doEveryHour(something);
      }, nextHour());
      running = true;
    }
  };
};

var updatingBattleLog = doEveryHour(updateBattleLog);
updatingBattleLog.exec();
var port = 5000;
app.listen(port, function () {
  console.log("Server started on port ".concat(port));
});