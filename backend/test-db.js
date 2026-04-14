const { pool } = require('./config/db');

pool.execute('SELECT * FROM attendances LIMIT 1').then(async () => {
  console.log('Connection successful using raw mysql2 pool!');
  const [records] = await pool.execute('SELECT * FROM attendances');
  console.log(records);
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
