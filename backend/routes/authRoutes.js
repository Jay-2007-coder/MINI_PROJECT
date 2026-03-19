const express = require('express');
const router = express.Router();
const { loginUser, registerUser, registerPublic } = require('../controllers/authController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.post('/login', loginUser);
router.post('/register', protect, adminOnly, registerUser);   // Admin creates a user
router.post('/register-public', registerPublic);               // Public: first admin OR new student (if allowed)

module.exports = router;
