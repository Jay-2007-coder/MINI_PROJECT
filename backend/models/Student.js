const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, required: true, trim: true },
  roll_number: { type: String, required: true, unique: true, trim: true },
  class: { type: String, required: true },
  section: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);
