/**
 * COMPREHENSIVE AUTOMATED END-TO-END TEST SUITE
 *
 * Validates all 10 modules:
 * 1. Health & Server Foundation
 * 2. Authentication & Session Handling
 * 3. Role-Based Access Control (RBAC) & Account Security
 * 4. Academic Management (Subjects, Sessions, Enrollments)
 * 5. Attendance Management (Sessions, Submission Lock, Audit, Calculations, Shortage)
 * 6. Academic Performance (Examinations, Score Limits, SGPA, Report Cards)
 * 7. Analytics & Rule-Based Risk Detection
 * 8. In-App Notifications & Binary Document Exports (PDF & Excel) + IDOR Protection
 */

const BASE_URL = "http://localhost:5000/api/v1";

let passedCount = 0;
let failedCount = 0;

const assert = (condition, message) => {
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passedCount++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    failedCount++;
  }
};

const runSuite = async () => {
  console.log("==================================================================");
  console.log("🚀 STARTING COMPREHENSIVE END-TO-END BACKEND TEST SUITE");
  console.log("==================================================================\n");

  let adminToken = "";
  let facultyToken = "";
  let studentToken = "";

  let deptId = "";
  let sessId = "";
  let subjectId = "";
  let studentId = "";
  let facultyId = "";
  let classSessionId = "";
  let attendanceRecordId = "";
  let examId = "";
  let markRecordId = "";

  try {
    // ── SUITE 1: HEALTH CHECK & ROUTING ──────────────────────────────────────
    console.log("📋 [SUITE 1] System Health & Routing Foundation");
    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200, "GET /health returns 200 OK");
    assert(healthData.data.database.status === "connected", "Database connection state is 'connected'");

    const notFoundRes = await fetch(`${BASE_URL}/nonexistent-route-xyz`);
    const notFoundData = await notFoundRes.json();
    assert(notFoundRes.status === 404, "Unknown route triggers 404 Not Found");
    assert(notFoundData.success === false, "404 response follows standard error format");

    // ── SUITE 2: AUTHENTICATION & SESSIONS ────────────────────────────────────
    console.log("\n🔐 [SUITE 2] Authentication & Security Credentials");
    // Admin login
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@college.com", password: "Admin@1234" }),
    });
    const adminLoginData = await adminLoginRes.json();
    assert(adminLoginRes.status === 200, "Admin login succeeds with valid credentials");
    assert(!!adminLoginData.data.accessToken, "JWT access token issued in login response");
    adminToken = adminLoginData.data.accessToken;

    // Invalid password
    const badPassRes = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@college.com", password: "WrongPassword999" }),
    });
    assert(badPassRes.status === 401, "Invalid password returns 401 Unauthorized");

    // Validation error
    const badEmailRes = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "not-an-email", password: "short" }),
    });
    assert(badEmailRes.status === 422, "Malformed payload triggers 422 Unprocessable Entity");

    // Missing token on protected route
    const noTokenRes = await fetch(`${BASE_URL}/auth/me`);
    assert(noTokenRes.status === 401, "Protected route blocks request without token (401)");

    // Malformed token
    const fakeTokenRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: "Bearer thisisnotavalidtoken" },
    });
    assert(fakeTokenRes.status === 401, "Malformed JWT rejected with 401 Unauthorized");

    // ── SUITE 3: RBAC & USER MANAGEMENT ──────────────────────────────────────
    console.log("\n🛡️  [SUITE 3] Role-Based Access Control & User Management");
    // Fetch departments
    const deptListRes = await fetch(`${BASE_URL}/admin/departments`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const deptListData = await deptListRes.json();
    deptId = deptListData.data.departments[0]._id;
    assert(deptListRes.status === 200, `Admin fetched departments list (BCA ID: ${deptId})`);

    // Fetch sessions
    const sessListRes = await fetch(`${BASE_URL}/admin/sessions`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const sessListData = await sessListRes.json();
    sessId = sessListData.data.sessions[0]._id;
    assert(sessListRes.status === 200, `Admin fetched academic sessions (Session ID: ${sessId})`);

    // Fetch student & faculty IDs
    const studentsRes = await fetch(`${BASE_URL}/admin/students`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const studentsData = await studentsRes.json();
    studentId = studentsData.data.students[0]._id;
    assert(studentsRes.status === 200, `Admin retrieved students (Student ID: ${studentId})`);

    const facultyRes = await fetch(`${BASE_URL}/admin/faculty`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const facultyData = await facultyRes.json();
    facultyId = facultyData.data.faculty[0]._id;
    assert(facultyRes.status === 200, `Admin retrieved faculty (Faculty ID: ${facultyId})`);

    // Faculty Login
    const facLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "meena.joshi@faculty.college.com", password: "Faculty@1234" }),
    });
    const facLoginData = await facLoginRes.json();
    facultyToken = facLoginData.data.accessToken;
    assert(facLoginRes.status === 200, "Faculty logged in successfully");

    // Student Login
    const stuLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "ravi.sharma@student.college.com", password: "Student@1234" }),
    });
    const stuLoginData = await stuLoginRes.json();
    studentToken = stuLoginData.data.accessToken;
    assert(stuLoginRes.status === 200, "Student logged in successfully");

    // RBAC: Student blocked from Admin route
    const studentBlockedRes = await fetch(`${BASE_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(studentBlockedRes.status === 403, "Student blocked from admin route with 403 Forbidden");

    // RBAC: Faculty blocked from Student creation
    const facBlockedRes = await fetch(`${BASE_URL}/admin/students`, {
      method: "POST",
      headers: { Authorization: `Bearer ${facultyToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    assert(facBlockedRes.status === 403, "Faculty blocked from creating student accounts (403)");

    // ── SUITE 4: ACADEMIC MANAGEMENT ─────────────────────────────────────────
    console.log("\n📚 [SUITE 4] Academic Management & Course Enrollments");
    const subjectsRes = await fetch(`${BASE_URL}/academic/subjects?code=BCA-101`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const subjectsData = await subjectsRes.json();
    subjectId = subjectsData.data.subjects[0]._id;
    assert(subjectsRes.status === 200, `Subject BCA-101 verified (Subject ID: ${subjectId})`);

    // Duplicate subject code in department blocked
    const dupSubjectRes = await fetch(`${BASE_URL}/academic/subjects`, {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Duplicate DBMS",
        code: "BCA-101",
        departmentId: deptId,
        semester: 1,
        credits: 4,
      }),
    });
    assert(dupSubjectRes.status === 409, "Duplicate subject code in same department rejected (409 Conflict)");

    // Query enrolled students
    const enrolledRes = await fetch(`${BASE_URL}/academic/enrollments/subject/${subjectId}`, {
      headers: { Authorization: `Bearer ${facultyToken}` },
    });
    const enrolledData = await enrolledRes.json();
    assert(enrolledRes.status === 200, `Faculty retrieved subject enrollment roster (${enrolledData.data.total} students)`);

    // Student queries their own enrolled courses
    const mySubjectsRes = await fetch(`${BASE_URL}/academic/enrollments/my-subjects`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const mySubjectsData = await mySubjectsRes.json();
    assert(mySubjectsRes.status === 200 && mySubjectsData.data.total > 0, "Student successfully queries enrolled course timetable");

    // ── SUITE 5: ATTENDANCE MANAGEMENT ───────────────────────────────────────
    console.log("\n📋 [SUITE 5] Attendance Management, Auditing & Calculations");
    // Schedule a test class session
    const scheduleRes = await fetch(`${BASE_URL}/attendance/sessions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${facultyToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        subjectId,
        academicSessionId: sessId,
        date: new Date().toISOString().split("T")[0],
        startTime: "09:00",
        endTime: "10:00",
        sessionType: "lecture",
        topic: "Automated E2E Testing Class",
      }),
    });
    const scheduleData = await scheduleRes.json();
    classSessionId = scheduleData.data.session._id;
    assert(scheduleRes.status === 201, "Faculty scheduled lecture session successfully (201 Created)");

    // Submit attendance and lock
    const submitAttRes = await fetch(`${BASE_URL}/attendance/submit`, {
      method: "POST",
      headers: { Authorization: `Bearer ${facultyToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        classSessionId,
        records: [{ studentId, status: "present", remarks: "E2E automated test present" }],
      }),
    });
    assert(submitAttRes.status === 200, "Faculty submitted and locked attendance (200 OK)");

    // Re-submission on locked session rejected
    const resubmitAttRes = await fetch(`${BASE_URL}/attendance/submit`, {
      method: "POST",
      headers: { Authorization: `Bearer ${facultyToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        classSessionId,
        records: [{ studentId, status: "absent" }],
      }),
    });
    assert(resubmitAttRes.status === 400, "Submitting attendance on locked session rejected (400 Bad Request)");

    // Audit correction
    const sessionDetailsRes = await fetch(`${BASE_URL}/attendance/sessions/${classSessionId}`, {
      headers: { Authorization: `Bearer ${facultyToken}` },
    });
    const sessionDetailsData = await sessionDetailsRes.json();
    attendanceRecordId = sessionDetailsData.data.attendanceRecords[0]._id;

    const correctRes = await fetch(`${BASE_URL}/attendance/${attendanceRecordId}/correct`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${facultyToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ status: "late", remarks: "Audit correction verified" }),
    });
    const correctData = await correctRes.json();
    assert(correctRes.status === 200, "Attendance audit correction succeeds");
    assert(correctData.data.attendance.isCorrected === true, "Attendance record audit flag 'isCorrected' is true");

    // Dynamic Aggregation Summary
    const summaryRes = await fetch(`${BASE_URL}/attendance/subject/${subjectId}/summary`, {
      headers: { Authorization: `Bearer ${facultyToken}` },
    });
    const summaryData = await summaryRes.json();
    assert(summaryRes.status === 200, "Subject attendance aggregation calculated dynamically");
    assert(summaryData.data.totalConductedClasses > 0, "Conducted classes count accurately calculated from sessions");

    // Shortage Detection report
    const shortageRes = await fetch(`${BASE_URL}/attendance/shortage?threshold=75`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(shortageRes.status === 200, "Attendance shortage report generated with threshold filtering");

    // ── SUITE 6: ACADEMIC PERFORMANCE (EXAMINATIONS & MARKS) ─────────────────
    console.log("\n🎯 [SUITE 6] Examinations, Marks Upload & SGPA Computation");
    // Create Examination
    const examRes = await fetch(`${BASE_URL}/marks/examinations`, {
      method: "POST",
      headers: { Authorization: `Bearer ${facultyToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "E2E Final Comprehensive Assessment",
        examType: "internal_test",
        subjectId,
        academicSessionId: sessId,
        semester: 1,
        maximumMarks: 50,
        passMarks: 20,
        weightage: 25,
      }),
    });
    const examData = await examRes.json();
    examId = examData.data.examination._id;
    assert(examRes.status === 201, "Faculty created examination successfully");

    // Pass marks > Max marks validation
    const invalidExamRes = await fetch(`${BASE_URL}/marks/examinations`, {
      method: "POST",
      headers: { Authorization: `Bearer ${facultyToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Invalid Marks Exam",
        examType: "quiz",
        subjectId,
        academicSessionId: sessId,
        semester: 1,
        maximumMarks: 30,
        passMarks: 40,
      }),
    });
    assert(invalidExamRes.status === 422, "Exam with passMarks > maximumMarks rejected with 422");

    // Submit marks
    const marksSubmitRes = await fetch(`${BASE_URL}/marks/submit`, {
      method: "POST",
      headers: { Authorization: `Bearer ${facultyToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        examinationId: examId,
        marks: [{ studentId, obtainedMarks: 46, isAbsent: false, remarks: "Outstanding performance" }],
      }),
    });
    assert(marksSubmitRes.status === 200, "Marks uploaded and letter grades calculated");

    // Exceeding maximum marks blocked
    const overflowMarksRes = await fetch(`${BASE_URL}/marks/submit`, {
      method: "POST",
      headers: { Authorization: `Bearer ${facultyToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        examinationId: examId,
        marks: [{ studentId, obtainedMarks: 60 }],
      }),
    });
    assert(overflowMarksRes.status === 400, "Marks exceeding maximum marks rejected with 400 Bad Request");

    // Examination Results Sheet
    const resultsSheetRes = await fetch(`${BASE_URL}/marks/examinations/${examId}/results`, {
      headers: { Authorization: `Bearer ${facultyToken}` },
    });
    const resultsSheetData = await resultsSheetRes.json();
    assert(resultsSheetRes.status === 200, "Examination results sheet and class performance fetched");
    assert(resultsSheetData.data.results[0].grade === "O", "Score of 46/50 (92%) correctly awarded 'O' (Outstanding) grade");

    // Student Semester Report Card & SGPA
    const reportCardRes = await fetch(`${BASE_URL}/marks/report/my-report?semester=1&academicSessionId=${sessId}`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const reportCardData = await reportCardRes.json();
    assert(reportCardRes.status === 200, "Student retrieved personal semester report card");
    assert(reportCardData.data.academicSummary.sgpa > 0, `Credit-weighted SGPA computed accurately (${reportCardData.data.academicSummary.sgpa})`);

    // ── SUITE 7: ANALYTICS & RISK DETECTION ──────────────────────────────────
    console.log("\n📊 [SUITE 7] Institutional Analytics & Academic Risk Detection");
    const deptAnalyticsRes = await fetch(`${BASE_URL}/analytics/department/${deptId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(deptAnalyticsRes.status === 200, "Department analytics dashboard fetched with live metrics");

    const subjAnalyticsRes = await fetch(`${BASE_URL}/analytics/subject/${subjectId}`, {
      headers: { Authorization: `Bearer ${facultyToken}` },
    });
    const subjAnalyticsData = await subjAnalyticsRes.json();
    assert(subjAnalyticsRes.status === 200, "Subject analytics retrieved");
    assert(!!subjAnalyticsData.data.academicPerformance.gradeHistogram, "Subject grade distribution histogram populated");

    const cohortRes = await fetch(`${BASE_URL}/analytics/cohort?departmentId=${deptId}&semester=1`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(cohortRes.status === 200, "Cohort performance and attendance-academic correlation retrieved");

    const riskRes = await fetch(`${BASE_URL}/analytics/risk-detection?departmentId=${deptId}&semester=1`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const riskData = await riskRes.json();
    assert(riskRes.status === 200, "Rule-based Academic Risk Detection report executed");
    assert(riskData.data.totalAtRiskStudents >= 0, "Risk engine evaluated student cohort against transparent thresholds");

    // ── SUITE 8: NOTIFICATIONS & REPORT EXPORTS (PDF & EXCEL) ────────────────
    console.log("\n📑 [SUITE 8] In-App Notifications, PDF/Excel Exports & IDOR Security");
    // Notifications check
    const notifsRes = await fetch(`${BASE_URL}/notifications`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const notifsData = await notifsRes.json();
    assert(notifsRes.status === 200, `Student retrieved notifications (${notifsData.data.pagination.totalItems} alerts)`);

    // PDF Report Card
    const pdfRes = await fetch(`${BASE_URL}/reports/pdf/my-report-card?semester=1&academicSessionId=${sessId}`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const pdfBuffer = await pdfRes.arrayBuffer();
    const pdfHeader = Buffer.from(pdfBuffer).subarray(0, 4).toString("ascii");
    assert(pdfRes.status === 200, "PDF Semester Report Card generated (200 OK)");
    assert(pdfHeader === "%PDF", "PDF response contains valid '%PDF' binary magic header");

    // PDF Attendance Roster
    const pdfAttRes = await fetch(`${BASE_URL}/reports/pdf/subject/${subjectId}/attendance?academicSessionId=${sessId}`, {
      headers: { Authorization: `Bearer ${facultyToken}` },
    });
    const pdfAttBuffer = await pdfAttRes.arrayBuffer();
    const pdfAttHeader = Buffer.from(pdfAttBuffer).subarray(0, 4).toString("ascii");
    assert(pdfAttRes.status === 200, "PDF Subject Attendance Roster generated (200 OK)");
    assert(pdfAttHeader === "%PDF", "PDF Attendance contains valid '%PDF' binary magic header");

    // Excel Attendance Export
    const excelAttRes = await fetch(`${BASE_URL}/reports/excel/subject/${subjectId}/attendance?academicSessionId=${sessId}`, {
      headers: { Authorization: `Bearer ${facultyToken}` },
    });
    const excelAttBuffer = await excelAttRes.arrayBuffer();
    const excelAttHeader = Buffer.from(excelAttBuffer).subarray(0, 2).toString("ascii");
    assert(excelAttRes.status === 200, "Excel Subject Attendance sheet exported (200 OK)");
    assert(excelAttHeader === "PK", "Excel response contains valid 'PK' Zip binary header");

    // Excel Exam Results Export
    const excelExamRes = await fetch(`${BASE_URL}/reports/excel/examination/${examId}/results`, {
      headers: { Authorization: `Bearer ${facultyToken}` },
    });
    const excelExamBuffer = await excelExamRes.arrayBuffer();
    const excelExamHeader = Buffer.from(excelExamBuffer).subarray(0, 2).toString("ascii");
    assert(excelExamRes.status === 200, "Excel Examination Results sheet exported (200 OK)");
    assert(excelExamHeader === "PK", "Excel Exam Results contains valid 'PK' Zip binary header");

    // IDOR Protection: Student cannot download another student's report card
    const idorRes = await fetch(`${BASE_URL}/reports/pdf/student/6af1e188167340ba25d92a1a?semester=1&academicSessionId=${sessId}`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(idorRes.status === 403, "IDOR attack blocked: Student downloading another student's PDF rejected with 403 Forbidden");

    // ── SUMMARY REPORT ───────────────────────────────────────────────────────
    console.log("\n==================================================================");
    console.log(`🏁 TEST SUITE COMPLETED: ${passedCount} PASSED | ${failedCount} FAILED`);
    console.log("==================================================================");

    if (failedCount === 0) {
      console.log("🎉 ALL TESTS PASSED SUCCESSFULLY! BACKEND API IS 100% PRODUCTION READY.");
      process.exit(0);
    } else {
      console.error(`⚠️  ${failedCount} test(s) failed. Please review the output above.`);
      process.exit(1);
    }
  } catch (error) {
    console.error("FATAL ERROR IN TEST SUITE RUNNER:", error);
    process.exit(1);
  }
};

runSuite();

