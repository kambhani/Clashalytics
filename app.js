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
let baseUrl;
if (process.env.NODE_ENV === "production") {
  baseUrl = "https://proxy.royaleapi.dev/";
} else {
  baseUrl = "https://api.clashroyale.com/";
}

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
    path: path
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
    path: path
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
  let playerInfo = [0, 0, 0, 0, 0];
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
      console.log(err);
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
      console.log(err);
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
      console.log(err);
    });
  
  fetch("https://royaleapi.github.io/cr-api-data/json/game_modes.json")
    .then(res => res.json())
    .then((json) => {
      playerInfo[3] = json;
      playerInfoLogicalSize++;
      checkSend();
    })
    .catch((err) => {
      errors.push(err);
      console.log(err);
    });
  
  fetch("https://royaleapi.github.io/cr-api-data/json/cards.json")
    .then(res => res.json())
    .then((json) => {
      playerInfo[4] = json;
      playerInfoLogicalSize++;
      checkSend();
    })
    .catch((err) => {
      errors.push(err);
      console.log(err);
    });

  function checkSend () {
    if (playerInfoLogicalSize === 5) {
      if(errors.length > 0) {
        res.send("ERROR");
      }
      if (playerInfo[2].reason) {
        // This area means that something is off with the JSON response
        handleErrors(res, path, `Player #${tag} | All`, playerInfo[2]);
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
        console.log(err);
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

  fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: auth
    }
  })
    .then(res => res.json())
    .then((json) => {
      if (json.reason) {
        handleErrors(res, path, `Player #${tag} | General`, json);
      } else {
        res.render("playerInfoGeneral", {
          path: path,
          playerStats: json
        });
      }
    })
    .catch((err) => {
      console.log(err);
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
  let toSend = [0, 0, 0];
  let toSendLogicalSize = 0;
  let errors = [];

  fetch(url1, {
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
      console.log(err);
    });
  
  
  
  fetch("https://royaleapi.github.io/cr-api-data/json/game_modes.json")
    .then(res => res.json())
    .then((json) => {
      toSend[1] = json;
      toSendLogicalSize++;
      checkSend();
    })
    .catch((err) => {
      errors.push(err);
      console.log(err);
    });

  fetch("https://royaleapi.github.io/cr-api-data/json/cards.json")
    .then(res => res.json())
    .then((json) => {
      toSend[2] = json;
      toSendLogicalSize++;
      checkSend();
    })
    .catch((err) => {
      errors.push(err);
      console.log(err);
    });

  function checkSend () {
    if (toSendLogicalSize === 3) {
      if(errors.length > 0) {
        res.send("ERROR");
      }
      if (toSend[0].reason) {
        handleErrors(res, path, `Player #${tag} | Battles`, toSend[0]);
      } else {
        if (toSend[0].length === 0) {
          fetch(url2, {
            headers: {
              Accept: "application/json",
              Authorization: auth
            }
          })
            .then(res => res.json())
            .then((json) => {
              if (json.reason) {
                handleErrors(res, path, `Player #${tag} | Battles`, json);
              } else {
                res.render("playerInfoBattles", {
                  tag: "#" + req.params.tag.toUpperCase(),
                  playerBattles: toSend[0],
                  gameModeJson: toSend[1],
                  cardJson: toSend[2]
                });
              }
            })
            .catch((err) => {
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

  fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: auth
    }
  })
    .then(res => res.json())
    .then((json) => {
      if (json.reason) {
        handleErrors(res, path, `Player #${tag} | Cards`, json);
      } else {
        res.render("playerInfoCards", {
          path: path,
          playerStats: json
        });
      }
    })
    .catch((err) => {
      console.log(err);
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

  fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: auth
    }
  })
    .then(res => res.json())
    .then((json) => {
      if (json.reason) {
        handleErrors(res, path, `Player #${tag} | Chests`, json);
      } else {
        res.render("playerInfoChests", {
          path: path,
          playerChests: json,
          tag: "#" + tag
        });
      }
    })
    .catch((err) => {
      console.log(err);
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
  let toSend = [0, 0, 0, 0, 0];
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
      console.log(err);
      errors.push(err);
    });

  fetch("https://royaleapi.github.io/cr-api-data/json/game_modes.json")
    .then(res => res.json())
    .then((json) => {
      toSend[1] = json;
      toSendLogicalSize++;
      checkSend();
    })
    .catch((err) => {
      errors.push(err);
      console.log(err);
    });

  fetch("https://royaleapi.github.io/cr-api-data/json/cards.json")
    .then(res => res.json())
    .then((json) => {
      toSend[2] = json;
      toSendLogicalSize++;
      checkSend();
    })
    .catch((err) => {
      errors.push(err);
      console.log(err);
    });

  // Check if player is being tracked with my system
  (async function () {
    toSend[3] = await Tracked_Player.exists({player: tag});
    toSendLogicalSize++;
    if (toSend[3]) {
      toSend[4] = await Battle.find({player_tag: tag}).lean();
      toSendLogicalSize++;
    } else {
      toSendLogicalSize++;
    }
    checkSend();
  }) ();

  function checkSend() {
    if (toSendLogicalSize === 5) {
      if(errors.length > 0) {
        res.send("ERROR");
      }
      if (toSend[0].reason) {
        handleErrors(res, path, `Player #${tag}`, toSend[0]);
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
        console.log(err);
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
      console.log(err);
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
      console.log(err);
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
      console.log(err);
    });

  function checkSend () {
    if (playerInfoLogicalSize === 3) {
      if(errors.length > 0) {
        res.send("ERROR");
      }
      res.send(playerInfo);
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
    path: path
  });
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
    path: path
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
    path: path
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
    path: path
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
    path: path
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
  ]

  fetch(baseUrl + "v1/locations", {
    headers: {
      Accept: "application/json",
      Authorization: auth
    }
  })
    .then(res => res.json())
    .then((json) => {
      if (Object.keys(req.query).length === 0) {
        res.render("clans", {
          path: path,
          locations: json,
          results: []
        });
      } else {
        const name = req.query.name;
        let locationId = decodeURIComponent(req.query.locationId);
        const minMembers = req.query.minMembers;
        const maxMembers = req.query.maxMembers;
        const minScore = req.query.minScore;
        const limit = req.query.limit;
        let errors = [];
        let validKeys = ["name", "locationId", "minMembers", "maxMembers", "minScore", "limit"];
        let validSearch = true;
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
          for (let i = 0; i < json.items.length; i++) {
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
          //console.log(url);
          fetch(url, {
            headers: {
              Accept: "application/json",
              Authorization: auth
            }
          })
            .then(res => res.json())
            .then((json2) => {
              res.render("clans", {
                path: path,
                locations: json,
                results: json2
              });
            })
          .catch((err) => {
            console.log(err);
          })
        }
      }
    })
    .catch((err) => {
      console.log(err);
      res.send("Server Error");
    })
})

app.post("/clans", (req, res) => {
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
            errors: errors,
            locations: json,
            results: []
          });
        })
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
  let clanInfo = [0, 0, 0];
  let clanInfoLogicalSize = 0;
  let errors = [];

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
  })
    .then(res => res.json())
    .then((json) => {
      clanInfo[0] = json;
      clanInfoLogicalSize++;
      checkSend();
    })
    .catch((err) => {
      errors.push(err);
      console.log(err);
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
      console.log(err);
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
      console.log(err);
    });

  function checkSend () {
    if (clanInfoLogicalSize === 3) {
      if(errors.length > 0) {
        res.send("ERROR");
      }
      if (clanInfo[0].reason) {
        handleErrors(res, path, `Clan #${tag} | All`, clanInfo[0]);
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

  fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: auth
    }
  })
    .then(res => res.json())
    .then((json) => {
      if (json.reason) {
        handleErrors(res, path, `Clan #${tag} | Description`, json);
      } else {
        res.render("clanInfoDescription", {
          path: path,
          clanStats: json
        });
      }
    })
    .catch((err) => {
      console.log(err);
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
      "href": `/clans/${tag}/description`,
      "name": "Members"
    }
  ];

  fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: auth
    }
  })
    .then(res => res.json())
    .then((json) => {
      if (json.reason) {
        handleErrors(res, path, `Clan #${tag} | Members`, json);
      } else {
        res.render("clanInfoMembers", {
          path: path,
          clanStats: json
        });
      }
    })
    .catch((err) => {
      console.log(err);
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

  fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: auth
    }
  })
    .then(res => res.json())
    .then((json) => {
      if (json.reason) {
        handleErrors(res, path, `Clan #${tag} | Race`, json);
      } else {
        res.render("clanInfoWarRace", {
          path: path,
          currentRiverRace: json,
          tag: "#" + tag
        });
      }
    })
    .catch((err) => {
      console.log(err);
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
          handleErrors(res, path, `Clan #${tag} | Log`, json);
        } else {
          if (num <= 0 || num > json.items.length) {
            if (num === 1) {
              // Clan has no river log
              handleErrors(res, path, `Clan #${tag} | Log`, {"reason": "No Log", "message": `The requested clan #${tag} has no log`});
            } else {
              handleErrors(res, path, `Clan #${tag} | Log`, {"reason": "Invalid Log", "message": `The requested log number for clan #${tag} is invalid`});
            }
          } else {
            let season, week;
            for (let i = 0; i < json.items.length; i++) {
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
      })
      .catch((err) => {
        console.log(err);
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

  fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: auth
    }
  })
    .then(res => res.json())
    .then((json) => {
      if (json.reason) {
        handleErrors(res, path, `Clan #${tag} | Insights`, json);
      } else {
        res.render("clanInfoWarInsights", {
          path: path,
          tag: "#" + tag,
          riverRaceLog: json
        });
      }
    })
    .catch((err) => {
      console.log(err);
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
  })
    .then(res => res.json())
    .then((json) => {
      clanInfo[0] = json;
      clanInfoLogicalSize++;
      checkSend();
    })
    .catch((err) => {
      errors.push(err);
      console.log(err);
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
      console.log(err);
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
      console.log(err);
    });

  function checkSend () {
    if (clanInfoLogicalSize === 3) {
      if(errors.length > 0) {
        res.send("ERROR");
      }
      res.send(clanInfo);
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

  handleErrors(res, path, `Cards`, {"reason": "construction"});
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

  handleErrors(res, path, `Guides`, {"reason": "construction"});
});

app.get("/tournaments", (req, res) => {
  const url = baseUrl + "v1/locations/global/rankings/players";
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
      console.log(err);
    });
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
let clearTime = -2;
const updateBattleLog = async function () {
  clearTime = (clearTime + 2) % 48;
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

let updatingBattleLog = doEveryHour(updateBattleLog);
updatingBattleLog.exec();

const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});