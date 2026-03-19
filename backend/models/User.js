const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  password_hash: { type: String, required: true },
  role: { type: String, enum: ['Admin', 'User'], default: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
