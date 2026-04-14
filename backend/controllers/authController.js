const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { pool } = require('../config/db');

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @route POST /api/auth/login
const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;
    const [rows] = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const user = rows[0];
    if (!(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    res.json({
      id: user.id,
      username: user.username,
      role: user.role,
      token: generateToken(user.id, user.role),
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @route POST /api/auth/register  (Admin only — creates any user)
const registerUser = async (req, res) => {
  try {
    const { username, password, role } = req.body;
    const [existing] = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);
    if (existing.length > 0) return res.status(400).json({ message: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    
    const [result] = await pool.execute(
      'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
      [username, password_hash, role || 'User']
    );

    res.status(201).json({ id: result.insertId, username, role: role || 'User' });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @route POST /api/auth/register-public (Public — Admin only, single admin allowed)
const registerPublic = async (req, res) => {
  try {
    const { username, password } = req.body;

    const [adminRows] = await pool.execute('SELECT * FROM users WHERE role = ?', ['Admin']);
    if (adminRows.length > 0) {
      return res.status(403).json({ message: 'An administrator already exists. Please login.' });
    }

    const [existing] = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);
    if (existing.length > 0) return res.status(400).json({ message: 'Username already taken' });

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    
    const [result] = await pool.execute(
      'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
      [username, password_hash, 'Admin']
    );

    res.status(201).json({
      id: result.insertId,
      username,
      role: 'Admin',
      token: generateToken(result.insertId, 'Admin'),
    });
  } catch (error) {
    console.error('Public register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { loginUser, registerUser, registerPublic };

