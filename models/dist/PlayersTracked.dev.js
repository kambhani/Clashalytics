"use strict";

var mongoose = require("mongoose");

var Schema = mongoose.Schema;
var Tracked_Player = new Schema({
  player: {
    type: String,
    required: true
  }
});
mongoose.model("Tracked_Player", Tracked_Player);