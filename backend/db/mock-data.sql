-- =========================================================
-- Mock/demo data for the Assignment Submission System
-- Run this in Neon's SQL Editor AFTER schema.sql has been applied.
--
-- Creates: 3 faculties, 5 departments, 3 programs, one academic
-- year + 2 semesters, 3 courses with course units, 3 lecturers
-- (each assigned to teach a unit), and 3 students (each registered
-- to a unit) - so you have something to click through immediately.
--
-- Login for every mock lecturer/student below: password "password123"
-- =========================================================

-- ---------- Faculties ----------
INSERT INTO faculties (name) VALUES
  ('Faculty of Science'),
  ('Faculty of Engineering'),
  ('Faculty of Environmental Studies');

-- ---------- Departments ----------
INSERT INTO departments (faculty_id, name) VALUES
  ((SELECT id FROM faculties WHERE name = 'Faculty of Science'), 'Computer Science'),
  ((SELECT id FROM faculties WHERE name = 'Faculty of Science'), 'Mathematics'),
  ((SELECT id FROM faculties WHERE name = 'Faculty of Engineering'), 'Electrical Engineering'),
  ((SELECT id FROM faculties WHERE name = 'Faculty of Engineering'), 'Mechanical Engineering'),
  ((SELECT id FROM faculties WHERE name = 'Faculty of Environmental Studies'), 'Architecture');

-- ---------- Programs ----------
INSERT INTO programs (name) VALUES ('ND'), ('HND'), ('Diploma');

-- ---------- Academic year & semesters ----------
INSERT INTO academic_years (name, start_date, end_date) VALUES
  ('2025/2026', '2025-09-01', '2026-07-31');

INSERT INTO semesters (name) VALUES ('First'), ('Second');

-- ---------- Courses ----------
INSERT INTO courses (faculty_id, department_id, code, name, duration, tuition) VALUES
  ((SELECT id FROM faculties WHERE name = 'Faculty of Science'),
   (SELECT id FROM departments WHERE name = 'Computer Science'),
   'CSC', 'Computer Science', '2 years', 50000),
  ((SELECT id FROM faculties WHERE name = 'Faculty of Engineering'),
   (SELECT id FROM departments WHERE name = 'Electrical Engineering'),
   'EEE', 'Electrical Engineering', '2 years', 55000),
  ((SELECT id FROM faculties WHERE name = 'Faculty of Environmental Studies'),
   (SELECT id FROM departments WHERE name = 'Architecture'),
   'ARC', 'Architecture', '2 years', 60000);

-- ---------- Course units ----------
INSERT INTO course_units (course_id, semester_id, name) VALUES
  ((SELECT id FROM courses WHERE code = 'CSC'), (SELECT id FROM semesters WHERE name = 'First'), 'Introduction to Programming'),
  ((SELECT id FROM courses WHERE code = 'CSC'), (SELECT id FROM semesters WHERE name = 'Second'), 'Data Structures'),
  ((SELECT id FROM courses WHERE code = 'EEE'), (SELECT id FROM semesters WHERE name = 'First'), 'Circuit Theory'),
  ((SELECT id FROM courses WHERE code = 'ARC'), (SELECT id FROM semesters WHERE name = 'First'), 'Architectural Drawing');

-- ---------- Lecturers ----------
-- All 3 use the password: password123
INSERT INTO users (username, password_hash, role_id) VALUES
  ('lecturer1', '$2b$10$xK9arV3eluASTQjNFRPE0O7.o0lI44evctZ/xI8kJA3sD1hAoTgi2', (SELECT id FROM roles WHERE name = 'lecturer')),
  ('lecturer2', '$2b$10$xK9arV3eluASTQjNFRPE0O7.o0lI44evctZ/xI8kJA3sD1hAoTgi2', (SELECT id FROM roles WHERE name = 'lecturer')),
  ('lecturer3', '$2b$10$xK9arV3eluASTQjNFRPE0O7.o0lI44evctZ/xI8kJA3sD1hAoTgi2', (SELECT id FROM roles WHERE name = 'lecturer'));

INSERT INTO staff (user_id, staff_type, name) VALUES
  ((SELECT id FROM users WHERE username = 'lecturer1'), 'lecturer', 'Dr. Ade Johnson'),
  ((SELECT id FROM users WHERE username = 'lecturer2'), 'lecturer', 'Mrs. Ngozi Eze'),
  ((SELECT id FROM users WHERE username = 'lecturer3'), 'lecturer', 'Mr. Tunde Bakare');

-- Assign each lecturer to teach one course unit
INSERT INTO teaches (staff_id, course_unit_id) VALUES
  ((SELECT id FROM staff WHERE name = 'Dr. Ade Johnson'),
   (SELECT id FROM course_units WHERE name = 'Introduction to Programming')),
  ((SELECT id FROM staff WHERE name = 'Mrs. Ngozi Eze'),
   (SELECT id FROM course_units WHERE name = 'Circuit Theory')),
  ((SELECT id FROM staff WHERE name = 'Mr. Tunde Bakare'),
   (SELECT id FROM course_units WHERE name = 'Architectural Drawing'));

-- ---------- Students ----------
-- All 3 use the password: password123
INSERT INTO users (username, password_hash, role_id) VALUES
  ('student1', '$2b$10$xK9arV3eluASTQjNFRPE0O7.o0lI44evctZ/xI8kJA3sD1hAoTgi2', (SELECT id FROM roles WHERE name = 'student')),
  ('student2', '$2b$10$xK9arV3eluASTQjNFRPE0O7.o0lI44evctZ/xI8kJA3sD1hAoTgi2', (SELECT id FROM roles WHERE name = 'student')),
  ('student3', '$2b$10$xK9arV3eluASTQjNFRPE0O7.o0lI44evctZ/xI8kJA3sD1hAoTgi2', (SELECT id FROM roles WHERE name = 'student'));

INSERT INTO students (user_id, faculty_id, department_id, program_id, first_name, surname, student_no, sex, admission_date) VALUES
  ((SELECT id FROM users WHERE username = 'student1'),
   (SELECT id FROM faculties WHERE name = 'Faculty of Science'),
   (SELECT id FROM departments WHERE name = 'Computer Science'),
   (SELECT id FROM programs WHERE name = 'ND'),
   'John', 'Doe', 'STU001', 'M', CURRENT_DATE),
  ((SELECT id FROM users WHERE username = 'student2'),
   (SELECT id FROM faculties WHERE name = 'Faculty of Engineering'),
   (SELECT id FROM departments WHERE name = 'Electrical Engineering'),
   (SELECT id FROM programs WHERE name = 'HND'),
   'Jane', 'Smith', 'STU002', 'F', CURRENT_DATE),
  ((SELECT id FROM users WHERE username = 'student3'),
   (SELECT id FROM faculties WHERE name = 'Faculty of Environmental Studies'),
   (SELECT id FROM departments WHERE name = 'Architecture'),
   (SELECT id FROM programs WHERE name = 'ND'),
   'Chike', 'Obi', 'STU003', 'M', CURRENT_DATE);

-- Register each student for the unit their lecturer teaches
INSERT INTO registrations (student_id, academic_year_id, semester_id, course_unit_id) VALUES
  ((SELECT id FROM students WHERE student_no = 'STU001'),
   (SELECT id FROM academic_years WHERE name = '2025/2026'),
   (SELECT id FROM semesters WHERE name = 'First'),
   (SELECT id FROM course_units WHERE name = 'Introduction to Programming')),
  ((SELECT id FROM students WHERE student_no = 'STU002'),
   (SELECT id FROM academic_years WHERE name = '2025/2026'),
   (SELECT id FROM semesters WHERE name = 'First'),
   (SELECT id FROM course_units WHERE name = 'Circuit Theory')),
  ((SELECT id FROM students WHERE student_no = 'STU003'),
   (SELECT id FROM academic_years WHERE name = '2025/2026'),
   (SELECT id FROM semesters WHERE name = 'First'),
   (SELECT id FROM course_units WHERE name = 'Architectural Drawing'));
