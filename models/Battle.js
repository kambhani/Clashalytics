const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Battle = new Schema({
  player_tag: {
    type: String,
    required: true
  },
  deck_used: [{
    type: Number,
    required: true
  }],
  deck_faced: [{
    type: Number,
    required: true
  }],
  level_difference: {
    type: Number,
    required: true
  },
  opponent_tag: {
    type: String,
    required: true
  },
  battle_outcome: {
    type: Number,
    required: true
  },
  time: {
    type: Date,
    required: true
  },
  battle_type: {
    type: Number,
    required: true
  }
});

mongoose.model("Battle", Battle);