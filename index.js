// Create variables and open up a request
//let requestURL = "https://api.clashroyale.com/v1/players/%YQUC8ULVL";
let requestURL = "https://mdn.github.io/learning-area/javascript/oojs/json/superheroes.json";
let request = new XMLHttpRequest();
request.open("Get", requestURL);
// This sets the response type
request.responseType = "json";

/*request.setRequestHeader("Accept", "application/json");
request.setRequestHeader("Authorization", "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiIsImtpZCI6IjI4YTMxOGY3LTAwMDAtYTFlYi03ZmExLTJjNzQzM2M2Y2NhNSJ9.eyJpc3MiOiJzdXBlcmNlbGwiLCJhdWQiOiJzdXBlcmNlbGw6Z2FtZWFwaSIsImp0aSI6ImRiNjM2NzZkLWUwZjUtNGJkNy1hZTlkLTQ4YzYwZmYzZmEwMiIsImlhdCI6MTYwNDU0MDg1Mywic3ViIjoiZGV2ZWxvcGVyLzZmMDliMjM1LWViMDUtMzhjOS04ZTEyLTMxYjViMjJkM2VkNCIsInNjb3BlcyI6WyJyb3lhbGUiXSwibGltaXRzIjpbeyJ0aWVyIjoiZGV2ZWxvcGVyL3NpbHZlciIsInR5cGUiOiJ0aHJvdHRsaW5nIn0seyJjaWRycyI6WyIxODQuMTcwLjE2Ni4xNzciXSwidHlwZSI6ImNsaWVudCJ9XX0");*/
request.send();

// Callback functions
request.onprogress = function () {

}

request.onerror = function () {
  console.log("=()");
}

request.onload = function() {
  if (this.status === 200) {
    const answer = request.response;
    console.log(answer);
  } else {
    console.log("=(");
  }
}