const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const PDFDocument = require('pdfkit');
const { Parser } = require('json2csv');

// Helper to fetch defaulters
const fetchDefaulters = async (startDate, endDate) => {
  // Build date filter (as strings since DB stores as YYYY-MM-DD)
  const dateFilter = {};
  if (startDate || endDate) {
    dateFilter.date = {};
    if (startDate) dateFilter.date.$gte = startDate;
    if (endDate) dateFilter.date.$lte = endDate;
  }

  const workingDaysQuery = (startDate || endDate) ? dateFilter : {};
  const workingDaysAggregation = await Attendance.aggregate([
    { $match: workingDaysQuery },
    { $group: { _id: "$date" } },
    { $count: "count" }
  ]);
  const totalWorkingDays = workingDaysAggregation.length > 0 ? workingDaysAggregation[0].count : 0;

  if (totalWorkingDays === 0) return { totalWorkingDays: 0, defaulters: [] };

  const students = await Student.find({}, 'name roll_number class section');
  const studentIds = students.map(s => s._id);

  const pipeline = [
    { $match: { student_id: { $in: studentIds } } }
  ];
  if (startDate || endDate) pipeline.push({ $match: { date: dateFilter.date } });

  pipeline.push({
    $group: {
      _id: { student_id: "$student_id", subject: "$subject" },
      presentCount: { $sum: { $cond: [{ $eq: ["$status", "Present"] }, 1, 0] } },
      totalCount: { $sum: 1 },
      workingDates: { $addToSet: "$date" }
    }
  });

  const stats = await Attendance.aggregate(pipeline);
  const defaulters = [];

  for (const stat of stats) {
    const student = students.find(s => s._id.toString() === stat._id.student_id.toString());
    if (!student) continue;
    
    const totalClasses = stat.totalCount;
    const percentage = totalClasses > 0 
      ? parseFloat(((stat.presentCount / totalClasses) * 100).toFixed(2)) 
      : 0;
      
    if (percentage < 75) {
      defaulters.push({
        name: student.name,
        roll_number: student.roll_number,
        class: student.class,
        section: student.section,
        subject: stat._id.subject,
        classes_attended: stat.presentCount,
        total_classes: totalClasses,
        working_days: stat.workingDates.length,
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
