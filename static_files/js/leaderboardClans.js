$(document).ready(function() {
  // Adds basic styling to the elements in the 'Change Viewable Data' modal
  $(".modal-toggle-div").addClass("d-flex my-2 justify-content-between");
  $(".modal-toggle-div").css({"height": "34.4px"});
  $(".modal-toggle-div h5").addClass("mr-4");
  $(".modal-toggle-div h5").css({"line-height": "30.0px"});

  // Initializes the DataTable
  let table = $("#table").DataTable();

  // Initializes all display toggles to on
  // This code is necessary; otherwise, the page would break if the user refreshes
  $(".display-toggle").each(function() {
    $(this).bootstrapToggle("on");
  });

  // Default view mode is based on screen size
  // lg and xl screens default to table; smaller sizes default to card
  $("#leaderboardDisplayFormat").bootstrapToggle("on");
  if (window.matchMedia("(max-width: 991.98px)").matches) {
    $("#leaderboardDisplayFormat").bootstrapToggle("off");
    $("#cards").removeClass("d-none").addClass("d-block");
    $("#tableDiv").removeClass("d-block").addClass("d-none");
  }

  // Styles the color of the rank change based on its value
  $(".rank-change").css("color", function() {
    if(parseFloat($(this).text()) < 0) {
      return ("#dc3545");
    }
    if(parseFloat($(this).text()) > 0) {
      return ("#28a745");
    }
    return ("gray");
  });

  // Creates dropdown for region selection
  const leaderboardType = $("#leaderboardType").text();
  amagiDropdown({
    elementId: "regionSelect",
    searchButtonInnerHtml: "Change",
    bodyMessage: "Search via the search bar and then double-click on the desired region",
    href: `/leaderboards/${leaderboardType}`,
    dynamicHref: "region"
  });

  // Changes visible data based on user interaction with the 'Change Viewable Data' modal
  $(function() {
    $(".display-toggle").change(function() {
      const cardClass = ".card-data-" + $(this).attr("data-column");
      let displayClass;
      if ($(this).attr("data-column") === "1" || $(this).attr("data-column") === "5" || $(this).attr("data-column") === "6") {
        displayClass = "d-flex";
      } else {
        displayClass = "d-block";
      }
      if($(this).prop("checked")) {
        $(cardClass).removeClass("d-none").addClass(displayClass);
      } else {
        $(cardClass).removeClass(displayClass).addClass("d-none");
      }
      let column = table.column($(this).attr("data-column"));
      column.visible(!column.visible());
    });
  });

  // Event handler for the card/table toggle
  $(function() {
    $("#leaderboardDisplayFormat").change(function() {
      if($(this).prop("checked")) {
        $("#cards").removeClass("d-block").addClass("d-none");
        $("#tableDiv").removeClass("d-none").addClass("d-block");
      } else {
        $("#cards").removeClass("d-none").addClass("d-block");
        $("#tableDiv").removeClass("d-block").addClass("d-none");
      }
    });
  });
});