const { pool } = require('../config/db');

// @route POST /api/attendance
const markAttendance = async (req, res) => {
  const { date, startTime, endTime, subject, lectureNumber, attendanceList } = req.body;

  if (!date || !subject || !attendanceList || attendanceList.length === 0) {
    return res.status(400).json({ message: 'Invalid data' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    for (const record of attendanceList) {
      await connection.execute(`
        INSERT INTO attendances (student_id, date, subject, lectureNumber, status, startTime, endTime)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE status = VALUES(status), startTime = VALUES(startTime), endTime = VALUES(endTime)
      `, [
        record.student_id, date, subject, lectureNumber || '', record.status, startTime || null, endTime || null
      ]);
    }

    await connection.commit();
    res.json({ message: 'Attendance marked successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error marking attendance:', error);
    res.status(500).json({ message: 'Server error marking attendance' });
  } finally {
    connection.release();
  }
};

// @route GET /api/attendance
const getAttendance = async (req, res) => {
  const { date, student_id, subject, lectureNumber } = req.query;

  try {
    let query = `
      SELECT a.*, s.name, s.roll_number, s.class, s.section
      FROM attendances a
      LEFT JOIN students s ON a.student_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (req.user.role === 'User') {
      const [studentRows] = await pool.execute('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
      if (studentRows.length === 0) return res.status(404).json({ message: 'Student profile not found' });
      query += ` AND a.student_id = ?`;
      params.push(studentRows[0].id);
    } else {
      if (date) { query += ` AND a.date = ?`; params.push(date); }
      else if (student_id) { query += ` AND a.student_id = ?`; params.push(student_id); }
    }

    if (subject) { query += ` AND a.subject = ?`; params.push(subject); }
    if (lectureNumber) { query += ` AND a.lectureNumber = ?`; params.push(lectureNumber); }

    query += ` ORDER BY a.date DESC`;

    const [records] = await pool.execute(query, params);

    const result = records.map(r => ({
      id: r.id,
      date: r.date,
      status: r.status,
      startTime: r.startTime,
      endTime: r.endTime,
      subject: r.subject,
      lectureNumber: r.lectureNumber,
      student_id: r.student_id,
      name: r.name,
      roll_number: r.roll_number,
      class: r.class,
      section: r.section,
    }));

    res.json(result);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @route GET /api/attendance/stats
const getStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const params = [];

    // Get Total Working Days
    let countQuery = `SELECT COUNT(DISTINCT date) as count FROM attendances WHERE 1=1`;
    if (startDate) { countQuery += ` AND date >= ?`; params.push(startDate); }
    if (endDate) { countQuery += ` AND date <= ?`; params.push(endDate); }

    const [workingDaysResult] = await pool.execute(countQuery, params);
    const totalWorkingDays = parseInt(workingDaysResult[0].count, 10);

    // Get students filter
    let studentFilterQuery = `SELECT * FROM students WHERE 1=1`;
    const studentParams = [];
    
    if (req.user.role === 'User') {
      const [uRows] = await pool.execute('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
      if (uRows.length > 0) {
        studentFilterQuery += ` AND id = ?`;
        studentParams.push(uRows[0].id);
      } else {
        return res.json({ totalWorkingDays, students: [] });
      }
    }

    const [students] = await pool.execute(studentFilterQuery, studentParams);
    if (students.length === 0) {
      return res.json({ totalWorkingDays, students: [] });
    }

    const studentIds = students.map(s => s.id);
    const placeholders = studentIds.map(() => '?').join(',');

    // Build Stats Query
    let statsQuery = `
      SELECT 
        student_id, 
        subject, 
        SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) AS presentCount,
        COUNT(*) AS totalCount,
        COUNT(DISTINCT date) as workingDatesCount
      FROM attendances
      WHERE student_id IN (${placeholders})
    `;
    const statsParams = [...studentIds];

    if (startDate) { statsQuery += ` AND date >= ?`; statsParams.push(startDate); }
    if (endDate) { statsQuery += ` AND date <= ?`; statsParams.push(endDate); }

    statsQuery += ` GROUP BY student_id, subject`;

    const [attendanceStats] = await pool.execute(statsQuery, statsParams);

    const statsResult = [];
    
    for (const stat of attendanceStats) {
      const student = students.find(s => s.id === stat.student_id);
      if (!student) continue;
      
      const total_classes = parseInt(stat.totalCount, 10);
      const present_classes = parseInt(stat.presentCount, 10);
      const percentage = total_classes > 0 
        ? parseFloat(((present_classes / total_classes) * 100).toFixed(2)) 
        : 0;
        
      statsResult.push({
        id: `${student.id}_${stat.subject}`, 
        student_id: student.id,
        name: student.name,
        roll_number: student.roll_number,
        class: student.class,
        section: student.section,
        subject: stat.subject,
        classes_present: present_classes,
        total_classes: total_classes,
        working_days: parseInt(stat.workingDatesCount, 10),
        percentage,
        isDefaulter: percentage < 75,
      });
    }

    res.json({ totalWorkingDays, students: statsResult });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { markAttendance, getAttendance, getStats };
