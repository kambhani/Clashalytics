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


var baseUrl = process.env.NODE_ENV === "production" ? "https://proxy.royaleapi.dev/" : "https://api.clashroyale.com/"; // Store cardJson, gameModeJson, and locations in global variables
// They are updated every two hours

var cardJson;
var gameModeJson;
var locations;
var clanBadgeJson;
var seasons; // Map global Promises

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

var auth = confidentialInfo.CR_API_TOKEN; // Records are deleted after 60 days

var daysToDeletion = 60; // Root Index

app.get("/", function (req, res) {
  var path = [{
    "href": "/",
    "name": "Home"
  }];
  res.render("index", {
    path: path,
    title: "Home",
    rawData: ""
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
    path: path,
    title: "Player Search",
    rawData: ""
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
  var title = "Player #".concat(tag, " | All");
  var playerInfo = [0, 0, 0];
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
    playerInfoLogicalSize++;
    checkSend();
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
    playerInfoLogicalSize++;
    checkSend();
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
    playerInfoLogicalSize++;
    checkSend();
  });

  function checkSend() {
    if (playerInfoLogicalSize === 3) {
      if (errors.length > 0) {
        var message = "";

        for (var i = 0; i < errors.length; i++) {
          message += errors[i] + "\n";
        }

        handleErrors(res, path, title, {
          reason: "Error",
          message: message
        });
      } else if (playerInfo[2].reason) {
        // This area means that something is off with the JSON response
        handleErrors(res, path, title, playerInfo[2]);
      } else {
        res.render("playerInfo", {
          path: path,
          playerStats: playerInfo[0],
          playerBattles: playerInfo[1],
          playerChests: playerInfo[2],
          isTracked: playerIsTracked,
          trackedBattles: trackedBattles,
          gameModeJson: gameModeJson,
          cardJson: cardJson,
          title: title,
          rawData: "/players/".concat(tag, "/data")
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
      handleErrors(res, path, "Player #".concat(tag, " | ALL"), {
        reason: "Error",
        message: err
      });
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
  var title = "Player #".concat(tag, " | General");
  fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: auth
    }
  }).then(function (res) {
    return res.json();
  }).then(function (json) {
    if (json.reason) {
      handleErrors(res, path, title, json);
    } else {
      res.render("playerInfoGeneral", {
        path: path,
        playerStats: json,
        title: title,
        rawData: "/players/".concat(tag, "/data")
      });
    }
  })["catch"](function (err) {
    handleErrors(res, path, title, {
      reason: "Error",
      message: err
    });
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
  var title = "Player #".concat(tag, " | Battles");
  fetch(url1, {
    headers: {
      Accept: "application/json",
      Authorization: auth
    }
  }).then(function (res) {
    return res.json();
  }).then(function (json) {
    if (json.reason) {
      handleErrors(res, path, title, json);
    } else if (json.length === 0) {
      // Fetching player chests since that endpoint shows whether or not the player tag exists
      fetch(url2, {
        headers: {
          Accept: "application/json",
          Authorization: auth
        }
      }).then(function (res) {
        return res.json();
      }).then(function (json2) {
        if (json2.reason) {
          handleErrors(res, path, "Player #".concat(tag, " | Battles"), json2);
        } else {
          res.render("playerInfoBattles", {
            tag: "#" + req.params.tag.toUpperCase(),
            playerBattles: json,
            gameModeJson: gameModeJson,
            cardJson: cardJson,
            title: title,
            rawData: "/players/".concat(tag, "/data")
          });
        }
      })["catch"](function (err) {
        handleErrors(res, path, title, {
          reason: "Error",
          message: err
        });
      });
    } else {
      res.render("playerInfoBattles", {
        path: path,
        tag: "#" + req.params.tag.toUpperCase(),
        playerBattles: json,
        gameModeJson: gameModeJson,
        cardJson: cardJson,
        title: title,
        rawData: "/players/".concat(tag, "/data")
      });
    }
  })["catch"](function (err) {
    handleErrors(res, path, title, {
      reason: "Error",
      message: err
    });
  });
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
  var title = "Player #".concat(tag, " | Cards");
  fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: auth
    }
  }).then(function (res) {
    return res.json();
  }).then(function (json) {
    if (json.reason) {
      handleErrors(res, path, title, json);
    } else {
      res.render("playerInfoCards", {
        path: path,
        playerStats: json,
        title: title,
        rawData: "/players/".concat(tag, "/data")
      });
    }
  })["catch"](function (err) {
    handleErrors(res, path, title, {
      reason: "Error",
      message: err
    });
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
  var title = "Player #".concat(tag, " | Chests");
  fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: auth
    }
  }).then(function (res) {
    return res.json();
  }).then(function (json) {
    if (json.reason) {
      handleErrors(res, path, title, json);
    } else {
      res.render("playerInfoChests", {
        path: path,
        playerChests: json,
        tag: "#" + tag,
        title: title,
        rawData: "/players/".concat(tag, "/data")
      });
    }
  })["catch"](function (err) {
    handleErrors(res, path, title, {
      reason: "Error",
      message: err
    });
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
  var title = "Player #".concat(tag, " | Analysis");
  var toSend = [0, 0, 0];
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
    errors.push(err);
    toSendLogicalSize++;
    checkSend();
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
            toSend[1] = _context2.sent;
            toSendLogicalSize++;

            if (!toSend[1]) {
              _context2.next = 11;
              break;
            }

            _context2.next = 7;
            return regeneratorRuntime.awrap(Battle.find({
              player_tag: tag
            }).lean());

          case 7:
            toSend[2] = _context2.sent;
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
    if (toSendLogicalSize === 3) {
      if (errors.length > 0) {
        var message = "";

        for (var i = 0; i < errors.length; i++) {
          message += errors[i] + "\n";
        }

        handleErrors(res, path, title, {
          reason: "Error",
          message: message
        });
      } else if (toSend[0].reason) {
        handleErrors(res, path, title, toSend[0]);
      } else {
        res.render("playerInfoAnalysis", {
          path: path,
          tag: "#" + tag,
          gameModeJson: gameModeJson,
          cardJson: cardJson,
          isTracked: toSend[1],
          trackedBattles: toSend[2],
          title: title,
          rawData: "/players/".concat(tag, "/data")
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
      handleErrors(res, path, "Player #".concat(tag, " | Analysis"), {
        reason: "Error",
        message: err
      });
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
    playerInfoLogicalSize++;
    checkSend();
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
    playerInfoLogicalSize++;
    checkSend();
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
    playerInfoLogicalSize++;
    checkSend();
  });

  function checkSend() {
    if (playerInfoLogicalSize === 3) {
      if (errors.length > 0) {
        res.send(errors);
      } else {
        res.send(playerInfo);
      }
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
    path: path,
    title: "About",
    rawData: ""
  });
});
app.get("/termsofservice", function (req, res) {
  res.redirect("/tos");
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
    path: path,
    title: "Terms of Service",
    rawData: ""
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
    path: path,
    title: "Privacy Policy",
    rawData: ""
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
    path: path,
    title: "Disclaimers",
    rawData: ""
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
    path: path,
    title: "Help",
    rawData: ""
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
  var title = "Clans";

  if (Object.keys(req.query).length === 0) {
    res.render("clans", {
      path: path,
      locations: locations,
      results: [],
      title: title,
      rawData: ""
    });
  } else {
    // Initializing relevant variables
    var name = req.query.name;
    var locationId = decodeURIComponent(req.query.locationId);
    var minMembers = req.query.minMembers;
    var maxMembers = req.query.maxMembers;
    var minScore = req.query.minScore;
    var limit = req.query.limit;
    var errors = [];
    var validKeys = ["name", "locationId", "minMembers", "maxMembers", "minScore", "limit"];
    var validSearch = true; // Checks to make sure that the search is valid

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

      for (var i = 0; i < locations.items.length; i++) {
        if (locationId === locations.items[i].name) {
          validLocation = true;
          locationId = locations.items[i].id;
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
    } // If search request was invalid, show that to the user
    // Otherwise, complete the search


    if (errors.length > 0) {
      res.render("clans", {
        path: path,
        errors: errors,
        locations: json,
        results: [],
        title: title,
        rawData: ""
      });
    } else {
      // Encode search parameters
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


      url = url.replace("&", ""); // Send request to API

      fetch(url, {
        headers: {
          Accept: "application/json",
          Authorization: auth
        }
      }).then(function (res) {
        return res.json();
      }).then(function (json) {
        res.render("clans", {
          path: path,
          locations: locations,
          results: json,
          clanBadgeJson: clanBadgeJson,
          title: title,
          rawData: ""
        });
      })["catch"](function (err) {
        handleErrors(res, path, title, {
          reason: "Error",
          message: err
        });
      });
    }
  }
});
app.post("/clans", function (req, res) {
  var path = [{
    "href": "/",
    "name": "Home"
  }, {
    "href": "/clans",
    "name": "Clans"
  }];
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
          path: path,
          errors: errors,
          locations: json,
          results: []
        });
      })["catch"](function (err) {
        handleErrors(res, path, "Clans", {
          reason: "Error",
          message: err
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
  var title = "Clan #".concat(tag, " | All");
  var clanInfo = [0, 0, 0];
  var clanInfoLogicalSize = 0;
  var errors = [];
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
    clanInfoLogicalSize++;
    checkSend();
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
    clanInfoLogicalSize++;
    checkSend();
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
    clanInfoLogicalSize++;
    checkSend();
  });

  function checkSend() {
    if (clanInfoLogicalSize === 3) {
      if (errors.length > 0) {
        var message = "";

        for (var i = 0; i < errors.length; i++) {
          message += errors[i] + "\n";
        }

        handleErrors(res, path, title, {
          reason: "Error",
          message: message
        });
      } else if (clanInfo[0].reason) {
        handleErrors(res, path, title, clanInfo[0]);
      } else {
        res.render("clanInfo", {
          path: path,
          clanStats: clanInfo[0],
          currentRiverRace: clanInfo[1],
          riverRaceLog: clanInfo[2],
          clanBadgeJson: clanBadgeJson,
          title: title,
          rawData: "/clans/".concat(tag, "/data")
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
  var title = "Clan #".concat(tag, " | Description");
  fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: auth
    }
  }).then(function (res) {
    return res.json();
  }).then(function (json) {
    if (json.reason) {
      handleErrors(res, path, title, json);
    } else {
      res.render("clanInfoDescription", {
        path: path,
        clanStats: json,
        clanBadgeJson: clanBadgeJson,
        title: title,
        rawData: "/clans/".concat(tag, "/data")
      });
    }
  })["catch"](function (err) {
    handleErrors(res, path, title, {
      reason: "Error",
      message: err
    });
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
    "href": "/clans/".concat(tag, "/members"),
    "name": "Members"
  }];
  var title = "Clan #".concat(tag, " | Members");
  fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: auth
    }
  }).then(function (res) {
    return res.json();
  }).then(function (json) {
    if (json.reason) {
      handleErrors(res, path, title, json);
    } else {
      res.render("clanInfoMembers", {
        path: path,
        clanStats: json,
        title: title,
        rawData: "/clans/".concat(tag, "/data")
      });
    }
  })["catch"](function (err) {
    handleErrors(res, path, title, {
      reason: "Error",
      message: err
    });
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
  var title = "Clan #".concat(tag, " | Current River Race");
  fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: auth
    }
  }).then(function (res) {
    return res.json();
  }).then(function (json) {
    if (json.reason) {
      handleErrors(res, path, title, json);
    } else {
      res.render("clanInfoWarRace", {
        path: path,
        currentRiverRace: json,
        tag: "#" + tag,
        clanBadgeJson: clanBadgeJson,
        title: title,
        rawData: "/clans/".concat(tag, "/data")
      });
    }
  })["catch"](function (err) {
    handleErrors(res, path, title, {
      reason: "Error",
      message: err
    });
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
  var title = "Clan #".concat(tag, " | War Log");

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
        handleErrors(res, path, title, json);
      } else {
        if (num <= 0 || num > json.items.length) {
          if (num === 1) {
            // Clan has no river log
            handleErrors(res, path, title, {
              "reason": "No Log",
              "message": "The requested clan #".concat(tag, " has no log")
            });
          } else {
            handleErrors(res, path, title, {
              "reason": "Invalid Log",
              "message": "The requested log number for clan #".concat(tag, " is invalid")
            });
          }
        } else {
          var season = json.items[num - 1].seasonId;
          var week = json.items[num - 1].sectionIndex + 1;
          res.render("clanInfoWarLog", {
            path: path,
            riverRaceLog: json,
            tag: "#" + tag,
            index: num - 1,
            season: season,
            week: week,
            clanBadgeJson: clanBadgeJson,
            title: "".concat(title, " | S").concat(season, " W").concat(week),
            rawData: "/clans/".concat(tag, "/data")
          });
        }
      }
    })["catch"](function (err) {
      handleErrors(res, path, title, {
        reason: "Error",
        message: err
      });
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
  var title = "Clan #".concat(tag, " | War Insights");
  fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: auth
    }
  }).then(function (res) {
    return res.json();
  }).then(function (json) {
    if (json.reason) {
      handleErrors(res, path, title, json);
    } else {
      res.render("clanInfoWarInsights", {
        path: path,
        tag: "#" + tag,
        riverRaceLog: json,
        title: title,
        rawData: "/clans/".concat(tag, "/data")
      });
    }
  })["catch"](function (err) {
    handleErrors(res, path, title, {
      reason: "Error",
      message: err
    });
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
    clanInfoLogicalSize++;
    checkSend();
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
    clanInfoLogicalSize++;
    checkSend();
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
    clanInfoLogicalSize++;
    checkSend();
  });

  function checkSend() {
    if (clanInfoLogicalSize === 3) {
      if (errors.length > 0) {
        res.send(errors);
      } else {
        res.send(clanInfo);
      }
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
  var path = [{
    "href": "/",
    "name": "Home"
  }, {
    "href": "/tournaments",
    "name": "Tournaments"
  }];
  var title = "Tournaments";
  var errors = [];

  if (Object.keys(req.query).length === 0) {
    res.render("tournaments", {
      path: path,
      title: title,
      rawData: ""
    });
  } else {
    var name = req.query.name; // Only valid search parameter is by name

    Object.keys(req.query).forEach(function (key, index) {
      if (key !== "name") {
        errors.push("Invalid search parameters");
      }
    });

    if (typeof name !== "undefined" && name.length < 3) {
      errors.push("Name must be at least three characters long");
    }

    if (errors.length > 0) {
      res.render("tournaments", {
        path: path,
        errors: errors,
        title: title,
        rawData: ""
      });
    } else {
      var url = baseUrl + "v1/tournaments?name=" + name;
      fetch(url, {
        headers: {
          Accept: "application/json",
          Authorization: auth
        }
      }).then(function (res) {
        return res.json();
      }).then(function (json) {
        res.render("tournaments", {
          path: path,
          results: json,
          gameModeJson: gameModeJson,
          title: title,
          rawData: ""
        });
      })["catch"](function (err) {
        handleErrors(res, path, title, {
          reason: "Error",
          message: err
        });
      });
    }
  }
});
app.post("/tournaments", function (req, res) {
  var path = [{
    "href": "/",
    "name": "Home"
  }, {
    "href": "/tournaments",
    "name": "Tournaments"
  }];
  var errors = [];

  if ("tag" in req.body) {
    // User searched by tag
    var pattern = new RegExp(/[\s~`!@#$%\^&*+=\-\[\]\\';,/{}|\\":<>\?()\._]/);

    if (pattern.test(req.body.tag)) {
      errors.push("Please remove special characters from the tag, including the initial pound (#) sign");
    }

    if (errors.length === 0) {
      res.redirect("/tournaments/".concat(req.body.tag.toUpperCase()));
    } else {
      res.render("tournaments", {
        path: path,
        errors: errors,
        title: title,
        rawData: ""
      });
    }
  } else if ("name" in req.body) {
    // User searched by name
    res.redirect("/tournaments?name=".concat(req.body.name));
  }
}); // gt is the abbreviation for global tournament
// This comes before '/tournaments/:tag'
// Otherwise, gt would be interpreted as a tag

app.get("/tournaments/gt", function (req, res) {
  var path = [{
    "href": "/",
    "name": "Home"
  }, {
    "href": "/tournaments",
    "name": "Tournaments"
  }, {
    "href": "/tournaments/gt",
    "name": "Global Tournaments"
  }];
  var title = "Global Tournaments";
  fetch(baseUrl + "v1/globaltournaments", {
    headers: {
      Accept: "application/json",
      Authorization: auth
    }
  }).then(function (res) {
    return res.json();
  }).then(function (json) {
    if (json.reason) {
      handleErrors(res, path, title, json);
    } else {
      res.render("gt", {
        path: path,
        gtInfo: json,
        gameModeJson: gameModeJson,
        title: title,
        rawData: "/tournaments/gt/data"
      });
    }
  })["catch"](function (err) {
    handleErrors(res, path, title, {
      reason: "Error",
      message: err
    });
  });
}); // Sends JSON object for use in gt.handlebars

app.get("/tournaments/gt/:tag/leaderboard", function (req, res) {
  var tag = req.params.tag.toUpperCase();
  fetch("".concat(baseUrl, "v1/locations/global/rankings/tournaments/%23").concat(tag), {
    headers: {
      Accept: "application/json",
      Authorization: auth
    }
  }).then(function (res) {
    return res.json();
  }).then(function (json) {
    if (json.reason) {
      res.send("Error");
    } else if (json.items.length === 0) {
      res.send("Empty");
    } else {
      res.render("gtLeaderboard", {
        leaderboardInfo: json,
        clanBadgeJson: clanBadgeJson,
        layout: false
      });
    }
  })["catch"](function (err) {
    res.send("Error");
  });
}); // Redirect for users who try to enter this manually

app.get("/tournaments/globaltournaments", function (req, res) {
  res.redirect("/tournaments/gt");
});
app.get("/tournaments/:tag", function (req, res) {
  var tag = req.params.tag.toUpperCase();
  var url = baseUrl + "v1/tournaments/%23" + tag;
  var path = [{
    "href": "/",
    "name": "Home"
  }, {
    "href": "/tournaments",
    "name": "Tournaments"
  }, {
    "href": "/tournaments/".concat(tag),
    "name": "#" + tag
  }];
  var title = "Tournament #".concat(tag);
  fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: auth
    }
  }).then(function (res) {
    return res.json();
  }).then(function (json) {
    if (json.reason) {
      handleErrors(res, path, "Tournament #".concat(tag), json);
    } else {
      res.render("tournamentInfo", {
        path: path,
        tournamentStats: json,
        gameModeJson: gameModeJson,
        clanBadgeJson: clanBadgeJson,
        title: title,
        rawData: "/tournaments/".concat(tag, "/data")
      });
    }
  })["catch"](function (err) {
    handleErrors(res, path, "Tournament #".concat(tag), {
      reason: "Error",
      message: err
    });
  });
});
app.get("/tournaments/gt/data", function (req, res) {
  fetch(baseUrl + "v1/globaltournaments", {
    headers: {
      Accept: "application/json",
      Authorization: auth
    }
  }).then(function (res) {
    return res.json();
  }).then(function (json) {
    res.send(json);
  })["catch"](function (err) {
    res.send(err);
  });
});
app.get("/tournaments/:tag/data", function (req, res) {
  var tag = req.params.tag.toUpperCase();
  var url = baseUrl + "v1/tournaments/%23" + tag;
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
    res.send(err);
  });
});
app.get("/emotes", function (req, res) {
  var path = [{
    "href": "/",
    "name": "Home"
  }, {
    "href": "/emotes",
    "name": "Emotes"
  }];
  res.render("emotes", {
    path: path,
    title: "Emotes",
    rawData: ""
  });
});
app.get("/emotes/:id", function (req, res) {
  var id = req.params.id;
  var path = [{
    "href": "/",
    "name": "Home"
  }, {
    "href": "/emotes",
    "name": "Emotes"
  }, {
    "href": "/emotes/".concat(id),
    "name": id
  }]; // The final condition is constantly changing as new emotes are added into the game
  // Update this value frequently
  // I just lazily set the value to 400

  if (isNaN(parseInt(id)) || parseInt(id) !== parseFloat(id) || id < 1 || id > 400) {
    handleErrors(res, path, "Emote #".concat(id), {
      reason: "Error",
      message: "Requested emote ID is not valid"
    });
  } else {
    res.render("emoteInfo", {
      path: path,
      emoteId: id,
      title: "Emote #".concat(id),
      rawData: ""
    });
  }
});
app.get("/leaderboards", function (req, res) {
  var path = [{
    "href": "/",
    "name": "Home"
  }, {
    "href": "/leaderboards",
    "name": "Leaderboards"
  }];
  res.render("leaderboards", {
    path: path,
    title: "Leaderboards",
    rawData: "",
    locations: locations,
    seasons: seasons
  });
}); // These three are similar, so they run under the same route handler
// clans and clanwars do not have past history, so I just check for that

app.get(["/leaderboards/players", "/leaderboards/clans", "/leaderboards/clanwars"], function (req, res) {
  var leaderboardType = "";
  var lbTypeName = "";
  var renderTemplate = "";

  if (req.path.includes("players")) {
    leaderboardType = "players";
    lbTypeName = "Players";
    renderTemplate = "leaderboardPlayers";
  } else if (req.path.includes("clans")) {
    leaderboardType = "clans";
    lbTypeName = "Clans";
    renderTemplate = "leaderboardClans";
  } else {
    leaderboardType = "clanwars";
    lbTypeName = "Clan Wars";
    renderTemplate = "leaderboardClans";
  }

  var path = [{
    "href": "/",
    "name": "Home"
  }, {
    "href": "/leaderboards",
    "name": "Leaderboards"
  }, {
    "href": "/leaderboards/".concat(leaderboardType),
    "name": lbTypeName
  }];
  var title = lbTypeName + " Leaderboard"; // This sets the number of results to show
  // Country leaderboards return 1,000 results and season leaderboards return 10,000 results
  // Too many returned results will cause poor performance, so I set the results returned to 500

  var resultsDisplayed = 500;
  var errors = [];

  if (Object.keys(req.query).length === 0) {
    res.redirect("/leaderboards/".concat(leaderboardType, "?region=GLOBAL"));
  } else {
    if (Object.keys(req.query).length > 1) {
      errors.push("Only one query parameter should be specified");
    }

    Object.keys(req.query).forEach(function (key, index) {
      if (leaderboardType === "players") {
        // season is a valid query
        if (key !== "region" && key !== "season") {
          errors.push("Invalid query parameter '".concat(key, "' \u2014 only valid parameters are region and season"));
        }
      } else {
        // season is not a valid query
        if (key !== "region") {
          errors.push("Invalid query parameter '".concat(key, "' \u2014 only valid parameter is region"));
        }
      }
    });
    var region = req.query.region;
    var season = req.query.season;

    regionIf: if (typeof region !== "undefined" && region !== "GLOBAL") {
      if (leaderboardType === "players") {
        // Non-countries like International, North America, etc. are not allowed
        for (var i = 0; i < locations.items.length; i++) {
          if (locations.items[i].isCountry && region === locations.items[i].countryCode) {
            region = locations.items[i].id;
            break regionIf;
          }
        }
      } else {
        // Non-countries like Intenational, North America, etc. are allowed
        // This switch takes care of the non-countries
        switch (region) {
          case "_INTL":
            {
              region = "International";
              break;
            }

          case "_AFR":
            {
              region = "Africa";
              break;
            }

          case "_ASIA":
            {
              region = "Asia";
              break;
            }

          case "_NA":
            {
              region = "North America";
              break;
            }

          case "_OCEA":
            {
              region = "Oceania";
              break;
            }

          case "_SA":
            {
              region = "South America";
              break;
            }
        }

        for (var _i = 0; _i < locations.items.length; _i++) {
          if (region === locations.items[_i].name || locations.items[_i].isCountry && region === locations.items[_i].countryCode) {
            region = locations.items[_i].id;
            break regionIf;
          }
        }
      }

      if (typeof region !== "number") {
        // Region was invalid because otherwise, it would have become an id
        errors.push("Region code not recognized");
      }
    }

    seasonIf: if (typeof season !== "undefined") {
      for (var _i2 = 0; _i2 < seasons.items.length; _i2++) {
        if (season === seasons.items[_i2].id) {
          break seasonIf;
        }
      } // Season ID was not found


      errors.push("Season ID not recognized");
    }

    if (errors.length > 0) {
      res.render(renderTemplate, {
        path: path,
        title: title,
        errors: errors,
        leaderboardType: leaderboardType,
        locations: locations,
        seasons: seasons
      });
    } else {
      if (typeof region !== "undefined") {
        // Query was region
        endUrl = region === "GLOBAL" ? "v1/locations/global/rankings/".concat(leaderboardType) : "v1/locations/".concat(region, "/rankings/").concat(leaderboardType);
        fetch(baseUrl + endUrl, {
          headers: {
            Accept: "application/json",
            Authorization: auth
          }
        }).then(function (res) {
          return res.json();
        }).then(function (json) {
          if (json.reason) {
            handleErrors(res, path, title, json);
          } else {
            res.render(renderTemplate, {
              path: path,
              title: title,
              leaderboard: json,
              clanBadgeJson: clanBadgeJson,
              locations: locations,
              seasons: seasons,
              rawData: "",
              resultsDisplayed: resultsDisplayed,
              leaderboardType: leaderboardType
            });
          }
        })["catch"](function (err) {
          handleErrors(res, path, title, {
            reason: "Error",
            message: err
          });
        });
      } else {
        // Query was season
        fetch("".concat(baseUrl, "v1/locations/global/seasons/").concat(season, "/rankings/").concat(leaderboardType), {
          headers: {
            Accept: "application/json",
            Authorization: auth
          }
        }).then(function (res) {
          return res.json();
        }).then(function (json) {
          if (json.reason) {
            handleErrors(res, path, title, json);
          } else {
            res.render(renderTemplate, {
              path: path,
              title: title,
              leaderboard: json,
              clanBadgeJson: clanBadgeJson,
              locations: locations,
              seasons: seasons,
              rawData: "",
              resultsDisplayed: resultsDisplayed,
              leaderboardType: leaderboardType
            });
          }
        })["catch"](function (err) {
          handleErrors(res, path, title, {
            reason: "Error",
            message: err
          });
        });
      }
    }
  }
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
// cardJson and gameModeJson are also updated here

var clearTime = -2;

var performAsyncTasks = function performAsyncTasks() {
  var players, errors, deletionDate;
  return regeneratorRuntime.async(function performAsyncTasks$(_context6) {
    while (1) {
      switch (_context6.prev = _context6.next) {
        case 0:
          // Update clearTime
          clearTime = (clearTime + 2) % 48; // Update cardJson

          fetch("https://royaleapi.github.io/cr-api-data/json/cards.json").then(function (res) {
            return res.json();
          }).then(function (json) {
            cardJson = json;
          })["catch"](function (err) {
            // Do something better
            console.log(err);
          }); // Update gameModeJson

          fetch("https://royaleapi.github.io/cr-api-data/json/game_modes.json").then(function (res) {
            return res.json();
          }).then(function (json) {
            gameModeJson = json;
          })["catch"](function (err) {
            // Do something better
            console.log(err);
          }); // Update locations

          fetch(baseUrl + "v1/locations", {
            headers: {
              Accept: "application/json",
              Authorization: auth
            }
          }).then(function (res) {
            return res.json();
          }).then(function (json) {
            locations = json;
          })["catch"](function (err) {
            // Do something better
            console.log(err);
          }); // Update clan badges

          fetch("https://royaleapi.github.io/cr-api-data/json/alliance_badges.json").then(function (res) {
            return res.json();
          }).then(function (json) {
            clanBadgeJson = json;
          })["catch"](function (err) {
            // Do something better
            console.log(err);
          }); // Update seasons

          fetch(baseUrl + "v1/locations/global/seasons", {
            headers: {
              Accept: "application/json",
              Authorization: auth
            }
          }).then(function (res) {
            return res.json();
          }).then(function (json) {
            seasons = json;
          })["catch"](function (err) {
            // Do something better
            console.log(err);
          }); // Update player logs

          _context6.next = 8;
          return regeneratorRuntime.awrap(Tracked_Player.find({}, "player -_id").exec());

        case 8:
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
            });
          }); // Delete old records

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

        case 12:
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

var updatingBattleLog = doEveryHour(performAsyncTasks);
updatingBattleLog.exec();
var port = process.env.PORT || 5000;
app.listen(port, function () {
  console.log("Server started on port ".concat(port));
});