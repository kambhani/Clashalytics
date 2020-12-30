// Taking this code straight from Udemy
// Confidential info is used for the MongoURI when in prod
const confidentialInfo = require("./confidentialInfo");
if (process.env.NODE_ENV === "production") {
  module.exports = {mongoURI: confidentialInfo.MongoURI}
} else {
  module.exports = {mongoURI: "mongodb://localhost/clashalytics-dev"}
}