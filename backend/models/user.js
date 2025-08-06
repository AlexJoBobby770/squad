const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  passwordHash: String,
  squadId: mongoose.Schema.Types.ObjectId,
  joinedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", userSchema);
