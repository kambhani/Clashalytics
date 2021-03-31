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

  function getDateDifference(oldDate, newDate, returnExpanded) {
    var timeDiffSec = Math.round((newDate.getTime() - oldDate.getTime()) / 1000);
    var seconds = timeDiffSec % 60;
    var minutes = Math.floor(timeDiffSec / 60);
    var hours = Math.floor(minutes / 60);
    minutes = minutes % 60;
    var days = Math.floor(hours / 24);
    hours = hours % 24;
    var hourWord = "hours";
    var minuteWord = "minutes";
    var secondWord = "seconds";
    var dayWord = "days"; // Use abbreviations on a small screen

    if (returnExpanded === 0) {
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
          return "".concat(minutes, " ").concat(minuteWord, " and ").concat(seconds, " ").concat(secondWord, " ago");
        }
      } else {
        return "".concat(hours, " ").concat(hourWord, ", ").concat(minutes, " ").concat(minuteWord, ", and ").concat(seconds, " ").concat(secondWord, " ago");
      }
    } else {
      return "".concat(days, " ").concat(dayWord, ", ").concat(hours, " ").concat(hourWord, ", ").concat(minutes, " ").concat(minuteWord, ", and ").concat(seconds, " ").concat(secondWord, " ago");
    }
  }

  var helpers = {
    // Calculates the acutal card level (since the API uses outdated ones)
    calculateCardLevel: function calculateCardLevel(oldLevel, oldMaxLevel) {
      return 13 - oldMaxLevel + oldLevel;
    },
    // Finds the difference between when a date and the current time
    dateDifference: function dateDifference(pastDate, isLargeScreen) {
      // Date is processed like it is given in the Clash Royale API
      // The format is: YYYYMMDDTHHMMSS.000Z
      if (typeof pastDate === "undefined") {
        return "server error";
      }

      var oldDate = new Date(Date.UTC(pastDate.substring(0, 4), pastDate.substring(4, 6) - 1, pastDate.substring(6, 8), pastDate.substring(9, 11), pastDate.substring(11, 13), pastDate.substring(13, 15)));
      var newDate = new Date();
      return getDateDifference(oldDate, newDate, isLargeScreen);
    },
    // Calculates the average level difference between the team and the opponent
    levelDifference: function levelDifference(t0, t1, opp0, opp1) {
      var teamCardSum = 0;
      var oppCardSum = 0;

      try {
        for (var i = 0; i < t0.length; i++) {
          teamCardSum += 13 - t0[i].maxLevel + t0[i].level;
          oppCardSum += 13 - opp0[i].maxLevel + opp0[i].level;

          if (t1) {
            teamCardSum += 13 - t1[i].maxLevel + t1[i].level;
            oppCardSum += 13 - opp1[i].maxLevel + opp1[i].level;
          }
        }
      } catch (error) {
        return "n/a";
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

        case ">=":
          if (a >= b) {
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
            return "/images/badges/webp/Classic Challenge.webp";
          }

        case "Grand12Wins":
          {
            return "/images/badges/webp/Grand Challenge.webp";
          }

        case "Crl20Wins":
          {
            return "/images/badges/CRL Logo.png";
          }

        case "1000Wins":
          {
            return "/images/badges/webp/1000 Wins.webp";
          }

        case "Played1Year":
          {
            return "/images/badges/webp/1 Year Badge.webp";
          }

        case "Played2Years":
          {
            return "/images/badges/webp/2 Year Badge.webp";
          }

        case "Played3Years":
          {
            return "/images/badges/webp/3 Year Badge.webp";
          }

        case "LadderTournamentTop1000_1":
        case "LadderTournamentTop1000_2":
        case "LadderTournamentTop1000_3":
          {
            return "/images/badges/webp/Tournament.webp";
          }

        case "LadderTop1000_1":
        case "LadderTop1000_2":
        case "LadderTop1000_3":
          {
            return "/images/badges/webp/trophy.webp";
          }

        case "TopLeague":
          {
            var league = getLeagueWithTrophies(value);
            return "/images/ladder/webp/".concat(league, ".webp");
          }

        case "ClanWarWins":
          {
            return "/images/clans/webp/War Shield.webp";
          }

        case "Crl20Wins2019":
          {
            return "/images/badges/CRL Logo.png";
          }

        case "Played4Years":
          {
            return "/images/badges/webp/4 Year Badge.webp";
          }

        case "Played5Years":
          {
            return "/images/badges/webp/5 Year Badge.webp";
          }

        default:
          {
            return "/images/badges/webp/Crying King Emote.webp";
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

        case "Played5Years":
          {
            return "Played for 5 Years";
          }

        default:
          {
            return apiName;
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

        case "Played5Years":
          {
            return "";
          }

        default:
          {
            return "";
          }
      }
    },
    // This function gets the right achievement image given the API name and value
    getAchievementImage: function getAchievementImage(apiName, value) {
      switch (apiName) {
        case "Team Player":
          {
            return "/images/achievements/webp/Clans.webp";
          }

        case "Friend in Need":
          {
            return "/images/achievements/webp/Donations.webp";
          }

        case "Road to Glory":
          {
            return "/images/ladder/webp/".concat(getLeagueByArena(value), ".webp");
          }

        case "Gatherer":
          {
            return "/images/misc/webp/cards.webp";
          }

        case "TV Royale":
          {
            return "/images/achievements/webp/TV Royale.webp";
          }

        case "Tournament Rewards":
          {
            return "/images/achievements/webp/Tournament Cards.webp";
          }

        case "Tournament Host":
          {
            return "/images/badges/webp/Tournament.webp";
          }

        case "Tournament Player":
          {
            return "/images/badges/webp/Tournament.webp";
          }

        case "Challenge Streak":
          {
            return "/images/badges/webp/Classic Challenge.webp";
          }

        case "Practice with Friends":
          {
            return "/images/achievements/webp/Friendly Battle.webp";
          }

        case "Special Challenge":
          {
            return "/images/achievements/webp/Special Event.webp";
          }

        case "Friend in Need II":
          {
            return "/images/achievements/webp/Donations.webp";
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
        // Next one is for tournament type — open is already checked for above

        case "passwordProtected":
          {
            return "Password Protected";
          }
        // Next three are for tournament statuses

        case "inPreparation":
          {
            return "In Preparation";
          }

        case "inProgress":
          {
            return "In Progress";
          }

        case "ended":
          {
            return "Ended";
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
    gameModeName: function gameModeName(id, json, challengeTitle) {
      // The switch statement is for the exceptional cases
      switch (id) {
        case 72000009:
          {
            return "Tournament";
          }

        case 72000010:
          {
            return challengeTitle === "" ? "Challenge" : challengeTitle;
          }

        case 72000226:
        case 72000227:
        case 72000228:
        case 72000229:
        case 72000230:
          {
            return "Nery's Elixir Extravaganza";
          }

        case 72000267:
          {
            return "Clan War Duel";
          }

        case 72000268:
          {
            return "River Race 1v1";
          }

        case 72000281:
          {
            return "Hog Race with Mother Witch";
          }

        case 72000283:
          {
            return "Princess Build-A-Deck";
          }

        case 72000284:
          {
            return "Prince Build-A-Deck";
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
      // Converts the Clash Royale API date to a proper Javascript one
      if (typeof date === "string" && date.charAt(date.length - 1) === "Z") {
        date = new Date(Date.UTC(date.substring(0, 4), date.substring(4, 6) - 1, date.substring(6, 8), date.substring(9, 11), date.substring(11, 13), date.substring(13, 15)));
      }

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
    getClanBadge: function getClanBadge(id, cwTrophies, clanBadgeJson) {
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

      for (var i = 0; i < clanBadgeJson.length; i++) {
        if (clanBadgeJson[i].id === id) {
          baseUrl += clanBadgeJson[i].name + ".png";
          return baseUrl;
        }
      }

      baseUrl += "no_clan.png";
      return baseUrl;
    },
    // This function returns the average elixir cost of a deck
    // There is a start and end so I can deal with duels as well
    averageElixirCost: function averageElixirCost(cards, deck, start, end) {
      var sum = 0;
      var name;

      deck: for (var i = start; i < end; i++) {
        try {
          name = deck[i].name;
        } catch (error) {
          // If here, then the inputted deck somehow did not have eight cards
          return "n/a";
        }

        name = deck[i].name;

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
      var name;

      deck: for (var i = start; i < end; i++) {
        try {
          name = deck[i].name;
        } catch (error) {
          return "n/a";
        }

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
      var name;

      deck: for (var i = start; i < end; i++) {
        try {
          name = deck[i].name;
        } catch (error) {
          return "#";
        }

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
    },
    // This function returns the card name, given the card id
    getCardNameFromID: function getCardNameFromID(cardJson, id) {
      for (var i = 0; i < cardJson.length; i++) {
        if (cardJson[i].id === id) {
          return cardJson[i].name;
        }
      }

      return "Server Error";
    },
    // This function converts the db battle outcome to a readable one
    // -1 is a loss, 0 is a draw, and 1 is a victory
    battleOutcomeFromNumber: function battleOutcomeFromNumber(outcome) {
      switch (outcome) {
        case 1:
          {
            return "Victory";
          }

        case 0:
          {
            return "Draw";
          }

        case -1:
          {
            return "Defeat";
          }

        default:
          {
            return "Unknown";
          }
      }
    },
    // This function takes a number and adds a "+" to it if the number is positive (n > 0)
    // Useful if "+5" is prefered over "5"
    addPlusToNumber: function addPlusToNumber(num) {
      if (num <= 0) {
        return num;
      } else {
        return "+" + num;
      }
    },
    // This function returns the time between two dates
    // dateDifference only allows the difference from the current date
    twoDateDifference: function twoDateDifference(pastDate, futureDate, specialCode) {
      // Special processing for specialCode === 1
      if (specialCode === 1 && typeof futureDate === "undefined" && typeof pastDate !== "undefined") {
        return "Not Completed";
      } //General check to prevent substring errors later on


      if (typeof pastDate === "undefined" || typeof futureDate === "undefined") {
        return "Server Error";
      } // Wrote this here just in case
      // Won't likely use it since I could just use dateDifference instead


      if (futureDate === "now") {
        // Rewriting the current date in the Clash Royale API form
        var tmp = new Date();
        futureDate = tmp.getUTCFullYear() + tmp.getUTCMonth() + tmp.getUTCDate() + "T" + tmp.getUTCHours() + tmp.getUTCMinutes() + tmp.getUTCSeconds() + ".000Z";
      } // Date is processed like it is given in the Clash Royale API
      // The format is: YYYYMMDDTHHMMSS.000Z


      var oldDate = new Date(Date.UTC(pastDate.substring(0, 4), pastDate.substring(4, 6) - 1, pastDate.substring(6, 8), pastDate.substring(9, 11), pastDate.substring(11, 13), pastDate.substring(13, 15)));
      var newDate = new Date(Date.UTC(futureDate.substring(0, 4), futureDate.substring(4, 6) - 1, futureDate.substring(6, 8), futureDate.substring(9, 11), futureDate.substring(11, 13), futureDate.substring(13, 15))); // Special codes let me do special rendering to specific time requests

      switch (specialCode) {
        case 1:
          {
            // In clanInfo.hbs, deals with inaccurate createdDate in riverRaceLog
            oldDate = new Date(oldDate.getTime() - 7 * 24 * 3600 * 1000);
          }
      }

      var timeDiffSec = Math.round((newDate.getTime() - oldDate.getTime()) / 1000);
      var seconds = timeDiffSec % 60;
      var minutes = Math.floor(timeDiffSec / 60);
      var hours = Math.floor(minutes / 60);
      minutes = minutes % 60;
      var days = Math.floor(hours / 24);
      hours = hours % 24;

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
    },
    // This function returns the total number of boat attacks, given the participant list
    totalBoatAttacks: function totalBoatAttacks(participantList) {
      var totalBoatAttacks = 0;

      for (var i = 0; i < participantList.length; i++) {
        totalBoatAttacks += participantList[i].boatAttacks;
      }

      return totalBoatAttacks;
    },
    // This function concats all the values given in arr
    concat: function concat() {
      var toReturn = ""; // Last argument is not used as that is "options"

      for (var i = 0; i < arguments.length - 1; i++) {
        toReturn += arguments[i];
      }

      return toReturn;
    },
    // This function returns the total number of decks used, given the participant list
    totalDecksUsed: function totalDecksUsed(participantList) {
      var totalDecksUsed = 0;

      for (var i = 0; i < participantList.length; i++) {
        totalDecksUsed += participantList[i].decksUsed;
      }

      return totalDecksUsed;
    },
    // This function returns the time elapsed since the end of a tournament
    getTimeSinceTournamentEnd: function getTimeSinceTournamentEnd(startedTime, duration) {
      if (startedTime) {
        var startDate = new Date(Date.UTC(startedTime.substring(0, 4), startedTime.substring(4, 6) - 1, startedTime.substring(6, 8), startedTime.substring(9, 11), startedTime.substring(11, 13), startedTime.substring(13, 15)));

        if (Date.now() > startDate.getTime() + duration * 1000) {
          var endDate = new Date(startDate.getTime() + duration * 1000);
          return getDateDifference(endDate, new Date(), 0);
        } else {
          return "";
        }
      } else {
        return "";
      }
    },
    // This function returns the clan badge name from the id (function name is self-explanatory)
    getClanBadgeNameFromId: function getClanBadgeNameFromId(badgeId, clanBadgeJson) {
      for (var i = 0; i < clanBadgeJson.length; i++) {
        if (clanBadgeJson[i].id === badgeId) {
          return clanBadgeJson[i].name;
        }
      }

      return "Unknown";
    },
    // This function returns the proper picture, given a global tournament tier object
    getGtTierPicture: function getGtTierPicture(tierObject) {
      switch (tierObject.type) {
        case "tradeToken":
          {
            return "/images/resources/webp/trade_token_".concat(tierObject.rarity, ".webp");
          }

        case "resource":
          {
            if (tierObject.resource === "gold") {
              return "/images/resources/webp/gold.webp";
            } else if (tierObject.resource === "unknown") {
              // For whatever reason, 'unknown' just means that the reward is in gems
              return "/images/resources/webp/gem.webp";
            }
          }

        case "chest":
          {
            switch (tierObject.chest) {
              // All the normal chest names
              case "Legendary":
              case "Epic":
              case "Giant":
              case "Lightning":
                {
                  return "/images/chests/webp/".concat(tierObject.chest, " Chest.webp");
                }
              // Special Exceptions

              case "Kings":
                {
                  return "/images/chests/webp/Legendary King's Chest.webp";
                }

              case "Magic":
                {
                  return "/images/chests/webp/Magical Chest.webp";
                }
            }
          }

        default:
          {
            return "/images/misc/svg/question_circle.svg";
          }
      }
    },
    // This function works similarly to getGtTierPicture, except that it returns the alt text
    getGtTierPictureAltText: function getGtTierPictureAltText(tierObject) {
      switch (tierObject.type) {
        case "tradeToken":
          {
            return "".concat(tierObject.rarity, " trade token");
          }

        case "resource":
          {
            if (tierObject.resource === "gold") {
              return "Gold";
            } else if (tierObject.resource === "unknown") {
              // For whatever reason, 'unknown' just means that the reward is in gems
              return "Gem";
            }
          }

        case "chest":
          {
            switch (tierObject.chest) {
              // All the normal chest names
              case "Legendary":
              case "Epic":
              case "Giant":
              case "Lightning":
                {
                  return "".concat(tierObject.chest, " Chest");
                }
              // Special Exceptions

              case "Kings":
                {
                  return "Legendary King's Chest";
                }

              case "Magic":
                {
                  return "Magical Chest";
                }
            }
          }

        default:
          {
            return "Unknown";
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