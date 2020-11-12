const express = require("express");
const exphbs = require("express-handlebars");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const fetch = require("node-fetch")
const Handlebars = require("handlebars");

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

// Load Deck Win Rate Model
require("./models/DeckWinRate");
const DeckWinRate = mongoose.model("DeckWinRate")

// How middleware works
app.use((req, res, next) => {
  //req.name = "Anish";
  next();
});

// Handlebars Middleware and Custom Helpers
app.engine("handlebars", exphbs({
  defaultLayout: "main"
}));
app.set("view engine", "handlebars");

Handlebars.registerHelper("removeFirstCharacter", function (text) {
  return text.substring(1);
});

Handlebars.registerHelper("compare", function(a, comparator, b) {
  switch(comparator) {
    case "<":
      if (a < b) {
        return true;
      } else {
        return false;
      }
  }
});

Handlebars.registerHelper("calculateCardLevel", function(oldLevel, oldMaxLevel) {
  return (13 - oldMaxLevel + oldLevel);
});

Handlebars.registerHelper("dateDifference", function(pastDate) {
  // Date is processed like it is given in the Clash Royale API
  // The format is: YYYYMMDDTHHMMSS.000Z
  let oldDate = new Date(pastDate.substring(0, 4), pastDate.substring(4, 6) - 1, pastDate.substring(6, 8), pastDate.substring(9, 11),pastDate.substring(11, 13), pastDate.substring(13, 15));
  //console.log(pastDate);
  let newDate = Date.now();
  return (oldDate);
});

// Body Parser Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Root Index
app.get("/", (req, res) => {
  const title = "Welcome!"
  res.render("index", {
    title: title
  });
});

// Players Page
app.get("/players", (req, res) => {
  console.log(req.originalUrl);
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
  /*if (tag.charAt(0) === '#') {
    const withoutHashtag = req.params.tag.substring(1);
    app.redirect(`/players/${withoutHashtag}`);
    console.log(1);
  }*/
  const url1 = "https://api.clashroyale.com/v1/players/%23" + tag;
  const url2 = url1 + "/battlelog";
  const url3 = url1 + "/upcomingchests";
  //let playerInfo = [];
  let playerInfo = [0, 0, 0];
  let playerInfoLogicalSize = 0;
  let errors = [];
  const auth = "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiIsImtpZCI6IjI4YTMxOGY3LTAwMDAtYTFlYi03ZmExLTJjNzQzM2M2Y2NhNSJ9.eyJpc3MiOiJzdXBlcmNlbGwiLCJhdWQiOiJzdXBlcmNlbGw6Z2FtZWFwaSIsImp0aSI6ImRiNjM2NzZkLWUwZjUtNGJkNy1hZTlkLTQ4YzYwZmYzZmEwMiIsImlhdCI6MTYwNDU0MDg1Mywic3ViIjoiZGV2ZWxvcGVyLzZmMDliMjM1LWViMDUtMzhjOS04ZTEyLTMxYjViMjJkM2VkNCIsInNjb3BlcyI6WyJyb3lhbGUiXSwibGltaXRzIjpbeyJ0aWVyIjoiZGV2ZWxvcGVyL3NpbHZlciIsInR5cGUiOiJ0aHJvdHRsaW5nIn0seyJjaWRycyI6WyIxODQuMTcwLjE2Ni4xNzciXSwidHlwZSI6ImNsaWVudCJ9XX0.--1G_piVVajh6AR4S_DU2mu7TrIQ7HKx7kf9xLpiWUTjuruJNDMeKv3NAJb4q-cWiRniVKdyKzliEWjSYn2-jA";

  fetch(url1, {
    headers: {
      Accept: "application/json",
      Authorization: auth
    }
  })
    .then(res => res.json())
    .then((json) => {
      //playerInfo.push(json);
      playerInfo[0] = json;
      playerInfoLogicalSize++;
      //console.log("1 " + playerInfo.length);
      if (playerInfoLogicalSize === 3) {
        res.render("playerInfo", {
          playerStats: playerInfo[0],
          playerBattles: playerInfo[1],
          playerChests: playerInfo[2]
        });
        //res.send(playerInfo);
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
      //res.send(json);
      //playerInfo.push(json);
      playerInfo[1] = json;
      playerInfoLogicalSize++;
      //console.log("2 " + playerInfo.length);
      //res.send(playerInfo);
      if (playerInfoLogicalSize === 3) {
        res.render("playerInfo", {
          playerStats: playerInfo[0],
          playerBattles: playerInfo[1],
          playerChests: playerInfo[2]
        });
        //res.send(playerInfo);
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
      //res.send(json);
      //console.log("here");
      //playerInfo.push(json);
      playerInfo[2] = json;
      playerInfoLogicalSize++;
      //console.log("3 " + playerInfo.length);
      if (playerInfoLogicalSize === 3) {
        res.render("playerInfo", {
          playerStats: playerInfo[0],
          playerBattles: playerInfo[1],
          playerChests: playerInfo[2]
        });
        //res.send(playerInfo);
      }
      //console.log("here1");
    })
    .catch((err) => {
      errors.push(err);
    });

  if(errors.length > 0) {
    res.send("ERROR");
  }
});

const port = 5000;

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});