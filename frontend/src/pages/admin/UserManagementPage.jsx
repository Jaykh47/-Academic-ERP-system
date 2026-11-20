import React, { useState, useEffect, useMemo } from "react";
import { adminApi } from "../../api/adminApi";
import { useToast } from "../../context/ToastContext";
import { formatApiError } from "../../utils/errorHelper";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { Badge } from "../../components/common/Badge";
import { Modal } from "../../components/common/Modal";
import {
  Users,
  Search,
  Filter,
  Shield,
  GraduationCap,
  Briefcase,
  Building2,
  BookOpen,
  Eye,
  UserCheck,
  UserX,
} from "lucide-react";

export const UserManagementPage = () => {
  const { success, error } = useToast();

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

  // Fetch all core user and organizational data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [deptRes, sessRes, studRes, facRes, adminRes] = await Promise.allSettled([
        adminApi.getDepartments(),
        adminApi.getSessions(),
        adminApi.getStudents({ limit: 200 }),
        adminApi.getFaculty({ limit: 100 }),
        adminApi.getUsers({ role: "admin", limit: 50 }),
      ]);

      if (deptRes.status === "fulfilled") {
        setDepartments(deptRes.value?.data?.departments || []);
      }
      if (sessRes.status === "fulfilled") {
        const sList = sessRes.value?.data?.sessions || [];
        setSessions(sList);
        // Default to active session if available
        const cur = sList.find((s) => s.isCurrent) || sList[0];
        if (cur) {
          setStudentForm((prev) => ({ ...prev, admissionSessionId: cur._id }));
        }
      }
      if (studRes.status === "fulfilled") {
        setStudents(studRes.value?.data?.students || []);
      }
      if (facRes.status === "fulfilled") {
        setFaculty(facRes.value?.data?.faculty || []);
      }
      if (adminRes.status === "fulfilled") {
        setAdmins(adminRes.value?.data?.users || []);
      }
    } catch (err) {
      error(formatApiError(err, "Failed to load user directory data"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute departmental staff/student count badges
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
    const staffCount = faculty.filter(
      (f) => (f.departmentId?._id || f.departmentId) === deptId
    ).length;
    const studentCount = students.filter(
      (s) => (s.departmentId?._id || s.departmentId) === deptId
    ).length;
    return {
      staff: staffCount,
      students: studentCount,
      admins: 0,
      total: staffCount + studentCount,
    };
  };

  // Find active department object
  const activeDepartment = useMemo(() => {
    if (selectedDeptId === "all") return { name: "All Academic Departments", code: "ALL" };
    if (selectedDeptId === "admin") return { name: "Administration", code: "ADMIN" };
    return departments.find((d) => d._id === selectedDeptId) || { name: "Department", code: "DEPT" };
  }, [selectedDeptId, departments]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    let list = [];

    if (activeSection === "staff") {
      list = faculty.map((f) => ({
        ...f,
        _itemType: "faculty",
      }));
      if (selectedDeptId !== "all" && selectedDeptId !== "admin") {
        list = list.filter(
          (f) => (f.departmentId?._id || f.departmentId) === selectedDeptId
        );
      }
    } else if (activeSection === "student") {
      list = students.map((s) => ({
        ...s,
        _itemType: "student",
      }));
      if (selectedDeptId !== "all" && selectedDeptId !== "admin") {
        list = list.filter(
          (s) => (s.departmentId?._id || s.departmentId) === selectedDeptId
        );
      }
      if (semesterFilter) {
        list = list.filter((s) => Number(s.currentSemester) === Number(semesterFilter));
      }
    } else if (activeSection === "admin") {
      list = admins.map((a) => ({
        ...a,
        _itemType: "admin",
        userId: a,
      }));
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((item) => {
        const u = item.userId || item;
        const name = (u.name || "").toLowerCase();
        const email = (u.email || "").toLowerCase();
        const roll = (item.rollNumber || "").toLowerCase();
        const emp = (item.employeeId || "").toLowerCase();
        return name.includes(q) || email.includes(q) || roll.includes(q) || emp.includes(q);
      });
    }

    if (statusFilter !== "all") {
      const isAct = statusFilter === "active";
      list = list.filter((item) => {
        const u = item.userId || item;
        return u.isActive === isAct;
      });
    }

    return list;
  }, [faculty, students, admins, activeSection, selectedDeptId, search, statusFilter, semesterFilter]);

  // Toggle user active/inactive status
  const handleToggleStatus = async (targetUserId, e) => {
    if (e) e.stopPropagation();
    try {
      const res = await adminApi.toggleUserStatus(targetUserId);
      const updatedUser = res.data?.user;
      success(
        `User ${updatedUser?.name || "account"} is now ${
          updatedUser?.isActive ? "ACTIVE" : "INACTIVE"
        }`
      );

      const updateList = (list) =>
        list.map((item) => {
          if (item.userId && (item.userId._id === targetUserId || item.userId === targetUserId)) {
            return {
              ...item,
              userId: {
                ...(typeof item.userId === "object" ? item.userId : {}),
                isActive: updatedUser.isActive,
              },
            };
          }
          if (item._id === targetUserId) {
            return { ...item, isActive: updatedUser.isActive };
          }
          return item;
        });

      setStudents((prev) => updateList(prev));
      setFaculty((prev) => updateList(prev));
      setAdmins((prev) => updateList(prev));

      if (selectedUserDetail) {
        const curUserObj = selectedUserDetail.userId || selectedUserDetail;
        if (curUserObj._id === targetUserId) {
          setSelectedUserDetail((prev) => ({
            ...prev,
            userId: {
              ...(typeof prev.userId === "object" ? prev.userId : {}),
              isActive: updatedUser.isActive,
            },
            isActive: updatedUser.isActive,
          }));
        }
      }
    } catch (err) {
      error(formatApiError(err, "Failed to update account status"));
    }
  };

  // Open Add Student Modal
  const handleOpenStudentModal = () => {
    const curDept = departments.find((d) => d._id === selectedDeptId) || departments[0];
    const curSess = sessions.find((s) => s.isCurrent) || sessions[0];
    setStudentForm({
      name: "",
      email: "",
      password: "",
      rollNumber: "",
      enrollmentNumber: "",
      departmentId: curDept?._id || "",
      admissionSessionId: curSess?._id || "",
      admissionYear: new Date().getFullYear(),
      currentSemester: 1,
    });
    setIsStudentModalOpen(true);
  };

  // Open Add Faculty Modal
  const handleOpenFacultyModal = () => {
    const curDept = departments.find((d) => d._id === selectedDeptId) || departments[0];
    setFacultyForm({
      name: "",
      email: "",
      password: "",
      role: "faculty",
      employeeId: "",
      designation: "Assistant Professor",
      departmentId: curDept?._id || "",
    });
    setIsFacultyModalOpen(true);
  };

  // Submit Add Student
  const handleCreateStudent = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await adminApi.createStudent(studentForm);
      success(`Student ${studentForm.name} added successfully!`);
      setIsStudentModalOpen(false);
      fetchData();
    } catch (err) {
      error(formatApiError(err, "Failed to add student account"));
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Add Faculty
  const handleCreateFaculty = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await adminApi.createFaculty(facultyForm);
      success(`Faculty member ${facultyForm.name} added successfully!`);
      setIsFacultyModalOpen(false);
      fetchData();
    } catch (err) {
      error(formatApiError(err, "Failed to add faculty account"));
    } finally {
      setSubmitting(false);
    }
  };

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
      {/* ── Top Header & Action Buttons ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-teal-400" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-semibold">
              ACADEMIC DIRECTORY
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            User Directory & Access Control
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Browse students and faculty by department and manage login access.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0">
          <button
            onClick={handleOpenStudentModal}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-[#080B11] font-semibold text-xs transition-all shadow-[0_1px_3px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.3)] hover:shadow-[0_0_16px_rgba(45,212,191,0.35)] cursor-pointer active:scale-[0.98]"
          >
            <GraduationCap className="w-3.5 h-3.5 text-[#080B11]" />
            <span>Add Student</span>
          </button>

          <button
            onClick={handleOpenFacultyModal}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#111726] hover:bg-[#182135] text-slate-200 hover:text-white border border-white/[0.1] hover:border-white/20 font-medium text-xs transition-all shadow-sm cursor-pointer active:scale-[0.98]"
          >
            <Briefcase className="w-3.5 h-3.5 text-slate-400" />
            <span>Add Faculty</span>
          </button>
        </div>
      </div>

      {/* ── LEVEL 1: DEPARTMENT SELECTOR ── */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5 text-teal-400" />
            DEPARTMENTS
          </span>
          <span className="text-[11px] font-mono text-slate-500">
            {departments.length} Departments
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
                className={`relative p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                  isSelected
                    ? "bg-[#0E1626] border-teal-500/50 shadow-[0_4px_20px_-2px_rgba(20,184,166,0.15),inset_0_1px_0_0_rgba(255,255,255,0.06)]"
                    : "bg-[#0D121D]/80 border-white/[0.07] hover:border-white/20 hover:bg-[#111724]"
                }`}
              >
                {isSelected && (
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-teal-400 rounded-t-xl" />
                )}

                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono text-xs font-bold border ${
                        isSelected
                          ? "bg-teal-500/15 text-teal-300 border-teal-500/30"
                          : "bg-white/[0.04] text-slate-400 border-white/10"
                      }`}
                    >
                      ALL
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white tracking-tight">
                        All Departments
                      </h4>
                      <span className="text-[10px] font-mono text-slate-500">
                        Entire College
                      </span>
                    </div>
                  </div>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-teal-400 shadow-[0_0_8px_#2dd4bf]" />
                  )}
                </div>

                <div className="pt-2 border-t border-white/[0.05] flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>{allStats.staff} Faculty</span>
                  <span className="text-slate-600">•</span>
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
                className={`relative p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                  isSelected
                    ? "bg-[#0E1626] border-teal-500/50 shadow-[0_4px_20px_-2px_rgba(20,184,166,0.15),inset_0_1px_0_0_rgba(255,255,255,0.06)]"
                    : "bg-[#0D121D]/80 border-white/[0.07] hover:border-white/20 hover:bg-[#111724]"
                }`}
              >
                {isSelected && (
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-teal-400 rounded-t-xl" />
                )}

                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono text-xs font-bold border ${
                        isSelected
                          ? "bg-teal-500/15 text-teal-300 border-teal-500/30"
                          : "bg-white/[0.04] text-slate-400 border-white/10"
                      }`}
                    >
                      {d.code}
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="text-xs font-bold text-white tracking-tight truncate max-w-[130px]" title={d.name}>
                        {d.name}
                      </h4>
                      <span className="text-[10px] font-mono text-slate-500">
                        {d.code}
                      </span>
                    </div>
                  </div>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-teal-400 shadow-[0_0_8px_#2dd4bf]" />
                  )}
                </div>

                <div className="pt-2 border-t border-white/[0.05] flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span className="text-indigo-300">{stats.staff} Faculty</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-amber-300">{stats.students} Students</span>
                </div>
              </button>
            );
          })}

          {/* Administrators Option */}
          {(() => {
            const adminStats = getDeptStats("admin");
            const isSelected = selectedDeptId === "admin";
            return (
              <button
                type="button"
                onClick={() => handleSelectDepartment("admin")}
                className={`relative p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                  isSelected
                    ? "bg-[#0E1626] border-teal-500/50 shadow-[0_4px_20px_-2px_rgba(20,184,166,0.15),inset_0_1px_0_0_rgba(255,255,255,0.06)]"
                    : "bg-[#0D121D]/80 border-white/[0.07] hover:border-white/20 hover:bg-[#111724]"
                }`}
              >
                {isSelected && (
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-teal-400 rounded-t-xl" />
                )}

                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono text-xs font-bold border ${
                        isSelected
                          ? "bg-teal-500/15 text-teal-300 border-teal-500/30"
                          : "bg-white/[0.04] text-slate-400 border-white/10"
                      }`}
                    >
                      <Shield className="w-4 h-4 text-teal-400" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white tracking-tight">
                        Administrators
                      </h4>
                      <span className="text-[10px] font-mono text-slate-500">
                        Admin Team
                      </span>
                    </div>
                  </div>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-teal-400 shadow-[0_0_8px_#2dd4bf]" />
                  )}
                </div>

                <div className="pt-2 border-t border-white/[0.05] flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span className="text-teal-300">{adminStats.admins} Admins</span>
                  <span className="text-slate-500">System</span>
                </div>
              </button>
            );
          })()}
        </div>
      </div>

      {/* ── LEVEL 2 & 3 CONTAINER: SECTION SELECTOR & ROSTER TABLE ── */}
      <div className="rounded-xl bg-[#0D121D]/80 backdrop-blur-xl border border-white/[0.07] p-5 shadow-[0_4px_24px_-2px_rgba(0,0,0,0.5)] space-y-5">
        {/* Section Header & Segmented Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/[0.06] gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-teal-500/10 text-teal-300 border border-teal-500/20 font-bold">
                {activeDepartment?.code || "DEPT"}
              </span>
              <h2 className="text-base font-bold text-white tracking-tight">
                {activeDepartment?.name || "Academic Department"}
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Select between Faculty or Students to view members.
            </p>
          </div>

          {/* Segmented Switcher */}
          <div className="inline-flex items-center p-1 rounded-lg bg-[#080C14] border border-white/[0.08] self-start sm:self-auto">
            {selectedDeptId !== "admin" && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveSection("staff")}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                    activeSection === "staff"
                      ? "bg-[#151D2E] text-white shadow-sm border border-white/10 font-semibold"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Faculty & Staff</span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-[#0A0E17] text-indigo-300 border border-white/[0.06]">
                    {currentStats.staff}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSection("student")}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                    activeSection === "student"
                      ? "bg-[#151D2E] text-white shadow-sm border border-white/10 font-semibold"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Students</span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-[#0A0E17] text-amber-300 border border-white/[0.06]">
                    {currentStats.students}
                  </span>
                </button>
              </>
            )}

            {(selectedDeptId === "all" || selectedDeptId === "admin") && (
              <button
                type="button"
                onClick={() => setActiveSection("admin")}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                  activeSection === "admin"
                    ? "bg-[#151D2E] text-white shadow-sm border border-white/10 font-semibold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-teal-400" />
                <span>Administrators</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-[#0A0E17] text-teal-300 border border-white/[0.06]">
                  {currentStats.admins}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                activeSection === "staff"
                  ? "Search faculty by name, email, employee ID..."
                  : activeSection === "student"
                  ? "Search students by name, roll no, email..."
                  : "Search admins by name or email..."
              }
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#080C14] border border-white/[0.08] text-white text-xs outline-none focus:border-teal-400/50 transition-all placeholder:text-slate-500"
            />
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {/* Semester Filter (Only for Students) */}
            {activeSection === "student" && (
              <select
                value={semesterFilter}
                onChange={(e) => setSemesterFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-[#080C14] border border-white/[0.08] text-slate-200 text-xs font-mono outline-none focus:border-teal-400/50"
              >
                <option value="">All Semesters</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                  <option key={sem} value={sem}>
                    Semester {sem}
                  </option>
                ))}
              </select>
            )}

            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-[#080C14] border border-white/[0.08] text-slate-200 text-xs font-mono outline-none focus:border-teal-400/50"
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>

            <span className="text-[11px] text-slate-500 font-mono hidden md:inline-block">
              {filteredRecords.length} records
            </span>
          </div>
        </div>

        {/* ── Table Roster ── */}
        <div className="overflow-x-auto rounded-lg border border-white/[0.06]">
          <table className="w-full text-left text-xs text-slate-200">
            <thead className="bg-[#080C14] text-[10px] font-mono tracking-widest text-slate-400 uppercase border-b border-white/[0.06]">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Name & Email</th>
                {activeSection === "staff" && (
                  <>
                    <th className="py-2.5 px-4 font-semibold">Employee ID</th>
                    <th className="py-2.5 px-4 font-semibold">Designation</th>
                    <th className="py-2.5 px-4 font-semibold text-center">Department</th>
                  </>
                )}
                {activeSection === "student" && (
                  <>
                    <th className="py-2.5 px-4 font-semibold">Roll Number</th>
                    <th className="py-2.5 px-4 font-semibold text-center">Semester</th>
                    <th className="py-2.5 px-4 font-semibold text-center">Department</th>
                  </>
                )}
                {activeSection === "admin" && (
                  <>
                    <th className="py-2.5 px-4 font-semibold text-center">Role</th>
                    <th className="py-2.5 px-4 font-semibold text-center">Permissions</th>
                  </>
                )}
                <th className="py-2.5 px-4 font-semibold text-center">Status</th>
                <th className="py-2.5 px-4 font-semibold text-center">Login Access</th>
                <th className="py-2.5 px-4 font-semibold text-right">Profile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <LoadingSpinner label="Loading directory records..." />
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
                      className="hover:bg-white/[0.02] transition-colors cursor-pointer group"
                    >
                      {/* Name & Email */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center font-mono font-bold text-xs text-slate-300 shrink-0">
                            {userObj.avatar ? (
                              <img
                                src={userObj.avatar}
                                alt={userObj.name}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              userObj.name?.charAt(0)?.toUpperCase() || "U"
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-white group-hover:text-teal-300 transition-colors flex items-center gap-1.5">
                              <span>{userObj.name}</span>
                              {role === "hod" && (
                                <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono font-bold">
                                  HOD
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                              {userObj.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Staff Specific Columns */}
                      {activeSection === "staff" && (
                        <>
                          <td className="py-3 px-4 font-mono font-bold text-slate-200">
                            {item.employeeId || "FAC-N/A"}
                          </td>
                          <td className="py-3 px-4 text-slate-300 font-medium">
                            {item.designation || "Faculty Member"}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#080C14] text-teal-300 border border-white/[0.08]">
                              {item.departmentId?.code || "N/A"}
                            </span>
                          </td>
                        </>
                      )}

                      {/* Student Specific Columns */}
                      {activeSection === "student" && (
                        <>
                          <td className="py-3 px-4 font-mono font-bold text-slate-200">
                            {item.rollNumber}
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-semibold text-amber-300">
                            Sem {item.currentSemester}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#080C14] text-teal-300 border border-white/[0.08]">
                              {item.departmentId?.code || "N/A"}
                            </span>
                          </td>
                        </>
                      )}

                      {/* Admin Specific Columns */}
                      {activeSection === "admin" && (
                        <>
                          <td className="py-3 px-4 text-center">
                            <Badge variant="downy">ADMIN</Badge>
                          </td>
                          <td className="py-3 px-4 text-center text-slate-400 font-mono text-[11px]">
                            Full Access
                          </td>
                        </>
                      )}

                      {/* Account Status Badge */}
                      <td className="py-3 px-4 text-center">
                        <Badge variant={isActive ? "success" : "danger"}>
                          {isActive ? "ACTIVE" : "INACTIVE"}
                        </Badge>
                      </td>

                      {/* Access Switch */}
                      <td className="py-3 px-4 text-center">
                        {role !== "admin" ? (
                          <button
                            type="button"
                            onClick={(e) => handleToggleStatus(userId, e)}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              isActive ? "bg-teal-500" : "bg-slate-700"
                            }`}
                            title={isActive ? "Disable Login Access" : "Enable Login Access"}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out mt-0.5 ${
                                isActive ? "translate-x-4" : "translate-x-0.5"
                              }`}
                            />
                          </button>
                        ) : (
                          <span className="text-slate-500 text-[10px] font-mono">Protected</span>
                        )}
                      </td>

                      {/* Profile Button */}
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedUserDetail(item)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-slate-300 hover:text-white text-[11px] font-mono transition-all cursor-pointer"
                        >
                          <Eye className="w-3 h-3 text-teal-400" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Users className="w-7 h-7 text-slate-600" />
                      <p className="font-semibold text-white">No matching records found</p>
                      <p className="text-xs text-slate-500 max-w-sm">
                        There are currently no {activeSection === "staff" ? "faculty members" : activeSection === "student" ? "students" : "users"} registered under this department filter.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── USER PROFILE MODAL ── */}
      {selectedUserDetail && (
        <Modal
          isOpen={!!selectedUserDetail}
          onClose={() => setSelectedUserDetail(null)}
          title="User Profile"
          subtitle="Account and academic details"
          maxWidth="max-w-lg"
        >
          {(() => {
            const userObj = selectedUserDetail.userId || selectedUserDetail;
            const isStudent = !!selectedUserDetail.rollNumber;
            const isFaculty = !!selectedUserDetail.employeeId;
            const isActive = userObj.isActive;
            const role = userObj.role || (isStudent ? "student" : "faculty");

            return (
              <div className="space-y-4">
                {/* User Header Card */}
                <div className="p-4 rounded-xl bg-[#080C14] border border-white/[0.08] flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center font-mono font-bold text-lg text-teal-300 shrink-0">
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
                      <h3 className="text-base font-bold text-white tracking-tight">{userObj.name}</h3>
                      <p className="text-xs font-mono text-slate-400">{userObj.email}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Badge variant={role === "admin" ? "downy" : role === "faculty" || role === "hod" ? "melrose" : "jonquil"}>
                          {role.toUpperCase()}
                        </Badge>
                        <Badge variant={isActive ? "success" : "danger"}>
                          {isActive ? "ACTIVE" : "INACTIVE"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  {/* Department */}
                  <div className="p-3 rounded-lg bg-[#080C14] border border-white/[0.06]">
                    <span className="text-[10px] uppercase font-mono font-bold text-slate-500">Department</span>
                    <p className="font-semibold text-white mt-0.5">
                      {selectedUserDetail.departmentId?.name || "College Administration"}
                    </p>
                    {selectedUserDetail.departmentId?.code && (
                      <span className="text-[10px] font-mono text-teal-400">
                        Code: {selectedUserDetail.departmentId.code}
                      </span>
                    )}
                  </div>

                  {/* ID */}
                  <div className="p-3 rounded-lg bg-[#080C14] border border-white/[0.06]">
                    <span className="text-[10px] uppercase font-mono font-bold text-slate-500">
                      {isStudent ? "Roll Number" : isFaculty ? "Employee ID" : "Account ID"}
                    </span>
                    <p className="font-mono font-bold text-white mt-0.5">
                      {selectedUserDetail.rollNumber || selectedUserDetail.employeeId || "ADMIN-01"}
                    </p>
                  </div>

                  {/* Student Details */}
                  {isStudent && (
                    <>
                      <div className="p-3 rounded-lg bg-[#080C14] border border-white/[0.06]">
                        <span className="text-[10px] uppercase font-mono font-bold text-slate-500">Current Semester</span>
                        <p className="font-bold text-amber-300 mt-0.5">
                          Semester {selectedUserDetail.currentSemester}
                        </p>
                      </div>

                      <div className="p-3 rounded-lg bg-[#080C14] border border-white/[0.06]">
                        <span className="text-[10px] uppercase font-mono font-bold text-slate-500">Enrollment No</span>
                        <p className="font-mono font-bold text-white mt-0.5">
                          {selectedUserDetail.enrollmentNumber || "N/A"}
                        </p>
                      </div>

                      <div className="p-3 rounded-lg bg-[#080C14] border border-white/[0.06]">
                        <span className="text-[10px] uppercase font-mono font-bold text-slate-500">Academic Session</span>
                        <p className="font-semibold text-white mt-0.5">
                          {selectedUserDetail.admissionSessionId?.label || "2024-2025"}
                        </p>
                      </div>

                      <div className="p-3 rounded-lg bg-[#080C14] border border-white/[0.06]">
                        <span className="text-[10px] uppercase font-mono font-bold text-slate-500">Guardian Contact</span>
                        <p className="font-semibold text-white mt-0.5">
                          {selectedUserDetail.guardianName || "Not provided"}
                        </p>
                      </div>
                    </>
                  )}

                  {/* Faculty Details */}
                  {isFaculty && (
                    <>
                      <div className="p-3 rounded-lg bg-[#080C14] border border-white/[0.06]">
                        <span className="text-[10px] uppercase font-mono font-bold text-slate-500">Designation</span>
                        <p className="font-bold text-indigo-300 mt-0.5">
                          {selectedUserDetail.designation || "Assistant Professor"}
                        </p>
                      </div>

                      <div className="p-3 rounded-lg bg-[#080C14] border border-white/[0.06]">
                        <span className="text-[10px] uppercase font-mono font-bold text-slate-500">Role</span>
                        <p className="font-semibold text-white mt-0.5">
                          {userObj.role === "hod" ? "Head of Department (HOD)" : "Faculty Member"}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
                  {role !== "admin" ? (
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(userObj._id)}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        isActive
                          ? "bg-rose-500/10 border border-rose-500/30 text-rose-300 hover:bg-rose-500/20"
                          : "bg-teal-500/10 border border-teal-500/30 text-teal-300 hover:bg-teal-500/20"
                      }`}
                    >
                      {isActive ? (
                        <>
                          <UserX className="w-3.5 h-3.5 text-rose-400" />
                          <span>Deactivate Account</span>
                        </>
                      ) : (
                        <>
                          <UserCheck className="w-3.5 h-3.5 text-teal-400" />
                          <span>Activate Account</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <span className="text-xs text-slate-500 font-mono">
                      Administrator account cannot be modified.
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => setSelectedUserDetail(null)}
                    className="px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-white text-xs font-medium cursor-pointer"
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
        title="Add New Student"
        subtitle="Create a student account and assign their department"
      >
        <form onSubmit={handleCreateStudent} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-mono font-semibold text-slate-400 uppercase mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={studentForm.name}
              onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
              placeholder="e.g. Rahul Verma"
              className="w-full px-3 py-2 rounded-lg bg-[#080C14] border border-white/[0.08] text-white text-xs outline-none focus:border-teal-400/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono font-semibold text-slate-400 uppercase mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={studentForm.email}
                onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                placeholder="rahul@student.college.com"
                className="w-full px-3 py-2 rounded-lg bg-[#080C14] border border-white/[0.08] text-white text-xs outline-none focus:border-teal-400/50"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono font-semibold text-slate-400 uppercase mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={studentForm.password}
                onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })}
                placeholder="Student@1234 (min 8 chars)"
                className="w-full px-3 py-2 rounded-lg bg-[#080C14] border border-white/[0.08] text-white text-xs outline-none focus:border-teal-400/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono font-semibold text-slate-400 uppercase mb-1">
                Roll Number
              </label>
              <input
                type="text"
                required
                value={studentForm.rollNumber}
                onChange={(e) => setStudentForm({ ...studentForm, rollNumber: e.target.value })}
                placeholder="BCA-2026-055"
                className="w-full px-3 py-2 rounded-lg bg-[#080C14] border border-white/[0.08] text-white text-xs outline-none focus:border-teal-400/50"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono font-semibold text-slate-400 uppercase mb-1">
                Enrollment Number
              </label>
              <input
                type="text"
                required
                value={studentForm.enrollmentNumber}
                onChange={(e) => setStudentForm({ ...studentForm, enrollmentNumber: e.target.value })}
                placeholder="EN20260055"
                className="w-full px-3 py-2 rounded-lg bg-[#080C14] border border-white/[0.08] text-white text-xs outline-none focus:border-teal-400/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono font-semibold text-slate-400 uppercase mb-1">
                Department
              </label>
              <select
                value={studentForm.departmentId}
                onChange={(e) => setStudentForm({ ...studentForm, departmentId: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#080C14] border border-white/[0.08] text-white text-xs outline-none focus:border-teal-400/50"
              >
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-mono font-semibold text-slate-400 uppercase mb-1">
                Current Semester
              </label>
              <select
                value={studentForm.currentSemester}
                onChange={(e) => setStudentForm({ ...studentForm, currentSemester: parseInt(e.target.value, 10) })}
                className="w-full px-3 py-2 rounded-lg bg-[#080C14] border border-white/[0.08] text-white text-xs outline-none focus:border-teal-400/50"
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
              <label className="block text-[11px] font-mono font-semibold text-slate-400 uppercase mb-1">
                Academic Session
              </label>
              <select
                value={studentForm.admissionSessionId}
                onChange={(e) => setStudentForm({ ...studentForm, admissionSessionId: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#080C14] border border-white/[0.08] text-white text-xs outline-none focus:border-teal-400/50"
              >
                {sessions.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} {s.isCurrent ? "(Current)" : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-mono font-semibold text-slate-400 uppercase mb-1">
                Admission Year
              </label>
              <input
                type="number"
                min="2000"
                max={new Date().getFullYear() + 1}
                required
                value={studentForm.admissionYear}
                onChange={(e) => setStudentForm({ ...studentForm, admissionYear: parseInt(e.target.value, 10) })}
                className="w-full px-3 py-2 rounded-lg bg-[#080C14] border border-white/[0.08] text-white text-xs outline-none focus:border-teal-400/50"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={() => setIsStudentModalOpen(false)}
              className="px-3.5 py-1.5 rounded-lg bg-white/[0.04] text-slate-400 hover:text-white text-xs font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-[#080B11] font-semibold text-xs cursor-pointer shadow-sm transition-all"
            >
              {submitting ? "Saving..." : "Add Student"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── CREATE FACULTY MODAL ── */}
      <Modal
        isOpen={isFacultyModalOpen}
        onClose={() => setIsFacultyModalOpen(false)}
        title="Add New Faculty"
        subtitle="Create a new faculty account and assign their department"
      >
        <form onSubmit={handleCreateFaculty} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-mono font-semibold text-slate-400 uppercase mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={facultyForm.name}
              onChange={(e) => setFacultyForm({ ...facultyForm, name: e.target.value })}
              placeholder="e.g. Dr. Rajesh Sharma"
              className="w-full px-3 py-2 rounded-lg bg-[#080C14] border border-white/[0.08] text-white text-xs outline-none focus:border-indigo-400/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono font-semibold text-slate-400 uppercase mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={facultyForm.email}
                onChange={(e) => setFacultyForm({ ...facultyForm, email: e.target.value })}
                placeholder="rajesh@faculty.college.com"
                className="w-full px-3 py-2 rounded-lg bg-[#080C14] border border-white/[0.08] text-white text-xs outline-none focus:border-indigo-400/50"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono font-semibold text-slate-400 uppercase mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={facultyForm.password}
                onChange={(e) => setFacultyForm({ ...facultyForm, password: e.target.value })}
                placeholder="Faculty@1234 (min 8 chars)"
                className="w-full px-3 py-2 rounded-lg bg-[#080C14] border border-white/[0.08] text-white text-xs outline-none focus:border-indigo-400/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-mono font-semibold text-slate-400 uppercase mb-1">
                Employee ID
              </label>
              <input
                type="text"
                required
                value={facultyForm.employeeId}
                onChange={(e) => setFacultyForm({ ...facultyForm, employeeId: e.target.value })}
                placeholder="FAC-2026-009"
                className="w-full px-3 py-2 rounded-lg bg-[#080C14] border border-white/[0.08] text-white text-xs outline-none focus:border-indigo-400/50"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono font-semibold text-slate-400 uppercase mb-1">
                Role
              </label>
              <select
                value={facultyForm.role}
                onChange={(e) => setFacultyForm({ ...facultyForm, role: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#080C14] border border-white/[0.08] text-white text-xs outline-none focus:border-indigo-400/50"
              >
                <option value="faculty">Faculty Member</option>
                <option value="hod">Head of Department (HOD)</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-mono font-semibold text-slate-400 uppercase mb-1">
                Designation
              </label>
              <select
                value={facultyForm.designation}
                onChange={(e) => setFacultyForm({ ...facultyForm, designation: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#080C14] border border-white/[0.08] text-white text-xs outline-none focus:border-indigo-400/50"
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
            <label className="block text-[11px] font-mono font-semibold text-slate-400 uppercase mb-1">
              Department
            </label>
            <select
              value={facultyForm.departmentId}
              onChange={(e) => setFacultyForm({ ...facultyForm, departmentId: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-[#080C14] border border-white/[0.08] text-white text-xs outline-none focus:border-indigo-400/50"
            >
              {departments.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={() => setIsFacultyModalOpen(false)}
              className="px-3.5 py-1.5 rounded-lg bg-white/[0.04] text-slate-400 hover:text-white text-xs font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white font-semibold text-xs cursor-pointer shadow-sm transition-all"
            >
              {submitting ? "Saving..." : "Add Faculty"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
