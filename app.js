const express = require("express");
const exphbs = require("express-handlebars");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const fetch = require("node-fetch")

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

// Handlebars Middleware
app.engine("handlebars", exphbs({
  defaultLayout: "main"
}));
app.set("view engine", "handlebars");

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
  let tag = req.params.tag.toUpperCase();
  let url = "https://api.clashroyale.com/v1/players/%23" + tag;
  fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiIsImtpZCI6IjI4YTMxOGY3LTAwMDAtYTFlYi03ZmExLTJjNzQzM2M2Y2NhNSJ9.eyJpc3MiOiJzdXBlcmNlbGwiLCJhdWQiOiJzdXBlcmNlbGw6Z2FtZWFwaSIsImp0aSI6ImRiNjM2NzZkLWUwZjUtNGJkNy1hZTlkLTQ4YzYwZmYzZmEwMiIsImlhdCI6MTYwNDU0MDg1Mywic3ViIjoiZGV2ZWxvcGVyLzZmMDliMjM1LWViMDUtMzhjOS04ZTEyLTMxYjViMjJkM2VkNCIsInNjb3BlcyI6WyJyb3lhbGUiXSwibGltaXRzIjpbeyJ0aWVyIjoiZGV2ZWxvcGVyL3NpbHZlciIsInR5cGUiOiJ0aHJvdHRsaW5nIn0seyJjaWRycyI6WyIxODQuMTcwLjE2Ni4xNzciXSwidHlwZSI6ImNsaWVudCJ9XX0.--1G_piVVajh6AR4S_DU2mu7TrIQ7HKx7kf9xLpiWUTjuruJNDMeKv3NAJb4q-cWiRniVKdyKzliEWjSYn2-jA"
    }
  })
    .then(res => res.json())
    .then((json) => {
      res.send(json);
    })
    .catch((err) => {
      res.send(err);
    });
});

const port = 5000;

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});