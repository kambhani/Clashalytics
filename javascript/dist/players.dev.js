"use strict";

document.getElementById("test").addEventListener("click", loadPlayer); // Can use proxy.royaleapi.dev instead

function loadPlayer() {
  fetch("https://proxy.royaleapi.dev/v1/cards", {
    headers: {
      Accept: "application/json",
      Authorization: "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiIsImtpZCI6IjI4YTMxOGY3LTAwMDAtYTFlYi03ZmExLTJjNzQzM2M2Y2NhNSJ9.eyJpc3MiOiJzdXBlcmNlbGwiLCJhdWQiOiJzdXBlcmNlbGw6Z2FtZWFwaSIsImp0aSI6IjEyY2RmZDFkLWQ0OTUtNDJlYy1iMDVmLTdkZmVjZmZhMmFlZiIsImlhdCI6MTYwNDc2NDE1OCwic3ViIjoiZGV2ZWxvcGVyLzZmMDliMjM1LWViMDUtMzhjOS04ZTEyLTMxYjViMjJkM2VkNCIsInNjb3BlcyI6WyJyb3lhbGUiXSwibGltaXRzIjpbeyJ0aWVyIjoiZGV2ZWxvcGVyL3NpbHZlciIsInR5cGUiOiJ0aHJvdHRsaW5nIn0seyJjaWRycyI6WyIxMjguMTI4LjEyOC4xMjgiLCIxODQuMTcwLjE2Ni4xNzciXSwidHlwZSI6ImNsaWVudCJ9XX0.9Gz9LO84bGeLOKF-mJ2soR2MARr-9q6VF0j_gc_o6UHoWX80VvJVPt2Md8VslRZcQdciWI9ZkI-UKJgBwLDrKw"
    }
  }).then(function (res) {
    console.log(res);
  })["catch"](function (err) {
    console.log(err);
  });
}