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

var compression = require("compression");

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

var Tracked_Player = mongoose.model("Tracked_Player"); // Compression middleware

app.use(compression()); // How middleware works

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
  var path = [{
    "href": "/",
    "name": "Home"
  }];
  res.render("index", {
    path: path
  });
}); // Players Page

app.get("/players", function (req, res) {
  var path = [{
    "href": "/",
    "name": "Home"
  }, {
    "href": "/players",
    "name": "Players"
  }];
  res.render("players", {
    path: path
  });
});
app.post("/players", function (req, res) {
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
});
app.get("/players/:tag", function (req, res) {
  res.redirect("/players/".concat(req.params.tag.toUpperCase(), "/general"));
});
app.get("/players/:tag/all", function (req, res) {
  var tag = req.params.tag.toUpperCase();
  var url1 = baseUrl + "v1/players/%23" + tag;
  var url2 = url1 + "/battlelog";
  var url3 = url1 + "/upcomingchests";
  var path = [{
    "href": "/",
    "name": "Home"
  }, {
    "href": "/players",
    "name": "Players"
  }, {
    "href": "/players/".concat(tag),
    "name": "#" + tag
  }, {
    "href": "/players/".concat(tag, "/all"),
    "name": "All"
  }];
  var playerInfo = [0, 0, 0, 0, 0];
  var playerInfoLogicalSize = 0;
  var errors = [];
  var playerIsTracked;
  var trackedBattles; // Check if player is being tracked with my system

  (function _callee() {
    return regeneratorRuntime.async(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return regeneratorRuntime.awrap(Tracked_Player.exists({
              player: tag
            }));

          case 2:
            playerIsTracked = _context.sent;

            if (!playerIsTracked) {
              _context.next = 7;
              break;
            }

            _context.next = 6;
            return regeneratorRuntime.awrap(Battle.find({
              player_tag: tag
            }).lean());

          case 6:
            trackedBattles = _context.sent;

          case 7:
          case "end":
            return _context.stop();
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
        // This area means that something is off with the JSON response
        handleErrors(res, path, "Player #".concat(tag, " | All"), playerInfo[2]);
      } else {
        res.render("playerInfo", {
          path: path,
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
app.post("/players/:tag/all", function (req, res) {
  if ("addPlayer" in req.body) {
    var tag = req.params.tag.toUpperCase();
    var toAdd = {
      player: tag
    };
    new Tracked_Player(toAdd).save().then(function (idea) {
      //console.log(idea);
      res.redirect("/players/" + tag + "/all");
    })["catch"](function (err) {
      console.log(err);
    });
  }
});
app.get("/players/:tag/general", function (req, res) {
  var tag = req.params.tag.toUpperCase();
  var url = baseUrl + "v1/players/%23" + tag;
  var path = [{
    "href": "/",
    "name": "Home"
  }, {
    "href": "/players",
    "name": "Players"
  }, {
    "href": "/players/".concat(tag),
    "name": "#" + tag
  }, {
    "href": "/players/".concat(tag, "/general"),
    "name": "General"
  }];
  fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: auth
    }
  }).then(function (res) {
    return res.json();
  }).then(function (json) {
    if (json.reason) {
      handleErrors(res, path, "Player #".concat(tag, " | General"), json);
    } else {
      res.render("playerInfoGeneral", {
        path: path,
        playerStats: json
      });
    }
  })["catch"](function (err) {
    console.log(err);
  });
});
app.get("/players/:tag/battles", function (req, res) {
  var tag = req.params.tag.toUpperCase();
  var url1 = baseUrl + "v1/players/%23" + tag + "/battlelog"; // url2 is only used to discern between player tags without any battles and player tags that do not exist

  var url2 = baseUrl + "v1/players/%23" + tag + "/upcomingchests";
  var path = [{
    "href": "/",
    "name": "Home"
  }, {
    "href": "/players",
    "name": "Players"
  }, {
    "href": "/players/".concat(tag),
    "name": "#" + tag
  }, {
    "href": "/players/".concat(tag, "/battles"),
    "name": "Battles"
  }];
  var toSend = [0, 0, 0];
  var toSendLogicalSize = 0;
  var errors = [];
  fetch(url1, {
    headers: {
      Accept: "application/json",
      Authorization: auth
    }
  }).then(function (res) {
    return res.json();
  }).then(function (json) {
    toSend[0] = json;
    toSendLogicalSize++;
    checkSend();
  })["catch"](function (err) {
    errors.push(err);
    console.log(err);
  });
  fetch("https://royaleapi.github.io/cr-api-data/json/game_modes.json").then(function (res) {
    return res.json();
  }).then(function (json) {
    toSend[1] = json;
    toSendLogicalSize++;
    checkSend();
  })["catch"](function (err) {
    errors.push(err);
    console.log(err);
  });
  fetch("https://royaleapi.github.io/cr-api-data/json/cards.json").then(function (res) {
    return res.json();
  }).then(function (json) {
    toSend[2] = json;
    toSendLogicalSize++;
    checkSend();
  })["catch"](function (err) {
    errors.push(err);
    console.log(err);
  });

  function checkSend() {
    if (toSendLogicalSize === 3) {
      if (errors.length > 0) {
        res.send("ERROR");
      }

      if (toSend[0].reason) {
        handleErrors(res, path, "Player #".concat(tag, " | Battles"), toSend[0]);
      } else {
        if (toSend[0].length === 0) {
          fetch(url2, {
            headers: {
              Accept: "application/json",
              Authorization: auth
            }
          }).then(function (res) {
            return res.json();
          }).then(function (json) {
            if (json.reason) {
              handleErrors(res, path, "Player #".concat(tag, " | Battles"), json);
            } else {
              res.render("playerInfoBattles", {
                tag: "#" + req.params.tag.toUpperCase(),
                playerBattles: toSend[0],
                gameModeJson: toSend[1],
                cardJson: toSend[2]
              });
            }
          })["catch"](function (err) {
            errors.push(err);
            console.log(err);
          });
        } else {
          res.render("playerInfoBattles", {
            path: path,
            tag: "#" + req.params.tag.toUpperCase(),
            playerBattles: toSend[0],
            gameModeJson: toSend[1],
            cardJson: toSend[2]
          });
        }
      }
    }
  }
});
app.get("/players/:tag/cards", function (req, res) {
  var tag = req.params.tag.toUpperCase();
  var url = baseUrl + "v1/players/%23" + tag; // Final href is not used, but I put it in there for consistency

  var path = [{
    "href": "/",
    "name": "Home"
  }, {
    "href": "/players",
    "name": "Players"
  }, {
    "href": "/players/".concat(tag),
    "name": "#" + tag
  }, {
    "href": "/players/".concat(tag, "/cards"),
    "name": "Cards"
  }];
  fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: auth
    }
  }).then(function (res) {
    return res.json();
  }).then(function (json) {
    if (json.reason) {
      handleErrors(res, path, "Player #".concat(tag, " | Cards"), json);
    } else {
      res.render("playerInfoCards", {
        path: path,
        playerStats: json
      });
    }
  })["catch"](function (err) {
    console.log(err);
  });
});
app.get("/players/:tag/chests", function (req, res) {
  var tag = req.params.tag.toUpperCase();
  var url = baseUrl + "v1/players/%23" + tag + "/upcomingchests";
  var path = [{
    "href": "/",
    "name": "Home"
  }, {
    "href": "/players",
    "name": "Players"
  }, {
    "href": "/players/".concat(tag),
    "name": "#" + tag
  }, {
    "href": "/players/".concat(tag, "/chests"),
    "name": "Chests"
  }];
  fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: auth
    }
  }).then(function (res) {
    return res.json();
  }).then(function (json) {
    if (json.reason) {
      handleErrors(res, path, "Player #".concat(tag, " | Chests"), json);
    } else {
      res.render("playerInfoChests", {
        path: path,
        playerChests: json,
        tag: "#" + tag
      });
    }
  })["catch"](function (err) {
    console.log(err);
  });
});
app.get("/players/:tag/analysis", function (req, res) {
  var tag = req.params.tag.toUpperCase();
  var url = baseUrl + "v1/players/%23" + tag + "/upcomingchests";
  var path = [{
    "href": "/",
    "name": "Home"
  }, {
    "href": "/players",
    "name": "Players"
  }, {
    "href": "/players/".concat(tag),
    "name": "#" + tag
  }, {
    "href": "/players/".concat(tag, "/analysis"),
    "name": "Analysis"
  }];
  var toSend = [0, 0, 0, 0, 0];
  var toSendLogicalSize = 0;
  var errors = []; // I send a request for chests just to see if the player tag is valid

  fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: auth
    }
  }).then(function (res) {
    return res.json();
  }).then(function (json) {
    toSend[0] = json;
    toSendLogicalSize++;
    checkSend();
  })["catch"](function (err) {
    console.log(err);
    errors.push(err);
  });
  fetch("https://royaleapi.github.io/cr-api-data/json/game_modes.json").then(function (res) {
    return res.json();
  }).then(function (json) {
    toSend[1] = json;
    toSendLogicalSize++;
    checkSend();
  })["catch"](function (err) {
    errors.push(err);
    console.log(err);
  });
  fetch("https://royaleapi.github.io/cr-api-data/json/cards.json").then(function (res) {
    return res.json();
  }).then(function (json) {
    toSend[2] = json;
    toSendLogicalSize++;
    checkSend();
  })["catch"](function (err) {
    errors.push(err);
    console.log(err);
  }); // Check if player is being tracked with my system

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
            toSend[3] = _context2.sent;
            toSendLogicalSize++;

            if (!toSend[3]) {
              _context2.next = 11;
              break;
            }

            _context2.next = 7;
            return regeneratorRuntime.awrap(Battle.find({
              player_tag: tag
            }).lean());

          case 7:
            toSend[4] = _context2.sent;
            toSendLogicalSize++;
            _context2.next = 12;
            break;

          case 11:
            toSendLogicalSize++;

          case 12:
            checkSend();

          case 13:
          case "end":
            return _context2.stop();
        }
      }
    });
  })();

  function checkSend() {
    if (toSendLogicalSize === 5) {
      if (errors.length > 0) {
        res.send("ERROR");
      }

      if (toSend[0].reason) {
        handleErrors(res, path, "Player #".concat(tag), toSend[0]);
      } else {
        res.render("playerInfoAnalysis", {
          path: path,
          tag: "#" + tag,
          gameModeJson: toSend[1],
          cardJson: toSend[2],
          isTracked: toSend[3],
          trackedBattles: toSend[4]
        });
      }
    }
  }
});
app.post("/players/:tag/analysis", function (req, res) {
  if ("addPlayer" in req.body) {
    var tag = req.params.tag.toUpperCase();
    var toAdd = {
      player: tag
    };
    new Tracked_Player(toAdd).save().then(function (idea) {
      //console.log(idea);
      res.redirect("/players/" + tag + "/analysis");
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
  var path = [{
    "href": "/",
    "name": "Home"
  }, {
    "href": "/about",
    "name": "About"
  }];
  res.render("about", {
    path: path
  });
});
app.get("/tos", function (req, res) {
  var path = [{
    "href": "/",
    "name": "Home"
  }, {
    "href": "/tos",
    "name": "Terms of Service"
  }];
  res.render("tos", {
    path: path
  });
});
app.get("/privacy", function (req, res) {
  var path = [{
    "href": "/",
    "name": "Home"
  }, {
    "href": "/privacy",
    "name": "Privacy Policy"
  }];
  res.render("privacy", {
    path: path
  });
});
app.get("/disclaimers", function (req, res) {
  var path = [{
    "href": "/",
    "name": "Home"
  }, {
    "href": "/disclaimers",
    "name": "Disclaimers"
  }];
  res.render("disclaimers", {
    path: path
  });
});
app.get("/help", function (req, res) {
  var path = [{
    "href": "/",
    "name": "Home"
  }, {
    "href": "/help",
    "name": "Help"
  }];
  res.render("help", {
    path: path
  });
});
app.get("/clans", function (req, res) {
  var path = [{
    "href": "/",
    "name": "Home"
  }, {
    "href": "/clans",
    "name": "Clans"
  }];
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
        path: path,
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
            path: path,
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
  res.redirect("/clans/".concat(req.params.tag.toUpperCase(), "/description"));
});
app.get("/clans/:tag/all", function (req, res) {
  var tag = req.params.tag.toUpperCase();
  var url1 = baseUrl + "v1/clans/%23" + tag;
  var url2 = url1 + "/currentriverrace";
  var url3 = url1 + "/riverracelog";
  var path = [{
    "href": "/",
    "name": "Home"
  }, {
    "href": "/clans",
    "name": "Clans"
  }, {
    "href": "/clans/".concat(tag),
    "name": "#" + tag
  }, {
    "href": "/clans/".concat(tag, "/all"),
    "name": "All"
  }];
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

      if (clanInfo[0].reason) {
        handleErrors(res, path, "Clan #".concat(tag, " | All"), clanInfo[0]);
      } else {
        res.render("clanInfo", {
          path: path,
          clanStats: clanInfo[0],
          currentRiverRace: clanInfo[1],
          riverRaceLog: clanInfo[2]
        });
      }
    }
  }
});
app.get("/clans/:tag/description", function (req, res) {
  var tag = req.params.tag.toUpperCase();
  var url = baseUrl + "v1/clans/%23" + tag;
  var path = [{
    "href": "/",
    "name": "Home"
  }, {
    "href": "/clans",
    "name": "Clans"
  }, {
    "href": "/clans/".concat(tag),
    "name": "#" + tag
  }, {
    "href": "/clans/".concat(tag, "/description"),
    "name": "Description"
  }];
  fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: auth
    }
  }).then(function (res) {
    return res.json();
  }).then(function (json) {
    if (json.reason) {
      handleErrors(res, path, "Clan #".concat(tag, " | Description"), json);
    } else {
      res.render("clanInfoDescription", {
        path: path,
        clanStats: json
      });
    }
  })["catch"](function (err) {
    console.log(err);
  });
});
app.get("/clans/:tag/members", function (req, res) {
  var tag = req.params.tag.toUpperCase();
  var url = baseUrl + "v1/clans/%23" + tag;
  var path = [{
    "href": "/",
    "name": "Home"
  }, {
    "href": "/clans",
    "name": "Clans"
  }, {
    "href": "/clans/".concat(tag),
    "name": "#" + tag
  }, {
    "href": "/clans/".concat(tag, "/description"),
    "name": "Members"
  }];
  fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: auth
    }
  }).then(function (res) {
    return res.json();
  }).then(function (json) {
    if (json.reason) {
      handleErrors(res, path, "Clan #".concat(tag, " | Members"), json);
    } else {
      res.render("clanInfoMembers", {
        path: path,
        clanStats: json
      });
    }
  })["catch"](function (err) {
    console.log(err);
  });
});
app.get("/clans/:tag/war", function (req, res) {
  // I don't use clanInfoWar.handlebars
  // I've kept this here just in case

  /*res.render("clanInfoWar", {
    tag: "#" + req.params.tag.toUpperCase()
  });*/
  res.redirect("/clans/".concat(req.params.tag.toUpperCase(), "/war/race"));
});
app.get("/clans/:tag/war/race", function (req, res) {
  var tag = req.params.tag.toUpperCase();
  var url = baseUrl + "v1/clans/%23" + tag + "/currentriverrace";
  var path = [{
    "href": "/",
    "name": "Home"
  }, {
    "href": "/clans",
    "name": "Clans"
  }, {
    "href": "/clans/".concat(tag),
    "name": "#" + tag
  }, {
    "href": "/clans/".concat(tag, "/war"),
    "name": "War"
  }, {
    "href": "/clans/".concat(tag, "/war/race"),
    "name": "Race"
  }];
  fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: auth
    }
  }).then(function (res) {
    return res.json();
  }).then(function (json) {
    if (json.reason) {
      handleErrors(res, path, "Clan #".concat(tag, " | Race"), json);
    } else {
      res.render("clanInfoWarRace", {
        path: path,
        currentRiverRace: json,
        tag: "#" + tag
      });
    }
  })["catch"](function (err) {
    console.log(err);
  });
});
app.get("/clans/:tag/war/log", function (req, res) {
  res.redirect("/clans/".concat(req.params.tag.toUpperCase(), "/war/log/1"));
});
app.get("/clans/:tag/war/log/:num", function (req, res) {
  var tag = req.params.tag.toUpperCase();
  var num = parseInt(req.params.num);
  var url = baseUrl + "v1/clans/%23" + tag + "/riverracelog";
  var path = [{
    "href": "/",
    "name": "Home"
  }, {
    "href": "/clans",
    "name": "Clans"
  }, {
    "href": "/clans/".concat(tag),
    "name": "#" + tag
  }, {
    "href": "/clans/".concat(tag, "/war"),
    "name": "War"
  }, {
    "href": "/clans/".concat(tag, "/war/log"),
    "name": "Log"
  }, {
    "href": "/clans/".concat(tag, "/war/log/").concat(req.params.num),
    "name": req.params.num
  }];

  if (num !== parseFloat(req.params.num.toUpperCase()) || isNaN(num)) {
    handleErrors(res, path, "Clan #".concat(tag, " | Log"), {
      "reason": "Invalid Log",
      "message": "The requested log number for clan #".concat(tag, " is invalid")
    });
  } else {
    fetch(url, {
      headers: {
        Accept: "application/json",
        Authorization: auth
      }
    }).then(function (res) {
      return res.json();
    }).then(function (json) {
      if (json.reason) {
        handleErrors(res, path, "Clan #".concat(tag, " | Log"), json);
      } else {
        if (num <= 0 || num > json.items.length) {
          if (num === 1) {
            // Clan has no river log
            handleErrors(res, path, "Clan #".concat(tag, " | Log"), {
              "reason": "No Log",
              "message": "The requested clan #".concat(tag, " has no log")
            });
          } else {
            handleErrors(res, path, "Clan #".concat(tag, " | Log"), {
              "reason": "Invalid Log",
              "message": "The requested log number for clan #".concat(tag, " is invalid")
            });
          }
        } else {
          var season, week;

          for (var i = 0; i < json.items.length; i++) {
            if (i + 1 === num) {
              season = json.items[i].seasonId;
              week = json.items[i].sectionIndex + 1;
              break;
            }
          }

          res.render("clanInfoWarLog", {
            path: path,
            riverRaceLog: json,
            tag: "#" + tag,
            index: num - 1,
            season: season,
            week: week
          });
        }
      }
    })["catch"](function (err) {
      console.log(err);
    });
  }
});
app.get("/clans/:tag/war/insights", function (req, res) {
  var tag = req.params.tag.toUpperCase();
  var url = baseUrl + "v1/clans/%23" + tag + "/riverracelog";
  var path = [{
    "href": "/",
    "name": "Home"
  }, {
    "href": "/clans",
    "name": "Clans"
  }, {
    "href": "/clans/".concat(tag),
    "name": "#" + tag
  }, {
    "href": "/clans/".concat(tag, "/war"),
    "name": "War"
  }, {
    "href": "/clans/".concat(tag, "/war/insights"),
    "name": "Insights"
  }];
  fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: auth
    }
  }).then(function (res) {
    return res.json();
  }).then(function (json) {
    if (json.reason) {
      handleErrors(res, path, "Clan #".concat(tag, " | Insights"), json);
    } else {
      res.render("clanInfoWarInsights", {
        path: path,
        tag: "#" + tag,
        riverRaceLog: json
      });
    }
  })["catch"](function (err) {
    console.log(err);
  });
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
  // This path is under construction
  var path = [{
    "href": "/",
    "name": "Home"
  }, {
    "href": "/cards",
    "name": "Cards"
  }];
  handleErrors(res, path, "Cards", {
    "reason": "construction"
  });
});
app.get("/guides", function (req, res) {
  // This path is under construction
  var path = [{
    "href": "/",
    "name": "Home"
  }, {
    "href": "/guides",
    "name": "Guides"
  }];
  handleErrors(res, path, "Guides", {
    "reason": "construction"
  });
});
app.get("/tournaments", function (req, res) {
  var url = baseUrl + "v1/locations/global/rankings/players";
  fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: auth
    }
  }).then(function (res) {
    return res.json();
  }).then(function (json) {
    res.send(json);
  })["catch"](function (err) {
    console.log(err);
  });
}); // This is for 404 errors

app.use(function (req, res) {
  var urlPath = req.url.split("/");
  urlPath.shift();
  var path = [{
    "href": "/",
    "name": "Home"
  }];

  for (var i = 0; i < urlPath.length; i++) {
    var curUrl = "/";
    var name = urlPath[i].charAt(0).toUpperCase() + urlPath[i].substring(1);

    for (var j = 0; j <= i; j++) {
      curUrl = curUrl + urlPath[j] + "/";
    }

    path.push({
      "href": curUrl,
      "name": name
    });
  }

  res.status(404);
  handleErrors(res, path, "404", {
    "reason": "notFound"
  });
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

function handleErrors(res, path, title, object) {
  switch (object.reason) {
    // Clash Royale API error for an invalid tag
    case "notFound":
      {
        sendError(res, path, "".concat(title, " | NOT FOUND"), "The requested resource could not be found");
        break;
      }
    // My own error for pages I have not yet completed

    case "construction":
      {
        sendError(res, path, "".concat(title, " | UNDER CONSTRUCTION"), "This page is currently under construction");
        break;
      }
    // Any other uncaught errors

    default:
      {
        var message = "The request was unable to be completed.\nReason --> ".concat(object.reason, ".");

        if (object.message) {
          message += "\nMessage --> ".concat(object.message, ".");
        }

        sendError(res, path, "".concat(title, " | ").concat(object.reason), message);
      }
  }
}

function sendError(res, path, title, message) {
  res.render("error", {
    path: path,
    title: title,
    message: message
  });
}

var updatingBattleLog = doEveryHour(updateBattleLog);
updatingBattleLog.exec();
var port = process.env.PORT || 5000;
app.listen(port, function () {
  console.log("Server started on port ".concat(port));
});