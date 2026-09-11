-- =========================================================
-- Online Assignment Submission System - PostgreSQL Schema
-- =========================================================

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(20) UNIQUE NOT NULL -- 'admin', 'lecturer', 'student'
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_id INTEGER NOT NULL REFERENCES roles(id),
    status VARCHAR(15) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE faculties (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    faculty_id INTEGER REFERENCES faculties(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE programs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE academic_years (
    id SERIAL PRIMARY KEY,
    name VARCHAR(20) NOT NULL,     -- e.g. 2025/2026
    start_date DATE,
    end_date DATE
);

CREATE TABLE semesters (
    id SERIAL PRIMARY KEY,
    name VARCHAR(20) NOT NULL      -- 'First', 'Second'
);

CREATE TABLE staff (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    staff_type VARCHAR(30) DEFAULT 'lecturer',
    name VARCHAR(100) NOT NULL,
    status VARCHAR(15) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    faculty_id INTEGER REFERENCES faculties(id),
    department_id INTEGER REFERENCES departments(id),
    program_id INTEGER REFERENCES programs(id),
    first_name VARCHAR(50) NOT NULL,
    surname VARCHAR(50) NOT NULL,
    nationality VARCHAR(50),
    student_no VARCHAR(20) UNIQUE NOT NULL,
    reg_no VARCHAR(30),
    sex VARCHAR(1) CHECK (sex IN ('M','F')),
    dob DATE,
    pob VARCHAR(60),
    marital_status VARCHAR(20),
    admission_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    faculty_id INTEGER REFERENCES faculties(id),
    department_id INTEGER REFERENCES departments(id),
    code VARCHAR(20) NOT NULL,
    name VARCHAR(200) NOT NULL,
    duration VARCHAR(20),
    tuition NUMERIC(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE course_units (
    id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    semester_id INTEGER REFERENCES semesters(id),
    name VARCHAR(200) NOT NULL
);

CREATE TABLE teaches (
    id SERIAL PRIMARY KEY,
    staff_id INTEGER REFERENCES staff(id) ON DELETE CASCADE,
    course_unit_id INTEGER REFERENCES course_units(id) ON DELETE CASCADE,
    assigned_date DATE DEFAULT CURRENT_DATE,
    UNIQUE (staff_id, course_unit_id)
);

CREATE TABLE registration_deadlines (
    id SERIAL PRIMARY KEY,
    academic_year_id INTEGER REFERENCES academic_years(id),
    semester_id INTEGER REFERENCES semesters(id),
    deadline_date DATE NOT NULL
);

CREATE TABLE registrations (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    academic_year_id INTEGER REFERENCES academic_years(id),
    semester_id INTEGER REFERENCES semesters(id),
    course_unit_id INTEGER REFERENCES course_units(id),
    status VARCHAR(15) DEFAULT 'registered',
    registered_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (student_id, course_unit_id, academic_year_id, semester_id)
);

CREATE TABLE assignments (
    id SERIAL PRIMARY KEY,
    course_unit_id INTEGER REFERENCES course_units(id) ON DELETE CASCADE,
    lecturer_id INTEGER REFERENCES staff(id),
    title VARCHAR(200) NOT NULL,
    instructions TEXT,
    due_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE submissions (
    id SERIAL PRIMARY KEY,
    assignment_id INTEGER REFERENCES assignments(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    text_content TEXT,
    file_path VARCHAR(255),
    file_name VARCHAR(150),
    submitted_at TIMESTAMP DEFAULT NOW(),
    grade NUMERIC(5,2),
    UNIQUE (assignment_id, student_id)
);

CREATE TABLE grade_scale (
    id SERIAL PRIMARY KEY,
    lower_bound NUMERIC(5,2) NOT NULL,
    upper_bound NUMERIC(5,2) NOT NULL,
    grade VARCHAR(5) NOT NULL,
    grade_point NUMERIC(5,3) NOT NULL
);

CREATE TABLE pass_marks (
    id SERIAL PRIMARY KEY,
    pass_mark NUMERIC(5,2) NOT NULL DEFAULT 40
);

CREATE TABLE results (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    course_unit_id INTEGER REFERENCES course_units(id) ON DELETE CASCADE,
    staff_id INTEGER REFERENCES staff(id),
    coursework_score NUMERIC(5,2) DEFAULT 0,
    exam_score NUMERIC(5,2) DEFAULT 0,
    total_score NUMERIC(5,2) DEFAULT 0,
    grade VARCHAR(5),
    result_date TIMESTAMP DEFAULT NOW(),
    UNIQUE (student_id, course_unit_id)
);

CREATE TABLE articles (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    staff_id INTEGER REFERENCES staff(id),
    file_path VARCHAR(255),
    uploaded_at TIMESTAMP DEFAULT NOW()
);

-- Seed roles
INSERT INTO roles (name) VALUES ('admin'), ('lecturer'), ('student');

-- Seed a default grade scale
INSERT INTO grade_scale (lower_bound, upper_bound, grade, grade_point) VALUES
(70, 100, 'A', 5.0),
(60, 69.99, 'B', 4.0),
(50, 59.99, 'C', 3.0),
(45, 49.99, 'D', 2.0),
(40, 44.99, 'E', 1.0),
(0, 39.99, 'F', 0.0);

INSERT INTO pass_marks (pass_mark) VALUES (40);
