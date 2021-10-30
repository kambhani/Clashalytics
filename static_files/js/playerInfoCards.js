// Fetch Card Info JSON
let cardJson = [];
fetch ("https://royaleapi.github.io/cr-api-data/json/cards.json")
  .then(res => res.json())
  .then((json) => {
    cardJson = json;
  })
  .catch((err) => {
    console.log(err);
  });

// These arrays are simply a backup in case the fetch request for the RoyaleAPI card info fails
const commons = ["Archers", "Arrows", "Barbarians", "Bats", "Bomber", "Cannon", "Electro Spirit", "Elite Barbarians", "Fire Spirit", "Firecracker", "Giant Snowball", "Goblin Gang", "Goblins", "Ice Spirit", "Knight", "Minion Horde", "Minions", "Mortar", "Rascals", "Royal Delivery", "Royal Giant", "Royal Recruits", "Skeleton Barrel", "Skeleton Dragons", "Skeletons", "Spear Goblins", "Tesla", "Zap"];
const rares = ["Barbarian Hut", "Battle Healer", "Battle Ram", "Bomb Tower", "Dart Goblin", "Earthquake", "Elixir Collector", "Elixir Golem", "Fireball", "Flying Machine", "Furnace", "Giant", "Goblin Cage", "Goblin Hut", "Heal Spirit", "Hog Rider", "Ice Golem", "Inferno Tower", "Mega Minion", "Mini P.E.K.K.A", "Musketeer", "Rocket", "Royal Hogs", "Three Musketeers", "Tombstone", "Valkyrie", "Wizard", "Zappies"];
const epics = ["Baby Dragon", "Balloon", "Barbarian Barrel", "Bowler", "Cannon Cart", "Clone", "Dark Prince", "Electro Dragon", "Electro Giant", "Executioner", "Freeze", "Giant Skeleton", "Goblin Barrel", "Goblin Drill", "Goblin Giant", "Golem", "Guards", "Hunter", "Lightning", "Mirror", "P.E.K.K.A", "Poison", "Prince", "Rage", "Skeleton Army", "Tornado", "Wall Breakers", "Witch", "X-Bow"];
const legendaries = ["Bandit", "Electro Wizard", "Fisherman", "Graveyard", "Ice Wizard", "Inferno Dragon", "Lava Hound", "Lumberjack", "Magic Archer", "Mega Knight", "Miner", "Mother Witch", "Night Witch", "Princess", "Ram Rider", "Royal Ghost", "Sparky", "The Log"];
const champions = ["Archer Queen", "Golden Knight", "Skeleton King"]

const zeroElixir = ["Mirror"];
const oneElixir = ["Electro Spirit", "Fire Spirit", "Heal Spirit", "Ice Spirit", "Skeletons"];
const twoElixir = ["Barbarian Barrel", "Bats", "Bomber", "Giant Snowball", "Goblins", "Ice Golem", "Rage", "Spear Goblins", "The Log", "Wall Breakers", "Zap"];
const threeElixir = ["Archers", "Arrows", "Bandit", "Cannon", "Clone", "Dart Goblin", "Earthquake", "Elixir Golem", "Firecracker", "Fisherman", "Goblin Barrel", "Goblin Gang", "Guards", "Ice Wizard", "Knight", "Mega Minion", "Miner", "Minions", "Princess", "Royal Delivery", "Royal Ghost", "Skeleton Army", "Skeleton Barrel", "Tombstone", "Tornado"];
const fourElixir = ["Baby Dragon", "Battle Healer", "Battle Ram", "Bomb Tower", "Dark Prince", "Electro Wizard", "Fireball", "Flying Machine", "Freeze", "Furnace", "Goblin Cage", "Goblin Drill", "Golden Knight", "Hog Rider", "Hunter", "Inferno Dragon", "Lumberjack", "Magic Archer", "Mini P.E.K.K.A", "Mortar", "Mother Witch", "Musketeer", "Night Witch", "Poison", "Skeleton Dragons", "Skeleton King", "Tesla", "Valkyrie", "Zappies"];
const fiveElixir = ["Archer Queen", "Balloon", "Barbarians", "Bowler", "Cannon Cart", "Electro Dragon", "Executioner", "Giant", "Goblin Hut", "Graveyard", "Inferno Tower", "Lightning", "Minion Horde", "Prince", "Ram Rider", "Rascals", "Rocket", "Royal Hogs", "Witch", "Wizard"];
const sixElixir = ["Elite Barbarians", "Elixir Collector", "Giant Skeleton", "Goblin Giant", "Royal Giant", "Sparky", "X-Bow"];
const sevenElixir = ["Barbarian Hut", "Lava Hound", "Mega Knight", "P.E.K.K.A", "Royal Recruits"];
const eightElixir = ["Electro Giant", "Golem"];
const nineElixir = ["Three Musketeers"];

// Custom CSS styling for the cards table (small screen)
$("#cards_table").children("thead").css({"background-color": "#343a40", "color": "#ffffff"});
$("#cards_table").find("th").css({"border-left-color": "#454d55", "border-right-color": "#454d55"});
$(".cards-sortable-column").mouseover(function() {
  $(this).css({"background-color": "#232930", "cursor": "pointer"});
});
$(".cards-sortable-column").mouseout(function() {
  $(this).css({"background-color": "#343a40", "cursor": "initial"});
});

// This code is for the sort feature on the cards table (small screen only)
let directions = [1, Number.NEGATIVE_INFINITY, 1, 1, 1];
function sortTable(n) {
  directions[n] = (directions[n] + 1) % 2;
  let table = document.getElementById("cards_table");
  let newTable;
  let rows = table.rows;
  let dir = directions[n];
  // This code segment toggles the up and down arrows
  let upArrows = document.getElementsByClassName("up-arrow-sort");
  let downArrows = document.getElementsByClassName("down-arrow-sort");
  for (let i = 0; i < 4; i++) {
    upArrows[i].classList.add("d-none");
    downArrows[i].classList.add("d-none");
  }
  let arrowIndex = n;
  if (n > 1) {
    arrowIndex--;
  }
  if (directions[n] === 0) {
    upArrows[arrowIndex].classList.remove("d-none");
  } else {
    downArrows[arrowIndex].classList.remove("d-none");
  }
  // This is the actual sort algorithm
  for (let i = 1; i < rows.length - 1; i++) {
    let toAddIndex = i;
    let toAdd;
    if (n === 0) {
      toAdd = rows[i].getElementsByTagName("TD")[n].innerHTML.toLowerCase();
    } else {
      toAdd = rows[i].getElementsByTagName("TD")[n].innerHTML;
      if (n === 2) {
        toAdd = parseInt(toAdd);
      } else if (n === 3) {
        if (toAdd === "MAX") {
          toAdd = 1000000;
        } else {
          toAdd = toAdd.replace("/", "");
          let arr = toAdd.split(" ");
          toAdd = parseInt(arr[0]) / parseInt(arr[2]);
        }
      } else if (n === 4) {
        switch (toAdd) {
          case "Common": {
            toAdd = 1;
            break;
          }
          case "Rare": {
            toAdd = 2;
            break;
          }
          case "Epic": {
            toAdd = 3;
            break;
          }
          case "Legendary": {
            toAdd = 4;
            break;
          }
          case "Champion": {
            toAdd = 5;
            break;
          }
          default: {
            toAdd = 0;
            break;
          }
        }
      }
    }
    for (let j = i + 1; j < rows.length; j++) {
      let toCheck;
      if (n === 0) {
        toCheck = rows[j].getElementsByTagName("TD")[n].innerHTML.toLowerCase();
      } else {
        toCheck = rows[j].getElementsByTagName("TD")[n].innerHTML;
        if (n === 2) {
          toCheck = parseInt(toCheck);
        } else if (n === 3) {
          if (toCheck === "MAX") {
            toCheck = 1000000;
          } else {
            toCheck = toCheck.replace("/", "");
            let arr2 = toCheck.split(" ");
            toCheck = parseInt(arr2[0]) / parseInt(arr2[2]);
          }
        } else if (n === 4) {
          switch (toCheck) {
            case "Common": {
              toCheck = 1;
              break;
            }
            case "Rare": {
              toCheck = 2;
              break;
            }
            case "Epic": {
              toCheck = 3;
              break;
            }
            case "Legendary": {
              toCheck = 4;
              break;
            }
            case "Champion": {
              toCheck = 5;
              break;
            }
            default: {
              toCheck = 0;
              break;
            }
          }
        }
      }
      if (dir === 0 && toCheck < toAdd) {
          toAddIndex = j;
          toAdd = toCheck;
      } else if (dir === 1 && toCheck > toAdd) {
          toAddIndex = j;
          toAdd = toCheck;
      }
    }
    if (i !== toAddIndex) {
      rows[i].parentNode.insertBefore(rows[toAddIndex], rows[i]);
      rows[i + 1].parentNode.insertBefore(rows[i + 1], rows[toAddIndex + 1]);
    }
  }
}

// Dropdown Menu JS (Cards section, large screen)
$("#cardSortTypeOptions p").on("click", function (e) {
  let selectedText = $(this).text();
  if($("#cardSortType").text() !== selectedText) {
    $("#cardSortType").text(selectedText);
    if (!$("#cardSortOrder").text().includes("Sort Order")) {
      sortCards();
    }
  }
});
$("#cardSortOrderOptions p").on("click", function (e) {
  let selectedText = $(this).text();
  if($("#cardSortOrder").text() !== selectedText) {
    $("#cardSortOrder").text(selectedText);
    if (!$("#cardSortType").text().includes("Sort Type")) {
      sortCards();
    }
  }
});

function sortCards() {
  let sortType = $("#cardSortType").text();
  let sortOrder = $("#cardSortOrder").text();

  // Got the general sorting code from: http://jsfiddle.net/hibbard_eu/C2heg/
  switch (sortType) {
    case ("Name"): {
      if (sortOrder === "Ascending") {
        $("#cardListDisplay").html($("#cardListDisplay").children().sort(function (a, b) {
          return $(a).find("h5").text() > $(b).find("h5").text();
        }));
      } else {
        $("#cardListDisplay").html($("#cardListDisplay").children().sort(function (a, b) {
          return $(a).find("h5").text() < $(b).find("h5").text();
        }));
      }
      break;
    }
    case ("Level"): {
      $("#cardListDisplay").html($("#cardListDisplay").children().sort(function (a, b) {
        let num1 = parseInt($(a).find(".card-level").text().substring(6));
        let num2 = parseInt($(b).find(".card-level").text().substring(6));
        if (num1 < num2) {
          return (sortOrder === "Ascending") ? -1 : 1;
        } else if (num1 > num2) {
          return (sortOrder === "Ascending") ? 1 : -1;
        } else {
          return 0;
        }
      }));
      break;
    }
    case ("Upgrade"): {
      $("#cardListDisplay").html($("#cardListDisplay").children().sort(function (a, b) {
        let text1 = $(a).find(".card-count").text();
        let text2 = $(b).find(".card-count").text();
        let percent1 = -1;
        let percent2 = -1;
        // Set large percent if card is already maxed
        if (text1 === "MAX") {
          percent1 = 1000000;
        }
        if (text2 === "MAX") {
          percent2 = 1000000;
        }
        // Calculate percent if card is not maxed
        if (percent1 === -1) {
          text1 = text1.replace("/", "");
          let arr = text1.split(" ");
          percent1 = parseInt(arr[0]) / parseInt(arr[2]);
        }
        if (percent2 === -1) {
          text2 = text2.replace("/", "");
          let arr = text2.split(" ");
          percent2 = parseInt(arr[0]) / parseInt(arr[2]);
        }
        if (percent1 < percent2) {
          return (sortOrder === "Ascending") ? -1 : 1;
        } else if (percent1 > percent2) {
          return (sortOrder === "Ascending") ? 1 : -1;
        } else {
          return 0;
        }
      }));
      break;
    }
    case ("Rarity"): {
      $("#cardListDisplay").html($("#cardListDisplay").children().sort(function (a, b) {
        let rarity1 = getRarity($(a).find("h5").text());
        let rarity2 = getRarity($(b).find("h5").text());
        if (rarity1 < rarity2) {
          return (sortOrder === "Ascending") ? -1 : 1;
        } else if (rarity1 > rarity2) {
          return (sortOrder === "Ascending") ? 1 : -1;
        } else {
          return 0;
        }
      }));
      break;
    }
    case ("Elixir"): {
      $("#cardListDisplay").html($("#cardListDisplay").children().sort(function (a, b) {
        let elixir1 = getElixirCost($(a).find("h5").text());
        let elixir2 = getElixirCost($(b).find("h5").text());
        if (elixir1 < elixir2) {
          return (sortOrder === "Ascending") ? -1 : 1;
        } else if (elixir1 > elixir2) {
          return (sortOrder === "Ascending") ? 1 : -1;
        } else {
          return 0;
        }
      }));
      break;
    }
    case ("Trade"): {
      $("#cardListDisplay").html($("#cardListDisplay").children().sort(function (a, b) {
        let text1 = $(a).find(".card-count").text();
        let text2 = $(b).find(".card-count").text();
        let trade1 = -1;
        let trade2 = -1;
        // Set large trade if card is already maxed
        if (text1 === "MAX") {
          trade1 = 1000000;
        }
        if (text2 === "MAX") {
          trade2 = 1000000;
        }
        // Calculate number of possible trades if card is not maxed
        if (trade1 === -1) {
          text1 = text1.replace("/", "");
          let arr = text1.split(" ");
          trade1 = getTrades(parseInt(arr[0]), getRarity($(a).find("h5").text()), parseInt($(a).find(".card-level").text().substring(6)));
        }
        if (trade2 === -1) {
          text2 = text2.replace("/", "");
          let arr = text2.split(" ");
          trade2 = getTrades(parseInt(arr[0]), getRarity($(b).find("h5").text()), parseInt($(b).find(".card-level").text().substring(6)));
        }
        if (trade1 < trade2) {
          return (sortOrder === "Ascending") ? -1 : 1;
        } else if (trade1 > trade2) {
          return (sortOrder === "Ascending") ? 1 : -1;
        } else {
          return 0;
        }
      }));
      break;
    }
    case ("Star Level"): {
      $("#cardListDisplay").html($("#cardListDisplay").children().sort(function (a, b) {
        let starLevel1 = $(a).find("img").length - 1;
        let starLevel2 = $(b).find("img").length - 1;
        let level1 = parseInt($(a).find(".card-level").text().substring(6));
        let level2 = parseInt($(b).find(".card-level").text().substring(6));

        // Ensures that non-maxed cards come before maxed cards in the sort
        if (starLevel1 === 0 && level1 !== 13) {
          starLevel1--;
        }
        if (starLevel2 === 0 && level2 !== 13) {
          starLevel2--;
        }
        
        if (starLevel1 < starLevel2) {
          return (sortOrder === "Ascending") ? -1 : 1;
        } else if (starLevel1 > starLevel2) {
          return (sortOrder === "Ascending") ? 1 : -1;
        } else {
          return 0;
        }
      }));
      break;
    }
  }
}

// These are useful helper functions
function getElixirCost(cardName) {
  if (cardName === "Mirror") {
    // Mirror has no definite cost, so I return 0
    // RoyaleAPI uses 1 elixir, but I don't like that
    // 0 elixir implies an exceptional case
    // I could have also made it 10 elixir
    return 0;
  }
  if (cardJson.length > 0) {
    for (let i = 0; i < cardJson.length; i++) {
      if (cardJson[i].name === cardName) {
        return cardJson[i].elixir;
      }
    }
  }
  // The below is maintained if there is ever an issue with the RoyaleAPI card json
  switch (true) {
    case ($.inArray(cardName, zeroElixir) > -1): {
      return 0;
    }
    case ($.inArray(cardName, oneElixir) > -1): {
      return 1;
    }
    case ($.inArray(cardName, twoElixir) > -1): {
      return 2;
    }
    case ($.inArray(cardName, threeElixir) > -1): {
      return 3;
    }
    case ($.inArray(cardName, fourElixir) > -1): {
      return 4;
    }
    case ($.inArray(cardName, fiveElixir) > -1): {
      return 5;
    }
    case ($.inArray(cardName, sixElixir) > -1): {
      return 6;
    }
    case ($.inArray(cardName, sevenElixir) > -1): {
      return 7;
    }
    case ($.inArray(cardName, eightElixir) > -1): {
      return 8;
    }
    case ($.inArray(cardName, nineElixir) > -1): {
      return 9;
    }
  }
}

function getRarity(cardName) {
  if (cardJson.length > 0) {
    for (let i = 0; i < cardJson.length; i++) {
      if (cardJson[i].name === cardName) {
        let rarity = cardJson[i].rarity;
        switch (rarity) {
          case ("Common"): {
            return 1;
          }
          case ("Rare"): {
            return 2;
          }
          case ("Epic"): {
            return 3;
          }
          case ("Legendary"): {
            return 4;
          }
          case ("Champion"): {
            return 5;
          }
          default: {
            // This should not happen
            return 0;
          }
        }
      }
    }
  }
  // The below is maintained if there is ever an issue with the RoyaleAPI card json
  switch (true) {
    case ($.inArray(cardName, commons) > -1): {
      return 1;
    }
    case ($.inArray(cardName, rares) > -1): {
      return 2;
    }
    case ($.inArray(cardName, epics) > -1): {
      return 3;
    }
    case ($.inArray(cardName, legendaries) > -1): {
      return 4;
    }
    case ($.inArray(cardName, champions) > -1): {
      return 5;
    }
  }
  
}

function getTrades(count, rarity, level) {
  switch (rarity) {
    case (1): {
      return Math.floor(count / 250);
    }
    case (2): {
      return Math.floor(count / 50);
    }
    case (3): {
      return Math.floor(count / 10);
    }
    case (4): {
      if (level === 9) {
        return 0;
      }
      return (count);
    }
  }
}