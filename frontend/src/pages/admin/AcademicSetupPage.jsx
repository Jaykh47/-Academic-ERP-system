import React, { useState, useEffect } from "react";
import { adminApi } from "../../api/adminApi";
import { academicApi } from "../../api/academicApi";
import { useToast } from "../../context/ToastContext";
import { formatApiError } from "../../utils/errorHelper";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { Badge } from "../../components/common/Badge";
import { Modal } from "../../components/common/Modal";
import {
  BookOpen,
  Calendar,
  Building2,
  Users,
  Plus,
  UserCheck,
  CheckCircle,
  Layers,
} from "lucide-react";

export const AcademicSetupPage = () => {
  const { success, error, warning } = useToast();
  const [activeTab, setActiveTab] = useState("departments");
  const [loading, setLoading] = useState(true);

  // Data states
  const [departments, setDepartments] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [facultyList, setFacultyList] = useState([]);

  // Modals
  const [modalType, setModalType] = useState(null); // 'dept' | 'session' | 'subject' | 'assign' | 'batch'
  const [submitting, setSubmitting] = useState(false);

  // Forms
  const [deptForm, setDeptForm] = useState({ name: "", code: "" });
  const [sessionForm, setSessionForm] = useState({
    name: "2026-2027",
    startDate: "2026-07-01",
    endDate: "2027-06-30",
    isCurrent: true,
  });
  const [subjectForm, setSubjectForm] = useState({
    code: "",
    name: "",
    departmentId: "",
    semester: 1,
    credits: 4,
    type: "theory",
  });
  const [assignForm, setAssignForm] = useState({ subjectId: "", facultyId: "" });
  const [batchForm, setBatchForm] = useState({
    departmentId: "",
    semester: 1,
    subjectId: "",
    academicSessionId: "",
  });
  const [selectedSession, setSelectedSession] = useState(null);
  const [windowForm, setWindowForm] = useState({
    isEnrollmentOpen: false,
    enrollmentStartDate: "",
    enrollmentEndDate: "",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [deptRes, sessRes, subRes, facRes] = await Promise.allSettled([
        adminApi.getDepartments(),
        adminApi.getSessions(),
        academicApi.getSubjects(),
        adminApi.getFaculty(),
      ]);

      if (deptRes.status === "fulfilled") {
        const d = deptRes.value?.data?.departments || [];
        setDepartments(d);
        if (d.length > 0) {
          setSubjectForm((prev) => ({ ...prev, departmentId: d[0]._id }));
          setBatchForm((prev) => ({ ...prev, departmentId: d[0]._id }));
        }
      }

      if (sessRes.status === "fulfilled") {
        const s = sessRes.value?.data?.sessions || [];
        setSessions(s);
        const curr = s.find((x) => x.isCurrent) || s[0];
        if (curr) {
          setBatchForm((prev) => ({ ...prev, academicSessionId: curr._id }));
        }
      }

      if (subRes.status === "fulfilled") {
        const sub = subRes.value?.data?.subjects || [];
        setSubjects(sub);
        if (sub.length > 0) {
          setAssignForm((prev) => ({ ...prev, subjectId: sub[0]._id }));
          setBatchForm((prev) => ({ ...prev, subjectId: sub[0]._id }));
        }
      }

      if (facRes.status === "fulfilled") {
        const f = facRes.value?.data?.faculty || [];
        setFacultyList(f);
        if (f.length > 0) {
          setAssignForm((prev) => ({ ...prev, facultyId: f[0]._id }));
        }
      }
    } catch {
      error("Failed to load academic data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateDept = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await adminApi.createDepartment(deptForm);
      success("Department created successfully!");
      setModalType(null);
      setDeptForm({ name: "", code: "" });
      loadData();
    } catch (err) {
      error(formatApiError(err, "Failed to create department"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await adminApi.createSession(sessionForm);
      success("Academic session created!");
      setModalType(null);
      loadData();
    } catch (err) {
      error(formatApiError(err, "Failed to create session"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await academicApi.createSubject(subjectForm);
      success("Course subject created!");
      setModalType(null);
      setSubjectForm({
        code: "",
        name: "",
        departmentId: departments[0]?._id || "",
        semester: 1,
        credits: 4,
        subjectType: "theory",
      });
      loadData();
    } catch (err) {
      error(formatApiError(err, "Failed to create subject"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignFaculty = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await academicApi.assignFaculty(assignForm.subjectId, assignForm.facultyId);
      success("Faculty successfully assigned to course subject!");
      setModalType(null);
      loadData();
    } catch (err) {
      error(formatApiError(err, "Failed to assign faculty"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleBatchEnroll = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await academicApi.batchEnrollSemester({
        departmentId: batchForm.departmentId,
        semester: parseInt(batchForm.semester, 10),
        subjectId: batchForm.subjectId,
        academicSessionId: batchForm.academicSessionId,
      });
      success(res?.message || "Cohort enrolled into subject successfully!");
      setModalType(null);
    } catch (err) {
      error(formatApiError(err, "Batch enrollment failed"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEnrollmentModal = (sess) => {
    setSelectedSession(sess);
    setWindowForm({
      isEnrollmentOpen: sess.isEnrollmentOpen || false,
      enrollmentStartDate: sess.enrollmentStartDate
        ? new Date(sess.enrollmentStartDate).toISOString().split("T")[0]
        : "",
      enrollmentEndDate: sess.enrollmentEndDate
        ? new Date(sess.enrollmentEndDate).toISOString().split("T")[0]
        : "",
    });
    setModalType("enrollmentWindow");
  };

  const handleUpdateEnrollmentWindow = async (e) => {
    e.preventDefault();
    if (!selectedSession) return;
    try {
      setSubmitting(true);
      await adminApi.updateEnrollmentWindow(selectedSession._id, windowForm);
      success("Enrollment registration window updated successfully!");
      setModalType(null);
      loadData();
    } catch (err) {
      error(formatApiError(err, "Failed to update enrollment window"));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading institutional academic structures..." />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-alice tracking-tight">
            Academic Infrastructure & Curriculum Setup
          </h1>
          <p className="text-xs text-alice-muted mt-1">
            Configure college departments, academic calendar sessions, course subjects, and batch cohort enrollments.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {activeTab === "departments" && (
            <button
              onClick={() => setModalType("dept")}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-downy text-charcoal font-bold text-xs uppercase tracking-wider hover:bg-downy-hover shadow-md shadow-downy/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Department
            </button>
          )}
          {activeTab === "sessions" && (
            <button
              onClick={() => setModalType("session")}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-downy text-charcoal font-bold text-xs uppercase tracking-wider hover:bg-downy-hover shadow-md shadow-downy/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Session
            </button>
          )}
          {activeTab === "subjects" && (
            <button
              onClick={() => setModalType("subject")}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-downy text-charcoal font-bold text-xs uppercase tracking-wider hover:bg-downy-hover shadow-md shadow-downy/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Course Subject
            </button>
          )}
          <button
            onClick={() => setModalType("assign")}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-charcoal-elevated border border-charcoal-border hover:border-melrose text-alice font-bold text-xs uppercase tracking-wider cursor-pointer"
          >
            <UserCheck className="w-4 h-4 text-melrose" /> Assign Faculty
          </button>
          <button
            onClick={() => setModalType("batch")}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-charcoal-elevated border border-charcoal-border hover:border-jonquil text-alice font-bold text-xs uppercase tracking-wider cursor-pointer"
          >
            <Layers className="w-4 h-4 text-jonquil" /> Batch Enroll Cohort
          </button>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex border-b border-charcoal-border gap-2 text-xs font-bold uppercase tracking-wider">
        <button
          onClick={() => setActiveTab("departments")}
          className={`pb-3 px-3 transition-all border-b-2 ${
            activeTab === "departments"
              ? "border-downy text-downy"
              : "border-transparent text-alice-muted hover:text-alice"
          }`}
        >
          Departments ({departments.length})
        </button>
        <button
          onClick={() => setActiveTab("sessions")}
          className={`pb-3 px-3 transition-all border-b-2 ${
            activeTab === "sessions"
              ? "border-downy text-downy"
              : "border-transparent text-alice-muted hover:text-alice"
          }`}
        >
          Sessions ({sessions.length})
        </button>
        <button
          onClick={() => setActiveTab("subjects")}
          className={`pb-3 px-3 transition-all border-b-2 ${
            activeTab === "subjects"
              ? "border-downy text-downy"
              : "border-transparent text-alice-muted hover:text-alice"
          }`}
        >
          Course Subjects ({subjects.length})
        </button>
      </div>

      {/* Tab 1: Departments */}
      {activeTab === "departments" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept) => (
            <div
              key={dept._id}
              className="p-5 rounded-2xl bg-charcoal-card border border-charcoal-border hover:border-downy/30 transition-all space-y-2 shadow-lg"
            >
              <div className="flex items-start justify-between">
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-charcoal text-downy font-bold border border-downy/20">
                  {dept.code}
                </span>
                <Badge variant={dept.isActive ? "success" : "neutral"}>
                  {dept.isActive ? "ACTIVE" : "INACTIVE"}
                </Badge>
              </div>
              <h3 className="text-base font-bold text-alice">{dept.name}</h3>
              <p className="text-xs text-alice-dim">
                HOD: {dept.hod?.user?.name || dept.hod?.name || "Dr. Meena Joshi"}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Sessions */}
      {activeTab === "sessions" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sessions.map((sess) => (
            <div
              key={sess._id}
              className="p-5 rounded-2xl bg-charcoal-card border border-charcoal-border hover:border-downy/30 transition-all space-y-4 shadow-lg flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-bold text-alice">{sess.label || sess.name}</h3>
                  <div className="flex flex-col items-end gap-1">
                    {sess.isCurrent && <Badge variant="downy">CURRENT ACTIVE</Badge>}
                    <Badge variant={sess.isEnrollmentOpen ? "success" : "neutral"}>
                      {sess.isEnrollmentOpen ? "REGISTRATION OPEN" : "REGISTRATION CLOSED"}
                    </Badge>
                  </div>
                </div>
                <div className="text-xs text-alice-muted space-y-1">
                  <div>Academic Year: {new Date(sess.startDate).toLocaleDateString()} — {new Date(sess.endDate).toLocaleDateString()}</div>
                  {sess.enrollmentStartDate && sess.enrollmentEndDate ? (
                    <div className="text-downy font-medium">
                      Timeline: {new Date(sess.enrollmentStartDate).toLocaleDateString()} to {new Date(sess.enrollmentEndDate).toLocaleDateString()}
                    </div>
                  ) : (
                    <div className="text-alice-dim">Timeline: Not scheduled</div>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-charcoal-border/50">
                <button
                  type="button"
                  onClick={() => handleOpenEnrollmentModal(sess)}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-charcoal-elevated border border-charcoal-border hover:border-melrose text-alice font-semibold text-xs tracking-wider cursor-pointer transition-all"
                >
                  <Calendar className="w-3.5 h-3.5 text-melrose" />
                  Manage Enrollment Window
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Course Subjects */}
      {activeTab === "subjects" && (
        <div className="rounded-3xl bg-charcoal-card border border-charcoal-border p-6 shadow-xl space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-alice">
              <thead className="bg-charcoal-elevated/70 text-xs uppercase tracking-wider text-alice-muted border-b border-charcoal-border">
                <tr>
                  <th className="py-3 px-4 font-semibold">Subject Code</th>
                  <th className="py-3 px-4 font-semibold">Course Title</th>
                  <th className="py-3 px-4 font-semibold text-center">Semester</th>
                  <th className="py-3 px-4 font-semibold text-center">Credits</th>
                  <th className="py-3 px-4 font-semibold text-center">Assigned Faculty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-border/50 text-xs">
                {subjects.map((s) => (
                  <tr key={s._id} className="hover:bg-charcoal-elevated/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-downy font-bold">{s.code}</td>
                    <td className="py-3.5 px-4 font-bold text-alice">{s.name}</td>
                    <td className="py-3.5 px-4 text-center font-mono">Sem {s.semester}</td>
                    <td className="py-3.5 px-4 text-center">
                      <Badge variant="melrose">{s.credits} Credits</Badge>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {s.faculty?.user?.name || s.faculty?.name || (
                        <span className="text-alice-dim">Unassigned</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal 1: Create Department */}
      <Modal
        isOpen={modalType === "dept"}
        onClose={() => setModalType(null)}
        title="Create Department"
        subtitle="Register new academic division (e.g. BCA, MCA, B.Tech)"
      >
        <form onSubmit={handleCreateDept} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-alice-muted uppercase mb-1">
              Department Name
            </label>
            <input
              type="text"
              required
              value={deptForm.name}
              onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
              placeholder="e.g. Bachelor of Computer Applications"
              className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-elevated border border-charcoal-border text-alice text-sm outline-none focus:border-downy"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-alice-muted uppercase mb-1">
              Department Code
            </label>
            <input
              type="text"
              required
              value={deptForm.code}
              onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value.toUpperCase() })}
              placeholder="e.g. BCA"
              className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-elevated border border-charcoal-border text-alice text-sm outline-none focus:border-downy uppercase font-mono"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModalType(null)}
              className="px-4 py-2 rounded-xl bg-charcoal-elevated text-alice-muted text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-downy text-charcoal font-bold text-xs uppercase hover:bg-downy-hover shadow-md shadow-downy/20"
            >
              {submitting ? "Saving..." : "Save Department"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Create Session */}
      <Modal
        isOpen={modalType === "session"}
        onClose={() => setModalType(null)}
        title="Add Academic Calendar Session"
        subtitle="Establish academic year range & current session lock"
      >
        <form onSubmit={handleCreateSession} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-alice-muted uppercase mb-1">
              Session Name
            </label>
            <input
              type="text"
              required
              value={sessionForm.name}
              onChange={(e) => setSessionForm({ ...sessionForm, name: e.target.value })}
              placeholder="e.g. 2026-2027"
              className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-elevated border border-charcoal-border text-alice text-sm outline-none focus:border-downy"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-alice-muted uppercase mb-1">
                Start Date
              </label>
              <input
                type="date"
                required
                value={sessionForm.startDate}
                onChange={(e) => setSessionForm({ ...sessionForm, startDate: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-elevated border border-charcoal-border text-alice text-sm outline-none focus:border-downy"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-alice-muted uppercase mb-1">
                End Date
              </label>
              <input
                type="date"
                required
                value={sessionForm.endDate}
                onChange={(e) => setSessionForm({ ...sessionForm, endDate: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-elevated border border-charcoal-border text-alice text-sm outline-none focus:border-downy"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isCurrentSess"
              checked={sessionForm.isCurrent}
              onChange={(e) => setSessionForm({ ...sessionForm, isCurrent: e.target.checked })}
              className="w-4 h-4 rounded bg-charcoal accent-downy cursor-pointer"
            />
            <label htmlFor="isCurrentSess" className="text-xs text-alice font-medium cursor-pointer">
              Set as currently active institutional session
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModalType(null)}
              className="px-4 py-2 rounded-xl bg-charcoal-elevated text-alice-muted text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-downy text-charcoal font-bold text-xs uppercase hover:bg-downy-hover shadow-md shadow-downy/20"
            >
              {submitting ? "Saving..." : "Save Session"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 3: Create Course Subject */}
      <Modal
        isOpen={modalType === "subject"}
        onClose={() => setModalType(null)}
        title="Add Course Subject"
        subtitle="Define course code, credit weighting, and department syllabus"
      >
        <form onSubmit={handleCreateSubject} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-alice-muted uppercase mb-1">
                Subject Code
              </label>
              <input
                type="text"
                required
                value={subjectForm.code}
                onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value.toUpperCase() })}
                placeholder="e.g. BCA-104"
                className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-elevated border border-charcoal-border text-alice text-sm outline-none focus:border-downy uppercase font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-alice-muted uppercase mb-1">
                Credits
              </label>
              <input
                type="number"
                min="1"
                max="8"
                required
                value={subjectForm.credits}
                onChange={(e) => setSubjectForm({ ...subjectForm, credits: parseInt(e.target.value, 10) })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-elevated border border-charcoal-border text-alice text-sm outline-none focus:border-downy"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-alice-muted uppercase mb-1">
              Course Title
            </label>
            <input
              type="text"
              required
              value={subjectForm.name}
              onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
              placeholder="e.g. Object Oriented Programming with C++"
              className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-elevated border border-charcoal-border text-alice text-sm outline-none focus:border-downy"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-alice-muted uppercase mb-1">
                Department
              </label>
              <select
                value={subjectForm.departmentId}
                onChange={(e) => setSubjectForm({ ...subjectForm, departmentId: e.target.value })}
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
                value={subjectForm.semester}
                onChange={(e) => setSubjectForm({ ...subjectForm, semester: parseInt(e.target.value, 10) })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-elevated border border-charcoal-border text-alice text-sm outline-none focus:border-downy"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModalType(null)}
              className="px-4 py-2 rounded-xl bg-charcoal-elevated text-alice-muted text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-downy text-charcoal font-bold text-xs uppercase hover:bg-downy-hover shadow-md shadow-downy/20"
            >
              {submitting ? "Saving..." : "Save Subject"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 4: Assign Faculty */}
      <Modal
        isOpen={modalType === "assign"}
        onClose={() => setModalType(null)}
        title="Assign Faculty Member to Subject"
        subtitle="Binds instructor permissions to conduct sessions and upload marks"
      >
        <form onSubmit={handleAssignFaculty} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-alice-muted uppercase mb-1">
              Course Subject
            </label>
            <select
              value={assignForm.subjectId}
              onChange={(e) => setAssignForm({ ...assignForm, subjectId: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-elevated border border-charcoal-border text-alice text-sm outline-none focus:border-melrose"
            >
              {subjects.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.code} — {s.name} (Sem {s.semester})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-alice-muted uppercase mb-1">
              Faculty Instructor
            </label>
            <select
              value={assignForm.facultyId}
              onChange={(e) => setAssignForm({ ...assignForm, facultyId: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-elevated border border-charcoal-border text-alice text-sm outline-none focus:border-melrose"
            >
              {facultyList.map((f) => (
                <option key={f._id} value={f._id}>
                  {f.user?.name || f.name} ({f.employeeId || "Faculty"} - {f.designation})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModalType(null)}
              className="px-4 py-2 rounded-xl bg-charcoal-elevated text-alice-muted text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-melrose text-charcoal font-bold text-xs uppercase hover:bg-melrose-light shadow-md shadow-melrose/20"
            >
              {submitting ? "Assigning..." : "Commit Assignment"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 5: Batch Cohort Enrollment */}
      <Modal
        isOpen={modalType === "batch"}
        onClose={() => setModalType(null)}
        title="Batch Cohort Enrollment"
        subtitle="Enrolls all active students of selected department & semester into course"
      >
        <form onSubmit={handleBatchEnroll} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-alice-muted uppercase mb-1">
                Department
              </label>
              <select
                value={batchForm.departmentId}
                onChange={(e) => setBatchForm({ ...batchForm, departmentId: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-elevated border border-charcoal-border text-alice text-sm outline-none focus:border-jonquil"
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
                Semester Cohort
              </label>
              <select
                value={batchForm.semester}
                onChange={(e) => setBatchForm({ ...batchForm, semester: parseInt(e.target.value, 10) })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-elevated border border-charcoal-border text-alice text-sm outline-none focus:border-jonquil"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-alice-muted uppercase mb-1">
              Course Subject to Enroll
            </label>
            <select
              value={batchForm.subjectId}
              onChange={(e) => setBatchForm({ ...batchForm, subjectId: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-elevated border border-charcoal-border text-alice text-sm outline-none focus:border-jonquil"
            >
              {subjects.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.code} — {s.name} (Sem {s.semester})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-alice-muted uppercase mb-1">
              Academic Session
            </label>
            <select
              value={batchForm.academicSessionId}
              onChange={(e) => setBatchForm({ ...batchForm, academicSessionId: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-elevated border border-charcoal-border text-alice text-sm outline-none focus:border-jonquil"
            >
              {sessions.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} {s.isCurrent ? "(Current)" : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModalType(null)}
              className="px-4 py-2 rounded-xl bg-charcoal-elevated text-alice-muted text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-jonquil text-charcoal font-bold text-xs uppercase hover:bg-jonquil-light shadow-md shadow-jonquil/20"
            >
              {submitting ? "Enrolling..." : "Execute Batch Enrollment"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 6: Configure Enrollment Window */}
      <Modal
        isOpen={modalType === "enrollmentWindow"}
        onClose={() => setModalType(null)}
        title="Student Registration Window"
        subtitle={`Configure DigiCampus course enrollment timeline for ${selectedSession?.label || selectedSession?.name || "Session"}`}
      >
        <form onSubmit={handleUpdateEnrollmentWindow} className="space-y-4">
          <div className="p-3.5 rounded-xl bg-charcoal-elevated border border-charcoal-border space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-alice">Registration Status</p>
                <p className="text-[11px] text-alice-muted">Allow students to self-enroll/drop semester courses</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={windowForm.isEnrollmentOpen}
                  onChange={(e) => setWindowForm({ ...windowForm, isEnrollmentOpen: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-charcoal rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-downy"></div>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-alice-muted uppercase mb-1">
                Window Start Date
              </label>
              <input
                type="date"
                value={windowForm.enrollmentStartDate}
                onChange={(e) => setWindowForm({ ...windowForm, enrollmentStartDate: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-elevated border border-charcoal-border text-alice text-sm outline-none focus:border-downy"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-alice-muted uppercase mb-1">
                Window End Date
              </label>
              <input
                type="date"
                value={windowForm.enrollmentEndDate}
                onChange={(e) => setWindowForm({ ...windowForm, enrollmentEndDate: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-elevated border border-charcoal-border text-alice text-sm outline-none focus:border-downy"
              />
            </div>
          </div>

          <div className="text-[11px] text-alice-dim leading-relaxed bg-charcoal p-3 rounded-xl border border-charcoal-border/50">
            💡 When enabled, students can register for their semester subjects through the DigiCampus Course Registration portal. Faculty will immediately see the newly registered students on their attendance rosters.
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModalType(null)}
              className="px-4 py-2 rounded-xl bg-charcoal-elevated text-alice-muted text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-downy text-charcoal font-bold text-xs uppercase hover:bg-downy-hover shadow-md shadow-downy/20"
            >
              {submitting ? "Saving..." : "Save Timeline"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

