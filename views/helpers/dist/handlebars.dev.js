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
    dateDifference: function dateDifference(pastDate) {
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
      var dayWord = "days";

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

      for (var i = 0; i < 8; i++) {
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

      return (teamCardSum - oppCardSum) / 8;
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
    findVictor: function findVictor(teamCrowns, opponentCrowns) {
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
          return "".concat(toReturn.getFullYear(), "-").concat(toReturn.getMonth() + 1, "-").concat(toReturn.getDate());
        }
      }

      return "< 1y";
    },
    // This function corrects the capitalization that the API uses
    correctClanRoleCapitalization: function correctClanRoleCapitalization(role) {
      switch (role) {
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