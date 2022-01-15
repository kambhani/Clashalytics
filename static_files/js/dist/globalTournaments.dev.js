"use strict";

function loadLeaderboard(caller) {
  var gtTag = $(caller).children("p").text();
  $(".spinner-border").removeClass("d-none");
  fetch("/tournaments/gt/".concat(gtTag, "/leaderboard")).then(function (res) {
    return res.text();
  }).then(function (text) {
    if (text === "Error") {
      $("#leaderboardDiv").html('<div class="alert alert-danger text-center mx-2" role="alert">Could not load leaderboard</div>');
    } else if (text === "Empty") {
      $("#leaderboardDiv").html('<div class="alert alert-warning text-center mx-2" role="alert">No Leaderboard Info Yet</div>');
    } else {
      $("#leaderboardDiv").html(text); // Have to call bootstrap toggle initializers since the html is dynamically loaded

      $('[data-bs-toggle="tooltip"]').tooltip({
        html: true
      });
      sizeLeaderboardIcons();
      $(".accordion > .card").css("overflow", "visible");
    }
  })["catch"](function (err) {
    $("#leaderboardDiv").html('<div class="alert alert-danger text-center mx-2" role="alert">Could not load leaderboard</div>');
  });
}

$(window).resize(function () {
  // Takes care of the sizing for the leaderboard icons
  sizeLeaderboardIcons(); // Takes care of screen resizing for the filter feature on the leaderboard

  if ($("#gtLeaderboard").length) {
    if (window.matchMedia("(min-width: 768px)").matches) {
      if ($("#gtLeaderboardFilter1").val() === "" || $("#gtLeaderboardFilter1").parent().find("button").text().includes("Filter By")) {
        $("#gtLeaderboard div").removeClass("d-none");
        $("#filterDisplay").text("Showing ".concat($("#gtLeaderboard").children().length, " of ").concat($("#gtLeaderboard").children().length, " placements"));
      } else {
        filterLeaderboard(1);
      }
    } else {
      if ($("#gtLeaderboardFilter2").val() === "" || $("#gtLeaderboardFilter2").parent().find("button").text().includes("Filter By")) {
        $("#gtLeaderboard div").removeClass("d-none");
        $("#filterDisplay").text("Showing ".concat($("#gtLeaderboard").children().length, " of ").concat($("#gtLeaderboard").children().length, " placements"));
      } else {
        filterLeaderboard(2);
      }
    }
  }
});

function sizeLeaderboardIcons() {
  var smallSize = "25px";
  var largeSize = "40px";

  if (window.matchMedia("(min-width: 576px)").matches) {
    $(".gt-leaderboard-icon-div").css("height", largeSize);
    $(".gt-leaderboard-icon-div img").css("height", largeSize);
    $(".gt-leaderboard-icon-div i").css({
      "font-size": largeSize,
      "line-height": largeSize
    });
    $(".gt-leaderboard-icon-div h5").css("line-height", largeSize);
  } else {
    $(".gt-leaderboard-icon-div").css("height", smallSize);
    $(".gt-leaderboard-icon-div img").css("height", smallSize);
    $(".gt-leaderboard-icon-div i").css({
      "font-size": smallSize,
      "line-height": smallSize
    });
    $(".gt-leaderboard-icon-div h5").css("line-height", smallSize);
  }
} // Dropdown Menu JS (with sorting) [for leaderboard]


$("#leaderboardDiv").on("click", ".dropdown-item-sort", function (e) {
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
      var toSort = $("#gtLeaderboard");

      switch (sortType) {
        case "Name":
          {
            if (sortOrder === "Ascending") {
              toSort.html(toSort.children().sort(function (a, b) {
                return $(a).find(".gt-leaderboard-player-name").text().toUpperCase() > $(b).find(".gt-leaderboard-player-name").text().toUpperCase();
              }));
            } else {
              toSort.html(toSort.children().sort(function (a, b) {
                return $(a).find(".gt-leaderboard-player-name").text().toUpperCase() < $(b).find(".gt-leaderboard-player-name").text().toUpperCase();
              }));
            }

            break;
          }

        case "Clan":
          {
            if (sortOrder === "Ascending") {
              toSort.html(toSort.children().sort(function (a, b) {
                return $(a).find(".gt-leaderboard-clan-name").text().toUpperCase() > $(b).find(".gt-leaderboard-clan-name").text().toUpperCase();
              }));
            } else {
              toSort.html(toSort.children().sort(function (a, b) {
                return $(a).find(".gt-leaderboard-clan-name").text().toUpperCase() < $(b).find(".gt-leaderboard-clan-name").text().toUpperCase();
              }));
            }

            break;
          }

        case "Rank":
          {
            // For rank, a smaller number means a higher rank
            // Therefore, the if statement is inverted
            toSort.html(toSort.children().sort(function (a, b) {
              var num1 = parseInt($(a).find(".gt-leaderboard-rank").text());
              var num2 = parseInt($(b).find(".gt-leaderboard-rank").text());

              if (num1 > num2) {
                return sortOrder === "Ascending" ? -1 : 1;
              } else if (num1 < num2) {
                return sortOrder === "Ascending" ? 1 : -1;
              } else {
                return 0;
              }
            }));
            break;
          }

        case "Losses":
          {
            toSort.html(toSort.children().sort(function (a, b) {
              var num1 = parseInt($(a).find(".gt-leaderboard-losses").text());
              var num2 = parseInt($(b).find(".gt-leaderboard-losses").text());

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

        case "Rank Change":
          {
            toSort.html(toSort.children().sort(function (a, b) {
              var num1 = parseInt($(a).find(".gt-leaderboard-rank-change").text());
              var num2 = parseInt($(b).find(".gt-leaderboard-rank-change").text());

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
      } // Have to call bootstrap toggle initializers since divs are sorted


      $('[data-bs-toggle="tooltip"]').tooltip({
        html: true
      });
    }
  }
}); // Dropdown Menu JS (for the filter)

$("#leaderboardDiv").on("click", ".gt-leaderboard-filter-dropdown p", function (e) {
  var selectedText = $(this).text();

  if ($(this).parent().parent().children("button").text() !== selectedText) {
    $(this).parent().parent().children("button").text(selectedText);
    filterLeaderboard($(this).parent().parent().children("span").text());
  }
}); // Code to filter the leaderboard by user-specified string
// Takes a callerId, which can be either 1 or 2
// 1 means the input is from a large screen
// 2 means the input is from a small screen

function filterLeaderboard(callerId) {
  var id = "#gtLeaderboardFilter" + callerId;
  var sortBy = $(id).parent().find("button").text();
  var filter = document.getElementById(id.substring(1)).value.toUpperCase();

  if (sortBy.includes("Filter By")) {
    return;
  }

  $("#gtLeaderboard > div").addClass("d-none");
  $("#gtLeaderboard > div").each(function (index) {
    switch (sortBy) {
      case "All":
        {
          var str = $(this).find(".gt-leaderboard-player-name").text().toUpperCase() + " " + $(this).find(".gt-leaderboard-clan-name").text().toUpperCase() + " " + $(this).find(".gt-leaderboard-rank").text().toUpperCase() + " " + $(this).find(".gt-leaderboard-wins").text().toUpperCase();
          +$(this).find(".gt-leaderboard-losses").text().toUpperCase() + " " + $(this).find(".gt-leaderboard-rank-change").text().toUpperCase();

          if (str.includes(filter)) {
            $(this).removeClass("d-none");
          }

          break;
        }

      case "Name":
        {
          if ($(this).find(".gt-leaderboard-player-name").text().toUpperCase().includes(filter)) {
            $(this).removeClass("d-none");
          }

          break;
        }

      case "Clan":
        {
          if ($(this).find(".gt-leaderboard-clan-name").text().toUpperCase().includes(filter)) {
            $(this).removeClass("d-none");
          }

          break;
        }

      case "Rank":
        {
          if ($(this).find(".gt-leaderboard-rank").text().toUpperCase().includes(filter)) {
            $(this).removeClass("d-none");
          }

          break;
        }

      case "Wins":
        {
          if ($(this).find(".gt-leaderboard-wins").text().toUpperCase().includes(filter)) {
            $(this).removeClass("d-none");
          }

          break;
        }

      case "Losses":
        {
          if ($(this).find(".gt-leaderboard-losses").text().toUpperCase().includes(filter)) {
            $(this).removeClass("d-none");
          }

          break;
        }

      case "Rank Change":
        {
          if ($(this).find(".gt-leaderboard-rank-change").text().toUpperCase().includes(filter)) {
            $(this).removeClass("d-none");
          }

          break;
        }
    }
  }); // These lines update the alert above the participant list

  var totalParticipants = $("#gtLeaderboard").children().length;
  var displayedParticipants = totalParticipants - $("#gtLeaderboard").children(".d-none").length;
  $("#filterDisplay").text("Showing ".concat(displayedParticipants, " of ").concat(totalParticipants, " participants"));
}