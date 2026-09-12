# Online Assignment Submission System

Final year project: a web platform where students submit assignments and lecturers/admins manage courses, grading, and results.

**Stack:** HTML/CSS/JavaScript (frontend) · Node.js + Express (backend) · PostgreSQL (Neon) · Render (hosting) · GitHub (version control)

## Project structure

```
/backend    Express API + serves the frontend static files
/frontend   Plain HTML/CSS/JS pages (login, register, 3 dashboards)
```

## 1. Set up the database (Neon)

1. Create a free project at https://neon.tech
2. Copy the connection string from your Neon dashboard (use the pooled connection string)
3. In `/backend`, copy `.env.example` to `.env` and paste it into `DATABASE_URL`
4. Set `JWT_SECRET` to any long random string

## 2. Install dependencies and load the schema

```bash
cd backend
npm install
npm run seed     # runs db/schema.sql against your Neon database
```

This creates all tables and seeds the roles, default grade scale, and pass mark.

**Already deployed before this update?** Run `db/migration_2_interactive_assignments.sql` in Neon's SQL Editor instead of re-running `schema.sql` — it only adds the new columns/tables needed for file-attached and interactive-form assignments, without touching your existing data.

## 3. Create the first admin account

The app has no public "become an admin" flow (on purpose — admins create lecturer accounts, and students self-register). Create your first admin manually, either via a Neon SQL console or `psql`:

```sql
-- 1. Hash a password with bcrypt first (e.g. run this in a node REPL inside /backend):
--    require('bcryptjs').hashSync('yourpassword', 10)
INSERT INTO users (username, password_hash, role_id)
VALUES ('admin', '<paste the bcrypt hash here>', (SELECT id FROM roles WHERE name = 'admin'));
```

## 4. Run locally

```bash
cd backend
npm run dev
```

Visit `http://localhost:5000` — it serves the login page and the API from the same server.

## 5. Deploy to Render

1. Push this project to a GitHub repository
2. On Render, create a **Web Service**, connect the repo, set:
   - Root directory: `backend`
   - Build command: `npm install`
   - Start command: `npm start`
3. Add environment variables `DATABASE_URL` and `JWT_SECRET` in Render's dashboard
4. Deploy — Render will give you a public URL serving the whole app (frontend + API)

## 6. Load mock/demo data (optional)

To quickly see the system with real-looking content instead of an empty database, run `backend/db/mock-data.sql` in Neon's SQL Editor after `schema.sql`. It creates:
- 3 faculties, 5 departments, 3 programs
- 1 academic year (2025/2026) with 2 semesters
- 3 courses, each with a course unit
- 3 lecturer accounts, each assigned to teach one unit
- 3 student accounts, each registered for a unit

All 6 mock lecturer/student accounts use username `lecturer1`/`lecturer2`/`lecturer3` and `student1`/`student2`/`student3`, password **`password123`** for all of them. Change these before sharing the link publicly.

## Troubleshooting

- **A form seems to hang, then eventually shows a 504/error page:** this was a bug in earlier versions where a failed database request (e.g. an empty dropdown, or assigning the same lecturer to the same course unit twice) had nowhere to go and just hung until the platform's proxy timed it out. This is fixed — failed requests now return an immediate, readable error message instead.
- **"That entry already exists" message:** you're trying to create something that already exists (e.g. assigning a lecturer to a course unit they're already assigned to, or a duplicate course code).
- **What is the "Tuition" field on a course?** It's the course/program fee, carried over from the original Chapter 3 design (the `courses` table represents a full program of study, not a single class). It's optional — leave it at 0 if your write-up doesn't need to track fees.


## Notes

- Uploaded files (assignment briefs and student submissions) are stored on disk in `/backend/uploads` and served at `/uploads/<filename>`. Render's free-tier filesystem is ephemeral (wiped on redeploy/restart) — fine for a project demo/defense, but mention this limitation in your project report, and consider cloud storage (e.g. Cloudflare R2) as a "future work" item. Also note that `/uploads` is currently unauthenticated (anyone with the exact file URL can view it) — a reasonable simplification for a student project, worth flagging in your write-up.
- **Admin**: full create/edit/delete on faculties, departments, programs, academic years, semesters, courses, course units, lecturers, and lecturer-to-course-unit assignments; can also delete students. Sets registration deadlines and pass mark.
- **Lecturer**: creates assignments as either (a) a file/text upload brief (optionally attaching a handout file of their own), or (b) an interactive form of objective and/or theory questions. Objective questions are auto-graded on submission; theory questions are graded by the lecturer afterward. Assignment marking is entirely the lecturer's own call — separate from the admin-controlled grade scale/pass mark, which only applies to overall course results.
- **Student**: registers for course units, then per assignment either submits text/a file, or answers an interactive form. For form-type assignments, the compiled score updates live as the lecturer grades theory answers.
- The database schema in `backend/db/schema.sql` consolidates all entities from your Chapter 3 design (faculty, department, admission/students, semester, course, course unit, staff, teaches, registration, assignment, submission, grade scale, pass mark, result, article) into one consistent relational structure, extended with `assignment_questions` and `student_answers` for the interactive form feature.
