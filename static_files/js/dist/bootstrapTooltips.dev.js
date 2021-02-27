"use strict";

// This code is used to initialize the tooltips (code taken from: https://getbootstrap.com/docs/5.0/components/tooltips/)
// Accidently used data-bs-toggle (bootstrap 5 version) rather than data-toggle (bootstrap 4 version)
// In the end, it doesn't matter
$(function () {
  $('[data-bs-toggle="tooltip"]').tooltip({
    html: true
  });
});