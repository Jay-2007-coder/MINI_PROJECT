const Student = require('../models/Student');
const Attendance = require('../models/Attendance');

// @route POST /api/attendance
const markAttendance = async (req, res) => {
  const { date, startTime, endTime, subject, lectureNumber, attendanceList } = req.body;

  if (!date || !subject || !attendanceList || attendanceList.length === 0) {
    return res.status(400).json({ message: 'Invalid data' });
  }

  try {
    // Upsert each record by student, date, subject, and optional lectureNumber
    const ops = attendanceList.map(record => ({
      updateOne: {
        filter: { student_id: record.student_id, date, subject, lectureNumber: lectureNumber || '' },
        update: { $set: { status: record.status, startTime, endTime } },
        upsert: true,
      },
    }));

    await Attendance.bulkWrite(ops);
    res.json({ message: 'Attendance marked successfully' });
  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({ message: 'Server error marking attendance' });
  }
};

// @route GET /api/attendance
const getAttendance = async (req, res) => {
  const { date, student_id, subject, lectureNumber } = req.query;

  try {
    let filter = {};

    if (req.user.role === 'User') {
      const student = await Student.findOne({ user_id: req.user.id });
      if (!student) return res.status(404).json({ message: 'Student profile not found' });
      filter.student_id = student._id;
    } else {
      if (date) filter.date = date;
      else if (student_id) filter.student_id = student_id;
    }

    if (subject) filter.subject = subject;
    if (lectureNumber) filter.lectureNumber = lectureNumber;

    const records = await Attendance.find(filter)
      .populate({ path: 'student_id', select: 'name roll_number class section' })
      .sort({ date: -1 });

    const result = records.map(r => ({
      id: r._id,
      date: r.date,
      status: r.status,
      startTime: r.startTime,
      endTime: r.endTime,
      subject: r.subject,
      lectureNumber: r.lectureNumber,
      student_id: r.student_id?._id,
      name: r.student_id?.name,
      roll_number: r.student_id?.roll_number,
      class: r.student_id?.class,
      section: r.student_id?.section,
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
    
    // Build date filter for queries (as strings since DB stores as YYYY-MM-DD)
    const dateFilter = {};
    if (startDate || endDate) {
      const criteria = {};
      if (startDate) criteria.$gte = startDate;
      if (endDate) criteria.$lte = endDate;
      dateFilter.date = criteria;
    }

    const workingDaysQuery = startDate || endDate ? dateFilter : {};
    const workingDaysAggregation = await Attendance.aggregate([
      { $match: workingDaysQuery },
      { $group: { _id: "$date" } },
      { $count: "count" }
    ]);
    const totalWorkingDays = workingDaysAggregation.length > 0 ? workingDaysAggregation[0].count : 0;

    let studentFilter = {};
    if (req.user.role === 'User') {
      const student = await Student.findOne({ user_id: req.user.id });
      if (student) studentFilter = { _id: student._id };
    }

    const students = await Student.find(studentFilter);
    const studentIds = students.map(s => s._id);

    // Build aggregation pipeline
    const pipeline = [
      { $match: { student_id: { $in: studentIds } } }
    ];
    
    if (startDate || endDate) {
      pipeline.push({ $match: { date: dateFilter.date } });
    }
    
    pipeline.push({
      $group: {
        _id: { student_id: "$student_id", subject: "$subject" },
        presentCount: { $sum: { $cond: [{ $eq: ["$status", "Present"] }, 1, 0] } },
        totalCount: { $sum: 1 },
        workingDates: { $addToSet: "$date" }
      }
    });

    const attendanceStats = await Attendance.aggregate(pipeline);
    const statsResult = [];
    
    for (const stat of attendanceStats) {
      const student = students.find(s => s._id.toString() === stat._id.student_id.toString());
      if (!student) continue;
      
      const total_classes = stat.totalCount;
      const percentage = total_classes > 0 
        ? parseFloat(((stat.presentCount / total_classes) * 100).toFixed(2)) 
        : 0;
        
      statsResult.push({
        id: `${student._id}_${stat._id.subject}`, 
        student_id: student._id,
        name: student.name,
        roll_number: student.roll_number,
        class: student.class,
        section: student.section,
        subject: stat._id.subject,
        classes_present: stat.presentCount,
        total_classes: total_classes,
        working_days: stat.workingDates.length, // Unique calendar days
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
