"use strict";

var express = require("express");

var exphbs = require("express-handlebars");

var bodyParser = require("body-parser");

var mongoose = require("mongoose");

var fetch = require("node-fetch");

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

require("./models/DeckWinRate");

var DeckWinRate = mongoose.model("DeckWinRate"); // How middleware works

app.use(function (req, res, next) {
  //req.name = "Anish";
  next();
}); // Handlebars Middleware

app.engine("handlebars", exphbs({
  defaultLayout: "main"
}));
app.set("view engine", "handlebars"); // Body Parser Middleware

app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(bodyParser.json()); // Root Index

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
  var playerInfo = [];
  var errors = [];
  var auth = "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiIsImtpZCI6IjI4YTMxOGY3LTAwMDAtYTFlYi03ZmExLTJjNzQzM2M2Y2NhNSJ9.eyJpc3MiOiJzdXBlcmNlbGwiLCJhdWQiOiJzdXBlcmNlbGw6Z2FtZWFwaSIsImp0aSI6ImRiNjM2NzZkLWUwZjUtNGJkNy1hZTlkLTQ4YzYwZmYzZmEwMiIsImlhdCI6MTYwNDU0MDg1Mywic3ViIjoiZGV2ZWxvcGVyLzZmMDliMjM1LWViMDUtMzhjOS04ZTEyLTMxYjViMjJkM2VkNCIsInNjb3BlcyI6WyJyb3lhbGUiXSwibGltaXRzIjpbeyJ0aWVyIjoiZGV2ZWxvcGVyL3NpbHZlciIsInR5cGUiOiJ0aHJvdHRsaW5nIn0seyJjaWRycyI6WyIxODQuMTcwLjE2Ni4xNzciXSwidHlwZSI6ImNsaWVudCJ9XX0.--1G_piVVajh6AR4S_DU2mu7TrIQ7HKx7kf9xLpiWUTjuruJNDMeKv3NAJb4q-cWiRniVKdyKzliEWjSYn2-jA";
  fetch(url1, {
    headers: {
      Accept: "application/json",
      Authorization: auth
    }
  }).then(function (res) {
    return res.json();
  }).then(function (json) {
    playerInfo.push(json);
    console.log("1 " + playerInfo.length);

    if (playerInfo.length === 3) {
      res.send(playerInfo);
    } //res.send(json);

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
    //res.send(json);
    playerInfo.push(json);
    console.log("2 " + playerInfo.length);

    if (playerInfo.length === 3) {
      res.send(playerInfo);
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
    //res.send(json);
    //console.log("here");
    playerInfo.push(json);
    console.log("3 " + playerInfo.length);

    if (playerInfo.length === 3) {
      res.send(playerInfo);
    } //console.log("here1");

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