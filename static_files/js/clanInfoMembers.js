$(document).ready(function () {
  let memberTable = $("#memberTable").DataTable({
    // Set options here if necessary
  });
  
  // Set all toggles to "on" upon page load
  $(".display-toggle").each(function() {
    $(this).bootstrapToggle("on");
  });

  // Add properties to certain classes
  // Table toggles are initially shown; card toggles are initially hidden
  // Toggles required for both modes are initially on
  $(".modal-toggle-div-card").addClass("d-none my-2 justify-content-between");
  $(".modal-toggle-div-card").css({"height": "34.4px"});
  $(".modal-toggle-div-card h5").addClass("mr-4");
  $(".modal-toggle-div-card h5").css({"line-height": "30.0px"});
  $(".modal-toggle-div-table").addClass("d-flex my-2 justify-content-between");
  $(".modal-toggle-div-table").css({"height": "34.4px"});
  $(".modal-toggle-div-table h5").addClass("mr-4");
  $(".modal-toggle-div-table h5").css({"line-height": "30.0px"});

  // Default view mode is based on screen size
  // lg and xl screens default to table; smaller sizes default to card
  $("#memberDisplayFormat").bootstrapToggle("on");
  if (window.matchMedia("(max-width: 991.98px)").matches) {
    $("#memberDisplayFormat").bootstrapToggle("off");
    $("#memberCards").removeClass("d-none").addClass("d-block");
    $("#memberTableDiv").removeClass("d-block").addClass("d-none");
    $(".modal-toggle-div-table").removeClass("d-flex").addClass("d-none");
    $(".modal-toggle-div-card").removeClass("d-none").addClass("d-flex");
  }

  // Handles when a modal toggle changes state
  $(function() {
    $(".display-toggle").change(function() {
      let cardClass = ".card-data-" + $(this).attr("data-column");
      if($(this).prop("checked")) {
        $(cardClass).removeClass("d-none").addClass("d-block");
      } else {
        $(cardClass).removeClass("d-block").addClass("d-none");
      }
      let column = memberTable.column($(this).attr("data-column"));
      column.visible(!column.visible());
    });
  });
});

// Toggle between table and card view
$(function() {
  $("#memberDisplayFormat").change(function() {
    if($(this).prop("checked")) {
      $("#memberCards").removeClass("d-block").addClass("d-none");
      $("#memberTableDiv").removeClass("d-none").addClass("d-block");
      $(".modal-toggle-div-card").removeClass("d-flex").addClass("d-none");
      $(".modal-toggle-div-table").removeClass("d-none").addClass("d-flex");
    } else {
      $("#memberCards").removeClass("d-none").addClass("d-block");
      $("#memberTableDiv").removeClass("d-block").addClass("d-none");
      $(".modal-toggle-div-table").removeClass("d-flex").addClass("d-none");
      $(".modal-toggle-div-card").removeClass("d-none").addClass("d-flex");
    }
  });
});