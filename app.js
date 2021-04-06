const express = require("express");
const exphbs = require("express-handlebars");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const fetch = require("node-fetch")
const Handlebars = require("handlebars");
const serveStatic = require("serve-static");
const { template } = require("handlebars");
const compression = require("compression");

const app = express();

//Database Configuration
const db = require("./config/database");

// Confidential Info (MongoDB Atlas user and password, CR API Token, etc.)
// When reusing, make sure to use your own stuff
// For obvious reasons, you won't find this file on Github
const confidentialInfo = require("./config/confidentialInfo");

// Use RoyaleAPI proxy in prod
// Use direct API Link in dev
let baseUrl = (process.env.NODE_ENV === "production") ? "https://proxy.royaleapi.dev" : "https://api.clashroyale.com/";

// Store cardJson, gameModeJson, and locations in global variables
// They are updated every two hours
let cardJson;
let gameModeJson;
let locations;
let clanBadgeJson;
let seasons;

// Map global Promises
mongoose.Promise = global.Promise;

// Mongoose Connection
mongoose.connect(db.mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => {
    console.log("Connected");
  })
  .catch((err) => {
    console.log("Failure");
    console.log(err);
  });

// Load MongoDB Models
require("./models/Battle");
const Battle = mongoose.model("Battle");
require("./models/Tracked_Player");
const Tracked_Player = mongoose.model("Tracked_Player");

// Compression middleware
app.use(compression());

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

// Global Variables that I declared
// Previous API Token are exposed publicly on my commit history
// However, since I deleted those tokens, they no longer work
// The only working token is hidden since I gitignored the file with the token
const auth = confidentialInfo.CR_API_TOKEN;

// Records are deleted after 90 days
const daysToDeletion = 90;

// Root Index
app.get("/", (req, res) => {
  const path = [
    {
      "href": "/",
      "name": "Home"
    }
  ];
  res.render("index", {
    path: path,
    title: "Home",
    rawData: ""
  });
});

// Players Page
app.get("/players", (req, res) => {
  const path = [
    {
      "href": "/",
      "name": "Home"
    },
    {
      "href": "/players",
      "name": "Players"
    }
  ]
  res.render("players", {
    path: path,
    title: "Player Search",
    rawData: ""
  });
});

app.post("/players", (req, res) => {
  let errors = [];
  if (!req.body.tag) {
    errors.push({text: "Please enter a tag"});
  } else {
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

app.get("/players/:tag", (req, res) => {
  res.redirect(`/players/${req.params.tag.toUpperCase()}/general`);
});

app.get("/players/:tag/all", (req, res) => {
  const tag = req.params.tag.toUpperCase();
  const url1 = baseUrl + "v1/players/%23" + tag;
  const url2 = url1 + "/battlelog";
  const url3 = url1 + "/upcomingchests";
  const path = [
    {
      "href": "/",
      "name": "Home"
    },
    {
      "href": "/players",
      "name": "Players"
    },
    {
      "href": `/players/${tag}`,
      "name": "#" + tag
    },
    {
      "href": `/players/${tag}/all`,
      "name": "All"
    }
  ];
  const title = `Player #${tag} | All`;

  let playerInfo = [0, 0, 0];
  let playerInfoLogicalSize = 0;
  let errors = [];
  let playerIsTracked;
  let trackedBattles;

  // Check if player is being tracked with my system
  (async function () {
    playerIsTracked = await Tracked_Player.exists({player: tag});
    if (playerIsTracked) {
        trackedBattles = await Battle.find({player_tag: tag}).lean();
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
      checkSend();
    })
    .catch((err) => {
      errors.push(err);
      playerInfoLogicalSize++;
      checkSend();
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
      checkSend();
    })
    .catch((err) => {
      errors.push(err);
      playerInfoLogicalSize++;
      checkSend();
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
      checkSend();
    })
    .catch((err) => {
      errors.push(err);
      playerInfoLogicalSize++;
      checkSend();
    });

  function checkSend () {
    if (playerInfoLogicalSize === 3) {
      if(errors.length > 0) {
        let message = "";
        for (let i = 0; i < errors.length; i++) {
          message += errors[i] + "\n";
        }
        handleErrors(res, path, title, {reason: "Error", message: message});
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
          rawData: `/players/${tag}/data`
        });
      }
    }
  }
});


app.post("/players/:tag/all", (req, res) => {
  if ("addPlayer" in req.body) {
    const tag = req.params.tag.toUpperCase();
    const toAdd = {
      player: tag
    }
    new Tracked_Player(toAdd)
      .save()
      .then(idea => {
        //console.log(idea);
        res.redirect("/players/" + tag + "/all");
      })
      .catch((err) => {
        handleErrors(res, path, `Player #${tag} | ALL`, {reason: "Error", message: err});
      });
  }
});

app.get("/players/:tag/general", (req, res) => {
  const tag = req.params.tag.toUpperCase();
  const url = baseUrl + "v1/players/%23" + tag;
  const path = [
    {
      "href": "/",
      "name": "Home"
    },
    {
      "href": "/players",
      "name": "Players"
    },
    {
      "href": `/players/${tag}`,
      "name": "#" + tag
    },
    {
      "href": `/players/${tag}/general`,
      "name": "General"
    }
  ];
  const title = `Player #${tag} | General`;

  fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: auth
    }
  })
    .then(res => res.json())
    .then((json) => {
      if (json.reason) {
        handleErrors(res, path, title, json);
      } else {
        res.render("playerInfoGeneral", {
          path: path,
          playerStats: json,
          title: title,
          rawData: `/players/${tag}/data`
        });
      }
    })
    .catch((err) => {
      handleErrors(res, path, title, {reason: "Error", message: err});
    });
});

app.get("/players/:tag/battles", (req, res) => {
  const tag = req.params.tag.toUpperCase();
  const url1 = baseUrl + "v1/players/%23" + tag + "/battlelog";
  // url2 is only used to discern between player tags without any battles and player tags that do not exist
  const url2 = baseUrl + "v1/players/%23" + tag + "/upcomingchests";
  const path = [
    {
      "href": "/",
      "name": "Home"
    },
    {
      "href": "/players",
      "name": "Players"
    },
    {
      "href": `/players/${tag}`,
      "name": "#" + tag
    },
    {
      "href": `/players/${tag}/battles`,
      "name": "Battles"
    }
  ];
  const title = `Player #${tag} | Battles`;

  fetch(url1, {
    headers: {
      Accept: "application/json",
      Authorization: auth
    }
  })
    .then(res => res.json())
    .then((json) => {
      if (json.reason) {
        handleErrors(res, path, title, json);
      } else if (json.length === 0) {
        // Fetching player chests since that endpoint shows whether or not the player tag exists
        fetch(url2, {
          headers: {
            Accept: "application/json",
            Authorization: auth
          }
        })
          .then(res => res.json())
          .then((json2) => {
            if (json2.reason) {
              handleErrors(res, path, `Player #${tag} | Battles`, json2);
            } else {
              res.render("playerInfoBattles", {
                tag: "#" + req.params.tag.toUpperCase(),
                playerBattles: json,
                gameModeJson: gameModeJson,
                cardJson: cardJson,
                title: title,
                rawData: `/players/${tag}/data`
              });
            }
          })
          .catch((err) => {
            handleErrors(res, path, title, {reason: "Error", message: err});
          });
      } else {
        res.render("playerInfoBattles", {
          path: path,
          tag: "#" + req.params.tag.toUpperCase(),
          playerBattles: json,
          gameModeJson: gameModeJson,
          cardJson: cardJson,
          title: title,
          rawData: `/players/${tag}/data`
        });
      }
    })
    .catch((err) => {
      handleErrors(res, path, title, {reason: "Error", message: err});
    });
});

app.get("/players/:tag/cards", (req, res) => {
  const tag = req.params.tag.toUpperCase();
  const url = baseUrl + "v1/players/%23" + tag;
  // Final href is not used, but I put it in there for consistency
  const path = [
    {
      "href": "/",
      "name": "Home"
    },
    {
      "href": "/players",
      "name": "Players"
    },
    {
      "href": `/players/${tag}`,
      "name": "#" + tag
    },
    {
      "href": `/players/${tag}/cards`,
      "name": "Cards"
    }
  ];
  const title = `Player #${tag} | Cards`;

  fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: auth
    }
  })
    .then(res => res.json())
    .then((json) => {
      if (json.reason) {
        handleErrors(res, path, title, json);
      } else {
        res.render("playerInfoCards", {
          path: path,
          playerStats: json,
          title: title,
          rawData: `/players/${tag}/data`
        });
      }
    })
    .catch((err) => {
      handleErrors(res, path, title, {reason: "Error", message: err});
    });
});

app.get("/players/:tag/chests", (req, res) => {
  const tag = req.params.tag.toUpperCase();
  const url = baseUrl + "v1/players/%23" + tag + "/upcomingchests";
  const path = [
    {
      "href": "/",
      "name": "Home"
    },
    {
      "href": "/players",
      "name": "Players"
    },
    {
      "href": `/players/${tag}`,
      "name": "#" + tag
    },
    {
      "href": `/players/${tag}/chests`,
      "name": "Chests"
    }
  ];
  const title = `Player #${tag} | Chests`;

  fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: auth
    }
  })
    .then(res => res.json())
    .then((json) => {
      if (json.reason) {
        handleErrors(res, path, title, json);
      } else {
        res.render("playerInfoChests", {
          path: path,
          playerChests: json,
          tag: "#" + tag,
          title: title,
          rawData: `/players/${tag}/data`
        });
      }
    })
    .catch((err) => {
      handleErrors(res, path, title, {reason: "Error", message: err});
    });
});

app.get("/players/:tag/analysis", (req, res) => {
  const tag = req.params.tag.toUpperCase();
  const url = baseUrl + "v1/players/%23" + tag + "/upcomingchests";
  const path = [
    {
      "href": "/",
      "name": "Home"
    },
    {
      "href": "/players",
      "name": "Players"
    },
    {
      "href": `/players/${tag}`,
      "name": "#" + tag
    },
    {
      "href": `/players/${tag}/analysis`,
      "name": "Analysis"
    }
  ];
  const title = `Player #${tag} | Analysis`;

  let toSend = [0, 0, 0];
  let toSendLogicalSize = 0;
  let errors = [];

  // I send a request for chests just to see if the player tag is valid
  fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: auth
    }
  })
    .then(res => res.json())
    .then((json) => {
      toSend[0] = json;
      toSendLogicalSize++;
      checkSend();
    })
    .catch((err) => {
      errors.push(err);
      toSendLogicalSize++;
      checkSend();
    });

  // Check if player is being tracked with my system
  (async function () {
    toSend[1] = await Tracked_Player.exists({player: tag});
    toSendLogicalSize++;
    if (toSend[1]) {
      toSend[2] = await Battle.find({player_tag: tag}).lean();
      toSendLogicalSize++;
    } else {
      toSendLogicalSize++;
    }
    checkSend();
  }) ();

  function checkSend() {
    if (toSendLogicalSize === 3) {
      if(errors.length > 0) {
        let message = "";
        for (let i = 0; i < errors.length; i++) {
          message += errors[i] + "\n";
        }
        handleErrors(res, path, title, {reason: "Error", message: message});
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
          rawData: `/players/${tag}/data`
        });
      }
    }
  }
});

app.post("/players/:tag/analysis", (req, res) => {
  if ("addPlayer" in req.body) {
    const tag = req.params.tag.toUpperCase();
    const toAdd = {
      player: tag
    }
    new Tracked_Player(toAdd)
      .save()
      .then(idea => {
        //console.log(idea);
        res.redirect("/players/" + tag + "/analysis");
      })
      .catch((err) => {
        handleErrors(res, path, `Player #${tag} | Analysis`, {reason: "Error", message: err});
      });
  }
});

app.get("/players/:tag/data", (req, res) => {
  const tag = req.params.tag.toUpperCase();
  const url1 = baseUrl + "v1/players/%23" + tag;
  const url2 = url1 + "/battlelog";
  const url3 = url1 + "/upcomingchests";
  let playerInfo = [0, 0, 0, 0];
  let playerInfoLogicalSize = 0;
  let errors = [];
  
  // Check if player is being tracked with my system
  (async function () {
    let playerIsTracked = await Tracked_Player.exists({player: tag});
    if (playerIsTracked) {
      (async function () {
        playerInfo[3] = await Battle.find({player_tag: tag}).lean();
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
      checkSend();
    })
    .catch((err) => {
      errors.push(err);
      playerInfoLogicalSize++;
      checkSend();
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
      checkSend();
    })
    .catch((err) => {
      errors.push(err);
      playerInfoLogicalSize++;
      checkSend();
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
      checkSend();
    })
    .catch((err) => {
      errors.push(err);
      playerInfoLogicalSize++;
      checkSend();
    });

  function checkSend () {
    if (playerInfoLogicalSize === 3) {
      if(errors.length > 0) {
        res.send(errors);
      } else {
        res.send(playerInfo);
      }
    }
  }
});

app.get("/about", (req, res) => {
  const path = [
    {
      "href": "/",
      "name": "Home"
    },
    {
      "href": "/about",
      "name": "About"
    }
  ]

  res.render("about", {
    path: path,
    title: "About",
    rawData: ""
  });
});

app.get("/termsofservice", (req, res) => {
  res.redirect("/tos");
});

app.get("/tos", (req, res) => {
  const path = [
    {
      "href": "/",
      "name": "Home"
    },
    {
      "href": "/tos",
      "name": "Terms of Service"
    }
  ]

  res.render("tos", {
    path: path,
    title: "Terms of Service",
    rawData: ""
  });
});

app.get("/privacy", (req, res) => {
  const path = [
    {
      "href": "/",
      "name": "Home"
    },
    {
      "href": "/privacy",
      "name": "Privacy Policy"
    }
  ]

  res.render("privacy", {
    path: path,
    title: "Privacy Policy",
    rawData: ""
  });
});

app.get("/disclaimers", (req, res) => {
  const path = [
    {
      "href": "/",
      "name": "Home"
    },
    {
      "href": "/disclaimers",
      "name": "Disclaimers"
    }
  ]

  res.render("disclaimers", {
    path: path,
    title: "Disclaimers",
    rawData: ""
  });
});

app.get("/help", (req, res) => {
  const path = [
    {
      "href": "/",
      "name": "Home"
    },
    {
      "href": "/help",
      "name": "Help"
    }
  ]

  res.render("help", {
    path: path,
    title: "Help",
    rawData: ""
  });
});

app.get("/clans", (req, res) => {
  const path = [
    {
      "href": "/",
      "name": "Home"
    },
    {
      "href": "/clans",
      "name": "Clans"
    }
  ];
  const title = "Clans";

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
    const name = req.query.name;
    let locationId = decodeURIComponent(req.query.locationId);
    const minMembers = req.query.minMembers;
    const maxMembers = req.query.maxMembers;
    const minScore = req.query.minScore;
    const limit = req.query.limit;
    let errors = [];
    let validKeys = ["name", "locationId", "minMembers", "maxMembers", "minScore", "limit"];
    let validSearch = true;

    // Checks to make sure that the search is valid
    if (typeof name === "undefined" && locationId === "undefined" && typeof minMembers === "undefined" && typeof maxMembers === "undefined" && typeof minScore === "undefined") {
      errors.push("Must specify at least one filtering parameter (limit does not count)");
    }
    Object.keys(req.query).forEach((key, index) => {
      if(!validKeys.includes(key)) {
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
      let validLocation = false;
      for (let i = 0; i < locations.items.length; i++) {
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
    }

    // If search request was invalid, show that to the user
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
      let url = baseUrl + "v1/clans?";
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
      }

      // Remove first "&"
      url = url.replace("&", "");

      // Send request to API
      fetch(url, {
        headers: {
          Accept: "application/json",
          Authorization: auth
        }
      })
        .then(res => res.json())
        .then((json) => {
          res.render("clans", {
            path: path,
            locations: locations,
            results: json,
            clanBadgeJson: clanBadgeJson,
            title: title,
            rawData: ""
          });
        })
      .catch((err) => {
        handleErrors(res, path, title, {reason: "Error", message: err});
      });
    }
  }
});

app.post("/clans", (req, res) => {
  const path = [
    {
      "href": "/",
      "name": "Home"
    },
    {
      "href": "/clans",
      "name": "Clans"
    }
  ]

  let errors = [];
  if ("tag" in req.body) {
    // User searched by tag
    let pattern = new RegExp(/[\s~`!@#$%\^&*+=\-\[\]\\';,/{}|\\":<>\?()\._]/);
    if (pattern.test(req.body.tag)) {
      errors.push("Please remove special characters from the tag, including the initial pound (#) sign");
    }
    if (errors.length === 0) {
      res.redirect(`/clans/${req.body.tag.toUpperCase()}`);
    } else {
      fetch(baseUrl + "v1/locations", {
        headers: {
          Accept: "application/json",
          Authorization: auth
        }
      })
        .then(res => res.json())
        .then((json) => {
          res.render("clans", {
            path: path,
            errors: errors,
            locations: json,
            results: []
          });
        })
        .catch((err) => {
          handleErrors(res, path, `Clans`, {reason: "Error", message: err});
        });
    }
  } else {
    // User searched by filters
    const name = req.body.name;
    let location = req.body.location;
    const minMembers = req.body.minMembers;
    const maxMembers = req.body.maxMembers;
    const minScore = req.body.minScore;
    const limit = req.body.limit;
    let url2 = "/clans?";
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
    }
    // Remove first "&"
    url2 = url2.replace("&", "");
    res.redirect(url2);
  }
});

app.get("/clans/:tag", (req, res) => {
  res.redirect(`/clans/${req.params.tag.toUpperCase()}/description`);
});

app.get("/clans/:tag/all", (req, res) => {
  const tag = req.params.tag.toUpperCase();
  const url1 = baseUrl + "v1/clans/%23" + tag;
  const url2 = url1 + "/currentriverrace";
  const url3 = url1 + "/riverracelog";
  const path = [
    {
      "href": "/",
      "name": "Home"
    },
    {
      "href": "/clans",
      "name": "Clans"
    },
    {
      "href": `/clans/${tag}`,
      "name": "#" + tag
    },
    {
      "href": `/clans/${tag}/all`,
      "name": "All"
    }
  ];
  const title = `Clan #${tag} | All`;

  let clanInfo = [0, 0, 0];
  let clanInfoLogicalSize = 0;
  let errors = [];
  
  fetch(url1, {
    headers: {
      Accept: "application/json",
      Authorization: auth
    }
  })
    .then(res => res.json())
    .then((json) => {
      clanInfo[0] = json;
      clanInfoLogicalSize++;
      checkSend();
    })
    .catch((err) => {
      errors.push(err);
      clanInfoLogicalSize++;
      checkSend();
    });

  fetch(url2, {
    headers: {
      Accept: "application/json",
      Authorization: auth
    }
  })
    .then(res => res.json())
    .then((json) => {
      clanInfo[1] = json;
      clanInfoLogicalSize++;
      checkSend();
    })
    .catch((err) => {
      errors.push(err);
      clanInfoLogicalSize++;
      checkSend();
    });

  fetch(url3, {
    headers: {
      Accept: "application/json",
      Authorization: auth
    }
  })
    .then(res => res.json())
    .then((json) => {
      clanInfo[2] = json;
      clanInfoLogicalSize++;
      checkSend();
    })
    .catch((err) => {
      errors.push(err);
      clanInfoLogicalSize++;
      checkSend();
    });

  function checkSend () {
    if (clanInfoLogicalSize === 3) {
      if(errors.length > 0) {
        let message = "";
        for (let i = 0; i < errors.length; i++) {
          message += errors[i] + "\n";
        }
        handleErrors(res, path, title, {reason: "Error", message: message});
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
          rawData: `/clans/${tag}/data`
        });
      }
    }
  }
});

app.get("/clans/:tag/description", (req, res) => {
  const tag = req.params.tag.toUpperCase();
  const url = baseUrl + "v1/clans/%23" + tag;
  const path = [
    {
      "href": "/",
      "name": "Home"
    },
    {
      "href": "/clans",
      "name": "Clans"
    },
    {
      "href": `/clans/${tag}`,
      "name": "#" + tag
    },
    {
      "href": `/clans/${tag}/description`,
      "name": "Description"
    }
  ];
  const title = `Clan #${tag} | Description`;

  fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: auth
    }
  })
    .then(res => res.json())
    .then((json) => {
      if (json.reason) {
        handleErrors(res, path, title, json);
      } else {
        res.render("clanInfoDescription", {
          path: path,
          clanStats: json,
          clanBadgeJson: clanBadgeJson,
          title: title,
          rawData: `/clans/${tag}/data`
        });
      }
    })
    .catch((err) => {
      handleErrors(res, path, title, {reason: "Error", message: err});
    });
});

app.get("/clans/:tag/members", (req, res) => {
  const tag = req.params.tag.toUpperCase();
  const url = baseUrl + "v1/clans/%23" + tag;
  const path = [
    {
      "href": "/",
      "name": "Home"
    },
    {
      "href": "/clans",
      "name": "Clans"
    },
    {
      "href": `/clans/${tag}`,
      "name": "#" + tag
    },
    {
      "href": `/clans/${tag}/members`,
      "name": "Members"
    }
  ];
  const title = `Clan #${tag} | Members`;

  fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: auth
    }
  })
    .then(res => res.json())
    .then((json) => {
      if (json.reason) {
        handleErrors(res, path, title, json);
      } else {
        res.render("clanInfoMembers", {
          path: path,
          clanStats: json,
          title: title,
          rawData: `/clans/${tag}/data`
        });
      }
    })
    .catch((err) => {
      handleErrors(res, path, title, {reason: "Error", message: err});
    });
});

app.get("/clans/:tag/war", (req, res) => {
  // I don't use clanInfoWar.handlebars
  // I've kept this here just in case
  /*res.render("clanInfoWar", {
    tag: "#" + req.params.tag.toUpperCase()
  });*/
  res.redirect(`/clans/${req.params.tag.toUpperCase()}/war/race`);
});

app.get("/clans/:tag/war/race", (req, res) => {
  const tag = req.params.tag.toUpperCase();
  const url = baseUrl + "v1/clans/%23" + tag + "/currentriverrace";
  const path = [
    {
      "href": "/",
      "name": "Home"
    },
    {
      "href": "/clans",
      "name": "Clans"
    },
    {
      "href": `/clans/${tag}`,
      "name": "#" + tag
    },
    {
      "href": `/clans/${tag}/war`,
      "name": "War"
    },
    {
      "href": `/clans/${tag}/war/race`,
      "name": "Race"
    }
  ];
  const title = `Clan #${tag} | Current River Race`;

  fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: auth
    }
  })
    .then(res => res.json())
    .then((json) => {
      if (json.reason) {
        handleErrors(res, path, title, json);
      } else {
        res.render("clanInfoWarRace", {
          path: path,
          currentRiverRace: json,
          tag: "#" + tag,
          clanBadgeJson: clanBadgeJson,
          title: title,
          rawData: `/clans/${tag}/data`
        });
      }
    })
    .catch((err) => {
      handleErrors(res, path, title, {reason: "Error", message: err});
    });
});

app.get("/clans/:tag/war/log", (req, res) => {
  res.redirect(`/clans/${req.params.tag.toUpperCase()}/war/log/1`);
});

app.get("/clans/:tag/war/log/:num", (req, res) => {
  const tag = req.params.tag.toUpperCase();
  const num = parseInt(req.params.num);
  const url = baseUrl + "v1/clans/%23" + tag + "/riverracelog";
  const path = [
    {
      "href": "/",
      "name": "Home"
    },
    {
      "href": "/clans",
      "name": "Clans"
    },
    {
      "href": `/clans/${tag}`,
      "name": "#" + tag
    },
    {
      "href": `/clans/${tag}/war`,
      "name": "War"
    },
    {
      "href": `/clans/${tag}/war/log`,
      "name": "Log"
    },
    {
      "href": `/clans/${tag}/war/log/${req.params.num}`,
      "name": req.params.num
    }
  ];
  const title = `Clan #${tag} | War Log`;

  if (num !== parseFloat(req.params.num.toUpperCase()) || isNaN(num)) {
    handleErrors(res, path, `Clan #${tag} | Log`, {"reason": "Invalid Log", "message": `The requested log number for clan #${tag} is invalid`});
  } else {
    fetch(url, {
      headers: {
        Accept: "application/json",
        Authorization: auth
      }
    })
      .then(res => res.json())
      .then((json) => {
        if (json.reason) {
          handleErrors(res, path, title, json);
        } else {
          if (num <= 0 || num > json.items.length) {
            if (num === 1) {
              // Clan has no river log
              handleErrors(res, path, title, {"reason": "No Log", "message": `The requested clan #${tag} has no log`});
            } else {
              handleErrors(res, path, title, {"reason": "Invalid Log", "message": `The requested log number for clan #${tag} is invalid`});
            }
          } else {
            const season = json.items[num - 1].seasonId;
            const week = json.items[num - 1].sectionIndex + 1;
            res.render("clanInfoWarLog", {
              path: path,
              riverRaceLog: json,
              tag: "#" + tag,
              index: num - 1,
              season: season,
              week: week,
              clanBadgeJson: clanBadgeJson,
              title: `${title} | S${season} W${week}`,
              rawData: `/clans/${tag}/data`
            });
          }
        }
      })
      .catch((err) => {
        handleErrors(res, path, title, {reason: "Error", message: err});
      });
  }
});

app.get("/clans/:tag/war/insights", (req, res) => {
  const tag = req.params.tag.toUpperCase();
  const url = baseUrl + "v1/clans/%23" + tag + "/riverracelog";
  const path = [
    {
      "href": "/",
      "name": "Home"
    },
    {
      "href": "/clans",
      "name": "Clans"
    },
    {
      "href": `/clans/${tag}`,
      "name": "#" + tag
    },
    {
      "href": `/clans/${tag}/war`,
      "name": "War"
    },
    {
      "href": `/clans/${tag}/war/insights`,
      "name": "Insights"
    }
  ];
  const title = `Clan #${tag} | War Insights`;

  fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: auth
    }
  })
    .then(res => res.json())
    .then((json) => {
      if (json.reason) {
        handleErrors(res, path, title, json);
      } else {
        res.render("clanInfoWarInsights", {
          path: path,
          tag: "#" + tag,
          riverRaceLog: json,
          title: title,
          rawData: `/clans/${tag}/data`
        });
      }
    })
    .catch((err) => {
      handleErrors(res, path, title, {reason: "Error", message: err});
    });
});

app.get("/clans/:tag/data", (req, res) => {
  const tag = req.params.tag.toUpperCase();
  const url1 = baseUrl + "v1/clans/%23" + tag;
  const url2 = url1 + "/currentriverrace";
  const url3 = url1 + "/riverracelog";
  let clanInfo = [0, 0, 0];
  let clanInfoLogicalSize = 0;
  let errors = [];

  fetch(url1, {
    headers: {
      Accept: "application/json",
      Authorization: auth
    }
  })
    .then(res => res.json())
    .then((json) => {
      clanInfo[0] = json;
      clanInfoLogicalSize++;
      checkSend();
    })
    .catch((err) => {
      errors.push(err);
      clanInfoLogicalSize++;
      checkSend();
    });

  fetch(url2, {
    headers: {
      Accept: "application/json",
      Authorization: auth
    }
  })
    .then(res => res.json())
    .then((json) => {
      clanInfo[1] = json;
      clanInfoLogicalSize++;
      checkSend();
    })
    .catch((err) => {
      errors.push(err);
      clanInfoLogicalSize++;
      checkSend();
    });

  fetch(url3, {
    headers: {
      Accept: "application/json",
      Authorization: auth
    }
  })
    .then(res => res.json())
    .then((json) => {
      clanInfo[2] = json;
      clanInfoLogicalSize++;
      checkSend();
    })
    .catch((err) => {
      errors.push(err);
      clanInfoLogicalSize++;
      checkSend();
    });

  function checkSend () {
    if (clanInfoLogicalSize === 3) {
      if(errors.length > 0) {
        res.send(errors);
      } else {
        res.send(clanInfo);
      }
    }
  }
});

app.get("/cards", (req, res) => {
  // This path is under construction
  const path = [
    {
      "href": "/",
      "name": "Home"
    },
    {
      "href": "/cards",
      "name": "Cards"
    }
  ];

  handleErrors(res, path, "Cards", {"reason": "construction"});
});

app.get("/guides", (req, res) => {
  // This path is under construction
  const path = [
    {
      "href": "/",
      "name": "Home"
    },
    {
      "href": "/guides",
      "name": "Guides"
    }
  ];

  handleErrors(res, path, "Guides", {"reason": "construction"});
});

app.get("/tournaments", (req, res) => {
  const path = [
    {
      "href": "/",
      "name": "Home"
    },
    {
      "href": "/tournaments",
      "name": "Tournaments"
    }
  ];
  const title = "Tournaments";
  let errors = [];

  if (Object.keys(req.query).length === 0) {
    res.render("tournaments", {
      path: path,
      title: title,
      rawData: ""
    });
  } else {
    const name = req.query.name;
    // Only valid search parameter is by name
    Object.keys(req.query).forEach((key, index) => {
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
      let url = baseUrl + "v1/tournaments?name=" + name;
      fetch(url, {
        headers: {
          Accept: "application/json",
          Authorization: auth
        }
      })
        .then(res => res.json())
        .then((json) => {
          res.render("tournaments", {
            path: path,
            results: json,
            gameModeJson: gameModeJson,
            title: title,
            rawData: ""
          });
        })
        .catch((err) => {
          handleErrors(res, path, title, {reason: "Error", message: err});
        });
    }
  }
});

app.post("/tournaments", (req, res) => {
  const path = [
    {
      "href": "/",
      "name": "Home"
    },
    {
      "href": "/tournaments",
      "name": "Tournaments"
    }
  ];
  let errors = [];
  if ("tag" in req.body) {
    // User searched by tag
    let pattern = new RegExp(/[\s~`!@#$%\^&*+=\-\[\]\\';,/{}|\\":<>\?()\._]/);
    if (pattern.test(req.body.tag)) {
      errors.push("Please remove special characters from the tag, including the initial pound (#) sign");
    }
    if (errors.length === 0) {
      res.redirect(`/tournaments/${req.body.tag.toUpperCase()}`);
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
    res.redirect(`/tournaments?name=${req.body.name}`);
  }
});

// gt is the abbreviation for global tournament
// This comes before '/tournaments/:tag'
// Otherwise, gt would be interpreted as a tag
app.get("/tournaments/gt", (req, res) => {
  const path = [
    {
      "href": "/",
      "name": "Home"
    },
    {
      "href": "/tournaments",
      "name": "Tournaments"
    },
    {
      "href": "/tournaments/gt",
      "name": "Global Tournaments"
    }
  ];
  const title = "Global Tournaments";

  fetch(baseUrl + "v1/globaltournaments", {
    headers: {
      Accept: "application/json",
      Authorization: auth
    }
  })
    .then(res => res.json())
    .then((json) => {
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
    })
    .catch((err) => {
      handleErrors(res, path, title, {reason: "Error", message: err});
    });
});

// Sends JSON object for use in gt.handlebars
app.get("/tournaments/gt/:tag/leaderboard", (req, res) => {
  const tag = req.params.tag.toUpperCase();
  fetch(`${baseUrl}v1/locations/global/rankings/tournaments/%23${tag}`, {
    headers: {
      Accept: "application/json",
      Authorization: auth
    }
  })
    .then(res => res.json())
    .then((json) => {
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
    })
    .catch((err) => {
      res.send("Error");
    });
});

// Redirect for users who try to enter this manually
app.get("/tournaments/globaltournaments", (req, res) => {
  res.redirect("/tournaments/gt");
});

app.get("/tournaments/:tag", (req, res) => {
  const tag = req.params.tag.toUpperCase();
  const url = baseUrl + "v1/tournaments/%23" + tag;
  const path = [
    {
      "href": "/",
      "name": "Home"
    },
    {
      "href": "/tournaments",
      "name": "Tournaments"
    },
    {
      "href": `/tournaments/${tag}`,
      "name": "#" + tag
    }
  ];
  const title = `Tournament #${tag}`;

  fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: auth
    }
  })
    .then(res => res.json())
    .then((json) => {
      if (json.reason) {
        handleErrors(res, path, `Tournament #${tag}`, json);
      } else {
        res.render("tournamentInfo", {
          path: path,
          tournamentStats: json,
          gameModeJson: gameModeJson,
          clanBadgeJson: clanBadgeJson,
          title: title,
          rawData: `/tournaments/${tag}/data`
        });
      }
    })
    .catch((err) => {
      handleErrors(res, path, `Tournament #${tag}`, {reason: "Error", message: err});
    });
});

app.get("/tournaments/gt/data", (req, res) => {
  fetch(baseUrl + "v1/globaltournaments", {
    headers: {
      Accept: "application/json",
      Authorization: auth
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

app.get("/tournaments/:tag/data", (req, res) => {
  const tag = req.params.tag.toUpperCase();
  const url = baseUrl + "v1/tournaments/%23" + tag;

  fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: auth
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

app.get("/emotes", (req, res) => {
  const path = [
    {
      "href": "/",
      "name": "Home"
    },
    {
      "href": "/emotes",
      "name": "Emotes"
    }
  ];

  res.render("emotes", {
    path: path,
    title: "Emotes",
    rawData: ""
  });
});

app.get("/emotes/:id", (req, res) => {
  const id = req.params.id;
  const path = [
    {
      "href": "/",
      "name": "Home"
    },
    {
      "href": "/emotes",
      "name": "Emotes"
    },
    {
      "href": `/emotes/${id}`,
      "name": id
    }
  ];

  // The final condition is constantly changing as new emotes are added into the game
  // Update this value frequently
  // I just lazily set the value to 400
  if (isNaN(parseInt(id)) || parseInt(id) !== parseFloat(id) || id < 1 || id > 400) {
    handleErrors(res, path, `Emote #${id}`, {reason: "Error", message: "Requested emote ID is not valid"});
  } else {
    res.render("emoteInfo", {
      path: path,
      emoteId: id,
      title: `Emote #${id}`,
      rawData: ""
    });
  }
});

app.get("/leaderboards", (req, res) => {
  const path = [
    {
      "href": "/",
      "name": "Home"
    },
    {
      "href": "/leaderboards",
      "name": "Leaderboards"
    }
  ];

  res.render("leaderboards", {
    path: path,
    title: "Leaderboards",
    rawData: "",
    locations: locations,
    seasons: seasons
  });
});

// These three are similar, so they run under the same route handler
// clans and clanwars do not have past history, so I just check for that
app.get(["/leaderboards/players", "/leaderboards/clans", "/leaderboards/clanwars"], (req, res) => {
  let leaderboardType = "";
  let lbTypeName = "";
  let renderTemplate = "";
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
  const path = [
    {
      "href": "/",
      "name": "Home"
    },
    {
      "href": "/leaderboards",
      "name": "Leaderboards"
    },
    {
      "href": `/leaderboards/${leaderboardType}`,
      "name": lbTypeName
    }
  ];
  const title = lbTypeName + " Leaderboard";
  // This sets the number of results to show
  // Country leaderboards return 1,000 results and season leaderboards return 10,000 results
  // Too many returned results will cause poor performance, so I set the results returned to 500
  const resultsDisplayed = 500;
  let errors = [];

  if (Object.keys(req.query).length === 0) {
    res.redirect(`/leaderboards/${leaderboardType}?region=GLOBAL`);
  } else {
    if (Object.keys(req.query).length > 1) {
      errors.push("Only one query parameter should be specified");
    }
    Object.keys(req.query).forEach((key, index) => {
      if (leaderboardType === "players") {
        // season is a valid query
        if (key !== "region" && key !== "season") {
          errors.push(`Invalid query parameter '${key}' — only valid parameters are region and season`);
        }
      } else {
        // season is not a valid query
        if (key !== "region") {
          errors.push(`Invalid query parameter '${key}' — only valid parameter is region`);
        }
      }
    });
    let region = req.query.region;
    let season = req.query.season;
    regionIf: 
    if (typeof region !== "undefined" && region !== "GLOBAL") {
      if (leaderboardType === "players") {
        // Non-countries like International, North America, etc. are not allowed
        for (let i = 0; i < locations.items.length; i++) {
          if (locations.items[i].isCountry && region === locations.items[i].countryCode) {
            region = locations.items[i].id;
            break regionIf;
          }
        }
      } else {
        // Non-countries like Intenational, North America, etc. are allowed
        // This switch takes care of the non-countries
        switch (region) {
          case ("_INTL"): {
            region = "International";
            break;
          }
          case ("_AFR"): {
            region = "Africa";
            break;
          }
          case ("_ASIA"): {
            region = "Asia";
            break;
          }
          case ("_NA"): {
            region = "North America";
            break;
          }
          case ("_OCEA"): {
            region = "Oceania";
            break;
          }
          case ("_SA"): {
            region = "South America";
            break;
          }
        }
        for (let i = 0; i < locations.items.length; i++) {
          if (region === locations.items[i].name || (locations.items[i].isCountry && region === locations.items[i].countryCode)) {
            region = locations.items[i].id;
            break regionIf;
          }
        }
      }
      
      if (typeof region !== "number") {
        // Region was invalid because otherwise, it would have become an id
        errors.push("Region code not recognized");
      }
    }
    seasonIf:
    if (typeof season !== "undefined") {
      for (let i = 0; i < seasons.items.length; i++) {
        if (season === seasons.items[i].id) {
          break seasonIf;
        }
      }
      // Season ID was not found
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
        endUrl = (region === "GLOBAL") ? `v1/locations/global/rankings/${leaderboardType}` : `v1/locations/${region}/rankings/${leaderboardType}`;
        fetch(baseUrl + endUrl, {
          headers: {
            Accept: "application/json",
            Authorization: auth
          }
        })
          .then(res => res.json())
          .then((json) => {
            if (json.reason) {
              handleErrors(res, path, title, json)
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
          })
          .catch((err) => {
            handleErrors(res, path, title, {reason: "Error", message: err});
          });
      } else {
        // Query was season
        fetch(`${baseUrl}v1/locations/global/seasons/${season}/rankings/${leaderboardType}`, {
          headers: {
            Accept: "application/json",
            Authorization: auth
          }
        })
          .then(res => res.json())
          .then((json) => {
            if (json.reason) {
              handleErrors(res, path, title, json)
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
          })
          .catch((err) => {
            handleErrors(res, path, title, {reason: "Error", message: err});
          });
      }
    }
  }
});

// This is for 404 errors
app.use((req, res) => {
  const urlPath = req.url.split("/");
  urlPath.shift();
  let path = [{"href": "/", "name": "Home"}];
  for (let i = 0; i < urlPath.length; i++) {
    let curUrl = "/";
    const name = urlPath[i].charAt(0).toUpperCase() + urlPath[i].substring(1);
    for (let j = 0; j <= i; j++) {
      curUrl = curUrl + urlPath[j] + "/";
    }
    path.push({"href": curUrl, "name": name});
  }
  res.status(404);
  handleErrors(res, path, `404`, {"reason": "notFound"});
});

// This area is where I try to keep track of player battles and update the db every two hours
// The "doEveryHour" code is taken from https://stackoverflow.com/a/58767632
// I'm updating every two hours (not one) to lighten server load
// I also clear old battles every two days
// cardJson and gameModeJson are also updated here
let clearTime = -2;
const performAsyncTasks = async function () {
  // Update clearTime
  clearTime = (clearTime + 2) % 48;
  
  // Update cardJson
  fetch("https://royaleapi.github.io/cr-api-data/json/cards.json")
    .then(res => res.json())
    .then((json) => {
      cardJson = json;
    })
    .catch((err) => {
      // Do something better
      console.log(err);
    });
  
  // Update gameModeJson
  fetch("https://royaleapi.github.io/cr-api-data/json/game_modes.json")
    .then(res => res.json())
    .then((json) => {
      gameModeJson = json;
    })
    .catch((err) => {
      // Do something better
      console.log(err);
    });

  // Update locations
  fetch(baseUrl + "v1/locations", {
    headers: {
      Accept: "application/json",
      Authorization: auth
    }
  })
    .then(res => res.json())
    .then((json) => {
      locations = json;
    })
    .catch((err) => {
      // Do something better
      console.log(err);
    });

  // Update clan badges
  fetch("https://royaleapi.github.io/cr-api-data/json/alliance_badges.json")
    .then(res => res.json())
    .then((json) => {
      clanBadgeJson = json;
    })
    .catch((err) => {
      // Do something better
      console.log(err);
    });

  // Update seasons
  fetch(baseUrl + "v1/locations/global/seasons", {
    headers: {
      Accept: "application/json",
      Authorization: auth
    }
  })
    .then(res => res.json())
    .then((json) => {
      seasons = json;
    })
    .catch((err) => {
      // Do something better
      console.log(err);
    });
  
  // Update player logs
  let players = await Tracked_Player.find({}, "player -_id").exec();
  let errors = [];
  players.forEach(playerObject => {
    let player = playerObject.player;
    let url = baseUrl + "v1/players/%23" + player + "/battlelog";
    fetch(url, {
      headers: {
        Accept: "application/json",
        Authorization: auth
      }
    })
      .then(res => res.json())
      .then((json) => {
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
            if (timeDifference > 7200000) {
              break jsonLoop;
            }
            if (json[i].type !== "boatBattle") {
              let deckUsed = [];
              let deckFaced = [];
              let levelDifference = 0;
              for (let j = 0; j < 8; j++) {
                deckUsed.push(json[i].team[0].cards[j].id);
                deckFaced.push(json[i].opponent[0].cards[j].id);
                levelDifference += getRealLevel(json[i].team[0].cards[j].level, json[i].team[0].cards[j].maxLevel);
                levelDifference -= getRealLevel(json[i].opponent[0].cards[j].level, json[i].opponent[0].cards[j].maxLevel);;
              }
              levelDifference /= 8;
              deckUsed.sort();
              deckFaced.sort();
              let victor = json[i].team[0].crowns - json[i].opponent[0].crowns;
              if (victor > 0) {
                victor = 1;
              } else if (victor < 0) {
                victor = -1;
              } else {
                victor = 0;
              }

              const toAdd = {
                player_tag: json[i].team[0].tag.substring(1),
                deck_used: deckUsed,
                deck_faced: deckFaced,
                level_difference: levelDifference,
                opponent_tag: json[i].opponent[0].tag.substring(1),
                battle_outcome: victor,
                time: battleTime,
                battle_type: json[i].gameMode.id
              }

              async function addBattle () {
                let battleExists = await Battle.exists({player_tag: json[i].team[0].tag.substring(1), time: battleTime});
                if (!battleExists && json[i].team[0].cards.length === 8) {
                  new Battle(toAdd)
                    .save()
                    .then(idea => {
                      //console.log(idea);
                    });
                } else {
                  // Battle.deleteOne({_id: "606b2980b872742f5c85ca6e"}, function(err, result) {
                  //   if (err) {
                  //     console.log(err);
                  //   } else {
                  //     console.log(result);
                  //   }
                  // });
                }
              }
              addBattle();
            }
          }
        }
      })
      .catch((err) => {
        console.log(err);
      });
    //console.log(player);
  });

  // Delete old records
  if (clearTime === 0) {
    let deletionDate = new Date(Date.now() - (daysToDeletion * 24 * 60 * 60 * 1000)).toISOString();
    Battle.deleteMany({time: {$lte: deletionDate}}, function(err, result) {
      if (err) {
        //console.log(err);
      } else {
        //console.log(result.deletedCount);
      }
    });
  }
}

// Name is do every hour, but I've changed it so that it only runs onces every two hours
const doEveryHour = (something) => {
  let running = true;
  let nextHour = () => {
    return 7200000 - new Date().getTime() % 7200000;
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

function handleErrors (res, path, title, object) {
  switch(object.reason) {
    // Clash Royale API error for an invalid tag
    case ("notFound"): {
      sendError(res, path, `${title} | NOT FOUND`, "The requested resource could not be found");
      break;
    }
    // My own error for pages I have not yet completed
    case ("construction"): {
      sendError(res, path, `${title} | UNDER CONSTRUCTION`, "This page is currently under construction");
      break;
    }
    // Any other uncaught errors
    default: {
      let message = `The request was unable to be completed.\nReason --> ${object.reason}.`;
      if (object.message) {
        message += `\nMessage --> ${object.message}.`;
      }
      sendError(res, path, `${title} | ${object.reason}`, message);
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

let updatingBattleLog = doEveryHour(performAsyncTasks);
updatingBattleLog.exec();

const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});