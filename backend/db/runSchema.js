// Run with: npm run seed
// Applies schema.sql to the database pointed to by DATABASE_URL in .env
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

async function run() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  try {
    await pool.query(sql);
    console.log('Schema applied successfully.');
  } catch (err) {
    console.error('Error applying schema:', err.message);
  } finally {
    await pool.end();
  }
}

run();
