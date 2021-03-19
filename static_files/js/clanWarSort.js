// Dropdown Menu JS (with sorting)
$(".dropdown-item").on("click", function(e) {
  let selectedText = $(this).text();
  let parentButton = $(this).parent().parent().children("button");
  if (parentButton.text() !== selectedText) {
    parentButton.text(selectedText);
    let dropdowns = $(this).parent().parent().parent().children();
    let sortOrder, sortType;
    dropdowns.each(function(index) {
      if (index === 0) {
        sortType = $(this).children("button").text();
      } else {
        sortOrder = $(this).children("button").text();
      }
    });
    if (!dropdowns.get(0).innerText.includes("Sort Type") && !dropdowns.get(1).innerText.includes("Sort Order")) {
      let toSort = $(this).parent().parent().parent().parent().children(".sortable");
      switch (sortType) {
        case ("Name"): {
          if (sortOrder === "Ascending") {
            toSort.html(toSort.children().sort(function (a, b) {
              return $(a).find(".card-title").text().toUpperCase() > $(b).find(".card-title").text().toUpperCase();
            }));
          } else {
            toSort.html(toSort.children().sort(function (a, b) {
              return $(a).find(".card-title").text().toUpperCase() < $(b).find(".card-title").text().toUpperCase();
            }));
          }
          break;
        }
        case ("Tag"): {
          if (sortOrder === "Ascending") {
            toSort.html(toSort.children().sort(function (a, b) {
              return $(a).find(".card-subtitle").text() > $(b).find(".card-subtitle").text();
            }));
          } else {
            toSort.html(toSort.children().sort(function (a, b) {
              return $(a).find(".card-subtitle").text() < $(b).find(".card-subtitle").text();
            }));
          }
          break;
        }
        case ("Fame"): {
          toSort.html(toSort.children().sort(function (a, b) {
            let num1 = parseInt($(a).find(".participant-fame").text());
            let num2 = parseInt($(b).find(".participant-fame").text());
            return numberComparator(num1, num2, sortOrder);
          }));
          break;
        }
        case ("Repair Points"): {
          toSort.html(toSort.children().sort(function (a, b) {
            let num1 = parseInt($(a).find(".participant-repair-points").text());
            let num2 = parseInt($(b).find(".participant-repair-points").text());
            return numberComparator(num1, num2, sortOrder);
          }));
          break;
        }
        case ("Boat Attacks"): {
          toSort.html(toSort.children().sort(function (a, b) {
            let num1 = parseInt($(a).find(".participant-boat-attacks").text());
            let num2 = parseInt($(b).find(".participant-boat-attacks").text());
            return numberComparator(num1, num2, sortOrder);
          }));
          break;
        }
        case ("Decks Used"): {
          toSort.html(toSort.children().sort(function (a, b) {
            let num1 = parseInt($(a).find(".participant-decks-used").text());
            let num2 = parseInt($(b).find(".participant-decks-used").text());
            return numberComparator(num1, num2, sortOrder);
          }));
          break;
        }
      }
      // Moving cards around destroys the event listeners associated with them
      // To counteract this, I need to add the event listeners again after the cards have been sorted
      $(".hover-card").mouseover(function() {
        $(this).css("background-color", "#eeeeee");
      });
      $(".hover-card").mouseout(function() {
        $(this).css("background-color", "ghostwhite");
      });
    }
  }
});

function numberComparator(num1, num2, sortOrder) {
  if (num1 < num2) {
    return (sortOrder === "Ascending") ? -1 : 1;
  } else if (num1 > num2) {
    return (sortOrder === "Ascending") ? 1 : -1;
  } else {
    return 0;
  }
}