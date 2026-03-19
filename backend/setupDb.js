const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const connectDB = require('./config/db');
const User = require('./models/User');
require('dotenv').config();

const setup = async () => {
  await connectDB();

  try {
    // Create default admin if none exists
    const existingAdmin = await User.findOne({ role: 'Admin' });
    if (!existingAdmin) {
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash('admin123', salt);
      await User.create({ username: 'admin', password_hash, role: 'Admin' });
      console.log('✅ Default Admin created — username: admin, password: admin123');
    } else {
      console.log('ℹ️  Admin user already exists, skipping seed.');
    }

    console.log('✅ MongoDB setup complete!');
    process.exit(0);
  } catch (error) {
    console.error('Setup error:', error);
    process.exit(1);
  }
};

setup();
