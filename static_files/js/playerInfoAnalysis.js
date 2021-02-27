// Analysis table picture styling
$(".analysisTablePicture").css("width", (0.02 * (window.innerWidth) + 29));

// Analysis table styling
if (window.matchMedia("(max-width: 991.98px)").matches) {
  $("#analysisTableDiv").css({"overflow-y": "auto", "height": "100vh"});
}
if (window.matchMedia("(max-width: 1200px)").matches) {
  $("#analysisTable").addClass("table-sm");
}

// Dealing with window resizing
$(window).resize(function() {
  $(".analysisTablePicture").css("width", (0.02 * (window.innerWidth) + 29));

  if (window.matchMedia("(max-width: 991.98px)").matches) {
    $("#analysisTableDiv").css({"overflow-y": "auto", "height": "100vh"});
  } else {
    $("#analysisTableDiv").css({"overflow-y": "", "height": ""});
  }

  if (window.matchMedia("(max-width: 1200px)").matches) {
    $("#analysisTable").addClass("table-sm");
  } else {
    $("#analysisTable").removeClass("table-sm");
  }
});

// Adds colors to the level differences and the battle outcomes on the table
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

// This function filters the data from the table in the Analysis Tab
// Implementation is taken from: https://www.w3schools.com/howto/howto_js_filter_table.asp
function filterAnalysisTable(notNeeded) {
  let filters = [];
  let tableRows = document.getElementById("analysisTable").rows;
  for (let i = 1; i < tableRows.length; i++) {
    tableRows[i].style.display = "";
  }
  for (let i = 0; i < 7; i++) {
    let tmp = document.getElementById("analysisTableSearch" + i).value.toUpperCase();
    filters.push((i === 0 || i === 2) ? tmp.split(" ") : tmp);
  }
  for (let i = 0; i < filters.length; i++) {
    if (i === 0 || i === 2) {
      let toSearch = (i === 0) ? (".analysisTableDeckUsed") : (".analysisTableDeckFaced");
      $(toSearch).each(function () {
        let tableData = "";
        $(this).find("div div img").each(function () {
          // Used Stack Overflow to get the RegEx
          // Basically, it removes all spaces and periods from the character name
          tableData += $(this).attr("alt").replace(/\s+/g, "").replace(/\./g, "") + " ";
        });
        let toShow = true;
        for (let j = 0; j < filters[i].length; j++) {
          if (!tableData.toUpperCase().includes(filters[i][j])) {
            toShow = false;
            break;
          }
        }
        if (!toShow) {
          $(this).parent().css("display", "none");
        }
      });
    } else {
      for (let j = 1; j < tableRows.length; j++) {
        let tableData = tableRows[j].getElementsByTagName("td")[i].innerText;
        if (!tableData.toUpperCase().includes(filters[i])) {
          tableRows[j].style.display = "none";
        }
      }
    }
  }
  let numEntriesShown = 0;
  let percentVictories = 0;
  for (let i = 1; i < tableRows.length; i++) {
    if (tableRows[i].style.display !== "none") {
      numEntriesShown++;
      if (tableRows[i].getElementsByTagName("td")[5].innerText === "Victory") {
        percentVictories++;
      }
    }
  }
  percentVictories /= numEntriesShown;
  percentVictories = Math.round(percentVictories * Math.pow(10, 3));
  percentVictories = (percentVictories / Math.pow(10, 1));
  if (isNaN(percentVictories)) {
    $("#analysisTableNumEntries").text(`Showing ${numEntriesShown} of ${tableRows.length - 1} Entries`);
  } else {
    $("#analysisTableNumEntries").text(`Showing ${numEntriesShown} of ${tableRows.length - 1} Entries with ${percentVictories}% Win Rate`);
  }
}