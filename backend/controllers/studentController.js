const bcrypt = require('bcrypt');
const { pool } = require('../config/db');

// @route GET /api/students
const getStudents = async (req, res) => {
  try {
    const [students] = await pool.execute(`
      SELECT s.id, s.name, s.roll_number, s.class, s.section, u.username
      FROM students s
      LEFT JOIN users u ON s.user_id = u.id
    `);
    
    // Formatting perfectly for frontend
    const result = students.map(s => ({
      id: s.id,
      name: s.name,
      roll_number: s.roll_number,
      class: s.class,
      section: s.section,
      username: s.username || '',
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

    const [existingUser] = await pool.execute('SELECT id FROM users WHERE username = ?', [username]);
    if (existingUser.length > 0) return res.status(400).json({ message: 'Username already exists' });

    const [existingStudent] = await pool.execute('SELECT id FROM students WHERE roll_number = ?', [roll_number]);
    if (existingStudent.length > 0) return res.status(400).json({ message: 'Roll number already exists' });

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    
    // Create user account
    const [userResult] = await pool.execute(
      'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
      [username, password_hash, 'User']
    );
    const user_id = userResult.insertId;

    // Create student record
    const [studentResult] = await pool.execute(
      'INSERT INTO students (user_id, name, roll_number, class, section) VALUES (?, ?, ?, ?, ?)',
      [user_id, name, roll_number, className, section]
    );

    res.status(201).json({
      id: studentResult.insertId,
      name,
      roll_number,
      class: className,
      section,
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
    const { id } = req.params;

    const [result] = await pool.execute(
      'UPDATE students SET name = ?, roll_number = ?, class = ?, section = ? WHERE id = ?',
      [name, roll_number, className, section, id]
    );

    if (result.affectedRows === 0) return res.status(404).json({ message: 'Student not found' });

    res.json({ message: 'Student updated successfully' });
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @route DELETE /api/students/:id
const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const [studentRows] = await pool.execute('SELECT user_id FROM students WHERE id = ?', [id]);
    
    if (studentRows.length === 0) return res.status(404).json({ message: 'Student not found' });
    const student = studentRows[0];

    // Deleting the user automatically deletes the student and their attendance via ON DELETE CASCADE in raw SQL
    if (student.user_id) {
      await pool.execute('DELETE FROM users WHERE id = ?', [student.user_id]);
    } else {
      await pool.execute('DELETE FROM students WHERE id = ?', [id]);
    }

    res.json({ message: 'Student removed successfully' });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getStudents, addStudent, updateStudent, deleteStudent };
