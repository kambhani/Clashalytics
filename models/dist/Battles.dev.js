"use strict";

var mongoose = require("mongoose");

var Schema = mongoose.Schema;
var Battles = new Schema({
  deck_used: [{
    type: String,
    required: true
  }],
  deck_faced: [{
    type: String,
    required: true
  }],
  level_difference: [{
    type: Number,
    required: true
  }],
  opp_tag: [{
    type: Number,
    required: true
  }],
  victory_status: [{
    // 1 is victory, 0 is draw, -1 is loss
    type: Number,
    required: true
  }],
  time: [{
    type: Date,
    required: true
  }]
});
mongoose.model("Battles", Battles);