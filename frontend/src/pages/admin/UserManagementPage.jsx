import React, { useState, useEffect } from "react";
import { adminApi } from "../../api/adminApi";
import { useToast } from "../../context/ToastContext";
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
} from "lucide-react";

export const UserManagementPage = () => {
  const { success, error, warning } = useToast();

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  // Modals
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isFacultyModalOpen, setIsFacultyModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New Student Form State
  const [studentForm, setStudentForm] = useState({
    name: "",
    email: "",
    password: "",
    rollNumber: "",
    enrollmentNumber: "",
    departmentId: "",
    currentSemester: 1,
  });

  // New Faculty Form State
  const [facultyForm, setFacultyForm] = useState({
    name: "",
    email: "",
    password: "",
    employeeId: "",
    designation: "Assistant Professor",
    departmentId: "",
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = { page, limit: 10 };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;

      const res = await adminApi.getUsers(params);
      setUsers(res?.data?.users || []);
      setTotalPages(res?.data?.pages || 1);
      setTotalUsers(res?.data?.total || 0);
    } catch (err) {
      error("Failed to load user list");
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await adminApi.getDepartments();
      const depts = res?.data?.departments || [];
      setDepartments(depts);
      if (depts.length > 0) {
        setStudentForm((prev) => ({ ...prev, departmentId: depts[0]._id }));
        setFacultyForm((prev) => ({ ...prev, departmentId: depts[0]._id }));
      }
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleToggleStatus = async (userId) => {
    try {
      await adminApi.toggleUserStatus(userId);
      setUsers((prev) =>
        prev.map((u) => {
          if (u._id === userId) {
            const newStatus = u.accountStatus === "active" ? "inactive" : "active";
            return { ...u, accountStatus: newStatus };
          }
          return u;
        })
      );
      success("User account status updated!");
    } catch (err) {
      error("Failed to update status");
    }
  };

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await adminApi.createStudent(studentForm);
      success("Student account created successfully!");
      setIsStudentModalOpen(false);
      setStudentForm({
        name: "",
        email: "",
        password: "",
        rollNumber: "",
        enrollmentNumber: "",
        departmentId: departments[0]?._id || "",
        currentSemester: 1,
      });
      fetchUsers();
    } catch (err) {
      error(err.response?.data?.message || "Failed to create student");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateFaculty = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await adminApi.createFaculty(facultyForm);
      success("Faculty account created successfully!");
      setIsFacultyModalOpen(false);
      setFacultyForm({
        name: "",
        email: "",
        password: "",
        employeeId: "",
        designation: "Assistant Professor",
        departmentId: departments[0]?._id || "",
      });
      fetchUsers();
    } catch (err) {
      error(err.response?.data?.message || "Failed to create faculty");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Provision Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-alice tracking-tight">
            User Directory & Access Control
          </h1>
          <p className="text-xs text-alice-muted mt-1">
            Provision academic accounts, assign institutional departments, and control login authorization.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            onClick={() => setIsStudentModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-downy text-charcoal font-bold text-xs uppercase tracking-wider hover:bg-downy-hover shadow-lg shadow-downy/20 transition-all cursor-pointer"
          >
            <GraduationCap className="w-4 h-4" />
            <span>Add Student</span>
          </button>

          <button
            onClick={() => setIsFacultyModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-melrose text-charcoal font-bold text-xs uppercase tracking-wider hover:bg-melrose-light shadow-lg shadow-melrose/20 transition-all cursor-pointer"
          >
            <Briefcase className="w-4 h-4" />
            <span>Add Faculty</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-charcoal-card border border-charcoal-border flex flex-col sm:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-alice-dim absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-charcoal-elevated border border-charcoal-border text-alice text-xs outline-none focus:border-downy"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-alice-dim" />
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl bg-charcoal-elevated border border-charcoal-border text-alice text-xs font-semibold outline-none focus:border-downy"
          >
            <option value="">All Roles</option>
            <option value="student">Students</option>
            <option value="faculty">Faculty</option>
            <option value="admin">Administrators</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-3xl bg-charcoal-card border border-charcoal-border p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-alice">Registered Academic Accounts</h3>
          <span className="text-xs text-alice-muted font-mono">{totalUsers} users found</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-alice">
            <thead className="bg-charcoal-elevated/70 text-xs uppercase tracking-wider text-alice-muted border-b border-charcoal-border">
              <tr>
                <th className="py-3 px-4 font-semibold">Name & Email</th>
                <th className="py-3 px-4 font-semibold text-center">Role</th>
                <th className="py-3 px-4 font-semibold text-center">Status</th>
                <th className="py-3 px-4 font-semibold text-center">Toggle Access</th>
                <th className="py-3 px-4 font-semibold text-right">Registration Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal-border/50 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-alice-muted">
                    <LoadingSpinner label="Fetching user records..." />
                  </td>
                </tr>
              ) : users.length > 0 ? (
                users.map((u) => {
                  const roleVariant =
                    u.role === "admin"
                      ? "downy"
                      : u.role === "faculty" || u.role === "hod"
                      ? "melrose"
                      : "jonquil";

                  const isActive = u.accountStatus === "active" || !u.accountStatus;

                  return (
                    <tr key={u._id} className="hover:bg-charcoal-elevated/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-alice">{u.name}</div>
                        <div className="text-[11px] font-mono text-alice-dim mt-0.5">{u.email}</div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Badge variant={roleVariant}>{u.role?.toUpperCase()}</Badge>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Badge variant={isActive ? "success" : "danger"}>
                          {isActive ? "ACTIVE" : "INACTIVE"}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {u.role !== "admin" ? (
                          <button
                            onClick={() => handleToggleStatus(u._id)}
                            className={`p-1.5 rounded-lg border transition-all ${
                              isActive
                                ? "bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20"
                                : "bg-downy/10 border-downy/20 text-downy hover:bg-downy/20"
                            }`}
                            title={isActive ? "Suspend User" : "Activate User"}
                          >
                            {isActive ? (
                              <ToggleRight className="w-5 h-5" />
                            ) : (
                              <ToggleLeft className="w-5 h-5" />
                            )}
                          </button>
                        ) : (
                          <span className="text-alice-dim text-[11px]">Protected</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right text-alice-dim font-mono">
                        {new Date(u.createdAt || Date.now()).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-alice-muted">
                    No users matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center pt-3 border-t border-charcoal-border/60 text-xs text-alice-muted">
            <span>Page {page} of {totalPages}</span>
            <div className="flex gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 rounded-lg border border-charcoal-border hover:bg-charcoal-elevated disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-lg border border-charcoal-border hover:bg-charcoal-elevated disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Student Modal */}
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
                placeholder="Student@1234"
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
                Semester
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

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsStudentModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-charcoal-elevated text-alice-muted hover:text-alice text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-downy text-charcoal font-bold text-xs uppercase hover:bg-downy-hover shadow-md shadow-downy/20"
            >
              {submitting ? "Creating..." : "Save Student"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Create Faculty Modal */}
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
                placeholder="Faculty@1234"
                className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-elevated border border-charcoal-border text-alice text-sm outline-none focus:border-melrose"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
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
                <option value="HOD">Head of Department (HOD)</option>
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
              className="px-4 py-2 rounded-xl bg-charcoal-elevated text-alice-muted hover:text-alice text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-melrose text-charcoal font-bold text-xs uppercase hover:bg-melrose-light shadow-md shadow-melrose/20"
            >
              {submitting ? "Creating..." : "Save Faculty"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
