// This makes the background of the hover cards a different color when they are hovered over
$(".hover-card").mouseover(function() {
  $(this).css("background-color", "#eeeeee");
});
$(".hover-card").mouseout(function() {
  $(this).css("background-color", "ghostwhite");
});