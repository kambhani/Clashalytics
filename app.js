const express = require("express");
const exphbs = require("express-handlebars");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const fetch = require("node-fetch")
const Handlebars = require("handlebars");
const serveStatic = require("serve-static");


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
require("./models/Battles");
const Battles = mongoose.model("Battles");

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
  const auth = "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiIsImtpZCI6IjI4YTMxOGY3LTAwMDAtYTFlYi03ZmExLTJjNzQzM2M2Y2NhNSJ9.eyJpc3MiOiJzdXBlcmNlbGwiLCJhdWQiOiJzdXBlcmNlbGw6Z2FtZWFwaSIsImp0aSI6IjFhMDI4NjAzLWY2OTUtNGUxMC04N2MxLTc1ZjFmMGZkMzUwMiIsImlhdCI6MTYwNjE1NTY5Miwic3ViIjoiZGV2ZWxvcGVyLzZmMDliMjM1LWViMDUtMzhjOS04ZTEyLTMxYjViMjJkM2VkNCIsInNjb3BlcyI6WyJyb3lhbGUiXSwibGltaXRzIjpbeyJ0aWVyIjoiZGV2ZWxvcGVyL3NpbHZlciIsInR5cGUiOiJ0aHJvdHRsaW5nIn0seyJjaWRycyI6WyIxODQuMTcwLjE2Ni4xNzMiXSwidHlwZSI6ImNsaWVudCJ9XX0.itwXBlkJmcVuB3dZm-FPXrHMNgpy5o75t9mJZha3Sn8rFpObsj2YTXZLlX5IkCQ7r_LoRm-SkTz2mXBwrPcbLQ";

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
            playerChests: playerInfo[2]
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
          res.render("playerInfo", {
            playerStats: playerInfo[0],
            playerBattles: playerInfo[1],
            playerChests: playerInfo[2]
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
            playerChests: playerInfo[2]
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

const port = 5000;

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});