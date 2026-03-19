const express = require('express');
const router = express.Router();
const { markAttendance, getAttendance, getStats } = require('../controllers/attendanceController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, adminOnly, markAttendance)
  .get(protect, getAttendance);

router.get('/stats', protect, getStats);

module.exports = router;
