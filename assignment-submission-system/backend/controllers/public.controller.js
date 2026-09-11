const pool = require('../config/db');

async function getFaculties(req, res) {
  const result = await pool.query('SELECT id, name FROM faculties ORDER BY name');
  res.json(result.rows);
}
async function getDepartments(req, res) {
  const { faculty_id } = req.query;
  const result = faculty_id
    ? await pool.query('SELECT id, name FROM departments WHERE faculty_id = $1 ORDER BY name', [faculty_id])
    : await pool.query('SELECT id, name FROM departments ORDER BY name');
  res.json(result.rows);
}
async function getPrograms(req, res) {
  const result = await pool.query('SELECT id, name FROM programs ORDER BY name');
  res.json(result.rows);
}

async function getAcademicYears(req, res) {
  const result = await pool.query('SELECT id, name FROM academic_years ORDER BY start_date DESC');
  res.json(result.rows);
}
async function getSemesters(req, res) {
  const result = await pool.query('SELECT id, name FROM semesters ORDER BY id');
  res.json(result.rows);
}

module.exports = { getFaculties, getDepartments, getPrograms, getAcademicYears, getSemesters };
