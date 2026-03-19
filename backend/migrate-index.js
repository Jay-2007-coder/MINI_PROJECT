const mongoose = require('mongoose');
const Attendance = require('./models/Attendance');
require('dotenv').config();

mongoose.connect('mongodb://localhost:27017/school_management').then(async () => {
  try {
    // Drop the old index if it exists
    await Attendance.collection.dropIndex('student_id_1_date_1');
    console.log('Successfully dropped old unique index.');
  } catch (err) {
    if (err.code === 27) {
      console.log('Index not found, nothing to drop.');
    } else {
      console.error('Error dropping index:', err.message);
    }
  }
  
  // Re-sync all indexes defined in the schema
  await Attendance.syncIndexes();
  console.log('Indexes synced successfully.');

  mongoose.connection.close();
}).catch(err => {
  console.error(err);
  process.exit(1);
});
