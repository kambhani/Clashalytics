"use strict";

// Got this code off of Stack Overflow
// https://stackoverflow.com/questions/32707322/how-to-make-a-handlebars-helper-global-in-expressjs/42224612#42224612
var register = function register(Handlebars) {
  // I define these functions at the top since I use them in multiple places
  function getLeagueWithTrophies(trophies) {
    switch (true) {
      case trophies < 4000:
        {
          return "Challenger I";
        }

      case trophies < 4300:
        {
          return "Challenger I";
        }

      case trophies < 4600:
        {
          return "Challenger II";
        }

      case trophies < 5000:
        {
          return "Challenger III";
        }

      case trophies < 5300:
        {
          return "Master I";
        }

      case trophies < 5600:
        {
          return "Master II";
        }

      case trophies < 6000:
        {
          return "Master III";
        }

      case trophies < 6300:
        {
          return "Champion";
        }

      case trophies < 6600:
        {
          return "Grand Champion";
        }

      case trophies < 7000:
        {
          return "Royal Champion";
        }

      default:
        {
          return "Ultimate Champion";
        }
    }
  }

  function getLeagueByArena(arena) {
    switch (arena) {
      case 1:
        {
          return "Goblin Stadium";
        }

      case 2:
        {
          return "Bone Pit";
        }

      case 3:
        {
          return "Barbarian Bowl";
        }

      case 4:
        {
          return "P.E.K.K.A's Playhouse";
        }

      case 5:
        {
          return "Spell Valley";
        }

      case 6:
        {
          return "Builder's Workshop";
        }

      case 7:
        {
          return "Royal Arena";
        }

      case 8:
        {
          return "Frozen Peak";
        }

      case 9:
        {
          return "Jungle Arena";
        }

      case 10:
        {
          return "Hog Mountain";
        }

      case 11:
        {
          return "Electro Valley";
        }

      case 12:
        {
          return "Spooky Town";
        }

      default:
        {
          return "Legendary Arena";
        }
    }
  }

  var helpers = {
    // Calculates the acutal card level (since the API uses outdated ones)
    calculateCardLevel: function calculateCardLevel(oldLevel, oldMaxLevel) {
      return 13 - oldMaxLevel + oldLevel;
    },
    // Finds the difference between when a battle was fought and the current time
    dateDifference: function dateDifference(pastDate, isLargeScreen) {
      // Date is processed like it is given in the Clash Royale API
      // The format is: YYYYMMDDTHHMMSS.000Z
      var oldDate = new Date(Date.UTC(pastDate.substring(0, 4), pastDate.substring(4, 6) - 1, pastDate.substring(6, 8), pastDate.substring(9, 11), pastDate.substring(11, 13), pastDate.substring(13, 15)));
      var timeDiffSec = Math.round((Date.now() - oldDate.getTime()) / 1000);
      var seconds = timeDiffSec % 60;
      var minutes = Math.floor(timeDiffSec / 60);
      var hours = Math.floor(minutes / 60);
      minutes = minutes % 60;
      var days = Math.floor(hours / 24);
      hours = hours % 60;
      var hourWord = "hours";
      var minuteWord = "minutes";
      var secondWord = "seconds";
      var dayWord = "days"; // Use abbreviations on a small screen

      if (isLargeScreen === 0) {
        if (days === 0) {
          if (hours === 0) {
            if (minutes === 0) {
              return "".concat(seconds, "s");
            } else {
              return "".concat(minutes, "m ").concat(seconds, "s");
            }
          } else {
            return "".concat(hours, "h ").concat(minutes, "m ").concat(seconds, "s");
          }
        } else {
          return "".concat(days, "d ").concat(hours, "h ").concat(minutes, "m ").concat(seconds, "s");
        }
      }

      if (hours === 1) {
        hourWord = "hour";
      }

      if (minutes === 1) {
        minuteWord = "minute";
      }

      if (seconds === 1) {
        secondWord = "second";
      }

      if (days === 1) {
        dayWord = "day";
      }

      if (days === 0) {
        if (hours === 0) {
          if (minutes === 0) {
            return "".concat(seconds, " ").concat(secondWord, " ago");
          } else {
            return "".concat(minutes, " ").concat(minuteWord, ", and ").concat(seconds, " ").concat(secondWord, " ago");
          }
        } else {
          return "".concat(hours, " ").concat(hourWord, ", ").concat(minutes, " ").concat(minuteWord, ", and ").concat(seconds, " ").concat(secondWord, " ago");
        }
      } else {
        return "".concat(days, " ").concat(dayWord, ", ").concat(hours, " ").concat(hourWord, ", ").concat(minutes, " ").concat(minuteWord, ", and ").concat(seconds, " ").concat(secondWord, " ago");
      }
    },
    // Calculates the average level difference between the team and the opponent
    levelDifference: function levelDifference(t0, t1, opp0, opp1) {
      var teamCardSum = 0;
      var oppCardSum = 0;

      for (var i = 0; i < t0.length; i++) {
        teamCardSum += 13 - t0[i].maxLevel + t0[i].level;
        oppCardSum += 13 - opp0[i].maxLevel + opp0[i].level;

        if (t1) {
          teamCardSum += 13 - t1[i].maxLevel + t1[i].level;
          oppCardSum += 13 - opp1[i].maxLevel + opp1[i].level;
        }
      }

      if (t1) {
        return (teamCardSum - oppCardSum) / 16;
      }

      return (teamCardSum - oppCardSum) / t0.length;
    },
    // Removes the first character from a string
    removeFirstCharacter: function removeFirstCharacter(text) {
      if (typeof text === "undefined") {
        return "Server Error";
      }

      return text.substring(1);
    },
    // Performs logical comparisons
    compare: function compare(a, comparator, b) {
      switch (comparator) {
        case "<":
          if (a < b) {
            return true;
          }

          return false;

        case "!==":
          if (a !== b) {
            return true;
          }

          return false;

        case "===":
          if (a === b) {
            return true;
          }

          return false;

        case ">":
          if (a > b) {
            return true;
          }

          return false;
      }
    },
    // Does basic math
    math: function math(a, operation, b) {
      switch (operation) {
        case "+":
          return a + b;

        case "-":
          return a - b;

        case "*":
          return a * b;

        case "/":
          return a / b;
      }
    },
    // Finds the winner of a battle
    // Deck size checks for duels, which then shows that winner is unknown
    // This is because a game with crowns 3-0, 0-1, and 0-2 would be displayed by the API as 3-3
    // Though it seems like a draw, it actually is not and I have to check for it
    findVictor: function findVictor(teamCrowns, opponentCrowns, deckSize) {
      if (deckSize > 8) {
        return "Victor Unknown";
      }

      if (teamCrowns - opponentCrowns > 0) {
        return "Victory";
      } else if (teamCrowns - opponentCrowns < 0) {
        return "Defeat";
      } else {
        return "Draw";
      }
    },
    // Find the number of cards needed to upgrade to the next level
    findCardsNeeded: function findCardsNeeded(oldLevel, oldMaxLevel) {
      var cardOrder = [2, 4, 10, 20, 50, 100, 200, 400, 800, 1000, 2000, 5000];

      if (oldLevel === oldMaxLevel) {
        return "MAX";
      }

      return cardOrder[oldLevel - 1];
    },
    // Loop over specified html a specified number of times
    loopHTML: function loopHTML(numTimes, html) {
      var toReturn = "";

      for (var i = 0; i < numTimes; i++) {
        toReturn += html;
      }

      return toReturn;
    },
    // Gets the league, given the trophies
    getLeague: function getLeague(trophies) {
      return getLeagueWithTrophies(trophies);
    },
    // This function iterates over acquired badges, finding the number of CC or GC wins
    findCCGCWins: function findCCGCWins(type, badges) {
      var name = type === "CC" ? "Classic12Wins" : "Grand12Wins";

      if (typeof badges === "undefined") {
        return "Server error";
      }

      for (var i = 0; i < badges.length; i++) {
        if (badges[i].name === name) {
          return badges[i].progress;
        }
      }

      return 0;
    },
    // This function is used to round a decimal to the specified number of places
    round: function round(num, numPlaces) {
      var tmp = Math.round(num * Math.pow(10, numPlaces));
      return tmp / Math.pow(10, numPlaces);
    },
    // This function returns the proper badge image given the API badge name
    getBadgeImage: function getBadgeImage(name, value) {
      switch (name) {
        case "Classic12Wins":
          {
            return "/images/badges/Classic Challenge.png";
          }

        case "Grand12Wins":
          {
            return "/images/badges/Grand Challenge.png";
          }

        case "Crl20Wins":
          {
            return "/images/badges/CRL Logo.png";
          }

        case "1000Wins":
          {
            return "/images/badges/1000 Wins.png";
          }

        case "Played1Year":
          {
            return "/images/badges/1 Year Badge.png";
          }

        case "Played2Years":
          {
            return "/images/badges/2 Year Badge.png";
          }

        case "Played3Years":
          {
            return "/images/badges/3 Year Badge.png";
          }

        case "LadderTournamentTop1000_1":
          {
            return "/images/badges/Tournament.png";
          }

        case "LadderTournamentTop1000_2":
          {
            return "/images/badges/Tournament.png";
          }

        case "LadderTournamentTop1000_3":
          {
            return "/images/badges/Tournament.png";
          }

        case "LadderTop1000_1":
          {
            return "/images/badges/Trophy.png";
          }

        case "LadderTop1000_2":
          {
            return "/images/badges/Trophy.png";
          }

        case "LadderTop1000_3":
          {
            return "/images/badges/Trophy.png";
          }

        case "TopLeague":
          {
            var league = getLeagueWithTrophies(value);
            return "/images/ladder/".concat(league, ".png");
          }

        case "ClanWarWins":
          {
            return "/images/clans/War Shield v4.png";
          }

        case "Crl20Wins2019":
          {
            return "/images/badges/CRL Logo.png";
          }

        case "Played4Years":
          {
            return "/images/badges/4 Year Badge.png";
          }

        default:
          {
            return "/images/badges/Crying King Emote.png";
          }
      }
    },
    // This function return the proper badge title given the API name
    getBadgeName: function getBadgeName(apiName, value) {
      switch (apiName) {
        case "Classic12Wins":
          {
            return "Classic Challenge 12 Wins";
          }

        case "Grand12Wins":
          {
            return "Grand Challenge 12 Wins";
          }

        case "Crl20Wins":
          {
            return "Clash Royale League";
          }

        case "1000Wins":
          {
            return "1000 Wins";
          }

        case "Played1Year":
          {
            return "Played for 1 Year";
          }

        case "Played2Years":
          {
            return "Played for 2 Years";
          }

        case "Played3Years":
          {
            return "Played for 3 Years";
          }

        case "LadderTournamentTop1000_1":
          {
            return "Global Tournament Finish";
          }

        case "LadderTournamentTop1000_2":
          {
            return "Global Tournament Finish";
          }

        case "LadderTournamentTop1000_3":
          {
            return "Global Tournament Finish";
          }

        case "LadderTop1000_1":
          {
            return "Season Finish";
          }

        case "LadderTop1000_2":
          {
            return "Season Finish";
          }

        case "LadderTop1000_3":
          {
            return "Season Finish";
          }

        case "TopLeague":
          {
            return "Reached ".concat(getLeagueWithTrophies(value));
          }

        case "ClanWarWins":
          {
            return "Clan War Wins";
          }

        case "Crl20Wins2019":
          {
            return "Clash Royale League 2019";
          }

        case "Played4Years":
          {
            return "Played for 4 Years";
          }

        default:
          {
            return "Server Error: Name Not Found";
          }
      }
    },
    displayBadgeValue: function displayBadgeValue(apiName, level, value) {
      switch (apiName) {
        case "Classic12Wins":
          {
            if (level === 1) {
              return "";
            } else {
              return "x" + Math.pow(10, level - 1);
            }
          }

        case "Grand12Wins":
          {
            if (level === 1) {
              return "";
            } else {
              return "x" + Math.pow(10, level - 1);
            }
          }

        case "Crl20Wins":
          {
            return value;
          }

        case "1000Wins":
          {
            return "";
          }

        case "Played1Year":
          {
            return "";
          }

        case "Played2Years":
          {
            return "";
          }

        case "Played3Years":
          {
            return "";
          }

        case "LadderTournamentTop1000_1":
          {
            return "#" + value;
          }

        case "LadderTournamentTop1000_2":
          {
            return "#" + value;
          }

        case "LadderTournamentTop1000_3":
          {
            return "#" + value;
          }

        case "LadderTop1000_1":
          {
            return "#" + value;
          }

        case "LadderTop1000_2":
          {
            return "#" + value;
          }

        case "LadderTop1000_3":
          {
            return "#" + value;
          }

        case "TopLeague":
          {
            return "";
          }

        case "ClanWarWins":
          {
            if (level === 1) {
              return "";
            } else {
              return "x" + Math.pow(10, level - 1);
            }
          }

        case "Crl20Wins2019":
          {
            return value;
          }

        case "Played4Years":
          {
            return "";
          }

        default:
          {
            return "Server Error: Name Not Found";
          }
      }
    },
    // This function gets the right achievement image given the API name and value
    getAchievementImage: function getAchievementImage(apiName, value) {
      switch (apiName) {
        case "Team Player":
          {
            return "/images/achievements/clans.png";
          }

        case "Friend in Need":
          {
            return "/images/achievements/Donations.png";
          }

        case "Road to Glory":
          {
            return "/images/ladder/".concat(getLeagueByArena(value), ".png");
          }

        case "Gatherer":
          {
            return "/images/misc/cards.png";
          }

        case "TV Royale":
          {
            return "/images/achievements/TV Royale.png";
          }

        case "Tournament Rewards":
          {
            return "/images/achievements/Tournament Cards v2.png";
          }

        case "Tournament Host":
          {
            return "/images/challenges/Tournament.png";
          }

        case "Tournament Player":
          {
            return "/images/challenges/Tournament.png";
          }

        case "Challenge Streak":
          {
            return "/images/badges/Classic Challenge.png";
          }

        case "Practice with Friends":
          {
            return "/images/achievements/Friendly Battle.png";
          }

        case "Special Challenge":
          {
            return "/images/achievements/Special Event.png";
          }

        case "Friend in Need II":
          {
            return "/images/achievements/Donations.png";
          }
      }
    },
    // This function return the name of the value (and the value) of an achievement, given the API name and the value
    displayAchievementValue: function displayAchievementValue(apiName, value) {
      switch (apiName) {
        case "Team Player":
          {
            return "Clans Joined: ".concat(value);
          }

        case "Friend in Need":
          {
            return "Cards Donated: ".concat(value);
          }

        case "Road to Glory":
          {
            return "Reached Arena: ".concat(getLeagueByArena(value));
          }

        case "Gatherer":
          {
            return "Cards Found: ".concat(value);
          }

        case "TV Royale":
          {
            // The API does not count the number of replays watched; it only counts whether at least one was actually watched
            if (value === 0) {
              return "TV Royale Replay: Not Watched";
            }

            return "TV Royale Replay: Watched";
          }

        case "Tournament Rewards":
          {
            return "Tournament Cards Won: ".concat(value);
          }

        case "Tournament Host":
          {
            return "Tournaments Hosted: ".concat(value);
          }

        case "Tournament Player":
          {
            return "Tournaments Joined: ".concat(value);
          }

        case "Challenge Streak":
          {
            return "Max Challenge Wins: ".concat(value);
          }

        case "Practice with Friends":
          {
            return "Friendly Battles Won: ".concat(value);
          }

        case "Special Challenge":
          {
            return "Special Challenged Joined: ".concat(value);
          }

        case "Friend in Need II":
          {
            return "Cards Donated: ".concat(value);
          }
      }
    },
    // This function returns the minimums for the various achievement levels given the API Name
    // I got the info from: https://clashroyale.fandom.com/wiki/Achievements
    achievementLevels: function achievementLevels(apiName) {
      var level1 = "<p class=\"text-muted mb-0\" style=\"font-size: 0.8em; padding-left: 22px; text-indent: -22px;\">1 Star: ";
      var level2 = "<p class=\"text-muted mb-0\" style=\"font-size: 0.8em; padding-left: 22px; text-indent: -22px;\">2 Stars: ";
      var level3 = "<p class=\"text-muted mb-0\" style=\"font-size: 0.8em; padding-left: 22px; text-indent: -22px;\">3 Stars: ";
      var toReturn = "";

      switch (apiName) {
        case "Team Player":
          {
            level3 += "Join 1 Clan</p>";
            toReturn += level3;
            return toReturn;
          }

        case "Friend in Need":
          {
            level1 += "Donate 25 Cards</p>";
            level2 += "Donate 250 Cards</p>";
            level3 += "Donate 2500 Cards</p>";
            toReturn = toReturn + level1 + level2 + level3;
            return toReturn;
          }

        case "Road to Glory":
          {
            level1 += "Reach Arena 2</p>";
            level2 += "Reach Arena 4</p>";
            level3 += "Reach Arena 6</p>";
            toReturn = toReturn + level1 + level2 + level3;
            return toReturn;
          }

        case "Gatherer":
          {
            level1 += "Collect 20 Cards</p>";
            level2 += "Collect 30 Cards</p>";
            level3 += "Collect 40 Cards</p>";
            toReturn = toReturn + level1 + level2 + level3;
            return toReturn;
          }

        case "TV Royale":
          {
            level3 += "Watch a TV Royale Replay</p>";
            toReturn += level3;
            return toReturn;
          }

        case "Tournament Rewards":
          {
            level1 += "Win 1,000 Tournament Cards</p>";
            level2 += "Win 20,000 Tournament Cards</p>";
            level3 += "Win 500,000 Tournament Cards</p>";
            toReturn = toReturn + level1 + level2 + level3;
            return toReturn;
          }

        case "Tournament Host":
          {
            level1 += "Host 1 Tournament</p>";
            level2 += "Host 10 Tournaments</p>";
            level3 += "Host 50 Tournaments</p>";
            toReturn = toReturn + level1 + level2 + level3;
            return toReturn;
          }

        case "Tournament Player":
          {
            level3 += "Join a Tournament</p>";
            toReturn += level3;
            return toReturn;
          }

        case "Challenge Streak":
          {
            level1 += "Get 4 Wins in a Challenge</p>";
            level2 += "Get 8 Wins in a Challenge</p>";
            level3 += "Get 12 Wins in a Challenge</p>";
            toReturn = toReturn + level1 + level2 + level3;
            return toReturn;
          }

        case "Practice with Friends":
          {
            level1 += "Win 1 Friendly Battle</p>";
            level2 += "Win 5 Friendly Battles</p>";
            level3 += "Win 10 Friendly Battles</p>";
            toReturn = toReturn + level1 + level2 + level3;
            return toReturn;
          }

        case "Special Challenge":
          {
            level1 += "Play in 1 Special Challenge</p>";
            level2 += "Play in 3 Special Challenges</p>";
            level3 += "Play in 5 Special Challenges</p>";
            toReturn = toReturn + level1 + level2 + level3;
            return toReturn;
          }

        case "Friend in Need II":
          {
            level1 += "Donate 5,000 Cards</p>";
            level2 += "Donate 10,000 Cards</p>";
            level3 += "Donate 25,000 Cards</p>";
            toReturn = toReturn + level1 + level2 + level3;
            return toReturn;
          }
      }
    },
    // This function returns the length of a given object
    objectLength: function objectLength(name) {
      return name.length;
    },
    // This function returns the date that the player started playing
    startDate: function startDate(badges) {
      for (var i = 0; i < badges.length; i++) {
        if (badges[i].name === "Played1Year") {
          var curMs = Date.now();
          var playedMs = badges[i].progress * 24 * 3600 * 1000;
          var originalStartMs = curMs - playedMs;
          var toReturn = new Date(originalStartMs);
          return new Intl.DateTimeFormat([]).format(toReturn);
        }
      }

      return "< 1y";
    },
    // This function corrects the capitalization of stuff I need to correct
    correctCapitalization: function correctCapitalization(value) {
      switch (value) {
        // Next four are for clan roles: member, elder, co-leader, and leader
        case "member":
          {
            return "Member";
          }

        case "elder":
          {
            return "Elder";
          }

        case "coLeader":
          {
            return "Co-leader";
          }

        case "leader":
          {
            return "Leader";
          }
        // Next three are for clan types: open, invite only, and closed

        case "open":
          {
            return "Open";
          }

        case "inviteOnly":
          {
            return "Invite Only";
          }

        case "closed":
          {
            return "Closed";
          }
        // Next two are for tagNotFound.handlebars

        case "players":
          {
            return "Players";
          }

        case "clans":
          {
            return "Clans";
          }
        // Default is for server error or unknown value

        default:
          {
            return "Server Error";
          }
      }
    },
    // This function returns the battle type, given the API game mode id
    // This function works by taking the id to name json object that RoyaleAPI made
    // This can be found at: https://raw.githubusercontent.com/RoyaleAPI/cr-api-data/master/docs/json/game_modes.json
    // The json object is not perfect, so I deal with exceptional cases myself
    gameModeName: function gameModeName(id, json) {
      // The switch statement is for the exceptional cases
      switch (id) {
        case 72000268:
          {
            return "River Race 1v1";
          }

        case 72000267:
          {
            return "Clan War Duel";
          }

        case 72000281:
          {
            return "Hog Race with Mother Witch";
          }

        case 72000226:
        case 72000227:
        case 72000228:
        case 72000229:
        case 72000230:
          {
            return "Nery's Elixir Extravaganza";
          }
      }

      try {
        if (json[id - 72000000].name_en === "") {
          return json[id - 72000000].name;
        } else {
          return json[id - 72000000].name_en;
        }
      } catch (_unused) {
        return "Battle Type Unknown";
      }
    },
    // This function returns a readable date
    readableDate: function readableDate(date) {
      return new Intl.DateTimeFormat([]).format(date);
    },
    // This function performs a single OR or AND
    booleanOperator: function booleanOperator(boolean1, operation, boolean2) {
      switch (operation) {
        case "AND":
          {
            return boolean1 && boolean2;
          }

        case "OR":
          {
            return boolean1 || boolean2;
          }
      }
    },
    // This function gets the right badge image, given the badgeId and the Clan War Trophies
    // It uses the RoyaleAPI CDN
    // For future reference, the below link will save a lot of time:
    // https://github.com/RoyaleAPI/cr-api-data/blob/master/docs/json/alliance_badges.json
    getClanBadge: function getClanBadge(id, cwTrophies) {
      var baseUrl = "https://cdn.royaleapi.com/static/img/badge/";

      switch (true) {
        case cwTrophies < 200:
          {
            baseUrl += "bronze-1/";
            break;
          }

        case cwTrophies < 400:
          {
            baseUrl += "bronze-2/";
            break;
          }

        case cwTrophies < 600:
          {
            baseUrl += "bronze-3/";
            break;
          }

        case cwTrophies < 900:
          {
            baseUrl += "silver-1/";
            break;
          }

        case cwTrophies < 1200:
          {
            baseUrl += "silver-2/";
            break;
          }

        case cwTrophies < 1500:
          {
            baseUrl += "silver-3/";
            break;
          }

        case cwTrophies < 2000:
          {
            baseUrl += "gold-1/";
            break;
          }

        case cwTrophies < 2500:
          {
            baseUrl += "gold-2/";
            break;
          }

        case cwTrophies < 3000:
          {
            baseUrl += "gold-3/";
            break;
          }

        case cwTrophies < 4000:
          {
            baseUrl += "legendary-1/";
            break;
          }

        case cwTrophies < 5000:
          {
            baseUrl += "legendary-2/";
            break;
          }

        default:
          {
            baseUrl += "legendary-3/";
            break;
          }
      }

      switch (id) {
        case 16000000:
          {
            baseUrl += "Flame_01.png";
            break;
          }

        case 16000001:
          {
            baseUrl += "Flame_02.png";
            break;
          }

        case 16000002:
          {
            baseUrl += "Flame_03.png";
            break;
          }

        case 16000003:
          {
            baseUrl += "Flame_04.png";
            break;
          }

        case 16000004:
          {
            baseUrl += "Sword_01.png";
            break;
          }

        case 16000005:
          {
            baseUrl += "Sword_02.png";
            break;
          }

        case 16000006:
          {
            baseUrl += "Sword_03.png";
            break;
          }

        case 16000007:
          {
            baseUrl += "Sword_04.png";
            break;
          }

        case 16000008:
          {
            baseUrl += "Bolt_01.png";
            break;
          }

        case 16000009:
          {
            baseUrl += "Bolt_02.png";
            break;
          }

        case 16000010:
          {
            baseUrl += "Bolt_03.png";
            break;
          }

        case 16000011:
          {
            baseUrl += "Bolt_04.png";
            break;
          }

        case 16000012:
          {
            baseUrl += "Crown_01.png";
            break;
          }

        case 16000013:
          {
            baseUrl += "Crown_02.png";
            break;
          }

        case 16000014:
          {
            baseUrl += "Crown_03.png";
            break;
          }

        case 16000015:
          {
            baseUrl += "Crown_04.png";
            break;
          }

        case 16000016:
          {
            baseUrl += "Arrow_01.png";
            break;
          }

        case 16000017:
          {
            baseUrl += "Arrow_02.png";
            break;
          }

        case 16000018:
          {
            baseUrl += "Arrow_03.png";
            break;
          }

        case 16000019:
          {
            baseUrl += "Arrow_04.png";
            break;
          }

        case 16000020:
          {
            baseUrl += "Diamond_Star_01.png";
            break;
          }

        case 16000021:
          {
            baseUrl += "Diamond_Star_02.png";
            break;
          }

        case 16000022:
          {
            baseUrl += "Diamond_Star_03.png";
            break;
          }

        case 16000023:
          {
            baseUrl += "Diamond_Star_04.png";
            break;
          }

        case 16000024:
          {
            baseUrl += "Skull_01.png";
            break;
          }

        case 16000025:
          {
            baseUrl += "Skull_02.png";
            break;
          }

        case 16000026:
          {
            baseUrl += "Skull_03.png";
            break;
          }

        case 16000027:
          {
            baseUrl += "Skull_04.png";
            break;
          }

        case 16000028:
          {
            baseUrl += "Skull_05.png";
            break;
          }

        case 16000029:
          {
            baseUrl += "Skull_06.png";
            break;
          }

        case 16000030:
          {
            baseUrl += "Moon_01.png";
            break;
          }

        case 16000031:
          {
            baseUrl += "Moon_02.png";
            break;
          }

        case 16000032:
          {
            baseUrl += "Moon_03.png";
            break;
          }

        case 16000033:
          {
            baseUrl += "Pine_01.png";
            break;
          }

        case 16000034:
          {
            baseUrl += "Pine_02.png";
            break;
          }

        case 16000035:
          {
            baseUrl += "Pine_03.png";
            break;
          }

        case 16000036:
          {
            baseUrl += "Traditional_Star_01.png";
            break;
          }

        case 16000037:
          {
            baseUrl += "Traditional_Star_02.png";
            break;
          }

        case 16000038:
          {
            baseUrl += "Traditional_Star_03.png";
            break;
          }

        case 16000039:
          {
            baseUrl += "Traditional_Star_04.png";
            break;
          }

        case 16000040:
          {
            baseUrl += "Traditional_Star_05.png";
            break;
          }

        case 16000041:
          {
            baseUrl += "Traditional_Star_06.png";
            break;
          }

        case 16000042:
          {
            baseUrl += "Star_Shine_01.png";
            break;
          }

        case 16000043:
          {
            baseUrl += "Star_Shine_02.png";
            break;
          }

        case 16000044:
          {
            baseUrl += "Star_Shine_03.png";
            break;
          }

        case 16000045:
          {
            baseUrl += "Diamond_01.png";
            break;
          }

        case 16000046:
          {
            baseUrl += "Diamond_02.png";
            break;
          }

        case 16000047:
          {
            baseUrl += "Diamond_03.png";
            break;
          }

        case 16000048:
          {
            baseUrl += "flag_a_01.png";
            break;
          }

        case 16000049:
          {
            baseUrl += "flag_a_02.png";
            break;
          }

        case 16000050:
          {
            baseUrl += "flag_a_03.png";
            break;
          }

        case 16000051:
          {
            baseUrl += "flag_b_01.png";
            break;
          }

        case 16000052:
          {
            baseUrl += "flag_b_02.png";
            break;
          }

        case 16000053:
          {
            baseUrl += "flag_b_03.png";
            break;
          }

        case 16000054:
          {
            baseUrl += "flag_c_03.png";
            break;
          }

        case 16000055:
          {
            baseUrl += "flag_c_04.png";
            break;
          }

        case 16000056:
          {
            baseUrl += "flag_c_05.png";
            break;
          }

        case 16000057:
          {
            baseUrl += "flag_c_06.png";
            break;
          }

        case 16000058:
          {
            baseUrl += "flag_c_07.png";
            break;
          }

        case 16000059:
          {
            baseUrl += "flag_c_08.png";
            break;
          }

        case 16000060:
          {
            baseUrl += "flag_d_01.png";
            break;
          }

        case 16000061:
          {
            baseUrl += "flag_d_02.png";
            break;
          }

        case 16000062:
          {
            baseUrl += "flag_d_03.png";
            break;
          }

        case 16000063:
          {
            baseUrl += "flag_d_04.png";
            break;
          }

        case 16000064:
          {
            baseUrl += "flag_d_05.png";
            break;
          }

        case 16000065:
          {
            baseUrl += "flag_d_06.png";
            break;
          }

        case 16000066:
          {
            baseUrl += "flag_f_01.png";
            break;
          }

        case 16000067:
          {
            baseUrl += "flag_f_02.png";
            break;
          }

        case 16000068:
          {
            baseUrl += "flag_g_01.png";
            break;
          }

        case 16000069:
          {
            baseUrl += "flag_g_02.png";
            break;
          }

        case 16000070:
          {
            baseUrl += "flag_i_01.png";
            break;
          }

        case 16000071:
          {
            baseUrl += "flag_i_02.png";
            break;
          }

        case 16000072:
          {
            baseUrl += "flag_h_01.png";
            break;
          }

        case 16000073:
          {
            baseUrl += "flag_h_02.png";
            break;
          }

        case 16000074:
          {
            baseUrl += "flag_h_03.png";
            break;
          }

        case 16000075:
          {
            baseUrl += "flag_j_01.png";
            break;
          }

        case 16000076:
          {
            baseUrl += "flag_j_02.png";
            break;
          }

        case 16000077:
          {
            baseUrl += "flag_j_03.png";
            break;
          }

        case 16000078:
          {
            baseUrl += "flag_k_01.png";
            break;
          }

        case 16000079:
          {
            baseUrl += "flag_k_02.png";
            break;
          }

        case 16000080:
          {
            baseUrl += "flag_k_03.png";
            break;
          }

        case 16000081:
          {
            baseUrl += "flag_k_04.png";
            break;
          }

        case 16000082:
          {
            baseUrl += "flag_k_05.png";
            break;
          }

        case 16000083:
          {
            baseUrl += "flag_k_06.png";
            break;
          }

        case 16000084:
          {
            baseUrl += "flag_l_01.png";
            break;
          }

        case 16000085:
          {
            baseUrl += "flag_l_02.png";
            break;
          }

        case 16000086:
          {
            baseUrl += "flag_l_03.png";
            break;
          }

        case 16000087:
          {
            baseUrl += "flag_m_01.png";
            break;
          }

        case 16000088:
          {
            baseUrl += "flag_m_02.png";
            break;
          }

        case 16000089:
          {
            baseUrl += "flag_m_03.png";
            break;
          }

        case 16000090:
          {
            baseUrl += "flag_n_01.png";
            break;
          }

        case 16000091:
          {
            baseUrl += "flag_n_01.png";
            break;
          }

        case 16000092:
          {
            baseUrl += "flag_n_03.png";
            break;
          }

        case 16000093:
          {
            baseUrl += "flag_n_04.png";
            break;
          }

        case 16000094:
          {
            baseUrl += "flag_n_05.png";
            break;
          }

        case 16000095:
          {
            baseUrl += "flag_n_06.png";
            break;
          }

        case 16000096:
          {
            baseUrl += "Twin_Peaks_01.png";
            break;
          }

        case 16000097:
          {
            baseUrl += "Twin_Peaks_02.png";
            break;
          }

        case 16000098:
          {
            baseUrl += "Gem_01.png";
            break;
          }

        case 16000099:
          {
            baseUrl += "Gem_02.png";
            break;
          }

        case 16000100:
          {
            baseUrl += "Gem_03.png";
            break;
          }

        case 16000101:
          {
            baseUrl += "Gem_04.png";
            break;
          }

        case 16000102:
          {
            baseUrl += "Coin_01.png";
            break;
          }

        case 16000103:
          {
            baseUrl += "Coin_02.png";
            break;
          }

        case 16000104:
          {
            baseUrl += "Coin_03.png";
            break;
          }

        case 16000105:
          {
            baseUrl += "Coin_04.png";
            break;
          }

        case 16000106:
          {
            baseUrl += "Elixir_01.png";
            break;
          }

        case 16000107:
          {
            baseUrl += "Elixir_02.png";
            break;
          }

        case 16000108:
          {
            baseUrl += "Heart_01.png";
            break;
          }

        case 16000109:
          {
            baseUrl += "Heart_02.png";
            break;
          }

        case 16000110:
          {
            baseUrl += "Heart_03.png";
            break;
          }

        case 16000111:
          {
            baseUrl += "Heart_04.png";
            break;
          }

        case 16000112:
          {
            baseUrl += "Tower_01.png";
            break;
          }

        case 16000113:
          {
            baseUrl += "Tower_02.png";
            break;
          }

        case 16000114:
          {
            baseUrl += "Tower_03.png";
            break;
          }

        case 16000115:
          {
            baseUrl += "Tower_04.png";
            break;
          }

        case 16000116:
          {
            baseUrl += "Fan_01.png";
            break;
          }

        case 16000117:
          {
            baseUrl += "Fan_02.png";
            break;
          }

        case 16000118:
          {
            baseUrl += "Fan_03.png";
            break;
          }

        case 16000119:
          {
            baseUrl += "Fan_04.png";
            break;
          }

        case 16000120:
          {
            baseUrl += "Fugi_01.png";
            break;
          }

        case 16000121:
          {
            baseUrl += "Fugi_02.png";
            break;
          }

        case 16000122:
          {
            baseUrl += "Fugi_03.png";
            break;
          }

        case 16000123:
          {
            baseUrl += "Fugi_04.png";
            break;
          }

        case 16000124:
          {
            baseUrl += "YingYang_01.png";
            break;
          }

        case 16000125:
          {
            baseUrl += "YingYang_02.png";
            break;
          }

        case 16000126:
          {
            baseUrl += "flag_c_01.png";
            break;
          }

        case 16000127:
          {
            baseUrl += "flag_c_02.png";
            break;
          }

        case 16000128:
          {
            baseUrl += "Cherry_Blossom_01.png";
            break;
          }

        case 16000129:
          {
            baseUrl += "Cherry_Blossom_02.png";
            break;
          }

        case 16000130:
          {
            baseUrl += "Cherry_Blossom_03.png";
            break;
          }

        case 16000131:
          {
            baseUrl += "Cherry_Blossom_04.png";
            break;
          }

        case 16000132:
          {
            baseUrl += "Cherry_Blossom_06.png";
            break;
          }

        case 16000133:
          {
            baseUrl += "Cherry_Blossom_05.png";
            break;
          }

        case 16000134:
          {
            baseUrl += "Cherry_Blossom_07.png";
            break;
          }

        case 16000135:
          {
            baseUrl += "Cherry_Blossom_08.png";
            break;
          }

        case 16000136:
          {
            baseUrl += "Bamboo_01.png";
            break;
          }

        case 16000137:
          {
            baseUrl += "Bamboo_02.png";
            break;
          }

        case 16000138:
          {
            baseUrl += "Bamboo_03.png";
            break;
          }

        case 16000139:
          {
            baseUrl += "Bamboo_04.png";
            break;
          }

        case 16000140:
          {
            baseUrl += "Orange_01.png";
            break;
          }

        case 16000141:
          {
            baseUrl += "Orange_02.png";
            break;
          }

        case 16000142:
          {
            baseUrl += "Lotus_01.png";
            break;
          }

        case 16000143:
          {
            baseUrl += "Lotus_02.png";
            break;
          }

        case 16000144:
          {
            baseUrl += "A_Char_King_01.png";
            break;
          }

        case 16000145:
          {
            baseUrl += "A_Char_King_02.png";
            break;
          }

        case 16000146:
          {
            baseUrl += "A_Char_King_03.png";
            break;
          }

        case 16000147:
          {
            baseUrl += "A_Char_King_04.png";
            break;
          }

        case 16000148:
          {
            baseUrl += "A_Char_Barbarian_01.png";
            break;
          }

        case 16000149:
          {
            baseUrl += "A_Char_Barbarian_02.png";
            break;
          }

        case 16000150:
          {
            baseUrl += "A_Char_Prince_01.png";
            break;
          }

        case 16000151:
          {
            baseUrl += "A_Char_Prince_02.png";
            break;
          }

        case 16000152:
          {
            baseUrl += "A_Char_Knight_01.png";
            break;
          }

        case 16000153:
          {
            baseUrl += "A_Char_Knight_02.png";
            break;
          }

        case 16000154:
          {
            baseUrl += "A_Char_Goblin_01.png";
            break;
          }

        case 16000155:
          {
            baseUrl += "A_Char_Goblin_02.png";
            break;
          }

        case 16000156:
          {
            baseUrl += "A_Char_DarkPrince_01.png";
            break;
          }

        case 16000157:
          {
            baseUrl += "A_Char_DarkPrince_02.png";
            break;
          }

        case 16000158:
          {
            baseUrl += "A_Char_DarkPrince_03.png";
            break;
          }

        case 16000159:
          {
            baseUrl += "A_Char_DarkPrince_04.png";
            break;
          }

        case 16000160:
          {
            baseUrl += "A_Char_MiniPekka_01.png";
            break;
          }

        case 16000161:
          {
            baseUrl += "A_Char_MiniPekka_02.png";
            break;
          }

        case 16000162:
          {
            baseUrl += "A_Char_Pekka_01.png";
            break;
          }

        case 16000163:
          {
            baseUrl += "A_Char_Pekka_02.png";
            break;
          }

        case 16000164:
          {
            baseUrl += "A_Char_Hammer_01.png";
            break;
          }

        case 16000165:
          {
            baseUrl += "A_Char_Hammer_02.png";
            break;
          }

        case 16000166:
          {
            baseUrl += "A_Char_Rocket_01.png";
            break;
          }

        case 16000167:
          {
            baseUrl += "A_Char_Rocket_02.png";
            break;
          }

        case 16000168:
          {
            baseUrl += "Freeze_01.png";
            break;
          }

        case 16000169:
          {
            baseUrl += "Freeze_02.png";
            break;
          }

        case 16000170:
          {
            baseUrl += "Clover_01.png";
            break;
          }

        case 16000171:
          {
            baseUrl += "Clover_02.png";
            break;
          }

        case 16000172:
          {
            baseUrl += "flag_h_04.png";
            break;
          }

        case 16000173:
          {
            baseUrl += "flag_e_02.png";
            break;
          }

        case 16000174:
          {
            baseUrl += "flag_i_03.png";
            break;
          }

        case 16000175:
          {
            baseUrl += "flag_e_01.png";
            break;
          }

        case 16000176:
          {
            baseUrl += "A_Char_Barbarian_03.png";
            break;
          }

        case 16000177:
          {
            baseUrl += "A_Char_Prince_03.png";
            break;
          }

        case 16000178:
          {
            baseUrl += "A_Char_Bomb_01.png";
            break;
          }

        case 16000179:
          {
            baseUrl += "A_Char_Bomb_02.png";
            break;
          }

        default:
          {
            baseUrl += "no_clan.png";
            break;
          }
      }

      return baseUrl;
    },
    // This function returns the average elixir cost of a deck
    // There is a start and end so I can deal with duels as well
    averageElixirCost: function averageElixirCost(cards, deck, start, end) {
      var sum = 0;

      deck: for (var i = start; i < end; i++) {
        var name = deck[i].name;

        for (var j = 0; j < cards.length; j++) {
          if (cards[j].name === name) {
            sum += cards[j].elixir;
            continue deck;
          }
        }
      } //  Returning and adding a ".0" at the end of an integer


      var toReturn = Math.round(sum / 8 * 10) / 10;

      if (Number.isInteger(toReturn)) {
        return toReturn + ".0";
      } else {
        return toReturn;
      }
    },
    // This function gets the 4-card cycle of a deck
    // There is a start and end so I can deal with duels
    fourCardCycle: function fourCardCycle(cards, deck, start, end) {
      var elixirCosts = [];

      deck: for (var i = start; i < end; i++) {
        var name = deck[i].name;

        for (var j = 0; j < cards.length; j++) {
          if (cards[j].name === name) {
            elixirCosts.push(cards[j].elixir);
            continue deck;
          }
        }
      }

      elixirCosts.sort();
      return elixirCosts[0] + elixirCosts[1] + elixirCosts[2] + elixirCosts[3];
    },
    // This function returns the link to copy the deck in-game
    // There is a start and end so I can deal with duels
    inGameLink: function inGameLink(cards, deck, start, end) {
      var baseLink = "https://link.clashroyale.com/deck/en?deck=";

      deck: for (var i = start; i < end; i++) {
        var name = deck[i].name;

        for (var j = 0; j < cards.length; j++) {
          if (cards[j].name === name) {
            baseLink = baseLink + cards[j].id + ";";
            continue deck;
          }
        }
      } // Omitting last character because that is an unnecessary semicolon


      return baseLink.substring(0, baseLink.length - 1);
    },
    // This function returns the health of the specified tower
    // For value, 0 is king tower, 1 is one princess tower, and 2 is the other
    getTowerHealth: function getTowerHealth(kingHealth, princessHealths, value) {
      switch (value) {
        case 0:
          {
            if (typeof kingHealth === "undefined") {
              return 0;
            } else {
              return kingHealth;
            }
          }

        case 1:
          {
            if (typeof princessHealths === "undefined") {
              return 0;
            } else {
              return princessHealths[0];
            }
          }

        case 2:
          {
            if (typeof princessHealths === "undefined" || princessHealths.length === 1) {
              return 0;
            } else {
              return princessHealths[1];
            }
          }

        case 3:
          {
            // All towers are gone
            if (typeof kingHealth === "undefined") {
              return 0;
            } // Both princess towers are gone


            if (typeof princessHealths === "undefined") {
              return kingHealth;
            } // One princess tower is gone


            if (princessHealths.length === 1) {
              return kingHealth + princessHealths[0];
            } // No tower is gone


            return kingHealth + princessHealths[0] + princessHealths[1];
          }

        default:
          {
            return "Server Error";
          }
      }
    }
  };

  if (Handlebars && typeof Handlebars.registerHelper === "function") {
    for (var prop in helpers) {
      Handlebars.registerHelper(prop, helpers[prop]);
    }
  } else {
    return helpers;
  }
};

module.exports.register = register;
module.exports.helpers = register(null);