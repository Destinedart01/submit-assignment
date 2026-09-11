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

## Notes

- Uploaded assignment files are stored on disk in `/backend/uploads`. Render's free-tier filesystem is ephemeral (wiped on redeploy/restart) — fine for a project demo/defense, but mention this limitation in your project report, and consider cloud storage (e.g. Cloudflare R2) as a "future work" item.
- Roles: **admin** (manages faculties, departments, programs, courses, course units, lecturers, deadlines, pass mark), **lecturer** (creates assignments, grades submissions, enters results), **student** (registers for course units, submits assignments as text and/or file, views results).
- The database schema in `backend/db/schema.sql` consolidates all entities from your Chapter 3 design (faculty, department, admission/students, semester, course, course unit, staff, teaches, registration, assignment, submission, grade scale, pass mark, result, article) into one consistent relational structure.
