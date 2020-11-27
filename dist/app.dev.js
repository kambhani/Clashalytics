"use strict";

var express = require("express");

var exphbs = require("express-handlebars");

var bodyParser = require("body-parser");

var mongoose = require("mongoose");

var fetch = require("node-fetch");

var Handlebars = require("handlebars");

var serveStatic = require("serve-static");

var app = express(); // Map global Promises

mongoose.Promise = global.Promise; // Mongoose Connection

mongoose.connect("mongodb://localhost/clashalytics-dev", {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(function () {
  console.log("Connected");
})["catch"](function (err) {
  console.log("Failure");
}); // Load Deck Win Rate Model

require("./models/Battles");

var Battles = mongoose.model("Battles"); // How middleware works

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

app.use(express["static"]("static_files")); // Root Index

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
  var auth = "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiIsImtpZCI6IjI4YTMxOGY3LTAwMDAtYTFlYi03ZmExLTJjNzQzM2M2Y2NhNSJ9.eyJpc3MiOiJzdXBlcmNlbGwiLCJhdWQiOiJzdXBlcmNlbGw6Z2FtZWFwaSIsImp0aSI6IjFhMDI4NjAzLWY2OTUtNGUxMC04N2MxLTc1ZjFmMGZkMzUwMiIsImlhdCI6MTYwNjE1NTY5Miwic3ViIjoiZGV2ZWxvcGVyLzZmMDliMjM1LWViMDUtMzhjOS04ZTEyLTMxYjViMjJkM2VkNCIsInNjb3BlcyI6WyJyb3lhbGUiXSwibGltaXRzIjpbeyJ0aWVyIjoiZGV2ZWxvcGVyL3NpbHZlciIsInR5cGUiOiJ0aHJvdHRsaW5nIn0seyJjaWRycyI6WyIxODQuMTcwLjE2Ni4xNzMiXSwidHlwZSI6ImNsaWVudCJ9XX0.itwXBlkJmcVuB3dZm-FPXrHMNgpy5o75t9mJZha3Sn8rFpObsj2YTXZLlX5IkCQ7r_LoRm-SkTz2mXBwrPcbLQ";
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
      if (playerInfo[2].reason) {
        res.render("playerNotFound", {
          tag: tag
        });
      } else {
        res.render("playerInfo", {
          playerStats: playerInfo[0],
          playerBattles: playerInfo[1],
          playerChests: playerInfo[2]
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
      if (playerInfo[2].reason) {
        res.render("playerNotFound", {
          tag: tag
        });
      } else {
        res.render("playerInfo", {
          playerStats: playerInfo[0],
          playerBattles: playerInfo[1],
          playerChests: playerInfo[2]
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
      if (playerInfo[2].reason) {
        res.render("playerNotFound", {
          tag: tag
        });
      } else {
        res.render("playerInfo", {
          playerStats: playerInfo[0],
          playerBattles: playerInfo[1],
          playerChests: playerInfo[2]
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
var port = 5000;
app.listen(port, function () {
  console.log("Server started on port ".concat(port));
});