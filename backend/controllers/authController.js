const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User');

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @route POST /api/auth/login
const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    res.json({
      id: user._id,
      username: user.username,
      role: user.role,
      token: generateToken(user._id, user.role),
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
    const existing = await User.findOne({ username });
    if (existing) return res.status(400).json({ message: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    const user = await User.create({ username, password_hash, role: role || 'User' });

    res.status(201).json({ id: user._id, username: user.username, role: user.role });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @route POST /api/auth/register-public (Public — Admin only, single admin allowed)
const registerPublic = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Reject if an admin already exists
    const existingAdmin = await User.findOne({ role: 'Admin' });
    if (existingAdmin) {
      return res.status(403).json({ message: 'An administrator already exists. Please login.' });
    }

    const existing = await User.findOne({ username });
    if (existing) return res.status(400).json({ message: 'Username already taken' });

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    
    // Public register is now strictly for Admins as per user requirement
    const user = await User.create({ username, password_hash, role: 'Admin' });

    res.status(201).json({
      id: user._id,
      username: user.username,
      role: user.role,
      token: generateToken(user._id, user.role),
    });
  } catch (error) {
    console.error('Public register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { loginUser, registerUser, registerPublic };

