const mongoose = require('mongoose');
const Attendance = require('./models/Attendance');

mongoose.connect('mongodb://localhost:27017/school_management').then(async () => {
  const records = await Attendance.find({});
  console.log(records);
  mongoose.connection.close();
}).catch(err => {
  console.error(err);
  process.exit(1);
});
