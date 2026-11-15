# College Attendance Tracker — Development Progress

> [!NOTE]
> This checklist tracks every phase and task. Update it after each phase is confirmed complete.

---

## PHASE 1: Project Initialization ✅ COMPLETE

- [x] Inspect working directory
- [x] Initialize Node.js project (`npm init`)
- [x] Install production dependencies (express, mongoose, bcryptjs, jsonwebtoken, dotenv, cookie-parser, express-validator, helmet, cors, express-rate-limit)
- [x] Install dev dependency (nodemon)
- [x] Configure ES Modules (`"type": "module"` in package.json)
- [x] Configure npm scripts (`start`, `dev`)
- [x] Create folder structure (`src/config`, `src/models`, `src/controllers`, `src/routes`, `src/middleware`, `src/services`, `src/utils`, `tests/`)
- [x] Create `.env` and `.env.example`
- [x] Create `.gitignore`
- [x] Implement `src/config/db.js` (MongoDB connection with error handling and reconnect events)
- [x] Implement `src/config/corsOptions.js` (environment-driven CORS)
- [x] Implement `src/utils/ApiError.js` (custom error class with statusCode, errors, isOperational)
- [x] Implement `src/utils/ApiResponse.js` (standardized success response)
- [x] Implement `src/middleware/errorMiddleware.js` (404 handler + global error handler)
- [x] Implement `src/routes/healthRoutes.js` (health-check endpoint)
- [x] Implement `src/app.js` (Express app with all middleware)
- [x] Implement `src/server.js` (startup sequence, graceful shutdown)
- [x] Create `README.md`
- [x] **Tested**: Server starts successfully
- [x] **Tested**: MongoDB connects successfully
- [x] **Tested**: `GET /api/v1/health` returns `200` with correct data
- [x] **Tested**: Unknown routes return `404` with consistent JSON error format
- [x] **Tested**: Stack trace visible in development, suppressed in production

---

## PHASE 2: Database Architecture ✅ COMPLETE

- [x] Design and implement `User.js` schema (with bcrypt pre-save hook, instance methods, `select: false` on sensitive fields)
- [x] Design and implement `Student.js` schema (rollNumber, enrollmentNumber, status, indexes)
- [x] Design and implement `Faculty.js` schema (employeeId, designation, subjects array)
- [x] Design and implement `Department.js` schema (code, HOD ref, isActive)
- [x] Design and implement `Subject.js` schema (compound unique index on code+department)
- [x] Design and implement `AcademicSession.js` schema (pre-save hook for single isCurrent, date validation)
- [x] Design and implement `Enrollment.js` schema (unique compound index: student+subject+session)
- [x] Design and implement `ClassSession.js` schema (isAttendanceSubmitted lock, status flow)
- [x] Design and implement `Attendance.js` schema (unique: student+classSession, selective denormalization)
- [x] Design and implement `Examination.js` schema (examType, weightage, passMarks)
- [x] Design and implement `Marks.js` schema (unique: student+examination, isAbsent flag, audit tracking)
- [x] Design and implement `Notification.js` schema (relatedEntity polymorphic ref)
- [x] Review all relationships and data integrity constraints
- [x] Define indexes for frequently queried fields
- [x] **Tested**: All 12 schemas load without errors
- [x] **Tested**: All indexes synced to MongoDB successfully
- [x] **Tested**: Validation script passed

---

## PHASE 3: Authentication ✅ COMPLETE

- [x] `utils/generateToken.js` — access token, refresh token, cookie helpers, password reset token
- [x] `middleware/validateMiddleware.js` — express-validator chains for all auth routes
- [x] `middleware/authMiddleware.js` — protect() middleware with 5 security checks
- [x] `middleware/roleMiddleware.js` — authorize(...roles) RBAC middleware
- [x] `controllers/authController.js` — login, logout, refreshAccessToken, getMe, changePassword, forgotPassword, resetPassword
- [x] `routes/authRoutes.js` — all routes with stricter rate limiter (10 req/15min)
- [x] `app.js` — auth routes mounted
- [x] `scripts/seedAdmin.js` — dev admin user seeder
- [x] Fixed Mongoose 8+ async pre-hook compatibility (removed `next` from async hooks)
- [x] **Tested**: Valid login → JWT + cookie issued ✅
- [x] **Tested**: Wrong password → 401 "Invalid email or password" ✅
- [x] **Tested**: Bad email format → 422 validation error with field details ✅
- [x] **Tested**: GET /me with valid token → user profile returned ✅
- [x] **Tested**: GET /me with no token → 401 blocked ✅
- [x] **Tested**: GET /me with malformed JWT → 401 "Invalid token" ✅
- [x] **Tested**: Forgot password → dev token returned, hash stored in DB ✅
- [x] **Tested**: Reset password → new password works, old token invalidated ✅
- [x] **Tested**: Token replay attack → 400 blocked ✅
- [x] **Tested**: Logout → refresh token cleared from DB ✅
- [x] **Tested**: User enumeration prevention → same response for unknown email ✅

---

## PHASE 4: Authorization ✅ COMPLETE

- [x] Implement `roleMiddleware.js` (RBAC `authorize(...roles)`)
- [x] Implement resource-level authorization checks
- [x] Department-level restrictions for HOD
- [x] Student isolation (students can only access own profile)
- [x] IDOR protection on profile inspection and updates
- [x] Administrative route protection (non-admins blocked with 403 Forbidden)

---

## PHASE 5: User Management ✅ COMPLETE

- [x] `utils/pagination.js` — safe pagination helper with caps and metadata
- [x] `services/userService.js` — atomic account creation with manual rollback
- [x] `controllers/adminController.js` — student/faculty creation, user listing, search, filtering, account toggle
- [x] `controllers/studentController.js` — student own profile view & field-restricted update
- [x] `controllers/facultyController.js` — faculty/HOD own profile view & field-restricted update
- [x] `models/index.js` — central model registration preventing MissingSchemaError
- [x] `routes/adminRoutes.js`, `routes/studentRoutes.js`, `routes/facultyRoutes.js`
- [x] **Tested**: Admin creates Department (BCA) & Academic Session (2024-2025) ✅
- [x] **Tested**: Admin creates Student account + profile (atomic linking) ✅
- [x] **Tested**: Admin creates Faculty account + profile ✅
- [x] **Tested**: Duplicate student email blocked with 409 Conflict ✅
- [x] **Tested**: Input validation blocks missing fields with 422 Unprocessable Entity ✅
- [x] **Tested**: Student logs in and views own profile ✅
- [x] **Tested**: Student blocked from admin route with 403 Forbidden ✅
- [x] **Tested**: Admin toggles user active status (deactivation locks login, reactivation restores access) ✅
- [x] **Tested**: User search + pagination (`search=ravi&page=1&limit=5`) ✅
- [x] **Tested**: Faculty logs in and views own profile ✅
- [x] **Tested**: Faculty blocked from student creation with 403 Forbidden ✅
- [x] **Tested**: Student updates allowed personal fields (phone, address) ✅
- [x] **Tested**: Student attempts to tamper with academic fields (semester) blocked ✅
- [x] **Tested**: Faculty updates personal profile (phone, qualification) ✅
- [x] **Tested**: Admin updates student academic profile (promotes semester) ✅

---

## PHASE 6: Academic Management ✅ COMPLETE

- [x] Department management (creation, listing, validation)
- [x] Academic session management (creation, single current session constraint)
- [x] Subject CRUD with pagination, filtering by department and semester
- [x] Faculty-subject assignment with bidirectional sync (`Subject.assignedFaculty` + `Faculty.subjects` array)
- [x] Single student enrollment with duplicate prevention (`studentId` + `subjectId` + `academicSessionId`)
- [x] Batch/Cohort enrollment using MongoDB `bulkWrite` with upsert
- [x] Subject roster retrieval (`/enrollments/subject/:subjectId`) for faculty taking attendance
- [x] Student enrolled courses retrieval (`/enrollments/my-subjects`)
- [x] **Tested**: Admin creates multiple subjects (theory & practical) ✅
- [x] **Tested**: Duplicate subject code in department blocked with 409 Conflict ✅
- [x] **Tested**: Faculty assigned to subject; bidirectional link verified in both documents ✅
- [x] **Tested**: Student blocked from creating subjects with 403 Forbidden ✅
- [x] **Tested**: Single student enrolled in subject ✅
- [x] **Tested**: Duplicate enrollment blocked with 409 Conflict ✅
- [x] **Tested**: Batch enrollment automatically enrolls cohort and skips existing records without failing ✅
- [x] **Tested**: Faculty retrieves full student roster for their assigned subject ✅
- [x] **Tested**: Student queries their enrolled courses and sees full metadata ✅

---

## PHASE 7: Attendance Management ✅ COMPLETE

- [x] Class session management (scheduling, listing, and session details)
- [x] Session lock mechanism (`isAttendanceSubmitted: true`) preventing tampering after submission
- [x] Attendance submission with batch enrollment verification (unregistered students rejected)
- [x] Audit correction endpoint (`isCorrected: true`, `correctedBy`, `correctedAt`, audit remarks)
- [x] Real-time MongoDB aggregation pipeline for subject attendance statistics
- [x] Dynamic formula: $\text{Attendance \%} = \frac{\text{Conducted Attended}}{\text{Total Conducted}} \times 100$
- [x] Configurable late arrival weighting policy (default 1.0 or 0.5)
- [x] Automatic Shortage Alert threshold check ($<75\%$)
- [x] Predictive recovery forecasting: exact count of consecutive classes required to restore $\ge 75\%$
- [x] Student live attendance breakdown endpoint across all enrolled courses
- [x] Department/College level Attendance Shortage Report with configurable thresholds
- [x] **Tested**: Faculty schedules a class session with topics and timings ✅
- [x] **Tested**: Faculty marks attendance (`present`, `absent`, `late`) and locks session ✅
- [x] **Tested**: Submitting attendance on an already locked session blocked with 400 ✅
- [x] **Tested**: Audit correction updates status, records modifier faculty ID, and sets timestamp ✅
- [x] **Tested**: Aggregation pipeline accurately calculates live attendance percentages ✅
- [x] **Tested**: Student views personal attendance breakdown across courses ✅
- [x] **Tested**: Automatic detection of attendance shortage below 75% ✅
- [x] **Tested**: Predictive recovery formula computes exact classes needed to regain 75% ✅
- [x] **Tested**: Shortage report accurately flags at-risk students for administrative intervention ✅

---

## PHASE 8: Academic Performance ✅ COMPLETE

- [x] Configurable grading scale engine (`src/utils/gradeCalculator.js`) supporting customizable percentage brackets
- [x] Choice Based Credit System (CBCS) 10-point scale ($O, A+, A, B+, B, C, P, F$)
- [x] Examination management across assessment types (Internal, Practical, Assignment, Semester Final)
- [x] Validation ensuring passing marks do not exceed maximum marks
- [x] Marks upload with enrollment verification and score ceiling validation ($\le \text{maximumMarks}$)
- [x] Audit tracking on mark modifications (`lastModifiedBy` reference)
- [x] Class Examination Result Sheet with statistical summary (Appeared, Passed, Failed, Pass %, Highest, Average)
- [x] Comprehensive Student Semester Report Card with subject-wise marks, grades, and credits
- [x] Dynamic SGPA calculation: $\text{SGPA} = \frac{\sum (\text{Grade Point} \times \text{Credits})}{\sum \text{Credits}}$
- [x] Strict IDOR protection preventing students from viewing unauthorized student report cards
- [x] **Tested**: Faculty creates internal test and semester final examinations ✅
- [x] **Tested**: Pass marks higher than maximum marks rejected by input validation ✅
- [x] **Tested**: Faculty uploads student marks with automatic letter grade assignment ✅
- [x] **Tested**: Uploading scores exceeding maximum marks rejected with 400 Bad Request ✅
- [x] **Tested**: Audit mark update records modified values and instructor identity ✅
- [x] **Tested**: Class examination results sheet computes summary statistics accurately ✅
- [x] **Tested**: Student semester report card aggregates multi-course performance and calculates exact SGPA (9.33) ✅
- [x] **Tested**: Student attempting to inspect another student's report card blocked with 403 Forbidden ✅

---

## PHASE 9: Analytics & Academic Risk Detection ✅ COMPLETE

- [x] Departmental Academic Analytics (student/faculty counts, conducted classes, average attendance %, exam pass rate %, avg score %)
- [x] Subject Analytics (conducted classes, attendance distribution tiers (<75%, 75-85%, >85%), grade histogram $O \to F$)
- [x] Semester Cohort Analytics with Attendance-Academic Correlation analysis (e.g. `LOW_ATTENDANCE_HIGH_SCORE`, `LOW_ATTENDANCE_LOW_SCORE`)
- [x] Rule-Based Academic Risk Detection System:
  - Multi-factor scoring engine evaluating Attendance Shortage, Exam Failures, Declining Score Trends, and Exam Absences
  - Severity mapping: `CRITICAL` vs `MODERATE` thresholds
  - Transparent human-readable diagnostic reasons
  - Automated actionable mentoring recommendations
- [x] Resource-level authorization and RBAC on analytics endpoints (Students strictly blocked with 403 Forbidden; HODs restricted to own department)
- [x] **Tested**: Admin/HOD retrieves Department Analytics with live aggregate metrics ✅
- [x] **Tested**: Faculty/HOD retrieves Subject Analytics with grade distribution histogram ✅
- [x] **Tested**: Cohort comparison correlates attendance percentage against academic performance ✅
- [x] **Tested**: Academic Risk Detection engine flags student with attendance shortage and declining score trend ✅
- [x] **Tested**: Automatic generation of mentoring recommendations and official notice alerts ✅
- [x] **Tested**: Students blocked from analytics and risk endpoints with 403 Forbidden ✅
- [x] **Tested**: Multi-student cohort correctly evaluates individual student risks dynamically ✅

---

## PHASE 10: Notifications & Reports ✅ COMPLETE

- [x] In-app notification engine with recipient tracking, unread counters, and status updates
- [x] Automated event-driven notification dispatches:
  - `exam_scheduled`: Triggers when faculty schedules an examination
  - `marks_uploaded`: Triggers when faculty uploads assessment scores
  - `attendance_shortage`: Triggers when class absence causes attendance to drop below 75%
- [x] Notification management REST endpoints (`GET /notifications`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all`, `DELETE /notifications/:id`)
- [x] Official Student Semester Grade Sheet / Report Card generation in PDF format (`pdfkit`)
- [x] Subject Attendance Eligibility and Roster report generation in PDF format (`pdfkit`)
- [x] Subject Attendance Sheet export in formatted Excel `.xlsx` workbook (`exceljs`)
- [x] Examination Results Sheet export in styled Excel `.xlsx` workbook (`exceljs`)
- [x] Resource-level authorization & IDOR protection on PDF transcript downloads
- [x] **Tested**: Student receives automated `exam_scheduled` notification upon exam creation ✅
- [x] **Tested**: Student receives automated `marks_uploaded` notification upon score upload ✅
- [x] **Tested**: Student marks notifications as read individually and in bulk (`read-all`) ✅
- [x] **Tested**: Generated Student Report Card PDF (`%PDF-`, 2,592 bytes) with semester summary & SGPA ✅
- [x] **Tested**: Generated Subject Attendance Roster PDF (`%PDF-`, 2,134 bytes) with eligibility status ✅
- [x] **Tested**: Exported Course Attendance Excel workbook (`.xlsx`, 7,147 bytes) with cell styling & column auto-fit ✅
- [x] **Tested**: Exported Examination Results Excel workbook (`.xlsx`, 7,002 bytes) with grade evaluation ✅
- [x] **Tested**: IDOR protection verified: Student attempting to download another student's PDF transcript blocked with 403 Forbidden ✅

---

## PHASE 11: Final Testing, Documentation & Postman Collection ✅ COMPLETE

- [x] Automated End-to-End Test Suite runner (`tests/runAllTests.js`) executing across all 10 modules
- [x] 54 automated assertions covering authentication, authorization, data integrity, calculations, PDF/Excel, and security
- [x] Security testing:
  - Role-based authorization boundaries (students blocked from admin/analytics with 403 Forbidden)
  - Insecure Direct Object Reference (IDOR) protection on student transcripts
  - Anti-enumeration login error responses
  - Token expiration, tampering, and revocation
- [x] Data integrity testing:
  - Duplicate subject code prevention
  - Duplicate enrollment prevention
  - Re-marking attendance on locked sessions rejected (400 Bad Request)
  - Exceeding maximum marks rejected (400 Bad Request)
  - Pass marks greater than maximum marks rejected by input validation (422)
- [x] Complete Postman collection (`backend/postman_collection.json`) with organized folders, environment variables, and sample payloads
- [x] Comprehensive enterprise-grade API documentation in [`backend/README.md`](file:///d:/MERN%20Project/backend/README.md)
- [x] **Tested**: `npm test` runs with **54 PASSED \| 0 FAILED** ✅


---

## PHASE 12: Production-Grade Frontend Application & Lexend Design System ✅ COMPLETE

- [x] Initialized modern Vite + React 19 single-page application (`frontend/`)
- [x] Installed and configured Tailwind CSS v4 with `@tailwindcss/vite`
- [x] Configured official **Lexend** typography (Light 300, Regular 400, Medium 500, SemiBold 600, Bold 700) via Google Fonts preconnect
- [x] Implemented brand color palette referenced from design specification:
  - **Blue Charcoal** (`#0D141C`) — Deep modern dark surface and background
  - **Downy** (`#37CAB9`) — Primary vibrant brand accent and active UI states
  - **Melrose** (`#C0B5EE`) — Secondary soft lavender accent for academic metrics & badges
  - **Jonquil** (`#E0F58E`) — High-visibility electric lime for attendance warnings, alerts & tags
  - **Alice Blue** (`#EFF4F7`) — High-contrast text & elevated interactive card surfaces
- [x] Centralized API layer (`src/api/`):
  - `axiosClient.js`: Configured `/api/v1` base URL, cookie credentials, Bearer token injection, and automatic 401 token refresh queue
  - Domain API services for Auth, Attendance, Marks, Academic, Admin, Analytics, Reports (PDF/Excel blob downloads), and Notifications
- [x] Context Providers (`src/context/`):
  - `AuthContext.jsx`: User state, RBAC role tracking, automatic session recovery, and **1-Click Instant Demo Role Switcher** (`Admin`, `Faculty`, `Student`)
  - `ToastContext.jsx`: Interactive feedback system with brand glowing accents
- [x] Navigation & Layout Architecture (`src/layouts/`, `src/components/common/`):
  - Responsive `Navbar.jsx`: Unread notifications counter, live academic session indicator, demo role quick-switch popover, profile info
  - Role-adaptive `Sidebar.jsx`: Dynamic navigation tailored to logged-in role
  - Reusable components: `StatCard.jsx`, `Badge.jsx`, `Modal.jsx`, `DataTable.jsx`, `LoadingSpinner.jsx`, `ProtectedRoute.jsx`
- [x] **Student Portal** (`src/pages/student/`):
  - `StudentDashboard.jsx`: Overall attendance gauge, SGPA summary, enrolled courses, and One-Click PDF Report Card export
  - `StudentAttendance.jsx`: Subject breakdown table, shortage warning (<75%), and **Predictive Class Recovery Engine** with interactive attendance simulator
  - `StudentPerformance.jsx`: UGC 10-Point CBCS Grade Sheet, Credit weighting breakdown, and pass/fail indicators
  - `StudentNotifications.jsx`: Real-time academic broadcasts with mark-as-read and filter controls
- [x] **Faculty & HOD Portal** (`src/pages/faculty/`):
  - `FacultyDashboard.jsx`: Assigned teaching loads, scheduled classes, and quick action cards
  - `ClassAttendancePage.jsx`: Session scheduler, student roll call with "Mark All Present" shortcut, live attendance percentage counter, and **Submission Lock** protection
  - `MarksEntryPage.jsx`: Assessment scheduler, batch score entry with ceiling validation ($\le \text{maximumMarks}$), absent flag, and dynamic CBCS grade preview
  - `DepartmentAnalyticsPage.jsx`: Grade distribution histogram (Recharts), at-risk mentorship list, and direct Excel/PDF roster exports
- [x] **Administrator Portal** (`src/pages/admin/`):
  - `AdminDashboard.jsx`: System-wide KPIs, registered users breakdown, active academic session banner
  - `UserManagementPage.jsx`: Search & filter directory, modal provisioning for Students & Faculty, and instant account status toggle (`active`/`inactive`)
  - `AcademicSetupPage.jsx`: Multi-tab interface for Departments, Sessions, Course Subjects, Faculty Assignment, and Batch Cohort Enrollment
  - `SystemRiskPage.jsx`: College-Wide Academic Risk Detection Engine with severe attendance deficit and academic probation alerts
- [x] **Verification**:
  - `npm run build` compiled 2,555 modules with **0 errors** in 1.41s
  - Local Vite dev server active on `http://localhost:3000/` with proxy to backend API `http://localhost:5000/`

---

## Phase 8: DigiCampus Course Registration & Strict Faculty Isolation

- [x] **Admin Academic Session Registration Window**:
  - Extended `AcademicSession` model with `isEnrollmentOpen` (Boolean), `enrollmentStartDate` (Date), and `enrollmentEndDate` (Date).
  - Implemented `PATCH /api/v1/admin/sessions/:sessionId/enrollment-window` to configure registration timelines.
  - Added "Manage Enrollment Window" modal and real-time status badges in `AcademicSetupPage.jsx`.
- [x] **DigiCampus Student Course Self-Enrollment**:
  - Built dedicated `StudentEnrollmentPage.jsx` (`/student/enrollment`) styled with the Lexend design system.
  - Real-time timeline detection: verifies registration window status and alerts students if enrollment is open or locked.
  - One-click batch enrollment and individual course select/drop for semester subjects.
  - Added "Course Registration" navigation item to student sidebar and registration prompt banner on dashboard.
  - Endpoints: `GET /academic/available-subjects`, `POST /academic/enrollments/self`, `DELETE /academic/enrollments/self/:subjectId`.
- [x] **Strict Faculty Subject Isolation**:
  - Implemented `GET /academic/my-assigned-subjects` strictly scoping subjects to assigned faculty instructor (`assignedFaculty: faculty._id` or `faculty.subjects`).
  - Swapped generic subject listings in `ClassAttendancePage.jsx`, `FacultyDashboard.jsx`, `MarksEntryPage.jsx`, and `DepartmentAnalyticsPage.jsx` to assigned-only subjects.
- [x] **Attendance Roster Bug Resolution ("Student Not Enrolled")**:
  - Fixed student ID resolution: mapped populated `item.studentId._id`, `item.studentId.rollNumber`, and `item.studentId.userId.name`.
  - Resolved 400 validation error in `attendanceService.js` where enrollment document IDs were erroneously sent instead of Student IDs.
  - Mounted `GET /academic/sessions` to allow faculty and students to fetch calendar sessions without 403 Forbidden.
- [x] **End-to-End Verification**:
  - Successfully verified admin timeline setup $\rightarrow$ student self-registration $\rightarrow$ faculty subject isolation $\rightarrow$ class session scheduling $\rightarrow$ attendance marking and locking with 200 OK.
  - Frontend compiled with 0 errors via `npm run build`.
  - Pushed to GitHub repository on `main`.

---

## Phase 9: Attendance Roster Names & Student Attendance/Marks Visibility ✅ COMPLETE

- [x] **Fixed Student Names Fallback ("Student") in Faculty Portals**:
  - Root Cause: In `ClassAttendancePage.jsx` and `MarksEntryPage.jsx`, evaluating `item.studentId || item.student || item` resolved to `item.studentId` (an ObjectId/string) rather than an object, causing `student.userId?.name` and `student.rollNumber` to return `undefined` and fall back to `"Student"` and generic roll numbers.
  - Fix: Implemented multi-layered student extraction:
    - ID: `(item.studentId && typeof item.studentId === "object" ? item.studentId._id : item.studentId) || item.student?._id || item._id`
    - Student Object: `(item.student && typeof item.student === "object" ? item.student : null) || (item.studentId && typeof item.studentId === "object" ? item.studentId : null) || item`
    - Name: `item.studentName || studentObj?.name || studentObj?.userId?.name || studentObj?.user?.name || item.name || "Student"`
    - Roll Number: `item.rollNumber || studentObj?.rollNumber || item.student?.rollNumber || ""`
  - Added session history inspection: viewing submitted sessions automatically loads recorded attendance statuses into badges.
  - Added examination results inspection: selecting an existing examination automatically populates scores and absentees from previous uploads.
- [x] **Fixed Student Attendance & Marks Visibility in Student Portal**:
  - Root Cause 1 (Null Profile): In `backend/src/controllers/authController.js`, `login` and `getMe` only returned `{ user }` without querying or attaching the corresponding `Student` or `Faculty` document. This caused `AuthContext.jsx` to set `profile = null`, leaving `studentId` `undefined` on all student views.
  - Fix 1: Added `getProfileForUser` helper in `authController.js` populating `departmentId` and `admissionSessionId` for students, and `departmentId` and `subjects` for faculty. `login` and `getMe` now return `profile` directly.
  - Root Cause 2 (Missing Routes): Frontend called `GET /attendance/student/:studentId/summary`, `GET /attendance/student/:studentId/predictive-recovery`, and `GET /marks/student/:studentId/performance`, which did not exist on the backend and threw 404s.
  - Fix 2: Implemented `getStudentAttendanceSummary`, `getPredictiveRecovery`, `getStudentPerformance`, and student self shortcuts (`/my-summary`, `/my-recovery`, `/my-performance`) returning exact data shapes expected by `StudentDashboard.jsx`, `StudentAttendance.jsx`, and `StudentPerformance.jsx`.
  - Root Cause 3 (Unenrolled Subjects Omission): Aggregation pipelines in `attendanceService.js` now merge all actively registered subjects from `Enrollment`, ensuring students always see all registered courses even before the first lecture is held.
- [x] **Verification**:
  - Automated E2E verification test passed: student login returns profile with student `_id` and roll number `BCA001`, attendance summary returns 200 with 3 registered courses, predictive recovery returns 200, academic performance returns 200 with SGPA (9.56) and 4 examination records.
  - Faculty roster verification: enrolled students returned with full names ("Ravi Sharma", "Priya Patel") and roll numbers ("BCA001", "BCA002").
  - Frontend production build (`npm run build`) succeeded with 0 errors in 2.72s.

---

## Phase 10: User Profile & Photo Upload Feature ✅ COMPLETE

- [x] **User Schema & Image Storage**:
  - Added `avatar` field (`type: String`, default: `""`) to `backend/src/models/User.js` supporting Base64 data URLs and remote image paths.
  - Increased Express body parser limit in `backend/src/app.js` to `10mb` to support client-side image uploads.
  - Sanitized user responses in `authController.js` to include `avatar`.
- [x] **Universal Profile Management Endpoints**:
  - Implemented `PATCH /api/v1/auth/profile` in `authController.js` and `authRoutes.js` allowing any authenticated user to update their name, avatar, and role-specific details (phone, residential address, guardian information, or faculty academic qualification).
  - Enhanced `studentController.js` and `facultyController.js` profile endpoints with user avatar synchronization.
  - Relaxed phone validation regex across `Student.js` and `Faculty.js` to gracefully accept international/standard formats (`+91...`).
- [x] **Frontend Profile Page (`/profile`, `/student/profile`, `/faculty/profile`, `/admin/profile`)**:
  - Created `ProfilePage.jsx` styled in the deep charcoal brand theme (`#0D141C`) with Downy (`#37CAB9`) and Melrose (`#C0B5EE`) accents.
  - **Photo Upload**: Client-side Canvas image compressor (downsamples images to crisp max 500x500 WebP/JPEG data URLs under 80KB) with instant preview, change, and remove controls.
  - **Student Credentials Card**: Displays College Roll Number, University Enrollment Number, Department, Current Semester, Admission Session, and Guardian Emergency Contact with one-click copy shortcuts.
  - **Faculty Credentials Card**: Displays Employee ID, Academic Designation, Department, Highest Qualification, and Assigned Course count.
  - **Account Security Card**: Integrated in-page Password Change form.
- [x] **Global UI Integration**:
  - Updated `Navbar.jsx`: User profile pill renders uploaded avatar thumbnail with hover states, directly linking to `/profile`.
  - Updated `Sidebar.jsx`: Added "My Profile" navigation item with `User` icon for Students, Faculty, and Administrators, plus avatar display in the sidebar user card.
  - Updated `StudentDashboard.jsx`: Welcome banner displays the student's avatar with quick link to profile.
  - Updated `AuthContext.jsx`: Added `updateUserProfile` context method for seamless real-time state synchronization without page reloads.
- [x] **Verification**:
  - Automated E2E verification test passed: student and faculty profile updates return 200 OK with persistent avatar and contact updates.
  - Production build (`npm run build`) succeeded with 0 errors in 1.04s.
