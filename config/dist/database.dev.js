"use strict";

// Taking this code straight from Udemy
// Confidential info is used for the MongoURI when in prod
var confidentialInfo = require("./confidentialInfo");

if (process.env.NODE_ENV === "production") {
  module.exports = {
    mongoURI: confidentialInfo.mongoURI
  };
} else {
  module.exports = {
    mongoURI: "mongodb://localhost/clashalytics-dev"
  }; //module.exports = {mongoURI: confidentialInfo.mongoURI}
}