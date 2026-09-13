-- =========================================================
-- Migration 3:
--   - Merges "course units" into "courses" - a course now
--     directly has faculty, department, code, title, semester
--     (no more two-level course -> course_unit hierarchy)
--   - Drops tuition/duration (not needed)
--   - Drops registration_deadlines and pass_marks (removed -
--     assignment due dates are the lecturer's call, and course
--     pass marks were unused)
--   - Renames course_unit_id -> course_id everywhere for clarity
--
-- Safe to run on your existing database: this works by
-- renaming/altering the current course_units table in place, so
-- all existing teaches/registrations/assignments rows keep their
-- links (their ids don't change, only the table/column names do).
-- Run this once in Neon's SQL Editor.
-- =========================================================

-- 1. Bring faculty/department/code onto the course_units table,
--    copying them from the parent (old) "courses" row
ALTER TABLE course_units ADD COLUMN IF NOT EXISTS faculty_id INTEGER REFERENCES faculties(id);
ALTER TABLE course_units ADD COLUMN IF NOT EXISTS department_id INTEGER REFERENCES departments(id);
ALTER TABLE course_units ADD COLUMN IF NOT EXISTS code VARCHAR(20);

UPDATE course_units cu
SET faculty_id = c.faculty_id, department_id = c.department_id, code = c.code
FROM courses c
WHERE cu.course_id = c.id;

-- 2. Rename "name" to "title", drop the old parent-course link
ALTER TABLE course_units RENAME COLUMN name TO title;
ALTER TABLE course_units DROP COLUMN course_id;
ALTER TABLE course_units ALTER COLUMN code SET NOT NULL;
ALTER TABLE course_units ALTER COLUMN title SET NOT NULL;

-- 3. Drop the old program-level "courses" table, then rename
--    course_units into its place
DROP TABLE courses;
ALTER TABLE course_units RENAME TO courses;

-- 4. Rename the foreign key columns that pointed at course_units
--    so they now clearly read as course_id
ALTER TABLE teaches RENAME COLUMN course_unit_id TO course_id;
ALTER TABLE registrations RENAME COLUMN course_unit_id TO course_id;
ALTER TABLE assignments RENAME COLUMN course_unit_id TO course_id;
ALTER TABLE results RENAME COLUMN course_unit_id TO course_id;

-- 5. Remove the admin deadline/pass-mark tools (unused, and
--    assignment due dates are set by the lecturer, not the admin)
DROP TABLE IF EXISTS registration_deadlines;
DROP TABLE IF EXISTS pass_marks;
