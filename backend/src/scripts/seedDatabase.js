/**
 * COMPREHENSIVE DATABASE RESET & SEED SCRIPT
 *
 * Resets all collections and provisions fresh, realistic data:
 * - 1 Current Academic Session (2024-2025) with DigiCampus Course Registration Window open
 * - 3 Academic Departments (BCA, BBA, BSC-IT)
 * - 1 System Administrator (admin@college.com)
 * - 1 HOD (Dr. Rajesh Gupta)
 * - 3 Faculty Members (Prof. Meena Joshi, Mr. Sudip Chatterjee, Dr. Anita Sharma)
 * - 6 Students across Semesters 1 and 5 (Ravi Sharma, Priya Patel, Jayanta Kumar, Amit Verma, Neha Gupta, Arjun Singh)
 * - 8 Subjects with proper credit weights and assigned instructors
 * - Full batch semester course enrollments
 * - Real historical class sessions with comprehensive roll call attendance records (Safe, High, and Shortage test cases)
 * - CBCS Examinations (Internal, Mid-Term, Practical, Quiz) with graded scores, letter grades, and computed SGPA
 * - Real-time system notifications
 *
 * Run with: npm run seed
 */

import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import {
  User,
  Student,
  Faculty,
  Department,
  AcademicSession,
  Subject,
  Enrollment,
  ClassSession,
  Attendance,
  Examination,
  Marks,
  Notification,
} from "../models/index.js";

const seed = async () => {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await connectDB();

    console.log("🧹 Resetting existing database collections...");
    await Promise.all([
      User.deleteMany({}),
      Student.deleteMany({}),
      Faculty.deleteMany({}),
      Department.deleteMany({}),
      AcademicSession.deleteMany({}),
      Subject.deleteMany({}),
      Enrollment.deleteMany({}),
      ClassSession.deleteMany({}),
      Attendance.deleteMany({}),
      Examination.deleteMany({}),
      Marks.deleteMany({}),
      Notification.deleteMany({}),
    ]);
    console.log("✨ All previous data cleared successfully.");

    // ─────────────────────────────────────────────────────────────────────────
    // 1. ACADEMIC SESSION
    // ─────────────────────────────────────────────────────────────────────────
    console.log("📅 Provisioning Academic Session...");
    const session = await AcademicSession.create({
      label: "2024-2025",
      startDate: new Date("2024-07-01"),
      endDate: new Date("2025-06-30"),
      isCurrent: true,
      isActive: true,
      isEnrollmentOpen: true, // DigiCampus enrollment is active!
      enrollmentStartDate: new Date("2024-07-01"),
      enrollmentEndDate: new Date("2025-12-31"),
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 2. DEPARTMENTS
    // ─────────────────────────────────────────────────────────────────────────
    console.log("🏛️ Provisioning Academic Departments...");
    const [deptBCA, deptBBA, deptBSCIT] = await Promise.all([
      Department.create({
        name: "Department of Computer Applications",
        code: "BCA",
        description: "Bachelor of Computer Applications - Software Engineering, Systems & Data Architecture",
        isActive: true,
      }),
      Department.create({
        name: "Department of Management Studies",
        code: "BBA",
        description: "Bachelor of Business Administration - Marketing, Finance & Human Resources",
        isActive: true,
      }),
      Department.create({
        name: "Department of Information Technology",
        code: "BSCIT",
        description: "B.Sc. in Information Technology - Cloud Computing, Cybersecurity & Networking",
        isActive: true,
      }),
    ]);

    // ─────────────────────────────────────────────────────────────────────────
    // 3. USERS & FACULTY / HOD PROFILES
    // ─────────────────────────────────────────────────────────────────────────
    console.log("👥 Provisioning Administrators and Faculty...");

    // Admin
    const adminUser = await User.create({
      name: "System Administrator",
      email: "admin@college.com",
      password: "Admin@1234",
      role: "admin",
      isActive: true,
    });

    // HOD
    const hodUser = await User.create({
      name: "Dr. Rajesh Gupta",
      email: "rajesh.gupta@faculty.college.com",
      password: "Faculty@1234",
      role: "hod",
      isActive: true,
    });

    const hodFaculty = await Faculty.create({
      userId: hodUser._id,
      employeeId: "FAC-HOD-001",
      designation: "Professor",
      departmentId: deptBCA._id,
      subjects: [],
    });

    // Link HOD to Department
    deptBCA.hod = hodFaculty._id;
    await deptBCA.save();

    // Faculty 1: Prof. Meena Joshi (Demo Faculty)
    const meenaUser = await User.create({
      name: "Prof. Meena Joshi",
      email: "meena.joshi@faculty.college.com",
      password: "Faculty@1234",
      role: "faculty",
      isActive: true,
    });

    const meenaFaculty = await Faculty.create({
      userId: meenaUser._id,
      employeeId: "FAC-2024-001",
      designation: "Associate Professor",
      departmentId: deptBCA._id,
      subjects: [],
    });

    // Faculty 2: Mr. Sudip Chatterjee
    const sudipUser = await User.create({
      name: "Mr. Sudip Chatterjee",
      email: "sudip@college.edu.in",
      password: "Faculty@1234",
      role: "faculty",
      isActive: true,
    });

    const sudipFaculty = await Faculty.create({
      userId: sudipUser._id,
      employeeId: "FAC-2024-002",
      designation: "Assistant Professor",
      departmentId: deptBCA._id,
      subjects: [],
    });

    // Faculty 3: Dr. Anita Sharma (BBA)
    const anitaUser = await User.create({
      name: "Dr. Anita Sharma",
      email: "anita.sharma@faculty.college.com",
      password: "Faculty@1234",
      role: "faculty",
      isActive: true,
    });

    const anitaFaculty = await Faculty.create({
      userId: anitaUser._id,
      employeeId: "FAC-2024-003",
      designation: "Assistant Professor",
      departmentId: deptBBA._id,
      subjects: [],
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 4. SUBJECTS
    // ─────────────────────────────────────────────────────────────────────────
    console.log("📚 Provisioning Course Subjects...");
    const [
      subBCA101,
      subBCA102,
      subBCA103,
      subBCA104,
      subBCA105,
      subBCA501,
      subBCA502,
      subBCA503,
    ] = await Promise.all([
      // BCA Semester 1
      Subject.create({
        name: "Database Management Systems",
        code: "BCA-101",
        departmentId: deptBCA._id,
        semester: 1,
        credits: 4,
        subjectType: "theory",
        assignedFaculty: meenaFaculty._id,
        description: "Relational database concepts, SQL, schema normalization, transaction management, and indexing.",
      }),
      Subject.create({
        name: "Web Technologies Lab",
        code: "BCA-102",
        departmentId: deptBCA._id,
        semester: 1,
        credits: 2,
        subjectType: "practical",
        assignedFaculty: meenaFaculty._id,
        description: "Hands-on web development with modern HTML5, CSS3, JavaScript, DOM manipulation, and responsive UI design.",
      }),
      Subject.create({
        name: "Programming with C",
        code: "BCA-103",
        departmentId: deptBCA._id,
        semester: 1,
        credits: 4,
        subjectType: "theory",
        assignedFaculty: sudipFaculty._id,
        description: "Structured programming fundamentals, memory management, pointers, dynamic memory allocation, and file I/O in C.",
      }),
      Subject.create({
        name: "Digital Electronics & Computer Architecture",
        code: "BCA-104",
        departmentId: deptBCA._id,
        semester: 1,
        credits: 4,
        subjectType: "theory",
        assignedFaculty: hodFaculty._id,
        description: "Boolean algebra, combinational & sequential logic, ALU design, processor registers, and instruction cycles.",
      }),
      Subject.create({
        name: "Mathematics for Computing",
        code: "BCA-105",
        departmentId: deptBCA._id,
        semester: 1,
        credits: 4,
        subjectType: "theory",
        assignedFaculty: sudipFaculty._id,
        description: "Discrete mathematics, set theory, graph theory, propositional logic, and recurrence relations.",
      }),
      // BCA Semester 5
      Subject.create({
        name: "Cloud Computing & DevOps",
        code: "BCA-501",
        departmentId: deptBCA._id,
        semester: 5,
        credits: 4,
        subjectType: "theory",
        assignedFaculty: meenaFaculty._id,
        description: "Cloud architecture, IaaS/PaaS/SaaS, Docker containerization, Kubernetes orchestration, and CI/CD pipelines.",
      }),
      Subject.create({
        name: "Artificial Intelligence & Machine Learning",
        code: "BCA-502",
        departmentId: deptBCA._id,
        semester: 5,
        credits: 4,
        subjectType: "theory",
        assignedFaculty: hodFaculty._id,
        description: "Search algorithms, supervised and unsupervised learning, neural networks, and decision trees.",
      }),
      Subject.create({
        name: "Mobile Application Development",
        code: "BCA-503",
        departmentId: deptBCA._id,
        semester: 5,
        credits: 3,
        subjectType: "practical",
        assignedFaculty: sudipFaculty._id,
        description: "Cross-platform mobile apps, state management, mobile storage, and device API integration.",
      }),
    ]);

    // Link assigned subjects back to faculty profiles
    meenaFaculty.subjects = [subBCA101._id, subBCA102._id, subBCA501._id];
    await meenaFaculty.save();

    sudipFaculty.subjects = [subBCA103._id, subBCA105._id, subBCA503._id];
    await sudipFaculty.save();

    hodFaculty.subjects = [subBCA104._id, subBCA502._id];
    await hodFaculty.save();

    // ─────────────────────────────────────────────────────────────────────────
    // 5. STUDENTS
    // ─────────────────────────────────────────────────────────────────────────
    console.log("🎓 Provisioning Students...");

    const studentSeedData = [
      {
        name: "Ravi Sharma",
        email: "ravi.sharma@student.college.com",
        rollNumber: "BCA001",
        enrollmentNumber: "0801BCA24001",
        semester: 1,
        phone: "9876543210",
        guardianName: "Ramesh Sharma",
      },
      {
        name: "Priya Patel",
        email: "priya.patel@student.college.com",
        rollNumber: "BCA002",
        enrollmentNumber: "0801BCA24002",
        semester: 1,
        phone: "9876543211",
        guardianName: "Mahesh Patel",
      },
      {
        name: "Jayanta Kumar",
        email: "jayanta@college.edu.in",
        rollNumber: "BCA-2024-032",
        enrollmentNumber: "EN2024032",
        semester: 1,
        phone: "9876543212",
        guardianName: "Bimal Kumar",
      },
      {
        name: "Amit Verma",
        email: "amit.verma@student.college.com",
        rollNumber: "BCA003",
        enrollmentNumber: "0801BCA24003",
        semester: 1,
        phone: "9876543213",
        guardianName: "Suresh Verma",
      },
      {
        name: "Neha Gupta",
        email: "neha.gupta@student.college.com",
        rollNumber: "BCA004",
        enrollmentNumber: "0801BCA24004",
        semester: 1,
        phone: "9876543214",
        guardianName: "Alok Gupta",
      },
      {
        name: "Arjun Singh",
        email: "arjun.singh@student.college.com",
        rollNumber: "BCA050",
        enrollmentNumber: "0801BCA22050",
        semester: 5,
        phone: "9876543215",
        guardianName: "Baljit Singh",
      },
    ];

    const studentDocs = [];
    for (const s of studentSeedData) {
      const user = await User.create({
        name: s.name,
        email: s.email,
        password: "Student@1234",
        role: "student",
        isActive: true,
      });

      const profile = await Student.create({
        userId: user._id,
        rollNumber: s.rollNumber,
        enrollmentNumber: s.enrollmentNumber,
        departmentId: deptBCA._id,
        admissionSessionId: session._id,
        admissionYear: s.semester === 5 ? 2022 : 2024,
        currentSemester: s.semester,
        phone: s.phone,
        guardianName: s.guardianName,
        guardianPhone: "9811223344",
        address: "Campus Residence, Block C",
        status: "active",
      });

      studentDocs.push({ user, profile, semester: s.semester });
    }

    const sem1Students = studentDocs.filter((s) => s.semester === 1);
    const sem5Students = studentDocs.filter((s) => s.semester === 5);

    // ─────────────────────────────────────────────────────────────────────────
    // 6. ENROLLMENTS
    // ─────────────────────────────────────────────────────────────────────────
    console.log("📝 Registering Course Enrollments...");
    const sem1Subjects = [subBCA101, subBCA102, subBCA103, subBCA104, subBCA105];

    for (const student of sem1Students) {
      for (const subject of sem1Subjects) {
        await Enrollment.create({
          studentId: student.profile._id,
          subjectId: subject._id,
          academicSessionId: session._id,
          semester: 1,
          status: "active",
          enrolledAt: new Date("2024-07-05"),
        });
      }
    }

    // Semester 5 enrollments: enroll Arjun in BCA-501 and BCA-502 (leaves BCA-503 open for self-enrollment testing!)
    for (const student of sem5Students) {
      for (const subject of [subBCA501, subBCA502]) {
        await Enrollment.create({
          studentId: student.profile._id,
          subjectId: subject._id,
          academicSessionId: session._id,
          semester: 5,
          status: "active",
          enrolledAt: new Date("2024-07-05"),
        });
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 7. CLASS SESSIONS & ATTENDANCE ROSTERS
    // ─────────────────────────────────────────────────────────────────────────
    console.log("📋 Scheduling Class Sessions & Marking Attendance Records...");

    // Subject 1: BCA-101 (DBMS) — 10 sessions conducted by Prof. Meena Joshi
    const dbmsSessionTopics = [
      "Introduction to Relational Database Architecture & 3-Tier Model",
      "Entity-Relationship (ER) Modeling & Crow's Foot Notation",
      "Translating Conceptual ER Diagrams into Relational Tables",
      "Relational Algebra: Select, Project, Join, and Set Operations",
      "SQL Fundamentals: DDL, DML, Table Constraints and Keys",
      "Complex SQL Queries: Nested Subqueries and Group By Aggregations",
      "Functional Dependencies & 1st, 2nd, 3rd Normal Forms (3NF)",
      "Boyce-Codd Normal Form (BCNF) & Lossless Decompositions",
      "Transaction Processing & ACID Properties",
      "Concurrency Control Protocols & Two-Phase Locking (2PL)",
    ];

    // Attendance patterns for BCA-101 across 10 sessions:
    // Ravi (BCA001): 8 Present, 1 Late, 1 Absent (Safe ~85%)
    // Priya (BCA002): 9 Present, 1 Late (95% - Top)
    // Jayanta (BCA-2024-032): 8 Present, 2 Absent (80% - Good)
    // Amit (BCA003): 4 Present, 1 Late, 5 Absent (45% - Critical Shortage!)
    // Neha (BCA004): 10 Present (100% - Perfect)
    const dbmsAttendanceMatrix = [
      // S1: all present
      { "BCA001": "present", "BCA002": "present", "BCA-2024-032": "present", "BCA003": "present", "BCA004": "present" },
      // S2: Amit absent
      { "BCA001": "present", "BCA002": "present", "BCA-2024-032": "present", "BCA003": "absent",  "BCA004": "present" },
      // S3: Jayanta absent
      { "BCA001": "present", "BCA002": "present", "BCA-2024-032": "absent",  "BCA003": "absent",  "BCA004": "present" },
      // S4: Amit absent
      { "BCA001": "present", "BCA002": "present", "BCA-2024-032": "present", "BCA003": "absent",  "BCA004": "present" },
      // S5: Ravi late, Priya late
      { "BCA001": "late",    "BCA002": "late",    "BCA-2024-032": "present", "BCA003": "present", "BCA004": "present" },
      // S6: Amit absent
      { "BCA001": "present", "BCA002": "present", "BCA-2024-032": "present", "BCA003": "absent",  "BCA004": "present" },
      // S7: Ravi absent
      { "BCA001": "absent",  "BCA002": "present", "BCA-2024-032": "present", "BCA003": "present", "BCA004": "present" },
      // S8: Amit late
      { "BCA001": "present", "BCA002": "present", "BCA-2024-032": "present", "BCA003": "late",    "BCA004": "present" },
      // S9: Jayanta absent, Amit absent
      { "BCA001": "present", "BCA002": "present", "BCA-2024-032": "absent",  "BCA003": "absent",  "BCA004": "present" },
      // S10: all present
      { "BCA001": "present", "BCA002": "present", "BCA-2024-032": "present", "BCA003": "present", "BCA004": "present" },
    ];

    for (let i = 0; i < dbmsSessionTopics.length; i++) {
      const sessionDate = new Date("2024-11-01");
      sessionDate.setDate(sessionDate.getDate() + i);

      const classSession = await ClassSession.create({
        subjectId: subBCA101._id,
        facultyId: meenaFaculty._id,
        academicSessionId: session._id,
        date: sessionDate,
        startTime: "09:00",
        endTime: "10:00",
        sessionType: "lecture",
        topic: dbmsSessionTopics[i],
        room: "LH-101",
        status: "completed",
        isAttendanceSubmitted: true,
      });

      const pattern = dbmsAttendanceMatrix[i];
      for (const st of sem1Students) {
        const roll = st.profile.rollNumber;
        const status = pattern[roll] || "present";

        await Attendance.create({
          studentId: st.profile._id,
          classSessionId: classSession._id,
          subjectId: subBCA101._id,
          facultyId: meenaFaculty._id,
          academicSessionId: session._id,
          date: sessionDate,
          status,
          isCorrected: false,
        });
      }
    }

    // 1 upcoming open session for BCA-101 (so faculty can take attendance immediately)
    await ClassSession.create({
      subjectId: subBCA101._id,
      facultyId: meenaFaculty._id,
      academicSessionId: session._id,
      date: new Date(),
      startTime: "10:00",
      endTime: "11:00",
      sessionType: "lecture",
      topic: "B+ Tree Indexing & Physical Storage Architecture",
      room: "LH-101",
      status: "scheduled",
      isAttendanceSubmitted: false,
    });

    // Subject 2: BCA-102 (Web Tech Lab) — 5 lab sessions conducted by Prof. Meena Joshi
    const webLabTopics = [
      "Semantic HTML5 Elements & Web Content Accessibility Guidelines",
      "CSS3 Flexbox & Grid Multi-Device Responsive Layouts",
      "JavaScript ES6 Syntax: Promises, Async/Await, & Fetch API",
      "Client-Side Form Validation & Dynamic DOM Manipulation",
      "Mini-Project Evaluation: Interactive Single Page Dashboard",
    ];

    for (let i = 0; i < webLabTopics.length; i++) {
      const sessionDate = new Date("2024-11-03");
      sessionDate.setDate(sessionDate.getDate() + (i * 2));

      const classSession = await ClassSession.create({
        subjectId: subBCA102._id,
        facultyId: meenaFaculty._id,
        academicSessionId: session._id,
        date: sessionDate,
        startTime: "14:00",
        endTime: "16:00",
        sessionType: "practical",
        topic: webLabTopics[i],
        room: "Lab-2",
        status: "completed",
        isAttendanceSubmitted: true,
      });

      for (const st of sem1Students) {
        // Amit missed 2 labs, others attended all
        const isAbsent = st.profile.rollNumber === "BCA003" && (i === 1 || i === 3);
        await Attendance.create({
          studentId: st.profile._id,
          classSessionId: classSession._id,
          subjectId: subBCA102._id,
          facultyId: meenaFaculty._id,
          academicSessionId: session._id,
          date: sessionDate,
          status: isAbsent ? "absent" : "present",
          isCorrected: false,
        });
      }
    }

    // Subject 3: BCA-103 (Programming in C) — 6 sessions conducted by Mr. Sudip Chatterjee
    const cTopics = [
      "Syntax & Structure of C: Compilers, Linkers, and Preprocessors",
      "Data Types, Storage Classes, and Operators",
      "Control Structures: Branches, Loops, and Switch Statements",
      "Functions: Recursion and Parameter Passing Conventions",
      "Arrays & Pointer Arithmetic: Memory Addressing",
      "Dynamic Memory: malloc, calloc, realloc, and free",
    ];

    for (let i = 0; i < cTopics.length; i++) {
      const sessionDate = new Date("2024-11-02");
      sessionDate.setDate(sessionDate.getDate() + (i * 2));

      const classSession = await ClassSession.create({
        subjectId: subBCA103._id,
        facultyId: sudipFaculty._id,
        academicSessionId: session._id,
        date: sessionDate,
        startTime: "11:00",
        endTime: "12:00",
        sessionType: "lecture",
        topic: cTopics[i],
        room: "LH-103",
        status: "completed",
        isAttendanceSubmitted: true,
      });

      for (const st of sem1Students) {
        await Attendance.create({
          studentId: st.profile._id,
          classSessionId: classSession._id,
          subjectId: subBCA103._id,
          facultyId: sudipFaculty._id,
          academicSessionId: session._id,
          date: sessionDate,
          status: "present",
          isCorrected: false,
        });
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 8. EXAMINATIONS & CBCS MARKS
    // ─────────────────────────────────────────────────────────────────────────
    console.log("📊 Provisioning Examinations & Uploading CBCS Graded Marks...");

    // Exam 1: DBMS Internal Assessment 1 (Max 30)
    const examDBMSInternal = await Examination.create({
      name: "DBMS Internal Assessment 1",
      examType: "internal_test",
      subjectId: subBCA101._id,
      academicSessionId: session._id,
      semester: 1,
      maximumMarks: 30,
      passMarks: 12,
      weightage: 20,
      examDate: new Date("2024-11-08"),
      createdBy: meenaFaculty._id,
    });

    const dbmsInternalScores = {
      "BCA001": 26, // Ravi (86.7% - A+)
      "BCA002": 28, // Priya (93.3% - O)
      "BCA-2024-032": 24, // Jayanta (80% - A+)
      "BCA003": 10, // Amit (33.3% - F, Failed)
      "BCA004": 29, // Neha (96.7% - O)
    };

    for (const st of sem1Students) {
      const score = dbmsInternalScores[st.profile.rollNumber];
      await Marks.create({
        studentId: st.profile._id,
        examinationId: examDBMSInternal._id,
        subjectId: subBCA101._id,
        academicSessionId: session._id,
        obtainedMarks: score,
        isAbsent: false,
        remarks: score >= 25 ? "Outstanding conceptual clarity" : score < 12 ? "Remedial tutorial recommended" : "Satisfactory",
        enteredBy: meenaFaculty._id,
      });
    }

    // Exam 2: DBMS Mid-Term Examination (Max 70)
    const examDBMSMid = await Examination.create({
      name: "DBMS Mid-Term Examination",
      examType: "semester",
      subjectId: subBCA101._id,
      academicSessionId: session._id,
      semester: 1,
      maximumMarks: 70,
      passMarks: 28,
      weightage: 50,
      examDate: new Date("2024-11-12"),
      createdBy: meenaFaculty._id,
    });

    const dbmsMidScores = {
      "BCA001": 58, // Ravi (82.9% - A+)
      "BCA002": 66, // Priya (94.3% - O)
      "BCA-2024-032": 53, // Jayanta (75.7% - A)
      "BCA003": 23, // Amit (32.9% - F)
      "BCA004": 67, // Neha (95.7% - O)
    };

    for (const st of sem1Students) {
      const score = dbmsMidScores[st.profile.rollNumber];
      await Marks.create({
        studentId: st.profile._id,
        examinationId: examDBMSMid._id,
        subjectId: subBCA101._id,
        academicSessionId: session._id,
        obtainedMarks: score,
        isAbsent: false,
        remarks: "Mid-Term evaluation record",
        enteredBy: meenaFaculty._id,
      });
    }

    // Exam 3: Web Tech Lab Practical (Max 50)
    const examWebLab = await Examination.create({
      name: "Web Technologies Practical Exam",
      examType: "practical",
      subjectId: subBCA102._id,
      academicSessionId: session._id,
      semester: 1,
      maximumMarks: 50,
      passMarks: 20,
      weightage: 50,
      examDate: new Date("2024-11-10"),
      createdBy: meenaFaculty._id,
    });

    const webScores = {
      "BCA001": 44, // Ravi (88% - A+)
      "BCA002": 48, // Priya (96% - O)
      "BCA-2024-032": 42, // Jayanta (84% - A+)
      "BCA003": 18, // Amit (36% - F)
      "BCA004": 49, // Neha (98% - O)
    };

    for (const st of sem1Students) {
      const score = webScores[st.profile.rollNumber];
      await Marks.create({
        studentId: st.profile._id,
        examinationId: examWebLab._id,
        subjectId: subBCA102._id,
        academicSessionId: session._id,
        obtainedMarks: score,
        isAbsent: false,
        remarks: "Practical viva and code submission",
        enteredBy: meenaFaculty._id,
      });
    }

    // Exam 4: C Programming Quiz 1 (Max 20)
    const examCQuiz = await Examination.create({
      name: "C Programming Quiz 1",
      examType: "quiz",
      subjectId: subBCA103._id,
      academicSessionId: session._id,
      semester: 1,
      maximumMarks: 20,
      passMarks: 8,
      weightage: 10,
      examDate: new Date("2024-11-09"),
      createdBy: sudipFaculty._id,
    });

    const cScores = {
      "BCA001": 18, // Ravi (90% - O)
      "BCA002": 19, // Priya (95% - O)
      "BCA-2024-032": 16, // Jayanta (80% - A+)
      "BCA003": 7,  // Amit (35% - F)
      "BCA004": 20, // Neha (100% - O)
    };

    for (const st of sem1Students) {
      const score = cScores[st.profile.rollNumber];
      await Marks.create({
        studentId: st.profile._id,
        examinationId: examCQuiz._id,
        subjectId: subBCA103._id,
        academicSessionId: session._id,
        obtainedMarks: score,
        isAbsent: false,
        remarks: "Classroom quiz test",
        enteredBy: sudipFaculty._id,
      });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 9. REAL-TIME NOTIFICATIONS
    // ─────────────────────────────────────────────────────────────────────────
    console.log("🔔 Dispatching In-App Notifications...");

    // Notification for Amit (Shortage Alert)
    const amitUser = sem1Students.find((s) => s.profile.rollNumber === "BCA003").user;
    await Notification.create({
      recipientId: amitUser._id,
      title: "Attendance Shortage Alert: BCA-101",
      message: "Your attendance in Database Management Systems is 45.0%, which is critically below the mandatory 75% threshold. Please review the Predictive Recovery Simulator to avoid detention.",
      type: "attendance_shortage",
      relatedEntity: { kind: "Subject", item: subBCA101._id },
    });

    // Notification for Ravi (Marks Published)
    const raviUser = sem1Students.find((s) => s.profile.rollNumber === "BCA001").user;
    await Notification.create({
      recipientId: raviUser._id,
      title: "Mid-Term Examination Results Published",
      message: "Grades for 'DBMS Mid-Term Examination' have been verified and published. Your score: 58/70 (Grade A+).",
      type: "marks_uploaded",
      relatedEntity: { kind: "Examination", item: examDBMSMid._id },
    });

    // General Announcements for all users
    for (const st of sem1Students) {
      await Notification.create({
        recipientId: st.user._id,
        title: "DigiCampus Course Registration Open",
        message: "The course enrollment window for Academic Session 2024-2025 is currently open. You may review and manage your registered courses under Course Registration.",
        type: "general",
        relatedEntity: { kind: "AcademicSession", item: session._id },
      });
    }

    console.log("\n========================================================");
    console.log("✅ DATABASE RESET & FRESH SEEDING COMPLETED SUCCESSFULLY");
    console.log("========================================================");
    console.log("🔑 DEMO LOGIN CREDENTIALS:");
    console.log("--------------------------------------------------------");
    console.log("1. System Administrator:");
    console.log("   Email:    admin@college.com");
    console.log("   Password: Admin@1234");
    console.log("--------------------------------------------------------");
    console.log("2. Faculty (Instructor - Prof. Meena Joshi):");
    console.log("   Email:    meena.joshi@faculty.college.com");
    console.log("   Password: Faculty@1234");
    console.log("   Subjects: BCA-101 (DBMS), BCA-102 (Web Lab), BCA-501 (Cloud)");
    console.log("--------------------------------------------------------");
    console.log("3. Faculty (Instructor - Mr. Sudip Chatterjee):");
    console.log("   Email:    sudip@college.edu.in");
    console.log("   Password: Faculty@1234");
    console.log("   Subjects: BCA-103 (C), BCA-105 (Math), BCA-503 (Mobile)");
    console.log("--------------------------------------------------------");
    console.log("4. HOD (Dr. Rajesh Gupta):");
    console.log("   Email:    rajesh.gupta@faculty.college.com");
    console.log("   Password: Faculty@1234");
    console.log("--------------------------------------------------------");
    console.log("5. Student (Ravi Sharma - Normal & Healthy):");
    console.log("   Email:    ravi.sharma@student.college.com");
    console.log("   Password: Student@1234");
    console.log("   Roll:     BCA001 (Semester 1)");
    console.log("--------------------------------------------------------");
    console.log("6. Student (Priya Patel - High Achiever):");
    console.log("   Email:    priya.patel@student.college.com");
    console.log("   Password: Student@1234");
    console.log("   Roll:     BCA002 (Semester 1)");
    console.log("--------------------------------------------------------");
    console.log("7. Student (Jayanta Kumar):");
    console.log("   Email:    jayanta@college.edu.in");
    console.log("   Password: Student@1234");
    console.log("   Roll:     BCA-2024-032 (Semester 1)");
    console.log("--------------------------------------------------------");
    console.log("8. Student (Amit Verma - Critical Attendance Shortage):");
    console.log("   Email:    amit.verma@student.college.com");
    console.log("   Password: Student@1234");
    console.log("   Roll:     BCA003 (Semester 1 - Tests Shortage / Recovery)");
    console.log("--------------------------------------------------------");
    console.log("9. Student (Arjun Singh - Semester 5 Elective Enrollment):");
    console.log("   Email:    arjun.singh@student.college.com");
    console.log("   Password: Student@1234");
    console.log("   Roll:     BCA050 (Semester 5)");
    console.log("========================================================\n");
  } catch (error) {
    console.error("❌ Database seeding failed:", error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

seed();
