const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

const setup = async () => {
  try {
    // 1. Create database if it doesn't exist
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
    });
    
    const dbName = process.env.DB_NAME || 'student_attendance_db';
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
    console.log(`✅ Database '${dbName}' ensured.`);
    
    await connection.query(`USE \`${dbName}\`;`);

    // 2. Create tables
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('Admin', 'User') DEFAULT 'User',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS students (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        name VARCHAR(255) NOT NULL,
        roll_number VARCHAR(255) NOT NULL UNIQUE,
        class VARCHAR(255) NOT NULL,
        section VARCHAR(255) NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS attendances (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        date VARCHAR(255) NOT NULL,
        status ENUM('Present', 'Absent') NOT NULL,
        startTime VARCHAR(255),
        endTime VARCHAR(255),
        subject VARCHAR(255) NOT NULL,
        lectureNumber VARCHAR(255) DEFAULT '',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        UNIQUE KEY student_date_subject_lecture (student_id, date, subject, lectureNumber)
      );
    `);
    console.log('✅ MySQL tables created successfully with raw SQL.');

    // 3. Create default admin if none exists
    const [rows] = await connection.execute('SELECT * FROM users WHERE role = ?', ['Admin']);
    if (rows.length === 0) {
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash('admin123', salt);
      await connection.execute(
        'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
        ['admin', password_hash, 'Admin']
      );
      console.log('✅ Default Admin created — username: admin, password: admin123');
    } else {
      console.log('ℹ️  Admin user already exists, skipping seed.');
    }

    await connection.end();
    console.log('✅ Full Setup Complete!');
    process.exit(0);
  } catch (error) {
    console.error('Setup error:', error);
    process.exit(1);
  }
};

setup();
