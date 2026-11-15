import React, { useState, useEffect } from "react";
import { academicApi } from "../../api/academicApi";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { formatApiError } from "../../utils/errorHelper";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { Badge } from "../../components/common/Badge";
import {
  BookOpen,
  Calendar,
  CheckCircle,
  AlertCircle,
  Clock,
  Layers,
  GraduationCap,
  PlusCircle,
  MinusCircle,
  Sparkles,
} from "lucide-react";

export const StudentEnrollmentPage = () => {
  const { user } = useAuth();
  const { success, error, warning } = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [studentInfo, setStudentInfo] = useState(null);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [enrollmentWindow, setEnrollmentWindow] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState(new Set());

  const fetchEnrollmentData = async () => {
    try {
      setLoading(true);
      const res = await academicApi.getAvailableSubjects();
      const data = res?.data || {};

      setStudentInfo(data.student || null);
      setSessionInfo(data.session || null);
      setEnrollmentWindow(data.enrollmentWindow || null);

      const subList = data.subjects || [];
      setSubjects(subList);

      // Pre-select subjects that are already enrolled
      const enrolledIds = new Set(
        subList.filter((s) => s.isEnrolled).map((s) => s._id)
      );
      setSelectedSubjectIds(enrolledIds);
    } catch (err) {
      error(formatApiError(err, "Failed to load course enrollment data."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnrollmentData();
  }, []);

  const handleToggleSelect = (subjectId) => {
    if (!enrollmentWindow?.isOpen) {
      warning("Registration is currently locked by administration.");
      return;
    }
    const next = new Set(selectedSubjectIds);
    if (next.has(subjectId)) {
      next.delete(subjectId);
    } else {
      next.add(subjectId);
    }
    setSelectedSubjectIds(next);
  };

  const handleSelectAllOffered = () => {
    if (!enrollmentWindow?.isOpen) return;
    const allIds = new Set(subjects.map((s) => s._id));
    setSelectedSubjectIds(allIds);
  };

  const handleClearSelection = () => {
    if (!enrollmentWindow?.isOpen) return;
    setSelectedSubjectIds(new Set());
  };

  const handleConfirmEnrollment = async () => {
    if (!enrollmentWindow?.isOpen) {
      warning("Subject enrollment is closed.");
      return;
    }

    if (selectedSubjectIds.size === 0) {
      warning("Please select at least one subject to register.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await academicApi.selfEnrollSubjects(Array.from(selectedSubjectIds));
      success(res?.message || "Course registration updated successfully!");
      await fetchEnrollmentData();
    } catch (err) {
      error(formatApiError(err, "Failed to confirm course enrollment."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDropSubject = async (subjectId, subjectName) => {
    if (!enrollmentWindow?.isOpen) {
      warning("Enrollment window is closed. Dropping subjects is locked.");
      return;
    }

    if (!window.confirm(`Are you sure you want to drop "${subjectName}"?`)) return;

    try {
      setSubmitting(true);
      await academicApi.selfDropSubject(subjectId);
      success(`Dropped "${subjectName}" successfully.`);
      await fetchEnrollmentData();
    } catch (err) {
      error(formatApiError(err, "Failed to drop subject."));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading DigiCampus Course Registration portal..." />;
  }

  const isWindowOpen = Boolean(enrollmentWindow?.isOpen);
  const enrolledSubjects = subjects.filter((s) => s.isEnrolled);
  const totalCreditsEnrolled = enrolledSubjects.reduce((acc, curr) => acc + (curr.credits || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-alice tracking-tight">
              DigiCampus Course Registration
            </h1>
            <Badge variant={isWindowOpen ? "success" : "neutral"}>
              {isWindowOpen ? "WINDOW OPEN" : "WINDOW CLOSED"}
            </Badge>
          </div>
          <p className="text-xs text-alice-muted mt-1">
            Enroll in your prescribed semester courses within the institutional registration timeline.
          </p>
        </div>

        {isWindowOpen && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleSelectAllOffered}
              type="button"
              className="px-3.5 py-2 rounded-xl bg-charcoal-elevated border border-charcoal-border hover:border-downy text-alice text-xs font-semibold cursor-pointer transition-all"
            >
              Select All
            </button>
            <button
              onClick={handleConfirmEnrollment}
              disabled={submitting}
              type="button"
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-downy text-charcoal font-bold text-xs uppercase tracking-wider hover:bg-downy-hover shadow-md shadow-downy/20 cursor-pointer disabled:opacity-50 transition-all"
            >
              <CheckCircle className="w-4 h-4" />
              {submitting ? "Registering..." : `Confirm Enrollment (${selectedSubjectIds.size})`}
            </button>
          </div>
        )}
      </div>

      {/* Registration Timeline Notice Card */}
      <div
        className={`p-5 rounded-2xl border transition-all ${
          isWindowOpen
            ? "bg-downy/5 border-downy/30 shadow-lg shadow-downy/5"
            : "bg-charcoal-card border-charcoal-border"
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isWindowOpen ? "bg-downy/15 text-downy" : "bg-charcoal text-alice-muted"
              }`}
            >
              {isWindowOpen ? <Clock className="w-5 h-5 animate-pulse" /> : <AlertCircle className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-alice">
                {isWindowOpen
                  ? "Semester Course Self-Registration is Active"
                  : "Course Registration Timeline Closed"}
              </h3>
              <p className="text-xs text-alice-dim mt-0.5">
                {isWindowOpen
                  ? "Select your required syllabus courses below and click 'Confirm Enrollment'. Faculty instructors will instantly access your registration."
                  : "The registration window is locked by college administration. No new courses can be added or dropped at this time."}
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className="text-xs font-semibold text-alice">
              Academic Session: <span className="text-downy font-mono">{sessionInfo?.label || sessionInfo?.name || "2026-2027"}</span>
            </div>
            {sessionInfo?.enrollmentStartDate && sessionInfo?.enrollmentEndDate ? (
              <div className="text-[11px] text-alice-muted mt-0.5">
                Window: {new Date(sessionInfo.enrollmentStartDate).toLocaleDateString()} to{" "}
                {new Date(sessionInfo.enrollmentEndDate).toLocaleDateString()}
              </div>
            ) : (
              <div className="text-[11px] text-alice-dim mt-0.5">Timeline: Managed by Admin</div>
            )}
          </div>
        </div>
      </div>

      {/* Student Profile Quick Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-charcoal-card border border-charcoal-border">
          <div className="text-[10px] uppercase font-bold text-alice-dim tracking-wider">Student Name</div>
          <div className="text-sm font-bold text-alice truncate mt-0.5">{user?.name}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-charcoal-card border border-charcoal-border">
          <div className="text-[10px] uppercase font-bold text-alice-dim tracking-wider">Roll Number</div>
          <div className="text-sm font-bold font-mono text-downy mt-0.5">{studentInfo?.rollNumber || "N/A"}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-charcoal-card border border-charcoal-border">
          <div className="text-[10px] uppercase font-bold text-alice-dim tracking-wider">Current Semester</div>
          <div className="text-sm font-bold text-melrose mt-0.5">Semester {studentInfo?.currentSemester || 1}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-charcoal-card border border-charcoal-border">
          <div className="text-[10px] uppercase font-bold text-alice-dim tracking-wider">Total Enrolled Credits</div>
          <div className="text-sm font-bold text-jonquil mt-0.5">{totalCreditsEnrolled} Credits</div>
        </div>
      </div>

      {/* Course Selection Table */}
      <div className="rounded-3xl bg-charcoal-card border border-charcoal-border p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-alice flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-downy" />
              Prescribed Curriculum Courses for Semester {studentInfo?.currentSemester || 1}
            </h2>
            <p className="text-xs text-alice-dim mt-0.5">
              Available courses offered by your department for the current active semester.
            </p>
          </div>
          <div className="text-xs text-alice-muted font-medium">
            Enrolled: <span className="text-downy font-bold">{enrolledSubjects.length}</span> / {subjects.length} courses
          </div>
        </div>

        {subjects.length === 0 ? (
          <div className="text-center py-12 text-alice-dim text-sm">
            No subjects are currently configured for your semester by the department.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-alice">
              <thead className="bg-charcoal-elevated/70 text-xs uppercase tracking-wider text-alice-muted border-b border-charcoal-border">
                <tr>
                  {isWindowOpen && (
                    <th className="py-3 px-4 w-12 text-center">
                      <span className="sr-only">Select</span>
                    </th>
                  )}
                  <th className="py-3 px-4 font-semibold">Subject Code</th>
                  <th className="py-3 px-4 font-semibold">Course Title</th>
                  <th className="py-3 px-4 font-semibold text-center">Type</th>
                  <th className="py-3 px-4 font-semibold text-center">Credits</th>
                  <th className="py-3 px-4 font-semibold">Assigned Faculty</th>
                  <th className="py-3 px-4 font-semibold text-center">Enrollment Status</th>
                  {isWindowOpen && <th className="py-3 px-4 font-semibold text-center">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-border/50 text-xs">
                {subjects.map((sub) => {
                  const isChecked = selectedSubjectIds.has(sub._id);
                  const facultyName =
                    sub.assignedFaculty?.userId?.name ||
                    sub.assignedFaculty?.name ||
                    "Faculty to be announced";

                  return (
                    <tr
                      key={sub._id}
                      className={`transition-colors ${
                        sub.isEnrolled
                          ? "bg-downy/5 hover:bg-downy/10"
                          : "hover:bg-charcoal-elevated/40"
                      }`}
                    >
                      {isWindowOpen && (
                        <td className="py-3.5 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleSelect(sub._id)}
                            className="w-4 h-4 rounded bg-charcoal accent-downy cursor-pointer"
                          />
                        </td>
                      )}
                      <td className="py-3.5 px-4 font-mono font-bold text-downy">{sub.code}</td>
                      <td className="py-3.5 px-4 font-bold text-alice">
                        {sub.name}
                        {sub.description && (
                          <p className="text-[11px] font-normal text-alice-dim mt-0.5 line-clamp-1">
                            {sub.description}
                          </p>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="capitalize text-alice-muted">{sub.subjectType || "Theory"}</span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Badge variant="melrose">{sub.credits || 4} Cr</Badge>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-alice">{facultyName}</div>
                        {sub.assignedFaculty?.designation && (
                          <div className="text-[10px] text-alice-dim">{sub.assignedFaculty.designation}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {sub.isEnrolled ? (
                          <Badge variant="success">ENROLLED</Badge>
                        ) : (
                          <Badge variant="neutral">NOT REGISTERED</Badge>
                        )}
                      </td>
                      {isWindowOpen && (
                        <td className="py-3.5 px-4 text-center">
                          {sub.isEnrolled ? (
                            <button
                              type="button"
                              onClick={() => handleDropSubject(sub._id, sub.name)}
                              disabled={submitting}
                              className="inline-flex items-center gap-1 text-[11px] text-red-400 hover:text-red-300 font-semibold cursor-pointer transition-colors"
                            >
                              <MinusCircle className="w-3.5 h-3.5" /> Drop
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                const next = new Set(selectedSubjectIds);
                                next.add(sub._id);
                                setSelectedSubjectIds(next);
                              }}
                              className="inline-flex items-center gap-1 text-[11px] text-downy hover:underline font-semibold cursor-pointer"
                            >
                              <PlusCircle className="w-3.5 h-3.5" /> Select
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {isWindowOpen && (
          <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-charcoal-border/50">
            <div className="text-xs text-alice-dim">
              Selected <span className="text-downy font-bold">{selectedSubjectIds.size}</span> of {subjects.length} courses to register.
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleClearSelection}
                className="px-4 py-2 rounded-xl bg-charcoal-elevated text-alice-muted hover:text-alice text-xs font-semibold cursor-pointer"
              >
                Clear Selection
              </button>
              <button
                type="button"
                onClick={handleConfirmEnrollment}
                disabled={submitting || selectedSubjectIds.size === 0}
                className="inline-flex items-center gap-2 px-6 py-2 rounded-xl bg-downy text-charcoal font-bold text-xs uppercase tracking-wider hover:bg-downy-hover shadow-md shadow-downy/20 cursor-pointer disabled:opacity-50 transition-all"
              >
                <CheckCircle className="w-4 h-4" />
                {submitting ? "Saving Registration..." : "Save Course Registration"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
