-- =========================================================
-- Self-contained mock data: creates everything needed from
-- scratch (Faculty of Science setup, lecturer4, student4,
-- course assignment, 3 assignments, submissions/answers).
--
-- Safe to run even if some of this already exists - every
-- insert either checks first or uses ON CONFLICT DO NOTHING,
-- so nothing gets duplicated if you run this more than once.
--
-- Login for both accounts: password "password123"
--   Lecturer username: lecturer4
--   Student username:  student4
-- =========================================================

-- ---------- Faculty / department / program ----------
INSERT INTO faculties (name)
  SELECT 'Faculty of Science'
  WHERE NOT EXISTS (SELECT 1 FROM faculties WHERE name = 'Faculty of Science');

INSERT INTO departments (faculty_id, name)
  SELECT (SELECT id FROM faculties WHERE name = 'Faculty of Science'), 'Computer Science'
  WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Computer Science');

INSERT INTO programs (name)
  SELECT 'ND'
  WHERE NOT EXISTS (SELECT 1 FROM programs WHERE name = 'ND');

-- ---------- Academic calendar ----------
INSERT INTO academic_years (name, start_date, end_date)
  SELECT '2025/2026', '2025-09-01', '2026-07-31'
  WHERE NOT EXISTS (SELECT 1 FROM academic_years WHERE name = '2025/2026');

INSERT INTO semesters (name)
  SELECT 'First'
  WHERE NOT EXISTS (SELECT 1 FROM semesters WHERE name = 'First');

-- ---------- Course & course unit ----------
INSERT INTO courses (faculty_id, department_id, code, name, duration, tuition)
  SELECT (SELECT id FROM faculties WHERE name = 'Faculty of Science'),
         (SELECT id FROM departments WHERE name = 'Computer Science'),
         'CSC', 'Computer Science', '2 years', 50000
  WHERE NOT EXISTS (SELECT 1 FROM courses WHERE code = 'CSC');

INSERT INTO course_units (course_id, semester_id, name)
  SELECT (SELECT id FROM courses WHERE code = 'CSC'),
         (SELECT id FROM semesters WHERE name = 'First'),
         'Introduction to Programming'
  WHERE NOT EXISTS (SELECT 1 FROM course_units WHERE name = 'Introduction to Programming');

-- ---------- Lecturer account ----------
INSERT INTO users (username, password_hash, role_id)
  SELECT 'lecturer4', '$2b$10$fYAnaZH44XEXZU3i6EwJ8erEdK9ScPfeRik4U6RvysYaOhjuVAmTC', (SELECT id FROM roles WHERE name = 'lecturer')
  WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'lecturer4');

INSERT INTO staff (user_id, staff_type, name)
  SELECT (SELECT id FROM users WHERE username = 'lecturer4'), 'lecturer', 'Dr. Sarah Coker'
  WHERE NOT EXISTS (SELECT 1 FROM staff WHERE user_id = (SELECT id FROM users WHERE username = 'lecturer4'));

-- ---------- Student account ----------
INSERT INTO users (username, password_hash, role_id)
  SELECT 'student4', '$2b$10$fYAnaZH44XEXZU3i6EwJ8erEdK9ScPfeRik4U6RvysYaOhjuVAmTC', (SELECT id FROM roles WHERE name = 'student')
  WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'student4');

INSERT INTO students (user_id, faculty_id, department_id, program_id, first_name, surname, student_no, sex, admission_date)
  SELECT (SELECT id FROM users WHERE username = 'student4'),
         (SELECT id FROM faculties WHERE name = 'Faculty of Science'),
         (SELECT id FROM departments WHERE name = 'Computer Science'),
         (SELECT id FROM programs WHERE name = 'ND'),
         'Amina', 'Yusuf', 'STU004', 'F', CURRENT_DATE
  WHERE NOT EXISTS (SELECT 1 FROM students WHERE student_no = 'STU004');

-- ---------- Link them to the course unit ----------
INSERT INTO teaches (staff_id, course_unit_id)
  SELECT (SELECT id FROM staff WHERE name = 'Dr. Sarah Coker'),
         (SELECT id FROM course_units WHERE name = 'Introduction to Programming')
  ON CONFLICT (staff_id, course_unit_id) DO NOTHING;

INSERT INTO registrations (student_id, academic_year_id, semester_id, course_unit_id)
  SELECT (SELECT id FROM students WHERE student_no = 'STU004'),
         (SELECT id FROM academic_years WHERE name = '2025/2026'),
         (SELECT id FROM semesters WHERE name = 'First'),
         (SELECT id FROM course_units WHERE name = 'Introduction to Programming')
  ON CONFLICT (student_id, course_unit_id, academic_year_id, semester_id) DO NOTHING;

-- ---------- Assignment 1 (file/text upload) ----------
INSERT INTO assignments (course_unit_id, lecturer_id, title, instructions, due_date, assignment_type, max_score)
  SELECT (SELECT id FROM course_units WHERE name = 'Introduction to Programming'),
         (SELECT id FROM staff WHERE name = 'Dr. Sarah Coker'),
         'Assignment 1: Variables and Data Types',
         'Write a short program demonstrating the use of at least 4 different data types, and explain each one.',
         NOW() + INTERVAL '7 days', 'file', 20
  WHERE NOT EXISTS (SELECT 1 FROM assignments WHERE title = 'Assignment 1: Variables and Data Types');

INSERT INTO submissions (assignment_id, student_id, text_content)
  SELECT (SELECT id FROM assignments WHERE title = 'Assignment 1: Variables and Data Types'),
         (SELECT id FROM students WHERE student_no = 'STU004'),
         'Here is my program: I declared an integer, a float, a string, and a boolean variable, then printed each with its type using type(). Integers store whole numbers, floats store decimals, strings store text, and booleans store true/false values.'
  ON CONFLICT (assignment_id, student_id) DO NOTHING;

-- ---------- Assignment 2 (file/text upload) ----------
INSERT INTO assignments (course_unit_id, lecturer_id, title, instructions, due_date, assignment_type, max_score)
  SELECT (SELECT id FROM course_units WHERE name = 'Introduction to Programming'),
         (SELECT id FROM staff WHERE name = 'Dr. Sarah Coker'),
         'Assignment 2: Loops and Control Structures',
         'Write a program that uses a for-loop and an if-else statement to print all even numbers between 1 and 50.',
         NOW() + INTERVAL '10 days', 'file', 20
  WHERE NOT EXISTS (SELECT 1 FROM assignments WHERE title = 'Assignment 2: Loops and Control Structures');

INSERT INTO submissions (assignment_id, student_id, text_content)
  SELECT (SELECT id FROM assignments WHERE title = 'Assignment 2: Loops and Control Structures'),
         (SELECT id FROM students WHERE student_no = 'STU004'),
         E'for i in range(1, 51):\n    if i % 2 == 0:\n        print(i)\nThis loop checks every number from 1 to 50 and prints it only if dividing by 2 leaves no remainder.'
  ON CONFLICT (assignment_id, student_id) DO NOTHING;

-- ---------- Assignment 3 (interactive form) ----------
INSERT INTO assignments (course_unit_id, lecturer_id, title, instructions, due_date, assignment_type)
  SELECT (SELECT id FROM course_units WHERE name = 'Introduction to Programming'),
         (SELECT id FROM staff WHERE name = 'Dr. Sarah Coker'),
         'Assignment 3: Programming Basics Quiz',
         'Answer the questions below.',
         NOW() + INTERVAL '5 days', 'form'
  WHERE NOT EXISTS (SELECT 1 FROM assignments WHERE title = 'Assignment 3: Programming Basics Quiz');

INSERT INTO assignment_questions (assignment_id, question_text, question_type, option_a, option_b, option_c, option_d, correct_option, marks)
  SELECT (SELECT id FROM assignments WHERE title = 'Assignment 3: Programming Basics Quiz'),
         'What does CSC commonly stand for in this context?',
         'objective', 'Computer Science', 'Computer Store', 'Central Science Council', 'Code Science Center', 'A', 2
  WHERE NOT EXISTS (
    SELECT 1 FROM assignment_questions
    WHERE assignment_id = (SELECT id FROM assignments WHERE title = 'Assignment 3: Programming Basics Quiz')
      AND question_text = 'What does CSC commonly stand for in this context?'
  );

INSERT INTO assignment_questions (assignment_id, question_text, question_type, marks)
  SELECT (SELECT id FROM assignments WHERE title = 'Assignment 3: Programming Basics Quiz'),
         'Explain, in your own words, the difference between a compiler and an interpreter.',
         'theory', 3
  WHERE NOT EXISTS (
    SELECT 1 FROM assignment_questions
    WHERE assignment_id = (SELECT id FROM assignments WHERE title = 'Assignment 3: Programming Basics Quiz')
      AND question_text = 'Explain, in your own words, the difference between a compiler and an interpreter.'
  );

UPDATE assignments SET max_score = (
  SELECT COALESCE(SUM(marks), 0) FROM assignment_questions
  WHERE assignment_id = (SELECT id FROM assignments WHERE title = 'Assignment 3: Programming Basics Quiz')
) WHERE title = 'Assignment 3: Programming Basics Quiz';

INSERT INTO student_answers (question_id, student_id, selected_option, score_awarded, graded)
  SELECT (SELECT id FROM assignment_questions WHERE question_text = 'What does CSC commonly stand for in this context?'),
         (SELECT id FROM students WHERE student_no = 'STU004'),
         'A', 2, TRUE
  ON CONFLICT (question_id, student_id) DO NOTHING;

INSERT INTO student_answers (question_id, student_id, answer_text, graded)
  SELECT (SELECT id FROM assignment_questions WHERE question_text = 'Explain, in your own words, the difference between a compiler and an interpreter.'),
         (SELECT id FROM students WHERE student_no = 'STU004'),
         'A compiler translates the whole program into machine code before running it, while an interpreter reads and executes the code line by line as the program runs.',
         FALSE
  ON CONFLICT (question_id, student_id) DO NOTHING;

-- ---------- Quick sanity check - run this after, you should see 3 rows ----------
SELECT title, assignment_type, due_date FROM assignments WHERE lecturer_id = (SELECT id FROM staff WHERE name = 'Dr. Sarah Coker');
