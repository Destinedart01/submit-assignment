-- =========================================================
-- Migration 2: adds
--   - file attachments + type + max_score on assignments
--   - interactive form-based assignments (objective/theory questions)
--
-- Safe to run on your EXISTING deployed database - it only adds
-- columns/tables, nothing is dropped or overwritten.
-- Run this once in Neon's SQL Editor.
-- =========================================================

ALTER TABLE assignments
  ADD COLUMN IF NOT EXISTS assignment_type VARCHAR(10) NOT NULL DEFAULT 'file'
    CHECK (assignment_type IN ('file', 'form')),
  ADD COLUMN IF NOT EXISTS max_score NUMERIC(6,2),
  ADD COLUMN IF NOT EXISTS file_path VARCHAR(255),
  ADD COLUMN IF NOT EXISTS file_name VARCHAR(150);

CREATE TABLE IF NOT EXISTS assignment_questions (
    id SERIAL PRIMARY KEY,
    assignment_id INTEGER REFERENCES assignments(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(10) NOT NULL CHECK (question_type IN ('objective', 'theory')),
    option_a VARCHAR(255),
    option_b VARCHAR(255),
    option_c VARCHAR(255),
    option_d VARCHAR(255),
    correct_option CHAR(1) CHECK (correct_option IN ('A','B','C','D')),
    marks NUMERIC(6,2) NOT NULL DEFAULT 1,
    position INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS student_answers (
    id SERIAL PRIMARY KEY,
    question_id INTEGER REFERENCES assignment_questions(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    selected_option CHAR(1),
    answer_text TEXT,
    score_awarded NUMERIC(6,2),
    graded BOOLEAN DEFAULT FALSE,
    answered_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (question_id, student_id)
);
