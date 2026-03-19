const mongoose = require('mongoose');
const { exportDefaultersPDF } = require('./controllers/exportController');
require('dotenv').config();

mongoose.connect('mongodb://localhost:27017/school_management').then(async () => {
  try {
    const req = {};
    const res = {
      setHeader: console.log,
      status: (code) => {
        console.log('Status set:', code);
        return {
          send: console.log,
          json: console.log
        };
      },
      write: () => true,
      end: () => console.log('Response ended.'),
      on: () => {},
      once: () => {},
      emit: () => {}
    };
    await exportDefaultersPDF(req, res);
  } catch (err) {
    console.error('Test script caught:', err);
  } finally {
    mongoose.connection.close();
  }
}).catch(console.error);
