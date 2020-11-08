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
mongoose.model("DeckWinRate", DeckWinRateSchema);