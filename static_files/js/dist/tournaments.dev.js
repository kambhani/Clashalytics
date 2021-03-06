"use strict";

$(".modal-toggle-div").addClass("d-flex my-2 justify-content-between");
$(".modal-toggle-div").css({
  "height": "34.4px"
});
$(".modal-toggle-div h5").addClass("mr-4");
$(".modal-toggle-div h5").css({
  "line-height": "30.0px"
});
$(document).ready(function () {
  // Initializaes the table
  var table = $("#table").DataTable(); // Initializes all display toggles to on
  // This code is necessary; otherwise, the page would break if the user refreshes

  $(".display-toggle").each(function () {
    $(this).bootstrapToggle("on");
  }); // Default view mode is based on screen size
  // lg and xl screens default to table; smaller sizes default to card

  $("#searchDisplayFormat").bootstrapToggle("on");

  if (window.matchMedia("(max-width: 991.98px)").matches) {
    $("#searchDisplayFormat").bootstrapToggle("off");
    $("#cards").removeClass("d-none").addClass("d-block");
    $("#tableDiv").removeClass("d-block").addClass("d-none");
  } // Event handler for the display toggles


  $(function () {
    $(".display-toggle").change(function () {
      var cardClass = ".card-data-" + $(this).attr("data-column");

      if ($(this).prop("checked")) {
        $(cardClass).removeClass("d-none").addClass("d-block");
      } else {
        $(cardClass).removeClass("d-block").addClass("d-none");
      }

      var column = table.column($(this).attr("data-column"));
      column.visible(!column.visible());
    });
  });
}); // Event handler for the card/table toggle

$(function () {
  $("#searchDisplayFormat").change(function () {
    if ($(this).prop("checked")) {
      $("#cards").removeClass("d-block").addClass("d-none");
      $("#tableDiv").removeClass("d-none").addClass("d-block");
    } else {
      $("#cards").removeClass("d-none").addClass("d-block");
      $("#tableDiv").removeClass("d-block").addClass("d-none");
    }
  });
});