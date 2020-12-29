"use strict";

// Taking this code straight from Udemy
if (process.env.NODE_ENV === "production") {
  // Need to find a better way to hide the password
  module.exports = {
    mongoURI: "mongodb+srv://anish:VGrSwYg3R4c9r5z@clashalytics-prod.z4uhu.mongodb.net/<dbname>?retryWrites=true&w=majority"
  };
} else {
  module.exports = {
    mongoURI: "mongodb://localhost/clashalytics-dev"
  };
}