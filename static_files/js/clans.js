$(".modal-toggle-div").addClass("d-flex my-2 justify-content-between");
$(".modal-toggle-div").css({"height": "34.4px"});
$(".modal-toggle-div h5").addClass("mr-4");
$(".modal-toggle-div h5").css({"line-height": "30.0px"});

$(document).ready(function () {
  let table = $("#table").DataTable();

  // Initializes all display toggles and the view format toggle to on
  // This code is necessary; otherwise, the page would break if the user refreshes
  $(".display-toggle").each(function() {
    $(this).bootstrapToggle("on");
  });
  $("#searchDisplayFormat").bootstrapToggle("on");

  // Event handler for the display toggles
  $(function() {
    $(".display-toggle").change(function() {
      let cardClass = ".card-data-" + $(this).attr("data-column");
      let cardClassDisplay = (cardClass === ".card-data-4") ? "d-flex" : "d-block";
      if($(this).prop("checked")) {
        $(cardClass).removeClass("d-none").addClass(cardClassDisplay);
      } else {
        $(cardClass).removeClass(cardClassDisplay).addClass("d-none");
      }
      let column = table.column($(this).attr("data-column"));
      column.visible(!column.visible());
    });
  });
});

// Event handler for the card/table toggle
$(function() {
  $("#searchDisplayFormat").change(function() {
    if($(this).prop("checked")) {
      $("#cards").removeClass("d-block").addClass("d-none");
      $("#tableDiv").removeClass("d-none").addClass("d-block");
    } else {
      $("#cards").removeClass("d-none").addClass("d-block");
      $("#tableDiv").removeClass("d-block").addClass("d-none");
    }
  });
});