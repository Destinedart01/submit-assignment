-- =========================================================
-- Extra mock data: one new lecturer + one new student, both on
-- Faculty of Science, plus 3 assignments from the lecturer and
-- matching submissions/answers from the student.
--
-- Assumes the original mock-data.sql has already been run (it
-- reuses the "Faculty of Science" / "Computer Science" / CSC /
-- "Introduction to Programming" records created there).
--
-- Login for both new accounts: password "password123"
--   Lecturer username: lecturer4
--   Student username:  student4
-- =========================================================

-- ---------- New lecturer ----------
INSERT INTO users (username, password_hash, role_id) VALUES
  ('lecturer4', '$2b$10$fYAnaZH44XEXZU3i6EwJ8erEdK9ScPfeRik4U6RvysYaOhjuVAmTC', (SELECT id FROM roles WHERE name = 'lecturer'));

INSERT INTO staff (user_id, staff_type, name) VALUES
  ((SELECT id FROM users WHERE username = 'lecturer4'), 'lecturer', 'Dr. Sarah Coker');

-- Assign her to teach the existing "Introduction to Programming" unit (Faculty of Science / Computer Science)
INSERT INTO teaches (staff_id, course_unit_id) VALUES
  ((SELECT id FROM staff WHERE name = 'Dr. Sarah Coker'),
   (SELECT id FROM course_units WHERE name = 'Introduction to Programming'));

-- ---------- New student ----------
INSERT INTO users (username, password_hash, role_id) VALUES
  ('student4', '$2b$10$fYAnaZH44XEXZU3i6EwJ8erEdK9ScPfeRik4U6RvysYaOhjuVAmTC', (SELECT id FROM roles WHERE name = 'student'));

INSERT INTO students (user_id, faculty_id, department_id, program_id, first_name, surname, student_no, sex, admission_date) VALUES
  ((SELECT id FROM users WHERE username = 'student4'),
   (SELECT id FROM faculties WHERE name = 'Faculty of Science'),
   (SELECT id FROM departments WHERE name = 'Computer Science'),
   (SELECT id FROM programs WHERE name = 'ND'),
   'Amina', 'Yusuf', 'STU004', 'F', CURRENT_DATE);

-- Register her for the same unit
INSERT INTO registrations (student_id, academic_year_id, semester_id, course_unit_id) VALUES
  ((SELECT id FROM students WHERE student_no = 'STU004'),
   (SELECT id FROM academic_years WHERE name = '2025/2026'),
   (SELECT id FROM semesters WHERE name = 'First'),
   (SELECT id FROM course_units WHERE name = 'Introduction to Programming'));

-- ---------- Assignment 1 (file/text upload) ----------
INSERT INTO assignments (course_unit_id, lecturer_id, title, instructions, due_date, assignment_type, max_score) VALUES
  ((SELECT id FROM course_units WHERE name = 'Introduction to Programming'),
   (SELECT id FROM staff WHERE name = 'Dr. Sarah Coker'),
   'Assignment 1: Variables and Data Types',
   'Write a short program demonstrating the use of at least 4 different data types, and explain each one.',
   NOW() + INTERVAL '7 days', 'file', 20);

INSERT INTO submissions (assignment_id, student_id, text_content) VALUES
  ((SELECT id FROM assignments WHERE title = 'Assignment 1: Variables and Data Types'),
   (SELECT id FROM students WHERE student_no = 'STU004'),
   'Here is my program: I declared an integer, a float, a string, and a boolean variable, then printed each with its type using type(). Integers store whole numbers, floats store decimals, strings store text, and booleans store true/false values.');

-- ---------- Assignment 2 (file/text upload) ----------
INSERT INTO assignments (course_unit_id, lecturer_id, title, instructions, due_date, assignment_type, max_score) VALUES
  ((SELECT id FROM course_units WHERE name = 'Introduction to Programming'),
   (SELECT id FROM staff WHERE name = 'Dr. Sarah Coker'),
   'Assignment 2: Loops and Control Structures',
   'Write a program that uses a for-loop and an if-else statement to print all even numbers between 1 and 50.',
   NOW() + INTERVAL '10 days', 'file', 20);

INSERT INTO submissions (assignment_id, student_id, text_content) VALUES
  ((SELECT id FROM assignments WHERE title = 'Assignment 2: Loops and Control Structures'),
   (SELECT id FROM students WHERE student_no = 'STU004'),
   'for i in range(1, 51):\n    if i % 2 == 0:\n        print(i)\nThis loop checks every number from 1 to 50 and prints it only if dividing by 2 leaves no remainder.');

-- ---------- Assignment 3 (interactive form: 1 objective + 1 theory question) ----------
INSERT INTO assignments (course_unit_id, lecturer_id, title, instructions, due_date, assignment_type) VALUES
  ((SELECT id FROM course_units WHERE name = 'Introduction to Programming'),
   (SELECT id FROM staff WHERE name = 'Dr. Sarah Coker'),
   'Assignment 3: Programming Basics Quiz',
   'Answer the questions below.',
   NOW() + INTERVAL '5 days', 'form');

INSERT INTO assignment_questions (assignment_id, question_text, question_type, option_a, option_b, option_c, option_d, correct_option, marks) VALUES
  ((SELECT id FROM assignments WHERE title = 'Assignment 3: Programming Basics Quiz'),
   'What does CSC commonly stand for in this context?',
   'objective', 'Computer Science', 'Computer Store', 'Central Science Council', 'Code Science Center', 'A', 2);

INSERT INTO assignment_questions (assignment_id, question_text, question_type, marks) VALUES
  ((SELECT id FROM assignments WHERE title = 'Assignment 3: Programming Basics Quiz'),
   'Explain, in your own words, the difference between a compiler and an interpreter.',
   'theory', 3);

-- Keep max_score in sync with the sum of question marks (2 + 3 = 5)
UPDATE assignments SET max_score = 5 WHERE title = 'Assignment 3: Programming Basics Quiz';

-- Student's answers: objective auto-graded correct (2/2), theory left ungraded
-- so you can try out the "Grade Theory Answers" screen as the lecturer.
INSERT INTO student_answers (question_id, student_id, selected_option, score_awarded, graded) VALUES
  ((SELECT id FROM assignment_questions WHERE question_text = 'What does CSC commonly stand for in this context?'),
   (SELECT id FROM students WHERE student_no = 'STU004'),
   'A', 2, TRUE);

INSERT INTO student_answers (question_id, student_id, answer_text, graded) VALUES
  ((SELECT id FROM assignment_questions WHERE question_text LIKE 'Explain, in your own words, the difference%'),
   (SELECT id FROM students WHERE student_no = 'STU004'),
   'A compiler translates the whole program into machine code before running it, while an interpreter reads and executes the code line by line as the program runs.',
   FALSE);
