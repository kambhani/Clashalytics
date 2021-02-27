// Useful global variables
let arr = [];
let weeks = [];
let playerSet = new Set();
let playerTagToName = new Map();
let players;
let fameChart, repairPointsChart, boatAttacksChart, decksUsedChart, heatmap;
let series = [];

$(document).ready(function() {
  // This grabs data from the DOM
  // This is the data for player participation
  $("#warInsights").find(".week-participation").each(function(index, element) {
    let curWeek = $(this).attr("class").split(" ")[1];
    weeks.push(curWeek);
    $(this).find("div").each(function() {
      if (playerSet.add($(this).find("h1").text())) {
        playerTagToName.set($(this).find("h1").text(), $(this).find("h2").text());
      }
      arr.push({
        week: curWeek,
        tag: $(this).find("h1").text(),
        name: $(this).find("h2").text(),
        fame: parseInt($(this).find("h3").text()),
        repairPoints: parseInt($(this).find("h4").text()),
        boatAttacks: parseInt($(this).find("h5").text()),
        decksUsed: parseInt($(this).find("h6").text())
      });
    });
  });

  console.log(weeks);

  // Reverse these two arrays since the data is in reverse order
  weeks.reverse();
  arr.reverse();

  // This adds the players to the datalist (the input field)
  players = Array.from(playerSet);
  for (let i = 0; i < players.length; i++) {
    // Season 69, Week 1 is glitched, so I don't want to include this tag
    if (players[i] === "#0") {
      players.splice(i, 1);
      break;
    }
  }
  let playerList = document.getElementById("playerList");
  let playerListOptions = `<option value="ALL MEMBERS">ALL MEMBERS</option>`;
  for (let i = 0; i < players.length; i++) {
    playerListOptions += `<option value="${players[i]}">${playerTagToName.get(players[i])}</option>`;
  }
  playerList.innerHTML = playerListOptions;

  // This adds all the players to the series array
  // The series array is used to create the heatmap
  $.each(players, function(index, value) {
    let toAdd = {};
    toAdd.name = playerTagToName.get(value);
    toAdd.data = [];
    let toAnalyze = arr.filter(element => element.tag === value);
    let toAnalyzeIndex = 0;
    for (let i = 0; i < weeks.length; i++) {
      if (toAnalyzeIndex >= toAnalyze.length || weeks[i] !== toAnalyze[toAnalyzeIndex].week) {
        toAdd.data.push({"x": weeks[i], "y": -1});
      } else {
        toAdd.data.push({"x": weeks[i], "y": (toAnalyze[toAnalyzeIndex].fame + toAnalyze[toAnalyzeIndex].repairPoints)});
        toAnalyzeIndex++;
      }
    }
    series.push(toAdd);
  });

  // Gets the x and y axis for the trophy chart
  let trophies = [];
  $("#trophyChart").find("h5").each(function(index, element) {
    trophies.push($(this).text());
  });
  trophies.reverse();

  // Settings for the Clan Wars Trophies Chart
  let options = {
    chart: {
      height: 500,
      type: "line"
    },
    theme: {
      mode: "light",
      palette: "palette10"
    },
    dataLabels: {
      enabled: true
    },
    tooltip: {
      theme: "light"
    },
    series: [{
      name: "Clan War Trophies",
      data: trophies
    }],
    title: {
      text: "Clan War Trophies Over Time",
      align: "center",
      style: {
        fontSize: "16px"
      }
    },
    xaxis: {
      categories: weeks
    },
    responsive: [{
      breakpoint: 576,
      options: {
        dataLabels: {
          enabled: false
        },
        tooltip: {
          enabled: true
        },
        title: {
          text: "Trophies Over Time",
          align: "left",
          offsetX: 20,
          style: {
            fontSize: "12px"
          }
        },
        markers: {
          size: 5
        }
      }
    }]
  }
  let chart = new ApexCharts(document.querySelector("#trophyChart"), options);
  chart.render();
});

function drawPlayerChart() {
  if (typeof fameChart !== "undefined") {
    fameChart.destroy();
    repairPointsChart.destroy();
    boatAttacksChart.destroy();
    decksUsedChart.destroy();
  }
  if (typeof heatmap !== "undefined") {
    heatmap.destroy();
  }
  $("#playerChartErrors").empty();
  let tag = $("#playerSelect").val();
  if (tag === "ALL MEMBERS") {
    let options = {
      chart: {
        height: 30 * players.length,
        width: "100%",
        type: "heatmap"
      },
      title: {
        text: "Player Participation Heatmap",
        align: "center"
      },
      theme: {
        mode: "light",
        palette: "palette10"
      },
      states: {
        active: {
          filter: {
            type: "none"
          }
        }
      },
      yaxis: {
        show: true,
        labels: {
          style: {
            fontSize: "14px"
          },
          offsetY: 100
        },
        tooltip: {
          enabled: false
        },
      },
      tooltip: {
        enabled: true
      },
      xaxis: {
        tooltip: {
          enabled: false
        }
      },
      dataLabels: {
        style: {
          colors: ["#000000"]
        }
      },
      noData: {
        text: "fail"
      },
      stroke: {
        colors: ["#000000"]
      },
      legend: {
        show: false
      },
      plotOptions: {
        heatmap: {
          useFillColorAsStroke: false,
          shadeIntensity: 0.9,
          radius: 0,
          colorScale: {
            ranges: [
              {
                from: -1,
                to: -1,
                color: "#FFFFFF",
                foreColor: "#FFFFFF"
              },
              {
                from: 0,
                to: 0,
                color: "#FF8888"
              }
            ],
            inverse: true
          },
        }
      },
      series: series,
      responsive: [
        {
          breakpoint: 768,
          options: {
            chart: {
              offsetX: 0
            },
            yaxis: {
              labels: {
                fontSize: "12px",
                offsetY: 100
              }
            },
            dataLabels: {
              enabled: true
            },
            tooltip: {
              y: {
                title: {
                  formatter: (seriesName) => ""
                },
                labels: {
                  fontSize: "10px"
                }
              }
            }
          }
        },
        {
          breakpoint: 576,
          options: {
            dataLabels: {
              enabled: false
            }
          }
        }
      ]
    }
    heatmap = new ApexCharts(document.querySelector("#playerChartAll"), options);
    heatmap.render();
  } else if (players.includes(tag)) {
    let toDisplay = arr.filter(element => element.tag === tag);
    let fame = [];
    let repairPoints = [];
    let boatAttacks = [];
    let decksUsed = [];
    let toDisplayIndex = 0;
    for (let i = 0; i < weeks.length; i++) {
      if (toDisplayIndex >= toDisplay.length || weeks[i] !== toDisplay[toDisplayIndex].week) {
        fame.push(null);
        repairPoints.push(null);
        boatAttacks.push(null);
        decksUsed.push(null);
      } else {
        fame.push(toDisplay[toDisplayIndex].fame);
        repairPoints.push(toDisplay[toDisplayIndex].repairPoints);
        boatAttacks.push(toDisplay[toDisplayIndex].boatAttacks);
        decksUsed.push(toDisplay[toDisplayIndex].decksUsed);
        toDisplayIndex++;
      }
    }
    let options1, options2, options3, options4;
    for (let i = 1; i <= 4; i++) {
      let dataSeries;
      let name;
      let color;
      switch (i) {
        case 1: {
          dataSeries = fame;
          name = "Fame";
          color = "#A300D6";
          break;
        }
        case 2: {
          dataSeries = repairPoints;
          name = "Repair Points";
          color = "#7D02EB";
          break;
        }
        case 3: {
          dataSeries = boatAttacks;
          name = "Boat Attacks";
          color = "#5653FE";
          break;
        }
        case 4: {
          dataSeries = decksUsed;
          name = "Decks Used";
          color = "#2983FF";
          break;
        }
      }
      let options = {
        chart: {
          id: `${tag}_${i}`,
          group: `${tag}_charts`,
          height: 150,
          type: "line"
        },
        theme: {
          mode: "light",
        },
        colors: [color],
        dataLabels: {
          enabled: true
        },
        tooltip: {
          theme: "light"
        },
        series: [
          {
            name: name,
            data: dataSeries
          }
        ],
        title: {
          text: tag + " | " + name,
          align: "center",
          style: {
            fontSize: "16px"
          }
        },
        xaxis: {
          categories: weeks
        },
        yaxis: {
          tickAmount: 4,
          labels: {
            minWidth: 20
          }
        },
        responsive: [{
          breakpoint: 576,
          options: {
            dataLabels: {
              enabled: false
            },
            tooltip: {
              enabled: true
            },
            yaxis: {
              tickAmount: 2
            },
            title: {
              text: name,
              align: "left",
              offsetX: 20,
              style: {
                fontSize: "16px"
              }
            },
            markers: {
              size: 5
            }
          }
        }]
      }
      switch (i) {
        case (1): {
          options1 = options;
          break;
        }
        case (2): {
          options2 = options;
          break;
        }
        case (3): {
          options3 = options;
          break;
        }
        case (4): {
          options4 = options;
          break;
        }
      }
    }
    
    fameChart = new ApexCharts(document.querySelector("#playerChartFame"), options1);
    fameChart.render();
    repairPointsChart = new ApexCharts(document.querySelector("#playerChartRepairPoints"), options2);
    repairPointsChart.render();
    boatAttacksChart = new ApexCharts(document.querySelector("#playerChartBoatAttacks"), options3);
    boatAttacksChart.render();
    decksUsedChart = new ApexCharts(document.querySelector("#playerChartDecksUsed"), options4);
    decksUsedChart.render();
  } else {
    $("#playerChartErrors").html(`<div class="alert alert-danger mx-2 text-center">Invalid Entry</div>`);
  }
}