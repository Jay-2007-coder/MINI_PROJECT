const express = require('express');
const router = express.Router();
const { getStudents, addStudent, updateStudent, deleteStudent } = require('../controllers/studentController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, adminOnly, getStudents)
  .post(protect, adminOnly, addStudent);

router.route('/:id')
  .put(protect, adminOnly, updateStudent)
  .delete(protect, adminOnly, deleteStudent);

module.exports = router;
