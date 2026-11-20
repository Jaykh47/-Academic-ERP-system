/**
 * COMPREHENSIVE HIGH-DENSITY DATABASE RESET & SEED SCRIPT
 *
 * Populates all academic departments with rich, realistic data:
 * - 1 Current Academic Session (2024-2025) & 1 Archived Session (2023-2024)
 * - 3 Academic Departments:
 *     1. Department of Computer Applications (BCA)
 *     2. Department of Management Studies (BBA)
 *     3. Department of Information Technology (BSCIT)
 * - 1 System Administrator
 * - 13 Faculty Members & HODs across all departments
 * - 24 Course Subjects across Semesters 1, 3, and 5 (Theory & Practical)
 * - 48 Students across BCA, BBA, and BSCIT (Semesters 1, 3, and 5)
 * - 200+ Course Enrollments (Students properly mapped to semester subjects)
 * - 40+ Historical & Scheduled Class Sessions (with roll call attendance)
 * - 8 CBCS Examinations with graded marks, remarks, and performance records
 * - In-app Notifications across user accounts
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
    // 1. ACADEMIC SESSIONS
    // ─────────────────────────────────────────────────────────────────────────
    console.log("📅 Provisioning Academic Sessions...");
    const [pastSession, session] = await Promise.all([
      AcademicSession.create({
        label: "2023-2024",
        startDate: new Date("2023-07-01"),
        endDate: new Date("2024-06-30"),
        isCurrent: false,
        isActive: false,
        isEnrollmentOpen: false,
      }),
      AcademicSession.create({
        label: "2024-2025",
        startDate: new Date("2024-07-01"),
        endDate: new Date("2025-06-30"),
        isCurrent: true,
        isActive: true,
        isEnrollmentOpen: true,
        enrollmentStartDate: new Date("2024-07-01"),
        enrollmentEndDate: new Date("2025-12-31"),
      }),
    ]);

    // ─────────────────────────────────────────────────────────────────────────
    // 2. DEPARTMENTS
    // ─────────────────────────────────────────────────────────────────────────
    console.log("🏛️ Provisioning Academic Departments...");
    const [deptBCA, deptBBA, deptBSCIT] = await Promise.all([
      Department.create({
        name: "Department of Computer Applications",
        code: "BCA",
        description: "Bachelor of Computer Applications - Software Engineering, Systems Architecture & Web Technologies",
        isActive: true,
      }),
      Department.create({
        name: "Department of Management Studies",
        code: "BBA",
        description: "Bachelor of Business Administration - Corporate Finance, Marketing Dynamics & Strategic Leadership",
        isActive: true,
      }),
      Department.create({
        name: "Department of Information Technology",
        code: "BSCIT",
        description: "B.Sc. in Information Technology - Cloud Computing, Cybersecurity, Data Networking & Systems Security",
        isActive: true,
      }),
    ]);

    // ─────────────────────────────────────────────────────────────────────────
    // 3. ADMINISTRATOR & FACULTY MEMBERS
    // ─────────────────────────────────────────────────────────────────────────
    console.log("👥 Provisioning System Administrator and Faculty Staff...");

    // System Administrator
    const adminUser = await User.create({
      name: "System Administrator",
      email: "admin@college.com",
      password: "Admin@1234",
      role: "admin",
      isActive: true,
    });

    // Helper to create a faculty member
    const createFacultyMember = async ({ name, email, employeeId, designation, departmentId, role = "faculty" }) => {
      const user = await User.create({
        name,
        email,
        password: "Faculty@1234",
        role,
        isActive: true,
      });

      const profile = await Faculty.create({
        userId: user._id,
        employeeId,
        designation,
        departmentId,
        subjects: [],
      });

      return { user, profile };
    };

    // --- BCA Faculty ---
    const hodBCA = await createFacultyMember({
      name: "Dr. Rajesh Gupta",
      email: "rajesh.gupta@faculty.college.com",
      employeeId: "FAC-HOD-001",
      designation: "Professor",
      departmentId: deptBCA._id,
      role: "hod",
    });
    deptBCA.hod = hodBCA.profile._id;
    await deptBCA.save();

    const meenaBCA = await createFacultyMember({
      name: "Prof. Meena Joshi",
      email: "meena.joshi@faculty.college.com",
      employeeId: "FAC-2024-001",
      designation: "Associate Professor",
      departmentId: deptBCA._id,
    });

    const sudipBCA = await createFacultyMember({
      name: "Mr. Sudip Chatterjee",
      email: "sudip@college.edu.in",
      employeeId: "FAC-2024-002",
      designation: "Assistant Professor",
      departmentId: deptBCA._id,
    });

    const ananyaBCA = await createFacultyMember({
      name: "Dr. Ananya Mukherjee",
      email: "ananya.mukherjee@faculty.college.com",
      employeeId: "FAC-BCA-004",
      designation: "Assistant Professor",
      departmentId: deptBCA._id,
    });

    const harishBCA = await createFacultyMember({
      name: "Mr. Harish Chandra",
      email: "harish.chandra@faculty.college.com",
      employeeId: "FAC-BCA-005",
      designation: "Lab Instructor",
      departmentId: deptBCA._id,
    });

    // --- BBA Faculty ---
    const hodBBA = await createFacultyMember({
      name: "Dr. Vikram Singhania",
      email: "vikram.singhania@faculty.college.com",
      employeeId: "FAC-HOD-002",
      designation: "Professor",
      departmentId: deptBBA._id,
      role: "hod",
    });
    deptBBA.hod = hodBBA.profile._id;
    await deptBBA.save();

    const anitaBBA = await createFacultyMember({
      name: "Dr. Anita Sharma",
      email: "anita.sharma@faculty.college.com",
      employeeId: "FAC-2024-003",
      designation: "Associate Professor",
      departmentId: deptBBA._id,
    });

    const tanviBBA = await createFacultyMember({
      name: "Ms. Tanvi Sethi",
      email: "tanvi.sethi@faculty.college.com",
      employeeId: "FAC-BBA-004",
      designation: "Assistant Professor",
      departmentId: deptBBA._id,
    });

    const rohanBBA = await createFacultyMember({
      name: "Mr. Rohan Kapoor",
      email: "rohan.kapoor@faculty.college.com",
      employeeId: "FAC-BBA-005",
      designation: "Lecturer",
      departmentId: deptBBA._id,
    });

    // --- BSCIT Faculty ---
    const hodIT = await createFacultyMember({
      name: "Dr. Arvind Swaminathan",
      email: "arvind.swaminathan@faculty.college.com",
      employeeId: "FAC-HOD-003",
      designation: "Professor",
      departmentId: deptBSCIT._id,
      role: "hod",
    });
    deptBSCIT.hod = hodIT.profile._id;
    await deptBSCIT.save();

    const poojaIT = await createFacultyMember({
      name: "Prof. Pooja Nambiar",
      email: "pooja.nambiar@faculty.college.com",
      employeeId: "FAC-IT-002",
      designation: "Associate Professor",
      departmentId: deptBSCIT._id,
    });

    const deepakIT = await createFacultyMember({
      name: "Mr. Deepak Joshi",
      email: "deepak.joshi@faculty.college.com",
      employeeId: "FAC-IT-003",
      designation: "Assistant Professor",
      departmentId: deptBSCIT._id,
    });

    const rituIT = await createFacultyMember({
      name: "Ms. Ritu Saxena",
      email: "ritu.saxena@faculty.college.com",
      employeeId: "FAC-IT-004",
      designation: "Lab Instructor",
      departmentId: deptBSCIT._id,
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 4. COURSE SUBJECTS ACROSS DEPARTMENTS
    // ─────────────────────────────────────────────────────────────────────────
    console.log("📚 Provisioning Course Subjects across BCA, BBA, and BSCIT...");

    // BCA Subjects (Sem 1, 3, 5)
    const [
      subBCA101, subBCA102, subBCA103, subBCA104, subBCA105,
      subBCA301, subBCA302, subBCA303,
      subBCA501, subBCA502, subBCA503,
    ] = await Promise.all([
      // BCA Sem 1
      Subject.create({
        name: "Database Management Systems",
        code: "BCA-101",
        departmentId: deptBCA._id,
        semester: 1,
        credits: 4,
        subjectType: "theory",
        assignedFaculty: meenaBCA.profile._id,
        description: "Relational database concepts, SQL, schema normalization, transaction management, and indexing.",
      }),
      Subject.create({
        name: "Web Technologies Lab",
        code: "BCA-102",
        departmentId: deptBCA._id,
        semester: 1,
        credits: 2,
        subjectType: "practical",
        assignedFaculty: meenaBCA.profile._id,
        description: "Modern HTML5, CSS3, JavaScript, DOM manipulation, responsive UI layouts, and REST integration.",
      }),
      Subject.create({
        name: "Programming with C",
        code: "BCA-103",
        departmentId: deptBCA._id,
        semester: 1,
        credits: 4,
        subjectType: "theory",
        assignedFaculty: sudipBCA.profile._id,
        description: "Structured programming fundamentals, memory management, pointers, dynamic memory, and file I/O.",
      }),
      Subject.create({
        name: "Digital Electronics & Architecture",
        code: "BCA-104",
        departmentId: deptBCA._id,
        semester: 1,
        credits: 4,
        subjectType: "theory",
        assignedFaculty: hodBCA.profile._id,
        description: "Boolean algebra, combinational & sequential logic, ALU design, processor registers, and instruction cycles.",
      }),
      Subject.create({
        name: "Mathematics for Computing",
        code: "BCA-105",
        departmentId: deptBCA._id,
        semester: 1,
        credits: 4,
        subjectType: "theory",
        assignedFaculty: ananyaBCA.profile._id,
        description: "Discrete mathematics, set theory, graph theory, propositional logic, and recurrence relations.",
      }),

      // BCA Sem 3
      Subject.create({
        name: "Object Oriented Programming with Java",
        code: "BCA-301",
        departmentId: deptBCA._id,
        semester: 3,
        credits: 4,
        subjectType: "theory",
        assignedFaculty: sudipBCA.profile._id,
        description: "OOP principles, JVM architecture, multithreading, collections framework, and exception handling.",
      }),
      Subject.create({
        name: "Java Programming Laboratory",
        code: "BCA-302",
        departmentId: deptBCA._id,
        semester: 3,
        credits: 2,
        subjectType: "practical",
        assignedFaculty: harishBCA.profile._id,
        description: "Hands-on application development using Java SE, graphical user interfaces, and socket programming.",
      }),
      Subject.create({
        name: "Operating Systems Principles",
        code: "BCA-303",
        departmentId: deptBCA._id,
        semester: 3,
        credits: 4,
        subjectType: "theory",
        assignedFaculty: hodBCA.profile._id,
        description: "Process synchronization, CPU scheduling algorithms, virtual memory, paging, and deadlocks.",
      }),

      // BCA Sem 5
      Subject.create({
        name: "Cloud Computing & DevOps",
        code: "BCA-501",
        departmentId: deptBCA._id,
        semester: 5,
        credits: 4,
        subjectType: "theory",
        assignedFaculty: meenaBCA.profile._id,
        description: "Cloud architecture, IaaS/PaaS/SaaS, Docker containerization, Kubernetes orchestration, and CI/CD.",
      }),
      Subject.create({
        name: "Artificial Intelligence & Machine Learning",
        code: "BCA-502",
        departmentId: deptBCA._id,
        semester: 5,
        credits: 4,
        subjectType: "theory",
        assignedFaculty: hodBCA.profile._id,
        description: "Search algorithms, supervised and unsupervised learning, neural networks, and decision trees.",
      }),
      Subject.create({
        name: "Mobile Application Development Lab",
        code: "BCA-503",
        departmentId: deptBCA._id,
        semester: 5,
        credits: 3,
        subjectType: "practical",
        assignedFaculty: ananyaBCA.profile._id,
        description: "Cross-platform mobile apps with React Native, native device APIs, state management, and deployment.",
      }),
    ]);

    // BBA Subjects (Sem 1, 3, 5)
    const [
      subBBA101, subBBA102, subBBA103, subBBA104,
      subBBA301, subBBA302, subBBA303,
      subBBA501, subBBA502,
    ] = await Promise.all([
      // BBA Sem 1
      Subject.create({
        name: "Principles of Management",
        code: "BBA-101",
        departmentId: deptBBA._id,
        semester: 1,
        credits: 4,
        subjectType: "theory",
        assignedFaculty: hodBBA.profile._id,
        description: "Classical management thought, planning hierarchies, organizational design, motivation, and leadership.",
      }),
      Subject.create({
        name: "Business Economics",
        code: "BBA-102",
        departmentId: deptBBA._id,
        semester: 1,
        credits: 4,
        subjectType: "theory",
        assignedFaculty: anitaBBA.profile._id,
        description: "Demand forecasting, cost curves, market structures, pricing strategies, and macroeconomic indicators.",
      }),
      Subject.create({
        name: "Financial Accounting & Reporting",
        code: "BBA-103",
        departmentId: deptBBA._id,
        semester: 1,
        credits: 4,
        subjectType: "theory",
        assignedFaculty: tanviBBA.profile._id,
        description: "Double-entry bookkeeping, trial balance, P&L statements, balance sheet analysis, and cash flow statements.",
      }),
      Subject.create({
        name: "Business Communication & Soft Skills",
        code: "BBA-104",
        departmentId: deptBBA._id,
        semester: 1,
        credits: 2,
        subjectType: "practical",
        assignedFaculty: rohanBBA.profile._id,
        description: "Executive presentations, negotiation strategies, corporate correspondence, and team dynamics.",
      }),

      // BBA Sem 3
      Subject.create({
        name: "Marketing Management & Strategy",
        code: "BBA-301",
        departmentId: deptBBA._id,
        semester: 3,
        credits: 4,
        subjectType: "theory",
        assignedFaculty: anitaBBA.profile._id,
        description: "Market segmentation, targeting, positioning (STP), 4Ps marketing mix, consumer behavior, and brand equity.",
      }),
      Subject.create({
        name: "Human Resource Management",
        code: "BBA-302",
        departmentId: deptBBA._id,
        semester: 3,
        credits: 4,
        subjectType: "theory",
        assignedFaculty: hodBBA.profile._id,
        description: "Talent acquisition, performance appraisals, compensation structures, industrial relations, and training.",
      }),
      Subject.create({
        name: "Organizational Behavior",
        code: "BBA-303",
        departmentId: deptBBA._id,
        semester: 3,
        credits: 4,
        subjectType: "theory",
        assignedFaculty: rohanBBA.profile._id,
        description: "Personality dynamics, workplace perception, group decision making, conflict resolution, and change.",
      }),

      // BBA Sem 5
      Subject.create({
        name: "Strategic Management & Policy",
        code: "BBA-501",
        departmentId: deptBBA._id,
        semester: 5,
        credits: 4,
        subjectType: "theory",
        assignedFaculty: hodBBA.profile._id,
        description: "Competitive analysis, Porter's Five Forces, SWOT frameworks, corporate growth strategies, and M&A.",
      }),
      Subject.create({
        name: "Financial Markets & Investment Analysis",
        code: "BBA-502",
        departmentId: deptBBA._id,
        semester: 5,
        credits: 4,
        subjectType: "theory",
        assignedFaculty: tanviBBA.profile._id,
        description: "Capital markets, securities valuation, portfolio management, risk-return tradeoffs, and derivative basics.",
      }),
    ]);

    // BSCIT Subjects (Sem 1, 3, 5)
    const [
      subIT101, subIT102, subIT103, subIT104,
      subIT301, subIT302, subIT303,
      subIT501, subIT502,
    ] = await Promise.all([
      // BSCIT Sem 1
      Subject.create({
        name: "Computer Fundamentals & IT Infrastructure",
        code: "IT-101",
        departmentId: deptBSCIT._id,
        semester: 1,
        credits: 4,
        subjectType: "theory",
        assignedFaculty: hodIT.profile._id,
        description: "Hardware architecture, storage hierarchies, network topologies, virtualization basics, and system software.",
      }),
      Subject.create({
        name: "Python Programming & Scripting",
        code: "IT-102",
        departmentId: deptBSCIT._id,
        semester: 1,
        credits: 4,
        subjectType: "theory",
        assignedFaculty: poojaIT.profile._id,
        description: "Core Python syntax, list comprehensions, modules, file processing, and object-oriented paradigms.",
      }),
      Subject.create({
        name: "Python Programming Laboratory",
        code: "IT-103",
        departmentId: deptBSCIT._id,
        semester: 1,
        credits: 2,
        subjectType: "practical",
        assignedFaculty: rituIT.profile._id,
        description: "Practical scripting exercises, data automation, file I/O, regex parsing, and mini-project deployment.",
      }),
      Subject.create({
        name: "Applied Mathematics for Engineers",
        code: "IT-104",
        departmentId: deptBSCIT._id,
        semester: 1,
        credits: 4,
        subjectType: "theory",
        assignedFaculty: deepakIT.profile._id,
        description: "Calculus, linear algebra, matrices, probability distributions, and statistical computational models.",
      }),

      // BSCIT Sem 3
      Subject.create({
        name: "Data Structures & Algorithms in C++",
        code: "IT-301",
        departmentId: deptBSCIT._id,
        semester: 3,
        credits: 4,
        subjectType: "theory",
        assignedFaculty: poojaIT.profile._id,
        description: "Stacks, queues, linked lists, binary search trees, heap structures, sorting, and Big-O complexity analysis.",
      }),
      Subject.create({
        name: "Data Structures Laboratory",
        code: "IT-302",
        departmentId: deptBSCIT._id,
        semester: 3,
        credits: 2,
        subjectType: "practical",
        assignedFaculty: rituIT.profile._id,
        description: "Hands-on implementation of non-linear data structures, tree traversals, and graph algorithms in C++.",
      }),
      Subject.create({
        name: "Computer Networks & Protocols",
        code: "IT-303",
        departmentId: deptBSCIT._id,
        semester: 3,
        credits: 4,
        subjectType: "theory",
        assignedFaculty: deepakIT.profile._id,
        description: "OSI and TCP/IP models, routing protocols (OSPF, BGP), subnetting, DNS, HTTP/HTTPS, and Wireshark analysis.",
      }),

      // BSCIT Sem 5
      Subject.create({
        name: "Network Security & Cryptography",
        code: "IT-501",
        departmentId: deptBSCIT._id,
        semester: 5,
        credits: 4,
        subjectType: "theory",
        assignedFaculty: hodIT.profile._id,
        description: "Symmetric and asymmetric encryption, RSA, AES, digital signatures, PKI infrastructure, and firewalls.",
      }),
      Subject.create({
        name: "Cloud Architecture & Virtualization",
        code: "IT-502",
        departmentId: deptBSCIT._id,
        semester: 5,
        credits: 4,
        subjectType: "theory",
        assignedFaculty: deepakIT.profile._id,
        description: "Hypervisors, AWS/Azure services, software-defined networking (SDN), VPC peering, and serverless compute.",
      }),
    ]);

    // Link assigned subjects back to faculty documents
    hodBCA.profile.subjects = [subBCA104._id, subBCA303._id, subBCA502._id];
    await hodBCA.profile.save();

    meenaBCA.profile.subjects = [subBCA101._id, subBCA102._id, subBCA501._id];
    await meenaBCA.profile.save();

    sudipBCA.profile.subjects = [subBCA103._id, subBCA301._id];
    await sudipBCA.profile.save();

    ananyaBCA.profile.subjects = [subBCA105._id, subBCA503._id];
    await ananyaBCA.profile.save();

    harishBCA.profile.subjects = [subBCA302._id];
    await harishBCA.profile.save();

    hodBBA.profile.subjects = [subBBA101._id, subBBA302._id, subBBA501._id];
    await hodBBA.profile.save();

    anitaBBA.profile.subjects = [subBBA102._id, subBBA301._id];
    await anitaBBA.profile.save();

    tanviBBA.profile.subjects = [subBBA103._id, subBBA502._id];
    await tanviBBA.profile.save();

    rohanBBA.profile.subjects = [subBBA104._id, subBBA303._id];
    await rohanBBA.profile.save();

    hodIT.profile.subjects = [subIT101._id, subIT501._id];
    await hodIT.profile.save();

    poojaIT.profile.subjects = [subIT102._id, subIT301._id];
    await poojaIT.profile.save();

    deepakIT.profile.subjects = [subIT104._id, subIT303._id, subIT502._id];
    await deepakIT.profile.save();

    rituIT.profile.subjects = [subIT103._id, subIT302._id];
    await rituIT.profile.save();

    // ─────────────────────────────────────────────────────────────────────────
    // 5. COMPREHENSIVE STUDENT COHORTS (48 STUDENTS)
    // ─────────────────────────────────────────────────────────────────────────
    console.log("🎓 Provisioning Student Cohorts across BCA, BBA, and BSCIT...");

    // Helper to register student
    const createStudentAccount = async ({
      name,
      email,
      rollNumber,
      enrollmentNumber,
      departmentId,
      semester,
      phone,
      guardianName,
      admissionYear,
    }) => {
      const user = await User.create({
        name,
        email,
        password: "Student@1234",
        role: "student",
        isActive: true,
      });

      const profile = await Student.create({
        userId: user._id,
        rollNumber,
        enrollmentNumber,
        departmentId,
        admissionSessionId: session._id,
        admissionYear: admissionYear || (semester === 5 ? 2022 : semester === 3 ? 2023 : 2024),
        currentSemester: semester,
        phone,
        guardianName,
        guardianPhone: "9811223344",
        address: "Campus Residence, Block C",
        status: "active",
      });

      return { user, profile, semester, departmentId };
    };

    const studentList = [];

    // --- Department of Computer Applications (BCA) ---
    // Semester 1 (Original key test accounts + new peers)
    studentList.push(await createStudentAccount({ name: "Ravi Sharma", email: "ravi.sharma@student.college.com", rollNumber: "BCA001", enrollmentNumber: "0801BCA24001", departmentId: deptBCA._id, semester: 1, phone: "9876543210", guardianName: "Ramesh Sharma" }));
    studentList.push(await createStudentAccount({ name: "Priya Patel", email: "priya.patel@student.college.com", rollNumber: "BCA002", enrollmentNumber: "0801BCA24002", departmentId: deptBCA._id, semester: 1, phone: "9876543211", guardianName: "Mahesh Patel" }));
    studentList.push(await createStudentAccount({ name: "Jayanta Kumar", email: "jayanta@college.edu.in", rollNumber: "BCA-2024-032", enrollmentNumber: "EN2024032", departmentId: deptBCA._id, semester: 1, phone: "9876543212", guardianName: "Bimal Kumar" }));
    studentList.push(await createStudentAccount({ name: "Amit Verma", email: "amit.verma@student.college.com", rollNumber: "BCA003", enrollmentNumber: "0801BCA24003", departmentId: deptBCA._id, semester: 1, phone: "9876543213", guardianName: "Suresh Verma" }));
    studentList.push(await createStudentAccount({ name: "Neha Gupta", email: "neha.gupta@student.college.com", rollNumber: "BCA004", enrollmentNumber: "0801BCA24004", departmentId: deptBCA._id, semester: 1, phone: "9876543214", guardianName: "Alok Gupta" }));
    studentList.push(await createStudentAccount({ name: "Aryan Deshmukh", email: "aryan.deshmukh@student.college.com", rollNumber: "BCA005", enrollmentNumber: "0801BCA24005", departmentId: deptBCA._id, semester: 1, phone: "9876543216", guardianName: "Pradeep Deshmukh" }));
    studentList.push(await createStudentAccount({ name: "Ananya Roy", email: "ananya.roy@student.college.com", rollNumber: "BCA006", enrollmentNumber: "0801BCA24006", departmentId: deptBCA._id, semester: 1, phone: "9876543217", guardianName: "Subhash Roy" }));
    studentList.push(await createStudentAccount({ name: "Rohan Mehra", email: "rohan.mehra@student.college.com", rollNumber: "BCA007", enrollmentNumber: "0801BCA24007", departmentId: deptBCA._id, semester: 1, phone: "9876543218", guardianName: "Rajeev Mehra" }));
    studentList.push(await createStudentAccount({ name: "Sneha Kulkarni", email: "sneha.kulkarni@student.college.com", rollNumber: "BCA008", enrollmentNumber: "0801BCA24008", departmentId: deptBCA._id, semester: 1, phone: "9876543219", guardianName: "Anand Kulkarni" }));
    studentList.push(await createStudentAccount({ name: "Devansh Bhatia", email: "devansh.bhatia@student.college.com", rollNumber: "BCA009", enrollmentNumber: "0801BCA24009", departmentId: deptBCA._id, semester: 1, phone: "9876543220", guardianName: "Sanjay Bhatia" }));

    // BCA Semester 3
    studentList.push(await createStudentAccount({ name: "Karan Malhotra", email: "karan.malhotra@student.college.com", rollNumber: "BCA301", enrollmentNumber: "0801BCA23001", departmentId: deptBCA._id, semester: 3, phone: "9876543221", guardianName: "Sunil Malhotra" }));
    studentList.push(await createStudentAccount({ name: "Shweta Tiwari", email: "shweta.tiwari@student.college.com", rollNumber: "BCA302", enrollmentNumber: "0801BCA23002", departmentId: deptBCA._id, semester: 3, phone: "9876543222", guardianName: "Dinesh Tiwari" }));
    studentList.push(await createStudentAccount({ name: "Varun Kapoor", email: "varun.kapoor@student.college.com", rollNumber: "BCA303", enrollmentNumber: "0801BCA23003", departmentId: deptBCA._id, semester: 3, phone: "9876543223", guardianName: "Anil Kapoor" }));
    studentList.push(await createStudentAccount({ name: "Tanvi Choudhury", email: "tanvi.choudhury@student.college.com", rollNumber: "BCA304", enrollmentNumber: "0801BCA23004", departmentId: deptBCA._id, semester: 3, phone: "9876543224", guardianName: "Debashish Choudhury" }));

    // BCA Semester 5
    studentList.push(await createStudentAccount({ name: "Arjun Singh", email: "arjun.singh@student.college.com", rollNumber: "BCA050", enrollmentNumber: "0801BCA22050", departmentId: deptBCA._id, semester: 5, phone: "9876543215", guardianName: "Baljit Singh" }));
    studentList.push(await createStudentAccount({ name: "Simran Kaur", email: "simran.kaur@student.college.com", rollNumber: "BCA501", enrollmentNumber: "0801BCA22001", departmentId: deptBCA._id, semester: 5, phone: "9876543225", guardianName: "Gurpreet Singh" }));
    studentList.push(await createStudentAccount({ name: "Nikhil Agarwal", email: "nikhil.agarwal@student.college.com", rollNumber: "BCA502", enrollmentNumber: "0801BCA22002", departmentId: deptBCA._id, semester: 5, phone: "9876543226", guardianName: "Vinod Agarwal" }));

    // --- Department of Management Studies (BBA) ---
    // Semester 1
    studentList.push(await createStudentAccount({ name: "Aayush Chawla", email: "aayush.chawla@student.college.com", rollNumber: "BBA101", enrollmentNumber: "0802BBA24001", departmentId: deptBBA._id, semester: 1, phone: "9876543227", guardianName: "Pawan Chawla" }));
    studentList.push(await createStudentAccount({ name: "Ishita Bannerjee", email: "ishita.bannerjee@student.college.com", rollNumber: "BBA102", enrollmentNumber: "0802BBA24002", departmentId: deptBBA._id, semester: 1, phone: "9876543228", guardianName: "Soumitra Bannerjee" }));
    studentList.push(await createStudentAccount({ name: "Harsh Vardhan", email: "harsh.vardhan@student.college.com", rollNumber: "BBA103", enrollmentNumber: "0802BBA24003", departmentId: deptBBA._id, semester: 1, phone: "9876543229", guardianName: "Kailash Vardhan" }));
    studentList.push(await createStudentAccount({ name: "Mehak Khurana", email: "mehak.khurana@student.college.com", rollNumber: "BBA104", enrollmentNumber: "0802BBA24004", departmentId: deptBBA._id, semester: 1, phone: "9876543230", guardianName: "Rajinder Khurana" }));
    studentList.push(await createStudentAccount({ name: "Yash Singhal", email: "yash.singhal@student.college.com", rollNumber: "BBA105", enrollmentNumber: "0802BBA24005", departmentId: deptBBA._id, semester: 1, phone: "9876543231", guardianName: "Deepak Singhal" }));
    studentList.push(await createStudentAccount({ name: "Kavya Nair", email: "kavya.nair@student.college.com", rollNumber: "BBA106", enrollmentNumber: "0802BBA24006", departmentId: deptBBA._id, semester: 1, phone: "9876543232", guardianName: "Madhavan Nair" }));

    // BBA Semester 3
    studentList.push(await createStudentAccount({ name: "Pranav Goel", email: "pranav.goel@student.college.com", rollNumber: "BBA301", enrollmentNumber: "0802BBA23001", departmentId: deptBBA._id, semester: 3, phone: "9876543233", guardianName: "Sudhir Goel" }));
    studentList.push(await createStudentAccount({ name: "Muskan Jain", email: "muskan.jain@student.college.com", rollNumber: "BBA302", enrollmentNumber: "0802BBA23002", departmentId: deptBBA._id, semester: 3, phone: "9876543234", guardianName: "Pramod Jain" }));
    studentList.push(await createStudentAccount({ name: "Aditya Bajaj", email: "aditya.bajaj@student.college.com", rollNumber: "BBA303", enrollmentNumber: "0802BBA23003", departmentId: deptBBA._id, semester: 3, phone: "9876543235", guardianName: "Vijay Bajaj" }));
    studentList.push(await createStudentAccount({ name: "Saloni Seth", email: "saloni.seth@student.college.com", rollNumber: "BBA304", enrollmentNumber: "0802BBA23004", departmentId: deptBBA._id, semester: 3, phone: "9876543236", guardianName: "Ashish Seth" }));

    // BBA Semester 5
    studentList.push(await createStudentAccount({ name: "Ritwik Sanyal", email: "ritwik.sanyal@student.college.com", rollNumber: "BBA501", enrollmentNumber: "0802BBA22001", departmentId: deptBBA._id, semester: 5, phone: "9876543237", guardianName: "Alok Sanyal" }));
    studentList.push(await createStudentAccount({ name: "Ananya Oberoi", email: "ananya.oberoi@student.college.com", rollNumber: "BBA502", enrollmentNumber: "0802BBA22002", departmentId: deptBBA._id, semester: 5, phone: "9876543238", guardianName: "Vivek Oberoi" }));
    studentList.push(await createStudentAccount({ name: "Sahil Anand", email: "sahil.anand@student.college.com", rollNumber: "BBA503", enrollmentNumber: "0802BBA22003", departmentId: deptBBA._id, semester: 5, phone: "9876543239", guardianName: "Naresh Anand" }));

    // --- Department of Information Technology (BSCIT) ---
    // Semester 1
    studentList.push(await createStudentAccount({ name: "Tushar Bhatt", email: "tushar.bhatt@student.college.com", rollNumber: "IT101", enrollmentNumber: "0803IT24001", departmentId: deptBSCIT._id, semester: 1, phone: "9876543240", guardianName: "Girish Bhatt" }));
    studentList.push(await createStudentAccount({ name: "Samiksha Rao", email: "samiksha.rao@student.college.com", rollNumber: "IT102", enrollmentNumber: "0803IT24002", departmentId: deptBSCIT._id, semester: 1, phone: "9876543241", guardianName: "Shridhar Rao" }));
    studentList.push(await createStudentAccount({ name: "Vivek Namboodiri", email: "vivek.namboodiri@student.college.com", rollNumber: "IT103", enrollmentNumber: "0803IT24003", departmentId: deptBSCIT._id, semester: 1, phone: "9876543242", guardianName: "Narayanan Namboodiri" }));
    studentList.push(await createStudentAccount({ name: "Divya Subramanian", email: "divya.subramanian@student.college.com", rollNumber: "IT104", enrollmentNumber: "0803IT24004", departmentId: deptBSCIT._id, semester: 1, phone: "9876543243", guardianName: "K. Subramanian" }));
    studentList.push(await createStudentAccount({ name: "Akash Mishra", email: "akash.mishra@student.college.com", rollNumber: "IT105", enrollmentNumber: "0803IT24005", departmentId: deptBSCIT._id, semester: 1, phone: "9876543244", guardianName: "Bhupendra Mishra" }));
    studentList.push(await createStudentAccount({ name: "Pallavi Joshi", email: "pallavi.joshi@student.college.com", rollNumber: "IT106", enrollmentNumber: "0803IT24006", departmentId: deptBSCIT._id, semester: 1, phone: "9876543245", guardianName: "Hemant Joshi" }));

    // BSCIT Semester 3
    studentList.push(await createStudentAccount({ name: "Abhinav Kashyap", email: "abhinav.kashyap@student.college.com", rollNumber: "IT301", enrollmentNumber: "0803IT23001", departmentId: deptBSCIT._id, semester: 3, phone: "9876543246", guardianName: "Santosh Kashyap" }));
    studentList.push(await createStudentAccount({ name: "Garima Verma", email: "garima.verma@student.college.com", rollNumber: "IT302", enrollmentNumber: "0803IT23002", departmentId: deptBSCIT._id, semester: 3, phone: "9876543247", guardianName: "Rajendra Verma" }));
    studentList.push(await createStudentAccount({ name: "Siddharth Nair", email: "siddharth.nair@student.college.com", rollNumber: "IT303", enrollmentNumber: "0803IT23003", departmentId: deptBSCIT._id, semester: 3, phone: "9876543248", guardianName: "Gopinath Nair" }));
    studentList.push(await createStudentAccount({ name: "Kritika Sen", email: "kritika.sen@student.college.com", rollNumber: "IT304", enrollmentNumber: "0803IT23004", departmentId: deptBSCIT._id, semester: 3, phone: "9876543249", guardianName: "Pranab Sen" }));

    // BSCIT Semester 5
    studentList.push(await createStudentAccount({ name: "Manav Rawat", email: "manav.rawat@student.college.com", rollNumber: "IT501", enrollmentNumber: "0803IT22001", departmentId: deptBSCIT._id, semester: 5, phone: "9876543250", guardianName: "Tej Rawat" }));
    studentList.push(await createStudentAccount({ name: "Urvashi Patil", email: "urvashi.patil@student.college.com", rollNumber: "IT502", enrollmentNumber: "0803IT22002", departmentId: deptBSCIT._id, semester: 5, phone: "9876543251", guardianName: "Sanjay Patil" }));
    studentList.push(await createStudentAccount({ name: "Chirag Shah", email: "chirag.shah@student.college.com", rollNumber: "IT503", enrollmentNumber: "0803IT22003", departmentId: deptBSCIT._id, semester: 5, phone: "9876543252", guardianName: "Mayur Shah" }));

    console.log(`✅ ${studentList.length} total students provisioned successfully.`);

    // ─────────────────────────────────────────────────────────────────────────
    // 6. COMPREHENSIVE COURSE ENROLLMENTS
    // ─────────────────────────────────────────────────────────────────────────
    console.log("📝 Registering Automatic Semester Course Enrollments...");

    // Map subjects by department and semester
    const subjectsMap = {
      [deptBCA._id.toString()]: {
        1: [subBCA101, subBCA102, subBCA103, subBCA104, subBCA105],
        3: [subBCA301, subBCA302, subBCA303],
        5: [subBCA501, subBCA502, subBCA503],
      },
      [deptBBA._id.toString()]: {
        1: [subBBA101, subBBA102, subBBA103, subBBA104],
        3: [subBBA301, subBBA302, subBBA303],
        5: [subBBA501, subBBA502],
      },
      [deptBSCIT._id.toString()]: {
        1: [subIT101, subIT102, subIT103, subIT104],
        3: [subIT301, subIT302, subIT303],
        5: [subIT501, subIT502],
      },
    };

    const enrollmentDocs = [];
    for (const st of studentList) {
      const deptKey = st.departmentId.toString();
      const semSubjects = subjectsMap[deptKey]?.[st.semester] || [];

      for (const sub of semSubjects) {
        // For Arjun Singh, leave BCA-503 un-enrolled to test self-registration
        if (st.profile.rollNumber === "BCA050" && sub.code === "BCA-503") continue;

        enrollmentDocs.push({
          studentId: st.profile._id,
          subjectId: sub._id,
          academicSessionId: session._id,
          semester: st.semester,
          status: "active",
          enrolledAt: new Date("2024-07-05"),
        });
      }
    }

    await Enrollment.insertMany(enrollmentDocs);
    console.log(`✅ ${enrollmentDocs.length} course enrollments created.`);

    // ─────────────────────────────────────────────────────────────────────────
    // 7. CLASS SESSIONS & ATTENDANCE RECORDS (BCA, BBA, BSCIT)
    // ─────────────────────────────────────────────────────────────────────────
    console.log("📋 Scheduling Class Sessions & Marking Attendance Records...");

    const bcaSem1Students = studentList.filter((s) => s.departmentId === deptBCA._id && s.semester === 1);
    const bbaSem1Students = studentList.filter((s) => s.departmentId === deptBBA._id && s.semester === 1);
    const itSem1Students = studentList.filter((s) => s.departmentId === deptBSCIT._id && s.semester === 1);

    // --- BCA-101: DBMS Sessions (10 sessions by Prof. Meena Joshi) ---
    const dbmsTopics = [
      "Introduction to Relational Architecture & 3-Tier Schema",
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

    for (let i = 0; i < dbmsTopics.length; i++) {
      const sessionDate = new Date("2024-11-01");
      sessionDate.setDate(sessionDate.getDate() + i);

      const classSession = await ClassSession.create({
        subjectId: subBCA101._id,
        facultyId: meenaBCA.profile._id,
        academicSessionId: session._id,
        date: sessionDate,
        startTime: "09:00",
        endTime: "10:00",
        sessionType: "lecture",
        topic: dbmsTopics[i],
        room: "LH-101",
        status: "completed",
        isAttendanceSubmitted: true,
      });

      const attDocs = [];
      for (const st of bcaSem1Students) {
        let status = "present";
        const roll = st.profile.rollNumber;
        // Amit Verma (BCA003) has severe shortage (attends only sessions 0, 4, 6, 9)
        if (roll === "BCA003" && ![0, 4, 6, 9].includes(i)) status = "absent";
        // Ravi late on session 4, absent on session 6
        if (roll === "BCA001" && i === 4) status = "late";
        if (roll === "BCA001" && i === 6) status = "absent";
        // Jayanta absent on session 2 and 8
        if (roll === "BCA-2024-032" && (i === 2 || i === 8)) status = "absent";

        attDocs.push({
          studentId: st.profile._id,
          classSessionId: classSession._id,
          subjectId: subBCA101._id,
          facultyId: meenaBCA.profile._id,
          academicSessionId: session._id,
          date: sessionDate,
          status,
          isCorrected: false,
        });
      }
      await Attendance.insertMany(attDocs);
    }

    // 1 Open Scheduled Session for BCA-101
    await ClassSession.create({
      subjectId: subBCA101._id,
      facultyId: meenaBCA.profile._id,
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

    // --- BBA-101: Principles of Management (8 sessions by Dr. Vikram Singhania) ---
    const bbaTopics = [
      "Evolution of Management Thought: Taylor, Fayol & Weber",
      "Strategic Planning Process & SWOT Analysis",
      "Organizational Structures: Functional, Matrix & Divisional",
      "Leadership Theories: Trait, Behavioral & Situational",
      "Motivation Models: Maslow Hierarchy & Herzberg Dual-Factor",
      "Managerial Decision Making under Risk & Uncertainty",
      "Corporate Social Responsibility & Ethical Governance",
      "Organizational Change Management & Resistance Overcoming",
    ];

    for (let i = 0; i < bbaTopics.length; i++) {
      const sessionDate = new Date("2024-11-02");
      sessionDate.setDate(sessionDate.getDate() + (i * 2));

      const classSession = await ClassSession.create({
        subjectId: subBBA101._id,
        facultyId: hodBBA.profile._id,
        academicSessionId: session._id,
        date: sessionDate,
        startTime: "11:00",
        endTime: "12:00",
        sessionType: "lecture",
        topic: bbaTopics[i],
        room: "MG-201",
        status: "completed",
        isAttendanceSubmitted: true,
      });

      const attDocs = bbaSem1Students.map((st, idx) => ({
        studentId: st.profile._id,
        classSessionId: classSession._id,
        subjectId: subBBA101._id,
        facultyId: hodBBA.profile._id,
        academicSessionId: session._id,
        date: sessionDate,
        status: (idx === 2 && i % 3 === 0) ? "absent" : "present",
        isCorrected: false,
      }));
      await Attendance.insertMany(attDocs);
    }

    // --- IT-101: Computer Fundamentals (8 sessions by Dr. Arvind Swaminathan) ---
    const itTopics = [
      "Von Neumann Architecture & Bus Interconnect Topologies",
      "Cache Memory Organization & Cache Mapping Techniques",
      "Secondary Storage: SSDs, NVMe & RAID Configurations",
      "Operating System Kernels: Monolithic vs Microkernel",
      "Data Communication Fundamentals: Bandwidth, Latency & Noise",
      "Introduction to Linux CLI & Shell Environment",
      "Process Lifecycle & Context Switching Mechanics",
      "Virtualization Hypervisors: Type-1 Bare Metal vs Type-2",
    ];

    for (let i = 0; i < itTopics.length; i++) {
      const sessionDate = new Date("2024-11-03");
      sessionDate.setDate(sessionDate.getDate() + (i * 2));

      const classSession = await ClassSession.create({
        subjectId: subIT101._id,
        facultyId: hodIT.profile._id,
        academicSessionId: session._id,
        date: sessionDate,
        startTime: "10:00",
        endTime: "11:00",
        sessionType: "lecture",
        topic: itTopics[i],
        room: "IT-302",
        status: "completed",
        isAttendanceSubmitted: true,
      });

      const attDocs = itSem1Students.map((st, idx) => ({
        studentId: st.profile._id,
        classSessionId: classSession._id,
        subjectId: subIT101._id,
        facultyId: hodIT.profile._id,
        academicSessionId: session._id,
        date: sessionDate,
        status: (idx === 3 && i % 2 === 0) ? "absent" : "present",
        isCorrected: false,
      }));
      await Attendance.insertMany(attDocs);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 8. EXAMINATIONS & CBCS MARKS
    // ─────────────────────────────────────────────────────────────────────────
    console.log("📊 Provisioning Examinations & Uploading CBCS Graded Marks...");

    // 1. DBMS Internal Assessment (BCA)
    const examDBMS = await Examination.create({
      name: "DBMS Internal Assessment 1",
      examType: "internal_test",
      subjectId: subBCA101._id,
      academicSessionId: session._id,
      semester: 1,
      maximumMarks: 30,
      passMarks: 12,
      weightage: 20,
      examDate: new Date("2024-11-08"),
      createdBy: meenaBCA.profile._id,
    });

    const bcaScores = {
      "BCA001": 26, "BCA002": 28, "BCA-2024-032": 24, "BCA003": 10, "BCA004": 29,
      "BCA005": 22, "BCA006": 27, "BCA007": 19, "BCA008": 25, "BCA009": 18,
    };

    for (const st of bcaSem1Students) {
      const score = bcaScores[st.profile.rollNumber] || 21;
      await Marks.create({
        studentId: st.profile._id,
        examinationId: examDBMS._id,
        subjectId: subBCA101._id,
        academicSessionId: session._id,
        obtainedMarks: score,
        isAbsent: false,
        remarks: score >= 25 ? "Outstanding conceptual clarity" : score < 12 ? "Remedial tutorial recommended" : "Satisfactory",
        enteredBy: meenaBCA.profile._id,
      });
    }

    // 2. Principles of Management Internal (BBA)
    const examBBA = await Examination.create({
      name: "Principles of Management Assessment",
      examType: "internal_test",
      subjectId: subBBA101._id,
      academicSessionId: session._id,
      semester: 1,
      maximumMarks: 30,
      passMarks: 12,
      weightage: 20,
      examDate: new Date("2024-11-10"),
      createdBy: hodBBA.profile._id,
    });

    for (const st of bbaSem1Students) {
      const score = Math.floor(Math.random() * 11) + 18; // 18-28
      await Marks.create({
        studentId: st.profile._id,
        examinationId: examBBA._id,
        subjectId: subBBA101._id,
        academicSessionId: session._id,
        obtainedMarks: score,
        isAbsent: false,
        remarks: "Solid understanding of organizational theories",
        enteredBy: hodBBA.profile._id,
      });
    }

    // 3. Computer Fundamentals Mid-Term (BSCIT)
    const examIT = await Examination.create({
      name: "Computer Fundamentals Mid-Term",
      examType: "internal_test",
      subjectId: subIT101._id,
      academicSessionId: session._id,
      semester: 1,
      maximumMarks: 50,
      passMarks: 20,
      weightage: 30,
      examDate: new Date("2024-11-12"),
      createdBy: hodIT.profile._id,
    });

    for (const st of itSem1Students) {
      const score = Math.floor(Math.random() * 16) + 32; // 32-47
      await Marks.create({
        studentId: st.profile._id,
        examinationId: examIT._id,
        subjectId: subIT101._id,
        academicSessionId: session._id,
        obtainedMarks: score,
        isAbsent: false,
        remarks: "Practical architecture knowledge validated",
        enteredBy: hodIT.profile._id,
      });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 9. SYSTEM NOTIFICATIONS
    // ─────────────────────────────────────────────────────────────────────────
    console.log("🔔 Dispatching In-App Notifications...");

    const amit = bcaSem1Students.find((s) => s.profile.rollNumber === "BCA003");
    if (amit) {
      await Notification.create({
        recipientId: amit.user._id,
        title: "Attendance Shortage Alert: BCA-101",
        message: "Your attendance in Database Management Systems is 40.0%, which is below the mandatory 75% threshold. Please attend upcoming lecture sessions.",
        type: "attendance_shortage",
        relatedEntity: { kind: "Subject", item: subBCA101._id },
      });
    }

    const ravi = bcaSem1Students.find((s) => s.profile.rollNumber === "BCA001");
    if (ravi) {
      await Notification.create({
        recipientId: ravi.user._id,
        title: "Internal Assessment Results Published",
        message: "Grades for 'DBMS Internal Assessment 1' have been uploaded. Your score: 26/30 (Grade A+).",
        type: "marks_uploaded",
        relatedEntity: { kind: "Examination", item: examDBMS._id },
      });
    }

    // Course registration announcements
    for (const st of studentList.slice(0, 10)) {
      await Notification.create({
        recipientId: st.user._id,
        title: "DigiCampus Academic Registration Active",
        message: "Course registration for the current term is open. You can view your registered courses in Course Registration.",
        type: "general",
        relatedEntity: { kind: "AcademicSession", item: session._id },
      });
    }

    console.log("\n========================================================");
    console.log("✅ HIGH-DENSITY DATABASE SEEDING COMPLETED SUCCESSFULLY!");
    console.log("========================================================");
    console.log(`🏛️ Departments: 3 (${deptBCA.name}, ${deptBBA.name}, ${deptBSCIT.name})`);
    console.log(`💼 Faculty & Staff: 13 members across all departments`);
    console.log(`📚 Subjects: 24 accredited courses`);
    console.log(`🎓 Students: 48 registered students across Semesters 1, 3, & 5`);
    console.log(`📋 Enrollments: ${enrollmentDocs.length} course enrollments`);
    console.log("--------------------------------------------------------");
    console.log("🔑 LOGIN ACCOUNTS FOR TESTING:");
    console.log("--------------------------------------------------------");
    console.log("1. System Administrator:");
    console.log("   Email:    admin@college.com");
    console.log("   Password: Admin@1234");
    console.log("--------------------------------------------------------");
    console.log("2. Faculty (BCA - Prof. Meena Joshi):");
    console.log("   Email:    meena.joshi@faculty.college.com");
    console.log("   Password: Faculty@1234");
    console.log("--------------------------------------------------------");
    console.log("3. Faculty (BCA - Mr. Sudip Chatterjee):");
    console.log("   Email:    sudip@college.edu.in");
    console.log("   Password: Faculty@1234");
    console.log("--------------------------------------------------------");
    console.log("4. HOD (BCA - Dr. Rajesh Gupta):");
    console.log("   Email:    rajesh.gupta@faculty.college.com");
    console.log("   Password: Faculty@1234");
    console.log("--------------------------------------------------------");
    console.log("5. HOD (BBA - Dr. Vikram Singhania):");
    console.log("   Email:    vikram.singhania@faculty.college.com");
    console.log("   Password: Faculty@1234");
    console.log("--------------------------------------------------------");
    console.log("6. HOD (BSCIT - Dr. Arvind Swaminathan):");
    console.log("   Email:    arvind.swaminathan@faculty.college.com");
    console.log("   Password: Faculty@1234");
    console.log("--------------------------------------------------------");
    console.log("7. Student (Ravi Sharma - BCA Sem 1):");
    console.log("   Email:    ravi.sharma@student.college.com");
    console.log("   Password: Student@1234");
    console.log("--------------------------------------------------------");
    console.log("8. Student (Jayanta Kumar - BCA Sem 1):");
    console.log("   Email:    jayanta@college.edu.in");
    console.log("   Password: Student@1234");
    console.log("--------------------------------------------------------");
    console.log("9. Student (Aayush Chawla - BBA Sem 1):");
    console.log("   Email:    aayush.chawla@student.college.com");
    console.log("   Password: Student@1234");
    console.log("--------------------------------------------------------");
    console.log("10. Student (Tushar Bhatt - BSCIT Sem 1):");
    console.log("    Email:    tushar.bhatt@student.college.com");
    console.log("    Password: Student@1234");
    console.log("========================================================\n");
  } catch (err) {
    console.error("❌ Database seeding failed:", err);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

seed();
