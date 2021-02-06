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

var app = express(); //Database Configuration

var db = require("./config/database"); // Confidential Info (MongoDB Atlas user and password, CR API Token, etc.)
// When reusing, make sure to use your own stuff
// For obvious reasons, you won't find this file on Github


var confidentialInfo = require("./config/confidentialInfo"); // Use RoyaleAPI proxy in prod
// Use direct API Link in dev


var baseUrl;

if (process.env.NODE_ENV === "production") {
  baseUrl = "https://proxy.royaleapi.dev/";
} else {
  baseUrl = "https://api.clashroyale.com/";
} // Map global Promises


mongoose.Promise = global.Promise; // Mongoose Connection

mongoose.connect(db.mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(function () {
  console.log("Connected");
})["catch"](function (err) {
  console.log("Failure");
  console.log(err);
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

app.use(express["static"]("static_files")); // Global Variables that I declared
// Previous API Token are exposed publicly on my commit history
// However, since I deleted those tokens, they no longer work
// The only working token is hidden since I gitignored the file with the token

var auth = confidentialInfo.CR_API_TOKEN; // Records are deleted after 90 days

var daysToDeletion = 90; // Root Index

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
  var url1 = baseUrl + "v1/players/%23" + tag;
  var url2 = url1 + "/battlelog";
  var url3 = url1 + "/upcomingchests";
  var playerInfo = [0, 0, 0, 0, 0];
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
    checkSend();
  })["catch"](function (err) {
    errors.push(err);
    console.log(err);
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
    checkSend();
  })["catch"](function (err) {
    errors.push(err);
    console.log(err);
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
    checkSend();
  })["catch"](function (err) {
    errors.push(err);
    console.log(err);
  });
  fetch("https://royaleapi.github.io/cr-api-data/json/game_modes.json").then(function (res) {
    return res.json();
  }).then(function (json) {
    playerInfo[3] = json;
    playerInfoLogicalSize++;
    checkSend();
  })["catch"](function (err) {
    errors.push(err);
    console.log(err);
  });
  fetch("https://royaleapi.github.io/cr-api-data/json/cards.json").then(function (res) {
    return res.json();
  }).then(function (json) {
    playerInfo[4] = json;
    playerInfoLogicalSize++;
    checkSend();
  })["catch"](function (err) {
    errors.push(err);
    console.log(err);
  });

  function checkSend() {
    if (playerInfoLogicalSize === 5) {
      if (errors.length > 0) {
        res.send("ERROR");
      }

      if (playerInfo[2].reason) {
        if (playerInfo[2].reason === "notFound") {
          res.render("tagNotFound", {
            tag: tag,
            type: "players"
          });
        } else {
          res.send("Server Error");
        }
      } else {
        res.render("playerInfo", {
          playerStats: playerInfo[0],
          playerBattles: playerInfo[1],
          playerChests: playerInfo[2],
          isTracked: playerIsTracked,
          trackedBattles: trackedBattles,
          gameModeJson: playerInfo[3],
          cardJson: playerInfo[4]
        });
      }
    }
  }
});
app.post("/players/:tag", function (req, res) {
  if ("addPlayer" in req.body) {
    var tag = req.params.tag.toUpperCase();
    var toAdd = {
      player: tag
    };
    new Tracked_Player(toAdd).save().then(function (idea) {
      //console.log(idea);
      res.redirect("/players/" + tag);
    })["catch"](function (err) {
      console.log(err);
    });
  }
});
app.get("/players/:tag/data", function (req, res) {
  var tag = req.params.tag.toUpperCase();
  var url1 = baseUrl + "v1/players/%23" + tag;
  var url2 = url1 + "/battlelog";
  var url3 = url1 + "/upcomingchests";
  var playerInfo = [0, 0, 0, 0];
  var playerInfoLogicalSize = 0;
  var errors = []; // Check if player is being tracked with my system

  (function _callee4() {
    var playerIsTracked;
    return regeneratorRuntime.async(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            _context4.next = 2;
            return regeneratorRuntime.awrap(Tracked_Player.exists({
              player: tag
            }));

          case 2:
            playerIsTracked = _context4.sent;

            if (playerIsTracked) {
              (function _callee3() {
                return regeneratorRuntime.async(function _callee3$(_context3) {
                  while (1) {
                    switch (_context3.prev = _context3.next) {
                      case 0:
                        _context3.next = 2;
                        return regeneratorRuntime.awrap(Battle.find({
                          player_tag: tag
                        }).lean());

                      case 2:
                        playerInfo[3] = _context3.sent;

                      case 3:
                      case "end":
                        return _context3.stop();
                    }
                  }
                });
              })();
            }

          case 4:
          case "end":
            return _context4.stop();
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
    checkSend();
  })["catch"](function (err) {
    errors.push(err);
    console.log(err);
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
    checkSend();
  })["catch"](function (err) {
    errors.push(err);
    console.log(err);
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
    checkSend();
  })["catch"](function (err) {
    errors.push(err);
    console.log(err);
  });

  function checkSend() {
    if (playerInfoLogicalSize === 3) {
      if (errors.length > 0) {
        res.send("ERROR");
      }

      res.send(playerInfo);
    }
  }
});
app.get("/about", function (req, res) {
  res.render("about");
});
app.get("/tos", function (req, res) {
  res.render("tos");
});
app.get("/privacy", function (req, res) {
  res.render("privacy");
});
app.get("/disclaimers", function (req, res) {
  res.render("disclaimers");
});
app.get("/help", function (req, res) {
  res.render("help");
});
app.get("/clans", function (req, res) {
  fetch(baseUrl + "v1/locations", {
    headers: {
      Accept: "application/json",
      Authorization: auth
    }
  }).then(function (res) {
    return res.json();
  }).then(function (json) {
    if (Object.keys(req.query).length === 0) {
      res.render("clans", {
        locations: json,
        results: []
      });
    } else {
      var name = req.query.name;
      var locationId = decodeURIComponent(req.query.locationId);
      var minMembers = req.query.minMembers;
      var maxMembers = req.query.maxMembers;
      var minScore = req.query.minScore;
      var limit = req.query.limit;
      var errors = [];
      var validKeys = ["name", "locationId", "minMembers", "maxMembers", "minScore", "limit"];
      var validSearch = true;

      if (typeof name === "undefined" && locationId === "undefined" && typeof minMembers === "undefined" && typeof maxMembers === "undefined" && typeof minScore === "undefined") {
        errors.push("Must specify at least one filtering parameter (limit does not count)");
      }

      Object.keys(req.query).forEach(function (key, index) {
        if (!validKeys.includes(key)) {
          validSearch = false;
        }
      });

      if (!validSearch) {
        errors.push("Invalid Search Parameters");
      }

      if (typeof name !== "undefined" && name.length < 3) {
        errors.push("Name must be at least three characters long");
      }

      if (typeof locationId !== "undefined" && locationId !== "undefined") {
        var validLocation = false;

        for (var i = 0; i < json.items.length; i++) {
          if (locationId === json.items[i].name) {
            validLocation = true;
            locationId = json.items[i].id;
          }
        }

        if (!validLocation && locationId !== "") {
          errors.push("Entered location is not valid");
        }
      }

      if (typeof minMembers !== "undefined") {
        if (minMembers < 2) {
          errors.push("Minimum members must be at least 2");
        }

        if (minMembers > 50) {
          errors.push("Minimum members must be no more than 50");
        }

        if (!Number.isInteger(Number(minMembers))) {
          errors.push("Minimum members must be an integer");
        }
      }

      if (typeof maxMembers !== "undefined") {
        if (maxMembers < 1) {
          errors.push("Maximum members must be at least 1");
        }

        if (maxMembers > 50) {
          errors.push("Maximum members must be no more than 50");
        }

        if (!Number.isInteger(Number(maxMembers))) {
          errors.push("Maximum members must be an integer");
        }
      }

      if (typeof maxMembers !== "undefined" && typeof minMembers !== "undefined") {
        if (Number(maxMembers) < Number(minMembers)) {
          errors.push("Maximum members must be equal to or greater than minimum members");
        }
      }

      if (typeof minScore !== "undefined") {
        if (minScore < 1) {
          errors.push("Minimum clan score must be at least 1");
        }

        if (!Number.isInteger(Number(minScore))) {
          errors.push("Minimum clan score must be an integer");
        }
      }

      if (typeof limit !== "undefined") {
        if (limit < 0) {
          errors.push("Limit must be at least 0");
        }

        if (!Number.isInteger(Number(limit))) {
          errors.push("Limit must be an integer");
        }
      }

      if (errors.length > 0) {
        res.render("clans", {
          errors: errors,
          locations: json,
          results: []
        });
      } else {
        var url = baseUrl + "v1/clans?";

        if (typeof name !== "undefined") {
          url = url + "&name=" + encodeURIComponent(name);
        }

        if (locationId !== "undefined") {
          url = url + "&locationId=" + locationId;
        }

        if (typeof minMembers !== "undefined") {
          url = url + "&minMembers=" + minMembers;
        }

        if (typeof maxMembers !== "undefined") {
          url = url + "&maxMembers=" + maxMembers;
        }

        if (typeof minScore !== "undefined") {
          url = url + "&minScore=" + minScore;
        }

        if (typeof limit !== "undefined") {
          url = url + "&limit=" + limit;
        } // Remove first "&"


        url = url.replace("&", ""); //console.log(url);

        fetch(url, {
          headers: {
            Accept: "application/json",
            Authorization: auth
          }
        }).then(function (res) {
          return res.json();
        }).then(function (json2) {
          res.render("clans", {
            locations: json,
            results: json2
          });
        })["catch"](function (err) {
          console.log(err);
        });
      }
    }
  })["catch"](function (err) {
    console.log(err);
    res.send("Server Error");
  });
});
app.post("/clans", function (req, res) {
  var errors = [];

  if ("tag" in req.body) {
    // User searched by tag
    var pattern = new RegExp(/[\s~`!@#$%\^&*+=\-\[\]\\';,/{}|\\":<>\?()\._]/);

    if (pattern.test(req.body.tag)) {
      errors.push("Please remove special characters from the tag, including the initial pound (#) sign");
    }

    if (errors.length === 0) {
      res.redirect("/clans/".concat(req.body.tag.toUpperCase()));
    } else {
      fetch(baseUrl + "v1/locations", {
        headers: {
          Accept: "application/json",
          Authorization: auth
        }
      }).then(function (res) {
        return res.json();
      }).then(function (json) {
        res.render("clans", {
          errors: errors,
          locations: json,
          results: []
        });
      });
    }
  } else {
    // User searched by filters
    var name = req.body.name;
    var location = req.body.location;
    var minMembers = req.body.minMembers;
    var maxMembers = req.body.maxMembers;
    var minScore = req.body.minScore;
    var limit = req.body.limit;
    var url2 = "/clans?";

    if (name !== "") {
      url2 = url2 + "&name=" + encodeURIComponent(name);
    }

    if (location !== "") {
      url2 = url2 + "&locationId=" + encodeURIComponent(location);
    }

    if (minMembers !== "") {
      url2 = url2 + "&minMembers=" + minMembers;
    }

    if (maxMembers !== "") {
      url2 = url2 + "&maxMembers=" + maxMembers;
    }

    if (minScore !== "") {
      url2 = url2 + "&minScore=" + minScore;
    }

    if (limit !== "") {
      url2 = url2 + "&limit=" + limit;
    } // Remove first "&"


    url2 = url2.replace("&", "");
    res.redirect(url2);
  }
});
app.get("/clans/:tag", function (req, res) {
  var tag = req.params.tag.toUpperCase();
  var url1 = baseUrl + "v1/clans/%23" + tag;
  var url2 = url1 + "/currentriverrace";
  var url3 = url1 + "/riverracelog";
  var clanInfo = [0, 0, 0];
  var clanInfoLogicalSize = 0;
  var errors = [];
  /*let playerIsTracked;
  let trackedBattles;
  // Check if player is being tracked with my system
  (async function () {
    playerIsTracked = await Tracked_Player.exists({player: tag});
    if (playerIsTracked) {
      (async function () {
        trackedBattles = await Battle.find({player_tag: tag}).lean();
      }) ();
    }
  }) ();*/

  fetch(url1, {
    headers: {
      Accept: "application/json",
      Authorization: auth
    }
  }).then(function (res) {
    return res.json();
  }).then(function (json) {
    clanInfo[0] = json;
    clanInfoLogicalSize++;
    checkSend();
  })["catch"](function (err) {
    errors.push(err);
    console.log(err);
  });
  fetch(url2, {
    headers: {
      Accept: "application/json",
      Authorization: auth
    }
  }).then(function (res) {
    return res.json();
  }).then(function (json) {
    clanInfo[1] = json;
    clanInfoLogicalSize++;
    checkSend();
  })["catch"](function (err) {
    errors.push(err);
    console.log(err);
  });
  fetch(url3, {
    headers: {
      Accept: "application/json",
      Authorization: auth
    }
  }).then(function (res) {
    return res.json();
  }).then(function (json) {
    clanInfo[2] = json;
    clanInfoLogicalSize++;
    checkSend();
  })["catch"](function (err) {
    errors.push(err);
    console.log(err);
  });

  function checkSend() {
    if (clanInfoLogicalSize === 3) {
      if (errors.length > 0) {
        res.send("ERROR");
      }

      if (clanInfo[0].reason === "notFound") {
        res.render("tagNotFound", {
          tag: tag,
          type: "clans"
        });
      } else {
        res.render("clanInfo", {
          clanStats: clanInfo[0],
          currentRiverRace: clanInfo[1],
          riverRaceLog: clanInfo[2]
        });
      }
    }
  }
});
app.get("/clans/:tag/data", function (req, res) {
  var tag = req.params.tag.toUpperCase();
  var url1 = baseUrl + "v1/clans/%23" + tag;
  var url2 = url1 + "/currentriverrace";
  var url3 = url1 + "/riverracelog";
  var clanInfo = [0, 0, 0];
  var clanInfoLogicalSize = 0;
  var errors = [];
  /*let playerIsTracked;
  let trackedBattles;
  // Check if player is being tracked with my system
  (async function () {
    playerIsTracked = await Tracked_Player.exists({player: tag});
    if (playerIsTracked) {
      (async function () {
        trackedBattles = await Battle.find({player_tag: tag}).lean();
      }) ();
    }
  }) ();*/

  fetch(url1, {
    headers: {
      Accept: "application/json",
      Authorization: auth
    }
  }).then(function (res) {
    return res.json();
  }).then(function (json) {
    clanInfo[0] = json;
    clanInfoLogicalSize++;
    checkSend();
  })["catch"](function (err) {
    errors.push(err);
    console.log(err);
  });
  fetch(url2, {
    headers: {
      Accept: "application/json",
      Authorization: auth
    }
  }).then(function (res) {
    return res.json();
  }).then(function (json) {
    clanInfo[1] = json;
    clanInfoLogicalSize++;
    checkSend();
  })["catch"](function (err) {
    errors.push(err);
    console.log(err);
  });
  fetch(url3, {
    headers: {
      Accept: "application/json",
      Authorization: auth
    }
  }).then(function (res) {
    return res.json();
  }).then(function (json) {
    clanInfo[2] = json;
    clanInfoLogicalSize++;
    checkSend();
  })["catch"](function (err) {
    errors.push(err);
    console.log(err);
  });

  function checkSend() {
    if (clanInfoLogicalSize === 3) {
      if (errors.length > 0) {
        res.send("ERROR");
      }

      res.send(clanInfo);
    }
  }
});
app.get("/cards", function (req, res) {
  res.render("construction", {
    page: "Cards"
  });
});
app.get("/guides", function (req, res) {
  res.render("construction", {
    page: "Guides"
  });
}); // This is for 404 errors

app.use(function (req, res, next) {
  res.status(404).send("fail");
}); // This area is where I try to keep track of player battles and update the db every two hours
// The "doEveryHour" code is taken from https://stackoverflow.com/a/58767632
// I'm updating every two hours (not one) to lighten server load
// I also clear old battles every two days

var clearTime = -2;

var updateBattleLog = function updateBattleLog() {
  var players, errors, deletionDate;
  return regeneratorRuntime.async(function updateBattleLog$(_context6) {
    while (1) {
      switch (_context6.prev = _context6.next) {
        case 0:
          clearTime = (clearTime + 2) % 48;
          _context6.next = 3;
          return regeneratorRuntime.awrap(Tracked_Player.find({}, "player -_id").exec());

        case 3:
          players = _context6.sent;
          errors = [];
          players.forEach(function (playerObject) {
            var player = playerObject.player;
            var url = baseUrl + "v1/players/%23" + player + "/battlelog";
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

                  if (timeDifference > 7200000) {
                    return "break|jsonLoop";
                  }

                  if (json[i].type !== "boatBattle") {
                    var addBattle = function addBattle() {
                      var battleExists;
                      return regeneratorRuntime.async(function addBattle$(_context5) {
                        while (1) {
                          switch (_context5.prev = _context5.next) {
                            case 0:
                              _context5.next = 2;
                              return regeneratorRuntime.awrap(Battle.exists({
                                player_tag: json[i].team[0].tag.substring(1),
                                time: battleTime
                              }));

                            case 2:
                              battleExists = _context5.sent;

                              if (!battleExists && json[i].team[0].cards.length === 8) {
                                new Battle(toAdd).save().then(function (idea) {//console.log(idea);
                                });
                              }

                            case 4:
                            case "end":
                              return _context5.stop();
                          }
                        }
                      });
                    };

                    var deckUsed = [];
                    var deckFaced = [];
                    var levelDifference = 0;

                    for (var j = 0; j < 8; j++) {
                      deckUsed.push(json[i].team[0].cards[j].id);
                      deckFaced.push(json[i].opponent[0].cards[j].id);
                      levelDifference += getRealLevel(json[i].team[0].cards[j].level, json[i].team[0].cards[j].maxLevel);
                      levelDifference -= getRealLevel(json[i].opponent[0].cards[j].level, json[i].opponent[0].cards[j].maxLevel);
                      ;
                    }

                    levelDifference /= 8;
                    deckUsed.sort();
                    deckFaced.sort();
                    var victor = json[i].team[0].crowns - json[i].opponent[0].crowns;

                    if (victor > 0) {
                      victor = 1;
                    } else if (victor < 0) {
                      victor = -1;
                    } else {
                      victor = 0;
                    }

                    var toAdd = {
                      player_tag: json[i].team[0].tag.substring(1),
                      deck_used: deckUsed,
                      deck_faced: deckFaced,
                      level_difference: levelDifference,
                      opponent_tag: json[i].opponent[0].tag.substring(1),
                      battle_outcome: victor,
                      time: battleTime,
                      battle_type: json[i].gameMode.id
                    };
                    addBattle();
                  }
                }
              };

              jsonLoop: for (var i = 0; i < json.length; i++) {
                var _ret = _loop(i);

                if (_ret === "break|jsonLoop") break jsonLoop;
              }
            })["catch"](function (err) {
              console.log(err);
            }); //console.log(player);
          });

          if (clearTime === 0) {
            deletionDate = new Date(Date.now() - daysToDeletion * 24 * 60 * 60 * 1000).toISOString();
            Battle.deleteMany({
              time: {
                $lte: deletionDate
              }
            }, function (err, result) {
              if (err) {//console.log(err);
              } else {//console.log(result.deletedCount);
                }
            });
          }

        case 7:
        case "end":
          return _context6.stop();
      }
    }
  });
}; // Name is do every hour, but I've changed it so that it only runs onces every two hours


var doEveryHour = function doEveryHour(something) {
  var running = true;

  var nextHour = function nextHour() {
    return 7200000 - new Date().getTime() % 7200000;
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
var port = process.env.PORT || 5000;
app.listen(port, function () {
  console.log("Server started on port ".concat(port));
});