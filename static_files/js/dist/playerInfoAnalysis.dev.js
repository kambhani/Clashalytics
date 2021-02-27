"use strict";

// Analysis table picture styling
$(".analysisTablePicture").css("width", 0.02 * window.innerWidth + 29); // Analysis table styling

if (window.matchMedia("(max-width: 991.98px)").matches) {
  $("#analysisTableDiv").css({
    "overflow-y": "auto",
    "height": "100vh"
  });
}

if (window.matchMedia("(max-width: 1200px)").matches) {
  $("#analysisTable").addClass("table-sm");
} // Dealing with window resizing


$(window).resize(function () {
  $(".analysisTablePicture").css("width", 0.02 * window.innerWidth + 29);

  if (window.matchMedia("(max-width: 991.98px)").matches) {
    $("#analysisTableDiv").css({
      "overflow-y": "auto",
      "height": "100vh"
    });
  } else {
    $("#analysisTableDiv").css({
      "overflow-y": "",
      "height": ""
    });
  }

  if (window.matchMedia("(max-width: 1200px)").matches) {
    $("#analysisTable").addClass("table-sm");
  } else {
    $("#analysisTable").removeClass("table-sm");
  }
}); // Adds colors to the level differences and the battle outcomes on the table

$(".battle-outcome").css("color", function () {
  if ($(this).text() === "Defeat") {
    return "#dc3545";
  }

  if ($(this).text() === "Victory") {
    return "#28a745";
  }

  return "gray";
});
$(".level-difference").css("color", function () {
  if (parseFloat($(this).text()) < 0) {
    return "#dc3545";
  }

  if (parseFloat($(this).text()) > 0) {
    return "#28a745";
  }

  return "gray";
}); // This function filters the data from the table in the Analysis Tab
// Implementation is taken from: https://www.w3schools.com/howto/howto_js_filter_table.asp

function filterAnalysisTable(notNeeded) {
  var filters = [];
  var tableRows = document.getElementById("analysisTable").rows;

  for (var i = 1; i < tableRows.length; i++) {
    tableRows[i].style.display = "";
  }

  for (var _i = 0; _i < 7; _i++) {
    var tmp = document.getElementById("analysisTableSearch" + _i).value.toUpperCase();
    filters.push(_i === 0 || _i === 2 ? tmp.split(" ") : tmp);
  }

  var _loop = function _loop(_i2) {
    if (_i2 === 0 || _i2 === 2) {
      var toSearch = _i2 === 0 ? ".analysisTableDeckUsed" : ".analysisTableDeckFaced";
      $(toSearch).each(function () {
        var tableData = "";
        $(this).find("div div img").each(function () {
          // Used Stack Overflow to get the RegEx
          // Basically, it removes all spaces and periods from the character name
          tableData += $(this).attr("alt").replace(/\s+/g, "").replace(/\./g, "") + " ";
        });
        var toShow = true;

        for (var j = 0; j < filters[_i2].length; j++) {
          if (!tableData.toUpperCase().includes(filters[_i2][j])) {
            toShow = false;
            break;
          }
        }

        if (!toShow) {
          $(this).parent().css("display", "none");
        }
      });
    } else {
      for (var j = 1; j < tableRows.length; j++) {
        var tableData = tableRows[j].getElementsByTagName("td")[_i2].innerText;

        if (!tableData.toUpperCase().includes(filters[_i2])) {
          tableRows[j].style.display = "none";
        }
      }
    }
  };

  for (var _i2 = 0; _i2 < filters.length; _i2++) {
    _loop(_i2);
  }

  var numEntriesShown = 0;
  var percentVictories = 0;

  for (var _i3 = 1; _i3 < tableRows.length; _i3++) {
    if (tableRows[_i3].style.display !== "none") {
      numEntriesShown++;

      if (tableRows[_i3].getElementsByTagName("td")[5].innerText === "Victory") {
        percentVictories++;
      }
    }
  }

  percentVictories /= numEntriesShown;
  percentVictories = Math.round(percentVictories * Math.pow(10, 3));
  percentVictories = percentVictories / Math.pow(10, 1);

  if (isNaN(percentVictories)) {
    $("#analysisTableNumEntries").text("Showing ".concat(numEntriesShown, " of ").concat(tableRows.length - 1, " Entries"));
  } else {
    $("#analysisTableNumEntries").text("Showing ".concat(numEntriesShown, " of ").concat(tableRows.length - 1, " Entries with ").concat(percentVictories, "% Win Rate"));
  }
}