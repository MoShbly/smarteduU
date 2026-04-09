# 🎓 Smart Classroom Demo & Presentation Guide

This guide is designed to help you ace your graduation project presentation! It contains a clear walkthrough of the features, exactly what you should show your professor, and key architectural talking points.

## 🚀 Before You Start (Preparation)

1. **Clear Old Data and Start with a Clean Database**:
   Ensure you have a clean slate to show real user flows.

```bash
   cd backend
   npm run prisma:migrate # applies latest schema

   npm run prisma:seed    # optional: creates one real account only if SEED_USER_* variables are set

```
   _For the most authentic presentation, skip seeded demo data and register fresh teacher and student accounts through the UI._

2. **Run in Production Mode for Maximum Speed**:
   Professors love fast, snappy applications. Instead of running in `dev` mode with hot-reloading (which is slightly slower), run the fully optimized production builds.
```bash
   docker compose -f docker-compose.prod.yml up -d --build
```
   _This uses Next.js `standalone` mode and makes the app load instantly._

---

## 🎤 Key Features to Highlight (Talking Points)

When explaining your project to the panel/professor, focus on these technical achievements:

1. **Modern Tech Stack (Next.js 15 & Express)**: Explain that you used Next.js App Router for a highly optimized, SEO-friendly frontend, and split it from the Express backend to demonstrate Service-Oriented Architecture (SOA).
2. **Relational Data Integrity (PostgreSQL + Prisma)**: Emphasize that data isn't just loosely saved; it uses a strict relational schema (`schema.prisma`) ensuring enrollments, submissions, and course associations are mathematically sound without orphan records.
3. **Advanced Security**:

   - **XSS Protection**: Talk about the `sanitize.middleware.js` that strips malicious script tags from all user inputs.
   - **JWT + Protected Session Persistence**: Explain that authentication is handled with signed JWTs, protected routes, and restored sessions without relying on fake client-side demo state.
   - **Brute-Force Protection**: Mention the API rate-limiting (`express-rate-limit`) on login and registration endpoints.
4. **Role-Based Access Control (RBAC)**: Next.js middleware safely guards the `/student` and `/teacher` routes preventing unauthorized access both on the UI layer and the API layer.
5. **Micro-Animations & UI/UX**: Show off the Framer Motion page transitions, explaining that a modern platform requires a modern, smooth User Experience.
6. **Containerization (Docker)**: Highlight the `Dockerfile.prod` and multi-stage container builds. This proves the project isn't just "works on my machine", but is CI/CD and cloud-ready.

---

## 🎬 Step-by-Step Demo Walkthrough

Follow this exact flow during your presentation to make sure nothing breaks and the story flows logically:

### Step 1: The Teacher Experience

1. **Register a Teacher**: Go to `http://localhost:3000/register`, choose the teacher role, and create a fresh account.
2. **Dashboard Overview**: Demonstrate that the teacher dashboard starts empty and honest, then fills with real data as actions happen.
3. **Create a Course**: Build a real course and point out that the course code is generated automatically by the backend.
4. **Create an Assignment**: Open the course context and publish a new assignment with a real due date.
4. **Log Out**: Log out securely to clear the session cookie.

### Step 2: The Student Experience

1. **Register a Student**: Go back to `/register`, create a separate student account, and sign in.
2. **Join the Course**: Use the generated course code from the teacher flow to join the real course.
3. **Student Dashboard**: Show that the UI completely changes according to the RBAC (Role-Based Access Control). The student only sees courses they are actually enrolled in.
4. **View Assignment**: Open the joined course and show the assignment created by the teacher.
5. **Submit Work**: Send a real submission using text, a file, or both. Emphasize that the submission is stored in PostgreSQL and immediately appears in the teacher review flow.
6. **Activity Logs**: Show that joins, submissions, and grading events are captured in real-time.

### Step 3: The "Under the Hood" Code Tour

If the professor asks to see the code, open these specific files as they show off the highest code quality:

1. `backend/src/middlewares/auth.middleware.js` -> Shows your token verification.
2. `backend/prisma/schema.prisma` -> Shows your database structure (teachers love seeing ERD/schemas).
3. `frontend/src/middleware.js` -> Highlights your Next.js route protection.
4. `docker-compose.prod.yml` -> Shows your orchestration and production readiness.

## 🐛 Failsafe Tips

- Always use **Google Chrome "Incognito" mode** or **Edge "InPrivate" mode** for the demo so no old cache/cookies interfere.
- Keep a terminal window open with `docker compose -f docker-compose.prod.yml logs -f frontend backend` running in the background. If anything stops working, you can instantly see the error log and look like a pro debugger!
