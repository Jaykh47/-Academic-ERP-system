# College Attendance and Academic Progress Tracker
### Production-Grade MERN Stack Backend API | RESTful MVC Architecture

A scalable, secure, and production-quality academic management backend designed for higher-education colleges and universities. The system streamlines student attendance, examination grading, institutional analytics, rule-based academic risk detection, in-app notifications, and official transcript generation (PDF & Excel).

---

## 🏗️ System Architecture & Request Flow

The backend follows an enterprise MVC pattern with a decoupled Service Layer to maintain lightweight controllers and testable business logic:

```
Client Request (Browser / Postman / Mobile)
        │
    Rate Limiter & Security Headers (Helmet, CORS)
        │
    Express URL Router (/api/v1/...)
        │
    Authentication Middleware (JWT verification + Cookie handling)
        │
    Authorization Middleware (Role-Based Access Control + Resource Ownership)
        │
    Input Validation Middleware (express-validator schema chains)
        │
    Controller (HTTP orchestration, response formatting)
        │
    Service Layer (Domain business logic, transactional integrity, aggregation)
        │
    Mongoose Model (Schema validation, indexes, pre/post hooks)
        │
    MongoDB (Database persistence)
        │
    Standardized JSON / Binary Stream (ApiResponse / PDFKit / ExcelJS)
```

---

## 🛠️ Technology Stack

| Technology | Purpose |
|---|---|
| **Node.js** (v18+) | JavaScript runtime with ES Modules (`import`/`export`) |
| **Express.js** (v5) | HTTP server & routing framework |
| **MongoDB** | Document database |
| **Mongoose** (v9) | ODM, schema-level validation, compound indexes |
| **JWT (`jsonwebtoken`)** | Short-lived access tokens & rotating refresh tokens |
| **bcryptjs** | Password hashing with cost factor 12 |
| **Helmet** | HTTP security headers (clickjacking, XSS, MIME sniffing) |
| **CORS** | Configurable cross-origin resource sharing |
| **express-rate-limit** | Multi-tier brute-force attack prevention |
| **express-validator** | Request body and URL parameter validation |
| **PDFKit** | Vector PDF transcript and roster rendering |
| **ExcelJS** | Styled `.xlsx` workbook spreadsheet export |
| **cookie-parser** | HTTP-only cookie parsing |
| **dotenv** | Environment variable management |

---

## 👥 Role-Based Access Control (RBAC) Matrix

| Domain / Resource | ADMIN | HOD | FACULTY | STUDENT |
|---|:---:|:---:|:---:|:---:|
| **User & Account Creation** | ✅ Full | ❌ Blocked | ❌ Blocked | ❌ Blocked |
| **Account Deactivation** | ✅ Full | ❌ Blocked | ❌ Blocked | ❌ Blocked |
| **Department & Session CRUD** | ✅ Full | ❌ Blocked | ❌ Blocked | ❌ Blocked |
| **Subject Management** | ✅ Full | ❌ Blocked | ❌ Blocked | ❌ Blocked |
| **Faculty Assignment** | ✅ Full | ✅ Dept Only | ❌ Blocked | ❌ Blocked |
| **Student Cohort Enrollment** | ✅ Full | ❌ Blocked | ❌ Blocked | ❌ Blocked |
| **Class Session Scheduling** | ✅ Full | ✅ Dept Only | ✅ Assigned Only | ❌ Blocked |
| **Attendance Submission & Lock** | ✅ Full | ✅ Dept Only | ✅ Assigned Only | ❌ Blocked |
| **Attendance Audit Correction** | ✅ Full | ✅ Dept Only | ✅ Assigned Only | ❌ Blocked |
| **Examination Creation** | ✅ Full | ✅ Dept Only | ✅ Assigned Only | ❌ Blocked |
| **Marks Entry & Score Upload** | ✅ Full | ✅ Dept Only | ✅ Assigned Only | ❌ Blocked |
| **Institutional Analytics** | ✅ Full | ✅ Dept Only | ❌ Blocked | ❌ Blocked |
| **Subject Grade Distribution** | ✅ Full | ✅ Dept Only | ✅ Assigned Only | ❌ Blocked |
| **Academic Risk Detection** | ✅ Full | ✅ Dept Only | ✅ View | ❌ Blocked |
| **Personal Attendance & SGPA** | ✅ All | ✅ All | ✅ All | ✅ Own Only (IDOR Protected) |
| **Download PDF Transcript** | ✅ All | ✅ All | ✅ All | ✅ Own Only (IDOR Protected) |

---

## 🗄️ Database Collections & Entity Relationships

The data layer uses 12 collections with compound unique indexes preventing duplicate entries:

1. **`users`**: Centralized authentication identity (email, hashed password, role, `isActive`, `refreshToken`).
2. **`students`**: Student academic profile (rollNumber, enrollmentNumber, department, currentSemester).
3. **`faculties`**: Faculty profile (employeeId, department, designation, assigned subjects array).
4. **`departments`**: Academic programs (name, unique code, HOD reference).
5. **`academicsessions`**: Calendar years (label, startDate, endDate, single `isCurrent` constraint).
6. **`subjects`**: Course catalog (name, unique code per dept, semester, credits, assignedFaculty).
7. **`enrollments`**: Many-to-many junction (`studentId` + `subjectId` + `academicSessionId` unique index).
8. **`classsessions`**: Scheduled lecture instances with topic, date, timings, and attendance lock status.
9. **`attendances`**: Granular attendance records (`studentId` + `classSessionId` unique index) with audit tracking (`isCorrected`, `correctedBy`).
10. **`examinations`**: Assessment events (name, examType, maximumMarks, passMarks, weightage).
11. **`marks`**: Examination scores (`studentId` + `examinationId` unique index) with absentee tracking.
12. **`notifications`**: In-app alerts with read/unread tracking and polymorphic entity references.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** v18.0.0 or higher
- **MongoDB** running locally on port `27017` or a MongoDB Atlas URI

### 2. Installation
```bash
# Clone and navigate to backend directory
cd backend

# Install production and development dependencies
npm install
```

### 3. Environment Configuration
Create a `.env` file in `backend/` (or copy from `.env.example`):
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/college_attendance_tracker

JWT_ACCESS_SECRET=your_super_secret_access_key_min_64_chars
JWT_REFRESH_SECRET=your_super_secret_refresh_key_min_64_chars
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 4. Seed Development Administrator
```bash
node src/scripts/seedAdmin.js
```
*Creates initial administrator (`admin@college.com` / `Admin@1234`).*

### 5. Start the Server
```bash
# Development mode with hot-reloading
npm run dev

# Production mode
npm start
```

---

## 🧪 Automated Testing

The backend includes a comprehensive, zero-dependency automated End-to-End test suite covering all 10 modules:

```bash
npm test
```

### Verified Test Results:
```
==================================================================
🏁 TEST SUITE COMPLETED: 54 PASSED | 0 FAILED
==================================================================
🎉 ALL TESTS PASSED SUCCESSFULLY! BACKEND API IS 100% PRODUCTION READY.
```

---

## 📬 Postman Collection

An importable Postman collection containing all pre-configured endpoints, sample payloads, and environment variables is provided at:
```
backend/postman_collection.json
```

### Importing into Postman:
1. Open Postman $\to$ Click **Import**.
2. Select `backend/postman_collection.json`.
3. Set the `baseUrl` variable to `http://localhost:5000/api/v1`.
4. Run `2. Authentication > Login (Admin)` to automatically obtain your bearer token.

---

## 📖 API Endpoints Reference

### 1. Authentication (`/api/v1/auth`)
- `POST /login` — Authenticate user and issue JWT access token + HTTP-only cookies
- `GET /me` — Retrieve profile of logged-in user
- `POST /refresh-token` — Rotate refresh token and issue new access token
- `POST /logout` — Invalidate session and revoke refresh token in database
- `POST /forgot-password` — Generate secure SHA-256 password reset token
- `PATCH /reset-password/:token` — Reset password using token
- `PATCH /change-password` — Change password with current password verification

### 2. Administrator Operations (`/api/v1/admin`)
- `GET /departments` — List academic departments
- `POST /departments` — Create new department
- `GET /sessions` — List academic sessions
- `POST /sessions` — Create academic session
- `POST /students` — Atomically create student authentication account and academic profile
- `GET /students` — Filter and paginate student records
- `PATCH /students/:studentId` — Update student semester or status
- `POST /faculty` — Atomically create faculty/HOD account and profile
- `GET /faculty` — Filter and paginate faculty members
- `GET /users` — Search users across roles with pagination
- `PATCH /users/:userId/toggle-status` — Activate/deactivate user account

### 3. Academic Management (`/api/v1/academic`)
- `POST /subjects` — Create a course (theory/practical)
- `GET /subjects` — List courses (filter by department and semester)
- `POST /subjects/:subjectId/assign-faculty` — Assign faculty instructor with bidirectional sync
- `POST /enrollments` — Enroll individual student in a course
- `POST /enrollments/batch` — Bulk-enroll entire semester cohort via MongoDB `bulkWrite`
- `GET /enrollments/subject/:subjectId` — Get student roster for attendance marking
- `GET /enrollments/my-subjects` — Student queries active enrolled courses

### 4. Attendance Management (`/api/v1/attendance`)
- `POST /sessions` — Schedule class session with topic and room
- `GET /sessions` — Filter sessions by date, subject, or faculty
- `GET /sessions/:sessionId` — Get session details and attendance records
- `POST /submit` — Submit and lock class attendance (`present`, `absent`, `late`)
- `PATCH /:attendanceId/correct` — Audit correction of attendance with modifier tracking
- `GET /subject/:subjectId/summary` — Dynamic MongoDB aggregation summary of subject attendance
- `GET /my-attendance` — Student views personal live attendance breakdown
- `GET /shortage` — Attendance shortage report with configurable threshold (e.g. 75%)

### 5. Marks & Examinations (`/api/v1/marks`)
- `POST /examinations` — Schedule assessment (Internal, Practical, Assignment, Semester Final)
- `GET /examinations` — Filter examinations by subject, session, or exam type
- `POST /submit` — Upload student marks with ceiling validation ($\le \text{maximumMarks}$)
- `PATCH /:marksId` — Audit update of marks record
- `GET /examinations/:examId/results` — Class examination result sheet & performance stats
- `GET /report/my-report` — Student views semester report card with credit-weighted SGPA
- `GET /report/student/:studentId` — View student report card (IDOR protected)

### 6. Analytics & Academic Risk Detection (`/api/v1/analytics`)
- `GET /department/:departmentId` — Department dashboard (attendance %, pass rate %, class counts)
- `GET /subject/:subjectId` — Subject performance metrics & grade histogram ($O \to F$)
- `GET /cohort` — Cohort attendance-academic correlation classification
- `GET /risk-detection` — Multi-factor rule-based Academic Risk Detection Engine

### 7. In-App Notifications (`/api/v1/notifications`)
- `GET /` — Fetch notifications with unread counter and pagination
- `PATCH /:notificationId/read` — Mark notification as read
- `PATCH /read-all` — Mark all notifications as read
- `DELETE /:notificationId` — Delete notification

### 8. Document Exports (`/api/v1/reports`)
- `GET /pdf/my-report-card` — Official Student Semester Grade Sheet (PDF)
- `GET /pdf/student/:studentId` — Student Grade Sheet PDF (IDOR protected)
- `GET /pdf/subject/:subjectId/attendance` — Course Attendance Eligibility Roster (PDF)
- `GET /excel/subject/:subjectId/attendance` — Formatted Course Attendance Sheet (`.xlsx`)
- `GET /excel/examination/:examId/results` — Styled Examination Results Sheet (`.xlsx`)

---

## 🔒 Security Best Practices Implemented

- **Single Auth Table + Role Profiles**: Clean separation of sensitive credentials from public profiles.
- **`select: false` on Secrets**: Passwords and refresh token hashes excluded from queries by default.
- **SHA-256 Refresh Token Hashing**: Stolen database dumps cannot be used to forge session tokens.
- **Token Rotation**: Every refresh generates a new refresh token, invalidating old tokens.
- **IDOR Mitigation**: All student endpoints verify token ownership before releasing transcripts or personal records.
- **Anti-Enumeration Responses**: Identical error messages returned for missing emails vs invalid passwords.
- **Dynamic Aggregation Calculations**: Attendance percentages and SGPAs are never stored as stale numbers.
