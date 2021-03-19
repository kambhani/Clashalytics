"use strict";

// Dropdown Menu JS (with sorting) [for tournament standings]
$(".dropdown-item-sort").on("click", function (e) {
  var selectedText = $(this).text();
  var parentButton = $(this).parent().parent().children("button");

  if (parentButton.text() !== selectedText) {
    parentButton.text(selectedText);
    var dropdowns = $(this).parent().parent().parent().children(".dropdown");
    var sortOrder, sortType;
    dropdowns.each(function (index) {
      if (index === 0) {
        sortType = $(this).children("button").text();
      } else {
        sortOrder = $(this).children("button").text();
      }
    });

    if (!dropdowns.get(0).innerText.includes("Sort Type") && !dropdowns.get(1).innerText.includes("Sort Order")) {
      var toSort = $("#tournamentParticipants");

      switch (sortType) {
        case "Name":
          {
            if (sortOrder === "Ascending") {
              toSort.html(toSort.children().sort(function (a, b) {
                return $(a).find(".tournament-player-name").text().toUpperCase() > $(b).find(".tournament-player-name").text().toUpperCase();
              }));
            } else {
              toSort.html(toSort.children().sort(function (a, b) {
                return $(a).find(".tournament-player-name").text().toUpperCase() < $(b).find(".tournament-player-name").text().toUpperCase();
              }));
            }

            break;
          }

        case "Clan":
          {
            if (sortOrder === "Ascending") {
              toSort.html(toSort.children().sort(function (a, b) {
                return $(a).find(".tournament-clan-name").text().toUpperCase() > $(b).find(".tournament-clan-name").text().toUpperCase();
              }));
            } else {
              toSort.html(toSort.children().sort(function (a, b) {
                return $(a).find(".tournament-clan-name").text().toUpperCase() < $(b).find(".tournament-clan-name").text().toUpperCase();
              }));
            }

            break;
          }

        case "Rank":
          {
            toSort.html(toSort.children().sort(function (a, b) {
              var num1 = parseInt($(a).find(".tournament-rank").text());
              var num2 = parseInt($(b).find(".tournament-rank").text());

              if (num1 < num2) {
                return sortOrder === "Ascending" ? -1 : 1;
              } else if (num1 > num2) {
                return sortOrder === "Ascending" ? 1 : -1;
              } else {
                return 0;
              }
            }));
            break;
          }
      }
    }
  }
}); // Dropdown Menu JS (for the filter)

$(".tournament-filter-dropdown p").on("click", function (e) {
  var selectedText = $(this).text();

  if ($(this).parent().parent().children("button").text() !== selectedText) {
    $(this).parent().parent().children("button").text(selectedText);
    filterTournamentStandings($(this).parent().parent().children("span").text());
  }
}); // Code to filter the tournament standings by user-specified string
// Takes a callerId, which can be either 1 or 2
// 1 means the input is from a large screen
// 2 means the input is from a small screen

function filterTournamentStandings(callerId) {
  var id = "#tournamentFilter" + callerId;
  var sortBy = $(id).parent().find("button").text();
  var filter = document.getElementById(id.substring(1)).value.toUpperCase();

  if (sortBy.includes("Filter By")) {
    return;
  }

  $("#tournamentParticipants div").addClass("d-none");
  $("#tournamentParticipants div").each(function (index) {
    switch (sortBy) {
      case "All":
        {
          var str = $(this).find(".tournament-player-name").text().toUpperCase() + " " + $(this).find(".tournament-clan-name").text().toUpperCase() + " " + $(this).find(".tournament-rank").text().toUpperCase() + " " + $(this).find(".tournament-wins").text().toUpperCase();

          if (str.includes(filter)) {
            $(this).removeClass("d-none");
          }

          break;
        }

      case "Name":
        {
          if ($(this).find(".tournament-player-name").text().toUpperCase().includes(filter)) {
            $(this).removeClass("d-none");
          }

          break;
        }

      case "Clan":
        {
          if ($(this).find(".tournament-clan-name").text().toUpperCase().includes(filter)) {
            $(this).removeClass("d-none");
          }

          break;
        }

      case "Rank":
        {
          if ($(this).find(".tournament-rank").text().toUpperCase().includes(filter)) {
            $(this).removeClass("d-none");
          }

          break;
        }

      case "Wins":
        {
          if ($(this).find(".tournament-wins").text().toUpperCase().includes(filter)) {
            $(this).removeClass("d-none");
          }

          break;
        }
    }
  }); // These lines update the alert above the participant list

  var totalParticipants = $("#tournamentParticipants").children().length;
  var displayedParticipants = totalParticipants - $("#tournamentParticipants").children(".d-none").length;
  $("#filterDisplay").text("Showing ".concat(displayedParticipants, " of ").concat(totalParticipants, " participants"));
} // Refilters tournament standings if the window is resized


$(window).resize(function () {
  if (window.matchMedia("(min-width: 768px)").matches) {
    if ($("#tournamentFilter1").val() === "" || $("#tournamentFilter1").parent().find("button").text().includes("Filter By")) {
      $("#tournamentParticipants div").removeClass("d-none");
      $("#filterDisplay").text("Showing ".concat($("#tournamentParticipants").children().length, " of ").concat($("#tournamentParticipants").children().length, " participants"));
    } else {
      filterTournamentStandings(1);
    }
  } else {
    if ($("#tournamentFilter2").val() === "" || $("#tournamentFilter2").parent().find("button").text().includes("Filter By")) {
      $("#tournamentParticipants div").removeClass("d-none");
      $("#filterDisplay").text("Showing ".concat($("#tournamentParticipants").children().length, " of ").concat($("#tournamentParticipants").children().length, " participants"));
    } else {
      filterTournamentStandings(2);
    }
  }
});