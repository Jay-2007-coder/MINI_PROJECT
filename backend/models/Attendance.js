const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  date: { type: String, required: true },   // stored as 'YYYY-MM-DD' string
  status: { type: String, enum: ['Present', 'Absent'], required: true },
  startTime: { type: String },              // e.g. "09:00"
  endTime: { type: String },                // e.g. "15:00"
  subject: { type: String, required: true },
  lectureNumber: { type: String },
}, { timestamps: true });

// Prevent duplicate entries for the same student on the same date, subject, and lecture
attendanceSchema.index({ student_id: 1, date: 1, subject: 1, lectureNumber: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
