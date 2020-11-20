"use strict";

var mongoose = require("mongoose");

var Schema = mongoose.Schema; // Create Schema

var DeckWinRateSchema = new Schema({
  deck_faced: [{
    type: Number,
    required: true
  }],
  total_wins: {
    type: Number,
    required: true
  },
  current_season_wins: {
    type: Number,
    required: true
  },
  win_player_tags: [{
    type: String,
    required: true
  }],
  total_losses: {
    type: Number,
    required: true
  },
  current_season_losses: {
    type: Number,
    required: true
  },
  loss_player_tags: [{
    type: String,
    required: true
  }]
});
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
    "default": Date.now
  }]
});
mongoose.model("DeckWinRate", DeckWinRateSchema);