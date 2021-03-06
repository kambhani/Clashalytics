// Styling for the battle icon classes
$(".battleIconLarge").addClass("list-inline-item d-none d-md-inline-block mr-2");
$(".battleIconSmall").addClass("list-inline-item d-inline-block d-md-none mr-0");

// Color styling for certain text
$(".battle-outcome").css("color", function() {
  if($(this).text() === "Defeat") {
    return ("#dc3545");
  }
  if($(this).text() === "Victory") {
    return ("#28a745");
  }
  return ("gray");
});
$(".level-difference").css("color", function() {
  if(parseFloat($(this).text()) < 0) {
    return ("#dc3545");
  }
  if(parseFloat($(this).text()) > 0) {
    return ("#28a745");
  }
  return ("gray");
});

// Dropdown Menu JS (Battle tab)
$("#battleSortTypeOptions p").on("click", function (e) {
  let selectedText = $(this).text();
  if($("#battleSortType").text() !== selectedText) {
    $("#battleSortType").text(selectedText);
    if (!$("#battleSortOrder").text().includes("Sort Order")) {
      sortBattles();
    }
  }
});
$("#battleSortOrderOptions p").on("click", function (e) {
  let selectedText = $(this).text();
  if($("#battleSortOrder").text() !== selectedText) {
    $("#battleSortOrder").text(selectedText);
    if (!$("#battleSortType").text().includes("Sort Type")) {
      sortBattles();
    }
  }
});

// Sort function for the battles
function sortBattles() {
  let sortType = $("#battleSortType").text();
  let sortOrder = $("#battleSortOrder").text();
  // Got the general sorting code from: http://jsfiddle.net/hibbard_eu/C2heg/
  switch (sortType) {
    case ("Battle Outcome"): {
      if (sortOrder === "Ascending") {
        $("#battleDisplay").html($("#battleDisplay").children().sort(function (a, b) {
          return $(a).find(".battle-outcome").text() > $(b).find(".battle-outcome").text();
        }));
      } else {
        $("#battleDisplay").html($("#battleDisplay").children().sort(function (a, b) {
          return $(a).find(".battle-outcome").text() < $(b).find(".battle-outcome").text();
        }));
      }
      break;
    }
    case ("Time"): {
      if (sortOrder === "Ascending") {
        $("#battleDisplay").html($("#battleDisplay").children().sort(function (a, b) {
          return $(a).find(".battle-time").text() > $(b).find(".battle-time").text();
        }));
      } else {
        $("#battleDisplay").html($("#battleDisplay").children().sort(function (a, b) {
          return $(a).find(".battle-time").text() < $(b).find(".battle-time").text();
        }));
      }
      break;
    }
    case ("Level Difference"): {
      $("#battleDisplay").html($("#battleDisplay").children().sort(function (a, b) {
        let num1 = parseFloat($(a).find(".level-difference").text());
        let num2 = parseFloat($(b).find(".level-difference").text());
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
  }
}