import React, { useState, useEffect, useMemo } from "react";
import { adminApi } from "../../api/adminApi";
import { useToast } from "../../context/ToastContext";
import { formatApiError } from "../../utils/errorHelper";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { Badge } from "../../components/common/Badge";
import { Modal } from "../../components/common/Modal";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Shield,
  GraduationCap,
  Briefcase,
  ToggleLeft,
  ToggleRight,
  Building2,
  BookOpen,
  Calendar,
  Eye,
  Mail,
  Phone,
  MapPin,
  ChevronRight,
  UserCheck,
  UserX,
} from "lucide-react";

export const UserManagementPage = () => {
  const { success, error, warning } = useToast();

  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [students, setStudents] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [admins, setAdmins] = useState([]);

  // Selection Hierarchy:
  // 1. Department selection ('all', 'admin', or department._id)
  const [selectedDeptId, setSelectedDeptId] = useState("all");
  // 2. Section selection ('staff' or 'student' or 'admin')
  const [activeSection, setActiveSection] = useState("staff");

  // Search & Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [semesterFilter, setSemesterFilter] = useState("");

  // Modals
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isFacultyModalOpen, setIsFacultyModalOpen] = useState(false);
  const [selectedUserDetail, setSelectedUserDetail] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // New Student Form State
  const [studentForm, setStudentForm] = useState({
    name: "",
    email: "",
    password: "",
    rollNumber: "",
    enrollmentNumber: "",
    departmentId: "",
    admissionSessionId: "",
    admissionYear: new Date().getFullYear(),
    currentSemester: 1,
  });

  // New Faculty Form State
  const [facultyForm, setFacultyForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "faculty",
    employeeId: "",
    designation: "Assistant Professor",
    departmentId: "",
  });

  // Fetch all departments, sessions, students, faculty, and admins
  const loadDirectoryData = async () => {
    try {
      setLoading(true);
      const [deptRes, sessRes, studRes, facRes, userRes] = await Promise.allSettled([
        adminApi.getDepartments(),
        adminApi.getSessions(),
        adminApi.getStudents({ limit: 500 }),
        adminApi.getFaculty({ limit: 500 }),
        adminApi.getUsers({ role: "admin", limit: 100 }),
      ]);

      if (deptRes.status === "fulfilled") {
        const depts = deptRes.value?.data?.departments || [];
        setDepartments(depts);
        if (depts.length > 0) {
          setStudentForm((prev) => ({ ...prev, departmentId: depts[0]._id }));
          setFacultyForm((prev) => ({ ...prev, departmentId: depts[0]._id }));
        }
      }

      if (sessRes.status === "fulfilled") {
        const sessList = sessRes.value?.data?.sessions || [];
        setSessions(sessList);
        const curr = sessList.find((s) => s.isCurrent) || sessList[0];
        if (curr) {
          setStudentForm((prev) => ({ ...prev, admissionSessionId: curr._id }));
        }
      }

      if (studRes.status === "fulfilled") {
        setStudents(studRes.value?.data?.students || []);
      }

      if (facRes.status === "fulfilled") {
        setFaculty(facRes.value?.data?.faculty || []);
      }

      if (userRes.status === "fulfilled") {
        setAdmins(userRes.value?.data?.users || []);
      }
    } catch (err) {
      error(formatApiError(err, "Failed to load directory"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDirectoryData();
  }, []);

  // Compute departmental statistics
  const getDeptStats = (deptId) => {
    if (deptId === "all") {
      return {
        staff: faculty.length,
        students: students.length,
        admins: admins.length,
        total: faculty.length + students.length + admins.length,
      };
    }
    if (deptId === "admin") {
      return {
        staff: 0,
        students: 0,
        admins: admins.length,
        total: admins.length,
      };
    }
    const staffCount = faculty.filter((f) => f.departmentId?._id === deptId).length;
    const studentCount = students.filter((s) => s.departmentId?._id === deptId).length;
    return {
      staff: staffCount,
      students: studentCount,
      admins: 0,
      total: staffCount + studentCount,
    };
  };

  // Get active department metadata
  const activeDepartment = useMemo(() => {
    if (selectedDeptId === "all") return { name: "All Academic Departments", code: "ALL" };
    if (selectedDeptId === "admin") return { name: "System Administration & Security", code: "ADMIN" };
    return departments.find((d) => d._id === selectedDeptId) || null;
  }, [selectedDeptId, departments]);

  // Dynamic list based on Department + Section + Search + Filters
  const filteredRecords = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (activeSection === "staff") {
      return faculty.filter((f) => {
        if (selectedDeptId !== "all" && f.departmentId?._id !== selectedDeptId) {
          return false;
        }
        if (statusFilter === "active" && !f.userId?.isActive) return false;
        if (statusFilter === "inactive" && f.userId?.isActive) return false;
        if (q) {
          const name = (f.userId?.name || "").toLowerCase();
          const email = (f.userId?.email || "").toLowerCase();
          const empId = (f.employeeId || "").toLowerCase();
          const desig = (f.designation || "").toLowerCase();
          return name.includes(q) || email.includes(q) || empId.includes(q) || desig.includes(q);
        }
        return true;
      });
    }

    if (activeSection === "student") {
      return students.filter((s) => {
        if (selectedDeptId !== "all" && s.departmentId?._id !== selectedDeptId) {
          return false;
        }
        if (statusFilter === "active" && !s.userId?.isActive) return false;
        if (statusFilter === "inactive" && s.userId?.isActive) return false;
        if (semesterFilter && s.currentSemester !== parseInt(semesterFilter, 10)) {
          return false;
        }
        if (q) {
          const name = (s.userId?.name || "").toLowerCase();
          const email = (s.userId?.email || "").toLowerCase();
          const roll = (s.rollNumber || "").toLowerCase();
          const enroll = (s.enrollmentNumber || "").toLowerCase();
          return name.includes(q) || email.includes(q) || roll.includes(q) || enroll.includes(q);
        }
        return true;
      });
    }

    if (activeSection === "admin") {
      return admins.filter((a) => {
        if (statusFilter === "active" && !a.isActive) return false;
        if (statusFilter === "inactive" && a.isActive) return false;
        if (q) {
          const name = (a.name || "").toLowerCase();
          const email = (a.email || "").toLowerCase();
          return name.includes(q) || email.includes(q);
        }
        return true;
      });
    }

    return [];
  }, [faculty, students, admins, activeSection, selectedDeptId, search, statusFilter, semesterFilter]);

  // Toggle account status
  const handleToggleStatus = async (userId, e) => {
    if (e) e.stopPropagation();
    try {
      await adminApi.toggleUserStatus(userId);

      // Optimistically update all lists
      setStudents((prev) =>
        prev.map((s) =>
          s.userId?._id === userId
            ? { ...s, userId: { ...s.userId, isActive: !s.userId.isActive } }
            : s
        )
      );
      setFaculty((prev) =>
        prev.map((f) =>
          f.userId?._id === userId
            ? { ...f, userId: { ...f.userId, isActive: !f.userId.isActive } }
            : f
        )
      );
      setAdmins((prev) =>
        prev.map((a) => (a._id === userId ? { ...a, isActive: !a.isActive } : a))
      );

      // Update active detail modal if open
      if (selectedUserDetail) {
        const detailUserId = selectedUserDetail.userId?._id || selectedUserDetail._id;
        if (detailUserId === userId) {
          setSelectedUserDetail((prev) => {
            if (prev.userId) {
              return { ...prev, userId: { ...prev.userId, isActive: !prev.userId.isActive } };
            }
            return { ...prev, isActive: !prev.isActive };
          });
        }
      }

      success("Account authorization updated successfully!");
    } catch (err) {
      error(formatApiError(err, "Failed to update account status"));
    }
  };

  // Open modals pre-configured with active department
  const handleOpenStudentModal = () => {
    if (selectedDeptId !== "all" && selectedDeptId !== "admin") {
      setStudentForm((prev) => ({ ...prev, departmentId: selectedDeptId }));
    }
    setIsStudentModalOpen(true);
  };

  const handleOpenFacultyModal = () => {
    if (selectedDeptId !== "all" && selectedDeptId !== "admin") {
      setFacultyForm((prev) => ({ ...prev, departmentId: selectedDeptId }));
    }
    setIsFacultyModalOpen(true);
  };

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    if (!studentForm.departmentId) {
      warning("Please select a department.");
      return;
    }
    if (!studentForm.admissionSessionId) {
      warning("Please select an admission session.");
      return;
    }

    try {
      setSubmitting(true);
      await adminApi.createStudent({
        ...studentForm,
        admissionYear: parseInt(studentForm.admissionYear, 10),
        currentSemester: parseInt(studentForm.currentSemester, 10),
      });
      success("Student account created successfully!");
      setIsStudentModalOpen(false);
      setStudentForm({
        name: "",
        email: "",
        password: "",
        rollNumber: "",
        enrollmentNumber: "",
        departmentId: departments[0]?._id || "",
        admissionSessionId: sessions[0]?._id || "",
        admissionYear: new Date().getFullYear(),
        currentSemester: 1,
      });
      loadDirectoryData();
    } catch (err) {
      error(formatApiError(err, "Failed to create student"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateFaculty = async (e) => {
    e.preventDefault();
    if (!facultyForm.departmentId) {
      warning("Please select a department.");
      return;
    }

    try {
      setSubmitting(true);
      await adminApi.createFaculty(facultyForm);
      success("Faculty account created successfully!");
      setIsFacultyModalOpen(false);
      setFacultyForm({
        name: "",
        email: "",
        password: "",
        role: "faculty",
        employeeId: "",
        designation: "Assistant Professor",
        departmentId: departments[0]?._id || "",
      });
      loadDirectoryData();
    } catch (err) {
      error(formatApiError(err, "Failed to create faculty"));
    } finally {
      setSubmitting(false);
    }
  };

  // Switch department handler
  const handleSelectDepartment = (deptId) => {
    setSelectedDeptId(deptId);
    if (deptId === "admin") {
      setActiveSection("admin");
    } else if (activeSection === "admin") {
      setActiveSection("staff");
    }
  };

  const currentStats = getDeptStats(selectedDeptId);

  return (
    <div className="space-y-6">
      {/* ── Top Header & Provisioning Action Buttons ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-alice tracking-tight">
            User Directory & Access Control
          </h1>
          <p className="text-xs text-alice-muted mt-1">
            Organized departmental directory: navigate by department, toggle between staff and student sections, and manage login authorization.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            onClick={handleOpenStudentModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-downy text-charcoal font-bold text-xs uppercase tracking-wider hover:bg-downy-hover shadow-lg shadow-downy/20 transition-all cursor-pointer"
          >
            <GraduationCap className="w-4 h-4" />
            <span>Add Student</span>
          </button>

          <button
            onClick={handleOpenFacultyModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-melrose text-charcoal font-bold text-xs uppercase tracking-wider hover:bg-melrose-light shadow-lg shadow-melrose/20 transition-all cursor-pointer"
          >
            <Briefcase className="w-4 h-4" />
            <span>Add Faculty</span>
          </button>
        </div>
      </div>

      {/* ── LEVEL 1: DEPARTMENTS SELECTOR ── */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-alice-muted flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-downy" />
            Select Academic Department
          </span>
          <span className="text-[11px] text-alice-dim">
            {departments.length} Academic Departments Configured
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* All Departments Option */}
          {(() => {
            const allStats = getDeptStats("all");
            const isSelected = selectedDeptId === "all";
            return (
              <button
                type="button"
                onClick={() => handleSelectDepartment("all")}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                  isSelected
                    ? "bg-downy/15 border-downy shadow-lg shadow-downy/10"
                    : "bg-charcoal-card border-charcoal-border hover:border-downy/40 hover:bg-charcoal-elevated"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`p-2 rounded-xl ${
                        isSelected ? "bg-downy text-charcoal font-bold" : "bg-charcoal-elevated text-downy"
                      }`}
                    >
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-charcoal text-alice-muted border border-charcoal-border">
                        ALL
                      </span>
                      <h4 className="text-sm font-bold text-alice mt-0.5">All Departments</h4>
                    </div>
                  </div>
                  {isSelected && <span className="w-2 h-2 rounded-full bg-downy animate-pulse" />}
                </div>

                <div className="pt-2 border-t border-charcoal-border/50 flex items-center justify-between text-xs text-alice-muted">
                  <span>{allStats.staff} Staff</span>
                  <span>•</span>
                  <span>{allStats.students} Students</span>
                </div>
              </button>
            );
          })()}

          {/* Department Cards */}
          {departments.map((d) => {
            const stats = getDeptStats(d._id);
            const isSelected = selectedDeptId === d._id;
            return (
              <button
                key={d._id}
                type="button"
                onClick={() => handleSelectDepartment(d._id)}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                  isSelected
                    ? "bg-downy/15 border-downy shadow-lg shadow-downy/10"
                    : "bg-charcoal-card border-charcoal-border hover:border-downy/40 hover:bg-charcoal-elevated"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`p-2 rounded-xl ${
                        isSelected ? "bg-downy text-charcoal font-bold" : "bg-charcoal-elevated text-melrose"
                      }`}
                    >
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-charcoal text-downy border border-downy/20 font-bold">
                        {d.code}
                      </span>
                      <h4 className="text-xs font-bold text-alice mt-0.5 line-clamp-1" title={d.name}>
                        {d.name}
                      </h4>
                    </div>
                  </div>
                  {isSelected && <span className="w-2 h-2 rounded-full bg-downy animate-pulse" />}
                </div>

                <div className="pt-2 border-t border-charcoal-border/50 flex items-center justify-between text-xs text-alice-muted">
                  <span className="text-melrose font-semibold">{stats.staff} Staff</span>
                  <span>•</span>
                  <span className="text-jonquil font-semibold">{stats.students} Students</span>
                </div>
              </button>
            );
          })}

          {/* System Administration Option */}
          {(() => {
            const adminStats = getDeptStats("admin");
            const isSelected = selectedDeptId === "admin";
            return (
              <button
                type="button"
                onClick={() => handleSelectDepartment("admin")}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                  isSelected
                    ? "bg-downy/15 border-downy shadow-lg shadow-downy/10"
                    : "bg-charcoal-card border-charcoal-border hover:border-downy/40 hover:bg-charcoal-elevated"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`p-2 rounded-xl ${
                        isSelected ? "bg-downy text-charcoal font-bold" : "bg-charcoal-elevated text-jonquil"
                      }`}
                    >
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-charcoal text-alice-muted border border-charcoal-border">
                        ADMIN
                      </span>
                      <h4 className="text-sm font-bold text-alice mt-0.5">Administration</h4>
                    </div>
                  </div>
                  {isSelected && <span className="w-2 h-2 rounded-full bg-downy animate-pulse" />}
                </div>

                <div className="pt-2 border-t border-charcoal-border/50 flex items-center justify-between text-xs text-alice-muted">
                  <span className="text-downy font-semibold">{adminStats.admins} System Admin</span>
                  <span>Role Protected</span>
                </div>
              </button>
            );
          })()}
        </div>
      </div>

      {/* ── LEVEL 2 & 3 CONTAINER: SECTION SELECTOR & DIRECTORY LIST ── */}
      <div className="rounded-3xl bg-charcoal-card border border-charcoal-border p-6 shadow-xl space-y-6">
        {/* Section Header & Subtitle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-charcoal-border/70 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2.5 py-0.5 rounded-md bg-downy/15 text-downy border border-downy/30 font-bold font-mono">
                {activeDepartment?.code || "DEPT"}
              </span>
              <h2 className="text-lg font-bold text-alice">
                {activeDepartment?.name || "Academic Department"}
              </h2>
            </div>
            <p className="text-xs text-alice-muted mt-1">
              Select between Staff or Student section to browse individual accounts.
            </p>
          </div>

          {/* ── LEVEL 2: SECTION SELECTOR (STAFF vs STUDENT vs ADMIN) ── */}
          <div className="flex items-center p-1 rounded-2xl bg-charcoal-elevated border border-charcoal-border/80 self-start sm:self-auto">
            {selectedDeptId !== "admin" && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveSection("staff")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeSection === "staff"
                      ? "bg-melrose text-charcoal shadow-md shadow-melrose/20"
                      : "text-alice-muted hover:text-alice"
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>Faculty & Staff</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                      activeSection === "staff" ? "bg-charcoal text-melrose" : "bg-charcoal-card text-alice-dim"
                    }`}
                  >
                    {currentStats.staff}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSection("student")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeSection === "student"
                      ? "bg-downy text-charcoal shadow-md shadow-downy/20"
                      : "text-alice-muted hover:text-alice"
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Student Section</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                      activeSection === "student" ? "bg-charcoal text-downy" : "bg-charcoal-card text-alice-dim"
                    }`}
                  >
                    {currentStats.students}
                  </span>
                </button>
              </>
            )}

            {(selectedDeptId === "all" || selectedDeptId === "admin") && (
              <button
                type="button"
                onClick={() => setActiveSection("admin")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeSection === "admin"
                    ? "bg-jonquil text-charcoal shadow-md shadow-jonquil/20"
                    : "text-alice-muted hover:text-alice"
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Administrators</span>
                <span
                  className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                    activeSection === "admin" ? "bg-charcoal text-jonquil" : "bg-charcoal-card text-alice-dim"
                  }`}
                >
                  {currentStats.admins}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Search & In-Section Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-alice-dim absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                activeSection === "staff"
                  ? "Search staff by name, email, employee ID..."
                  : activeSection === "student"
                  ? "Search students by name, roll no, email..."
                  : "Search admins by name or email..."
              }
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-charcoal-elevated border border-charcoal-border text-alice text-xs outline-none focus:border-downy transition-all"
            />
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {/* Semester Filter (Only for Students) */}
            {activeSection === "student" && (
              <select
                value={semesterFilter}
                onChange={(e) => setSemesterFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-charcoal-elevated border border-charcoal-border text-alice text-xs font-semibold outline-none focus:border-downy"
              >
                <option value="">All Semesters</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                  <option key={sem} value={sem}>
                    Semester {sem}
                  </option>
                ))}
              </select>
            )}

            {/* Account Status Filter */}
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-alice-dim" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-charcoal-elevated border border-charcoal-border text-alice text-xs font-semibold outline-none focus:border-downy"
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>

            <span className="text-xs text-alice-dim font-mono hidden md:inline-block">
              {filteredRecords.length} records
            </span>
          </div>
        </div>

        {/* ── LEVEL 3: NAMES & RECORDS BASED ON SELECTION ── */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-alice">
            <thead className="bg-charcoal-elevated/70 text-xs uppercase tracking-wider text-alice-muted border-b border-charcoal-border">
              <tr>
                <th className="py-3 px-4 font-semibold">Name & Email</th>
                {activeSection === "staff" && (
                  <>
                    <th className="py-3 px-4 font-semibold">Employee ID</th>
                    <th className="py-3 px-4 font-semibold">Designation</th>
                    <th className="py-3 px-4 font-semibold text-center">Department</th>
                  </>
                )}
                {activeSection === "student" && (
                  <>
                    <th className="py-3 px-4 font-semibold">Roll Number</th>
                    <th className="py-3 px-4 font-semibold text-center">Semester</th>
                    <th className="py-3 px-4 font-semibold text-center">Department</th>
                  </>
                )}
                {activeSection === "admin" && (
                  <>
                    <th className="py-3 px-4 font-semibold text-center">Role Authority</th>
                    <th className="py-3 px-4 font-semibold text-center">Privileges</th>
                  </>
                )}
                <th className="py-3 px-4 font-semibold text-center">Status</th>
                <th className="py-3 px-4 font-semibold text-center">Toggle Access</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal-border/50 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-alice-muted">
                    <LoadingSpinner label="Fetching selected departmental directory records..." />
                  </td>
                </tr>
              ) : filteredRecords.length > 0 ? (
                filteredRecords.map((item) => {
                  const userObj = item.userId || item;
                  const isActive = userObj.isActive;
                  const userId = userObj._id;
                  const role = userObj.role || (activeSection === "student" ? "student" : "faculty");

                  return (
                    <tr
                      key={item._id || userId}
                      onClick={() => setSelectedUserDetail(item)}
                      className="hover:bg-charcoal-elevated/40 transition-colors cursor-pointer group"
                    >
                      {/* Name & Email */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 border ${
                              role === "admin"
                                ? "bg-downy/15 text-downy border-downy/30"
                                : role === "faculty" || role === "hod"
                                ? "bg-melrose/15 text-melrose border-melrose/30"
                                : "bg-jonquil/15 text-[#bfd948] border-jonquil/30"
                            }`}
                          >
                            {userObj.avatar ? (
                              <img
                                src={userObj.avatar}
                                alt={userObj.name}
                                className="w-full h-full object-cover rounded-xl"
                              />
                            ) : (
                              userObj.name?.charAt(0)?.toUpperCase() || "U"
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-alice group-hover:text-downy transition-colors flex items-center gap-1.5">
                              <span>{userObj.name}</span>
                              {role === "hod" && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-melrose/20 text-melrose font-mono">
                                  HOD
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] font-mono text-alice-dim mt-0.5">
                              {userObj.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Staff Specific Columns */}
                      {activeSection === "staff" && (
                        <>
                          <td className="py-3.5 px-4 font-mono font-bold text-alice">
                            {item.employeeId || "FAC-N/A"}
                          </td>
                          <td className="py-3.5 px-4 text-alice-muted font-medium">
                            {item.designation || "Faculty Member"}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-charcoal text-downy border border-downy/20">
                              {item.departmentId?.code || "N/A"}
                            </span>
                          </td>
                        </>
                      )}

                      {/* Student Specific Columns */}
                      {activeSection === "student" && (
                        <>
                          <td className="py-3.5 px-4 font-mono font-bold text-alice">
                            {item.rollNumber}
                          </td>
                          <td className="py-3.5 px-4 text-center font-semibold text-downy">
                            Sem {item.currentSemester}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-charcoal text-downy border border-downy/20">
                              {item.departmentId?.code || "N/A"}
                            </span>
                          </td>
                        </>
                      )}

                      {/* Admin Specific Columns */}
                      {activeSection === "admin" && (
                        <>
                          <td className="py-3.5 px-4 text-center">
                            <Badge variant="downy">SUPER ADMIN</Badge>
                          </td>
                          <td className="py-3.5 px-4 text-center text-alice-muted">
                            Full RBAC Authorization
                          </td>
                        </>
                      )}

                      {/* Account Status Badge */}
                      <td className="py-3.5 px-4 text-center">
                        <Badge variant={isActive ? "success" : "danger"}>
                          {isActive ? "ACTIVE" : "INACTIVE"}
                        </Badge>
                      </td>

                      {/* Toggle Access Switch */}
                      <td className="py-3.5 px-4 text-center">
                        {role !== "admin" ? (
                          <button
                            type="button"
                            onClick={(e) => handleToggleStatus(userId, e)}
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                              isActive
                                ? "bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20 hover:scale-105"
                                : "bg-downy/10 border-downy/20 text-downy hover:bg-downy/20 hover:scale-105"
                            }`}
                            title={isActive ? "Deactivate Login Access" : "Activate Login Access"}
                          >
                            {isActive ? (
                              <ToggleRight className="w-5 h-5" />
                            ) : (
                              <ToggleLeft className="w-5 h-5" />
                            )}
                          </button>
                        ) : (
                          <span className="text-alice-dim text-[11px] font-mono">Protected</span>
                        )}
                      </td>

                      {/* Details Button */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedUserDetail(item)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-charcoal-elevated border border-charcoal-border hover:border-downy text-alice-muted hover:text-alice text-xs font-semibold transition-all cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-downy" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-alice-muted">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Users className="w-8 h-8 text-alice-dim/50" />
                      <p className="font-semibold text-alice">No matching records found</p>
                      <p className="text-xs text-alice-dim max-w-sm">
                        There are currently no {activeSection === "staff" ? "staff members" : activeSection === "student" ? "students" : "users"} registered under this department filter.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── USER PROFILE DETAIL MODAL / DRAWER ── */}
      {selectedUserDetail && (
        <Modal
          isOpen={!!selectedUserDetail}
          onClose={() => setSelectedUserDetail(null)}
          title="Account Profile & Details"
          subtitle="Complete record of selected academic entity"
          maxWidth="max-w-lg"
        >
          {(() => {
            const userObj = selectedUserDetail.userId || selectedUserDetail;
            const isStudent = !!selectedUserDetail.rollNumber;
            const isFaculty = !!selectedUserDetail.employeeId;
            const isActive = userObj.isActive;
            const role = userObj.role || (isStudent ? "student" : "faculty");

            return (
              <div className="space-y-5">
                {/* User Header Card */}
                <div className="p-4 rounded-2xl bg-charcoal-elevated border border-charcoal-border flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl border shrink-0 ${
                        role === "admin"
                          ? "bg-downy/15 text-downy border-downy/30"
                          : role === "faculty" || role === "hod"
                          ? "bg-melrose/15 text-melrose border-melrose/30"
                          : "bg-jonquil/15 text-[#bfd948] border-jonquil/30"
                      }`}
                    >
                      {userObj.avatar ? (
                        <img
                          src={userObj.avatar}
                          alt={userObj.name}
                          className="w-full h-full object-cover rounded-2xl"
                        />
                      ) : (
                        userObj.name?.charAt(0)?.toUpperCase() || "U"
                      )}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-alice">{userObj.name}</h3>
                      <p className="text-xs font-mono text-alice-dim">{userObj.email}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Badge
                          variant={
                            role === "admin"
                              ? "downy"
                              : role === "faculty" || role === "hod"
                              ? "melrose"
                              : "jonquil"
                          }
                        >
                          {role.toUpperCase()}
                        </Badge>
                        <Badge variant={isActive ? "success" : "danger"}>
                          {isActive ? "ACTIVE ACCOUNT" : "INACTIVE ACCOUNT"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Specific Details Grid */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  {/* Department */}
                  <div className="p-3 rounded-xl bg-charcoal-elevated/50 border border-charcoal-border">
                    <span className="text-[10px] uppercase font-bold text-alice-dim">Department</span>
                    <p className="font-bold text-alice mt-0.5">
                      {selectedUserDetail.departmentId?.name || "System Level"}
                    </p>
                    {selectedUserDetail.departmentId?.code && (
                      <span className="text-[10px] font-mono text-downy">
                        Code: {selectedUserDetail.departmentId.code}
                      </span>
                    )}
                  </div>

                  {/* Academic / Employment ID */}
                  <div className="p-3 rounded-xl bg-charcoal-elevated/50 border border-charcoal-border">
                    <span className="text-[10px] uppercase font-bold text-alice-dim">
                      {isStudent ? "Roll Number" : isFaculty ? "Employee ID" : "System ID"}
                    </span>
                    <p className="font-mono font-bold text-alice mt-0.5">
                      {selectedUserDetail.rollNumber || selectedUserDetail.employeeId || "ADMIN-SYS"}
                    </p>
                  </div>

                  {/* Student Specific Details */}
                  {isStudent && (
                    <>
                      <div className="p-3 rounded-xl bg-charcoal-elevated/50 border border-charcoal-border">
                        <span className="text-[10px] uppercase font-bold text-alice-dim">Current Semester</span>
                        <p className="font-bold text-downy mt-0.5">
                          Semester {selectedUserDetail.currentSemester}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-charcoal-elevated/50 border border-charcoal-border">
                        <span className="text-[10px] uppercase font-bold text-alice-dim">Enrollment No</span>
                        <p className="font-mono font-bold text-alice mt-0.5">
                          {selectedUserDetail.enrollmentNumber || "N/A"}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-charcoal-elevated/50 border border-charcoal-border">
                        <span className="text-[10px] uppercase font-bold text-alice-dim">Admission Session</span>
                        <p className="font-bold text-alice mt-0.5">
                          {selectedUserDetail.admissionSessionId?.label || "2024-2025"}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-charcoal-elevated/50 border border-charcoal-border">
                        <span className="text-[10px] uppercase font-bold text-alice-dim">Guardian Name</span>
                        <p className="font-bold text-alice mt-0.5">
                          {selectedUserDetail.guardianName || "Not provided"}
                        </p>
                      </div>
                    </>
                  )}

                  {/* Faculty Specific Details */}
                  {isFaculty && (
                    <>
                      <div className="p-3 rounded-xl bg-charcoal-elevated/50 border border-charcoal-border">
                        <span className="text-[10px] uppercase font-bold text-alice-dim">Designation</span>
                        <p className="font-bold text-melrose mt-0.5">
                          {selectedUserDetail.designation || "Assistant Professor"}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-charcoal-elevated/50 border border-charcoal-border">
                        <span className="text-[10px] uppercase font-bold text-alice-dim">Faculty Role</span>
                        <p className="font-bold text-alice mt-0.5">
                          {userObj.role === "hod" ? "Head of Department (HOD)" : "Teaching Faculty"}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {/* Account Toggle & Footer Actions */}
                <div className="pt-3 border-t border-charcoal-border flex items-center justify-between">
                  {role !== "admin" ? (
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(userObj._id)}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? "bg-rose-500/10 border border-rose-500/30 text-rose-300 hover:bg-rose-500/20"
                          : "bg-downy/10 border border-downy/30 text-downy hover:bg-downy/20"
                      }`}
                    >
                      {isActive ? (
                        <>
                          <UserX className="w-4 h-4 text-rose-400" />
                          <span>Deactivate User Account</span>
                        </>
                      ) : (
                        <>
                          <UserCheck className="w-4 h-4 text-downy" />
                          <span>Activate User Account</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <span className="text-xs text-alice-dim font-mono">
                      Administrator account cannot be deactivated.
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => setSelectedUserDetail(null)}
                    className="px-4 py-2 rounded-xl bg-charcoal-elevated hover:bg-charcoal text-alice text-xs font-bold cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            );
          })()}
        </Modal>
      )}

      {/* ── CREATE STUDENT MODAL ── */}
      <Modal
        isOpen={isStudentModalOpen}
        onClose={() => setIsStudentModalOpen(false)}
        title="Provision Student Account"
        subtitle="Creates login credentials and academic student record atomically"
      >
        <form onSubmit={handleCreateStudent} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-alice-muted uppercase mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={studentForm.name}
              onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
              placeholder="e.g. Rahul Verma"
              className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-elevated border border-charcoal-border text-alice text-sm outline-none focus:border-downy"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-alice-muted uppercase mb-1">
                Institutional Email
              </label>
              <input
                type="email"
                required
                value={studentForm.email}
                onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                placeholder="rahul@student.college.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-elevated border border-charcoal-border text-alice text-sm outline-none focus:border-downy"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-alice-muted uppercase mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={studentForm.password}
                onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })}
                placeholder="Student@1234 (min 8 chars)"
                className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-elevated border border-charcoal-border text-alice text-sm outline-none focus:border-downy"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-alice-muted uppercase mb-1">
                Roll Number
              </label>
              <input
                type="text"
                required
                value={studentForm.rollNumber}
                onChange={(e) => setStudentForm({ ...studentForm, rollNumber: e.target.value })}
                placeholder="BCA-2026-055"
                className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-elevated border border-charcoal-border text-alice text-sm outline-none focus:border-downy"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-alice-muted uppercase mb-1">
                Enrollment Number
              </label>
              <input
                type="text"
                required
                value={studentForm.enrollmentNumber}
                onChange={(e) => setStudentForm({ ...studentForm, enrollmentNumber: e.target.value })}
                placeholder="EN20260055"
                className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-elevated border border-charcoal-border text-alice text-sm outline-none focus:border-downy"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-alice-muted uppercase mb-1">
                Department
              </label>
              <select
                value={studentForm.departmentId}
                onChange={(e) => setStudentForm({ ...studentForm, departmentId: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-elevated border border-charcoal-border text-alice text-sm outline-none focus:border-downy"
              >
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-alice-muted uppercase mb-1">
                Current Semester
              </label>
              <select
                value={studentForm.currentSemester}
                onChange={(e) => setStudentForm({ ...studentForm, currentSemester: parseInt(e.target.value, 10) })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-elevated border border-charcoal-border text-alice text-sm outline-none focus:border-downy"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                  <option key={sem} value={sem}>
                    Semester {sem}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-alice-muted uppercase mb-1">
                Admission Academic Session
              </label>
              <select
                value={studentForm.admissionSessionId}
                onChange={(e) => setStudentForm({ ...studentForm, admissionSessionId: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-elevated border border-charcoal-border text-alice text-sm outline-none focus:border-downy"
              >
                {sessions.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} {s.isCurrent ? "(Current)" : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-alice-muted uppercase mb-1">
                Admission Year
              </label>
              <input
                type="number"
                min="2000"
                max={new Date().getFullYear() + 1}
                required
                value={studentForm.admissionYear}
                onChange={(e) => setStudentForm({ ...studentForm, admissionYear: parseInt(e.target.value, 10) })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-elevated border border-charcoal-border text-alice text-sm outline-none focus:border-downy"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsStudentModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-charcoal-elevated text-alice-muted hover:text-alice text-xs font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-downy text-charcoal font-bold text-xs uppercase hover:bg-downy-hover shadow-md shadow-downy/20 cursor-pointer"
            >
              {submitting ? "Creating..." : "Save Student"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── CREATE FACULTY MODAL ── */}
      <Modal
        isOpen={isFacultyModalOpen}
        onClose={() => setIsFacultyModalOpen(false)}
        title="Provision Faculty Account"
        subtitle="Creates instructor account & attaches departmental affiliation"
      >
        <form onSubmit={handleCreateFaculty} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-alice-muted uppercase mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={facultyForm.name}
              onChange={(e) => setFacultyForm({ ...facultyForm, name: e.target.value })}
              placeholder="e.g. Dr. Rajesh Sharma"
              className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-elevated border border-charcoal-border text-alice text-sm outline-none focus:border-melrose"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-alice-muted uppercase mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={facultyForm.email}
                onChange={(e) => setFacultyForm({ ...facultyForm, email: e.target.value })}
                placeholder="rajesh@faculty.college.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-elevated border border-charcoal-border text-alice text-sm outline-none focus:border-melrose"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-alice-muted uppercase mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={facultyForm.password}
                onChange={(e) => setFacultyForm({ ...facultyForm, password: e.target.value })}
                placeholder="Faculty@1234 (min 8 chars)"
                className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-elevated border border-charcoal-border text-alice text-sm outline-none focus:border-melrose"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-alice-muted uppercase mb-1">
                Employee ID
              </label>
              <input
                type="text"
                required
                value={facultyForm.employeeId}
                onChange={(e) => setFacultyForm({ ...facultyForm, employeeId: e.target.value })}
                placeholder="FAC-2026-009"
                className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-elevated border border-charcoal-border text-alice text-sm outline-none focus:border-melrose"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-alice-muted uppercase mb-1">
                Role
              </label>
              <select
                value={facultyForm.role}
                onChange={(e) => setFacultyForm({ ...facultyForm, role: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-elevated border border-charcoal-border text-alice text-sm outline-none focus:border-melrose"
              >
                <option value="faculty">Faculty Member</option>
                <option value="hod">Head of Department (HOD)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-alice-muted uppercase mb-1">
                Designation
              </label>
              <select
                value={facultyForm.designation}
                onChange={(e) => setFacultyForm({ ...facultyForm, designation: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-elevated border border-charcoal-border text-alice text-sm outline-none focus:border-melrose"
              >
                <option value="Assistant Professor">Assistant Professor</option>
                <option value="Associate Professor">Associate Professor</option>
                <option value="Professor">Professor</option>
                <option value="Lecturer">Lecturer</option>
                <option value="Lab Instructor">Lab Instructor</option>
                <option value="Guest Faculty">Guest Faculty</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-alice-muted uppercase mb-1">
              Department
            </label>
            <select
              value={facultyForm.departmentId}
              onChange={(e) => setFacultyForm({ ...facultyForm, departmentId: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-elevated border border-charcoal-border text-alice text-sm outline-none focus:border-melrose"
            >
              {departments.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsFacultyModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-charcoal-elevated text-alice-muted hover:text-alice text-xs font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-melrose text-charcoal font-bold text-xs uppercase hover:bg-melrose-light shadow-md shadow-melrose/20 cursor-pointer"
            >
              {submitting ? "Creating..." : "Save Faculty"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
