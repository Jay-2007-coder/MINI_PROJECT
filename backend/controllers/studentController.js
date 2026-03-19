const bcrypt = require('bcrypt');
const User = require('../models/User');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');

// @route GET /api/students
const getStudents = async (req, res) => {
  try {
    const students = await Student.find().populate('user_id', 'username');
    const result = students.map(s => ({
      id: s._id,
      name: s.name,
      roll_number: s.roll_number,
      class: s.class,
      section: s.section,
      username: s.user_id?.username || '',
    }));
    res.json(result);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @route POST /api/students
const addStudent = async (req, res) => {
  try {
    const { name, roll_number, className, section, username, password } = req.body;

    // Check duplicates
    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ message: 'Username already exists' });

    const existingStudent = await Student.findOne({ roll_number });
    if (existingStudent) return res.status(400).json({ message: 'Roll number already exists' });

    // Create user account
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    const user = await User.create({ username, password_hash, role: 'User' });

    // Create student record
    const student = await Student.create({
      user_id: user._id,
      name,
      roll_number,
      class: className,
      section,
    });

    res.status(201).json({
      id: student._id,
      name: student.name,
      roll_number: student.roll_number,
      class: student.class,
      section: student.section,
    });
  } catch (error) {
    console.error('Error adding student:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @route PUT /api/students/:id
const updateStudent = async (req, res) => {
  try {
    const { name, roll_number, className, section } = req.body;

    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { name, roll_number, class: className, section },
      { new: true }
    );

    if (!student) return res.status(404).json({ message: 'Student not found' });

    res.json({ message: 'Student updated successfully' });
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @route DELETE /api/students/:id
const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    // Delete related records
    await Attendance.deleteMany({ student_id: student._id });
    if (student.user_id) await User.findByIdAndDelete(student.user_id);
    await Student.findByIdAndDelete(student._id);

    res.json({ message: 'Student removed successfully' });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getStudents, addStudent, updateStudent, deleteStudent };
