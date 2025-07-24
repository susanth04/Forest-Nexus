const mongoose = require("mongoose");

const preferenceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  type: String,
  size: String,
  energy: String,
  grooming: String,
  space: String,
  kids: String,
  otherPets: String,
  activity: String,
  outdoorAccess: String,
  salary: String,
  timeAvailable: String,
  groomingEffort: String,
  age: String,
  trainability: String,
  temperament: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Preference", preferenceSchema);
