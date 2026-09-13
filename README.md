# Online Assignment Submission System

Final year project: a web platform where students submit assignments and lecturers/admins manage courses and grading.

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

This creates all tables and seeds the roles and default grade scale.

**Already deployed before this update?** Run these two migrations, in order, in Neon's SQL Editor instead of re-running `schema.sql` (they only alter/add what's needed, without touching your existing data):
1. `db/migration_2_interactive_assignments.sql` — adds file attachments and interactive form-based assignments
2. `db/migration_3_merge_courses.sql` — merges "course" and "course unit" into a single `courses` table (faculty, department, code, title, semester), and removes the admin registration-deadline/pass-mark tools

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

To quickly see the system with real-looking content instead of an empty database, run `backend/db/mock-data.sql` in Neon's SQL Editor after `schema.sql`. Note: this script predates the merged courses table, so if you're setting up fresh, adjust its course-related inserts to the new `courses` shape (faculty_id, department_id, code, title, semester_id) before running it.

## Troubleshooting

- **A form seems to hang, then eventually shows a 504/error page:** this was a bug in earlier versions where a failed database request had nowhere to go and just hung until the platform's proxy timed it out. This is fixed — failed requests now return an immediate, readable error message instead.
- **"That entry already exists" message:** you're trying to create something that already exists (e.g. assigning a lecturer to a course they're already assigned to, or a duplicate course code).

## Notes

- Uploaded files (assignment briefs and student submissions) are stored on disk in `/backend/uploads` and served at `/uploads/<filename>`. Render's free-tier filesystem is ephemeral (wiped on redeploy/restart) — fine for a project demo/defense, but mention this limitation in your project report, and consider cloud storage (e.g. Cloudflare R2) as a "future work" item. Also note that `/uploads` is currently unauthenticated (anyone with the exact file URL can view it) — a reasonable simplification for a student project, worth flagging in your write-up.
- **Course model**: a course is a single entity with faculty, department, code, title, and semester — there is no separate "course unit" layer. This keeps the data model close to what a lecturer would actually teach in one semester.
- **Admin**: full create/edit/delete on faculties, departments, programs, academic years, semesters, courses, lecturers, and lecturer-to-course assignments; can also delete students. There is no registration-deadline or pass-mark tool — assignment due dates are set by the lecturer, per assignment.
- **Lecturer**: creates assignments as either (a) a file/text upload brief (optionally attaching a handout file of their own), or (b) an interactive form of objective and/or theory questions. Objective questions are auto-graded on submission; theory questions are graded by the lecturer afterward. Assignment marking is entirely the lecturer's own call. Course results are entered separately as a single score, converted to a letter grade using the admin-defined grade scale.
- **Student**: registers for courses, then per assignment either submits text/a file, or answers an interactive form. For form-type assignments, the compiled score updates live as the lecturer grades theory answers.
- Color scheme: tea green and white throughout, replacing the earlier navy/parchment palette.
- The database schema in `backend/db/schema.sql` reflects all of the above as the current, fresh-install structure. `db/migration_2_interactive_assignments.sql` and `db/migration_3_merge_courses.sql` document how an already-deployed database gets there incrementally.
