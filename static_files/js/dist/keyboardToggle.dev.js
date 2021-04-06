"use strict";

// Enables keyboard navigation on the data settings modal
$(".toggle-keyboard-div").keypress(function () {
  $(this).find(".display-toggle").bootstrapToggle("toggle");
});