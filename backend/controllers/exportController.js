const { pool } = require('../config/db');
const PDFDocument = require('pdfkit');
const { Parser } = require('json2csv');

// Helper to fetch defaulters
const fetchDefaulters = async (startDate, endDate) => {
  const params = [];

  let countQuery = `SELECT COUNT(DISTINCT date) as count FROM attendances WHERE 1=1`;
  if (startDate) { countQuery += ` AND date >= ?`; params.push(startDate); }
  if (endDate) { countQuery += ` AND date <= ?`; params.push(endDate); }

  const [workingDaysResult] = await pool.execute(countQuery, params);
  const totalWorkingDays = parseInt(workingDaysResult[0].count, 10);

  if (totalWorkingDays === 0) return { totalWorkingDays: 0, defaulters: [] };

  const [students] = await pool.execute(`SELECT id, name, roll_number, class, section FROM students`);
  if (students.length === 0) return { totalWorkingDays, defaulters: [] };

  const studentIds = students.map(s => s.id);
  const placeholders = studentIds.map(() => '?').join(',');

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

  const [stats] = await pool.execute(statsQuery, statsParams);
  const defaulters = [];

  for (const stat of stats) {
    const student = students.find(s => s.id === stat.student_id);
    if (!student) continue;
    
    const totalClasses = parseInt(stat.totalCount, 10);
    const presentCount = parseInt(stat.presentCount, 10);
    const percentage = totalClasses > 0 
      ? parseFloat(((presentCount / totalClasses) * 100).toFixed(2)) 
      : 0;
      
    if (percentage < 75) {
      defaulters.push({
        name: student.name,
        roll_number: student.roll_number,
        class: student.class,
        section: student.section,
        subject: stat.subject,
        classes_attended: presentCount,
        total_classes: totalClasses,
        working_days: parseInt(stat.workingDatesCount, 10),
        percentage
      });
    }
  }

  return { totalWorkingDays, defaulters };
};

// @route GET /api/exports/defaulters/pdf
const exportDefaultersPDF = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const { totalWorkingDays, defaulters } = await fetchDefaulters(startDate, endDate);

    const doc = new PDFDocument();
    res.setHeader('Content-Disposition', `attachment; filename="Defaulters_List.pdf"`);
    res.setHeader('Content-Type', 'application/pdf');
    doc.pipe(res);

    doc.fontSize(20).text('Defaulters List (< 75% Attendance)', { align: 'center' });
    doc.moveDown();

    if (!defaulters || defaulters.length === 0) {
      doc.fontSize(14).text('No defaulters found or no attendance data available.', { align: 'center' });
    } else {
      doc.fontSize(12).text(`Overall Working Days: ${totalWorkingDays}`);
      doc.moveDown();
      defaulters.forEach((s, i) => {
        doc.text(`${i + 1}. ${s.name} (Roll: ${s.roll_number}) - Subject: ${s.subject} - Attended: ${s.classes_attended}/${s.total_classes} classes (${s.percentage}%)`);
      });
    }

    doc.end();
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ message: 'Error generating PDF' });
  }
};

// @route GET /api/exports/defaulters/csv
const exportDefaultersCSV = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const { defaulters } = await fetchDefaulters(startDate, endDate);

    if (!defaulters || defaulters.length === 0) {
      return res.status(404).json({ message: 'No defaulters found or no attendance data available' });
    }

    const parser = new Parser({ fields: [
      { label: 'Name', value: 'name' },
      { label: 'Roll Number', value: 'roll_number' },
      { label: 'Class', value: 'class' },
      { label: 'Section', value: 'section' },
      { label: 'Subject', value: 'subject' },
      { label: 'Classes Attended', value: 'classes_attended' },
      { label: 'Total Classes', value: 'total_classes' },
      { label: 'Working Days (Calendar)', value: 'working_days' },
      { label: 'Attendance %', value: 'percentage' }
    ] });
    const csv = parser.parse(defaulters);

    res.setHeader('Content-Disposition', `attachment; filename="Defaulters_List.csv"`);
    res.setHeader('Content-Type', 'text/csv');
    res.status(200).send(csv);
  } catch (error) {
    console.error('Error generating CSV:', error);
    res.status(500).json({ message: 'Error generating CSV' });
  }
};

module.exports = { exportDefaultersPDF, exportDefaultersCSV };
