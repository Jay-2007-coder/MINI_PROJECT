const express = require('express');
const router = express.Router();
const { exportDefaultersPDF, exportDefaultersCSV } = require('../controllers/exportController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/defaulters/pdf', protect, adminOnly, exportDefaultersPDF);
router.get('/defaulters/csv', protect, adminOnly, exportDefaultersCSV);

module.exports = router;
