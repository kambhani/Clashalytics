const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Tracked_Player = new Schema({
  player: {
    type: String,
    required: true
  }
});

mongoose.model("Tracked_Player", Tracked_Player);