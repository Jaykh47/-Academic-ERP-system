import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { academicApi } from "../../api/academicApi";
import { attendanceApi } from "../../api/attendanceApi";
import { adminApi } from "../../api/adminApi";
import { useToast } from "../../context/ToastContext";
import { formatApiError } from "../../utils/errorHelper";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { Badge } from "../../components/common/Badge";
import { Modal } from "../../components/common/Modal";
import {
  CheckSquare,
  Users,
  Calendar,
  Lock,
  Unlock,
  Plus,
  Save,
  CheckCircle,
  XCircle,
  Clock,
  Sparkles,
} from "lucide-react";

const PERIOD_TIMES = {
  "1": { start: "09:00", end: "10:00", label: "Period 1 (09:00 - 10:00)" },
  "2": { start: "10:00", end: "11:00", label: "Period 2 (10:00 - 11:00)" },
  "3": { start: "11:15", end: "12:15", label: "Period 3 (11:15 - 12:15)" },
  "4": { start: "12:15", end: "13:15", label: "Period 4 (12:15 - 13:15)" },
  "5": { start: "14:00", end: "15:00", label: "Period 5 (14:00 - 15:00)" },
};

export const ClassAttendancePage = () => {
  const [searchParams] = useSearchParams();
  const initialSubjectId = searchParams.get("subjectId");
  const { success, error, warning } = useToast();

  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState([]);
  const [academicSessions, setAcademicSessions] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState(initialSubjectId || "");
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // New session modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTopic, setNewTopic] = useState("");
  const [newDate, setNewDate] = useState(new Date().toISOString().split("T")[0]);
  const [newPeriod, setNewPeriod] = useState("1");
  const [newRoom, setNewRoom] = useState("LH-101");

  // Load subjects & academic sessions
  useEffect(() => {
    const fetchInit = async () => {
      try {
        setLoading(true);
        const [subsRes, sessRes] = await Promise.allSettled([
          academicApi.getSubjects(),
          adminApi.getSessions(),
        ]);

        if (subsRes.status === "fulfilled") {
          const subs = subsRes.value?.data?.subjects || [];
          setSubjects(subs);
          if (!selectedSubjectId && subs.length > 0) {
            setSelectedSubjectId(subs[0]._id);
          }
        }

        if (sessRes.status === "fulfilled") {
          setAcademicSessions(sessRes.value?.data?.sessions || []);
        }
      } catch (err) {
        error(formatApiError(err, "Failed to load subjects"));
      } finally {
        setLoading(false);
      }
    };
    fetchInit();
  }, []);

  // When subject changes, fetch sessions and enrolled students
  useEffect(() => {
    if (!selectedSubjectId) return;

    const fetchSubjectData = async () => {
      try {
        const [sessRes, enrollRes] = await Promise.all([
          attendanceApi.getClassSessions({ subjectId: selectedSubjectId }),
          academicApi.getEnrolledStudents(selectedSubjectId),
        ]);

        const sessionList = sessRes?.data?.sessions || [];
        setSessions(sessionList);
        if (sessionList.length > 0) {
          setSelectedSession(sessionList[0]);
        } else {
          setSelectedSession(null);
        }

        const enrolled = enrollRes?.data?.enrollments || [];
        setStudents(enrolled);

        // Pre-fill attendance map as "present" by default
        const initialMap = {};
        enrolled.forEach((item) => {
          const sId = item.student?._id || item.student?.id || item._id;
          initialMap[sId] = "present";
        });
        setAttendanceMap(initialMap);
      } catch (err) {
        // Tolerant
      }
    };

    fetchSubjectData();
  }, [selectedSubjectId]);

  const handleCreateSession = async (e) => {
    e.preventDefault();
    if (!newTopic) {
      warning("Please enter a lecture topic.");
      return;
    }

    const currentSess = academicSessions.find((s) => s.isCurrent) || academicSessions[0];
    if (!currentSess) {
      warning("No academic session available. Please create one in Academic Setup.");
      return;
    }

    const times = PERIOD_TIMES[newPeriod] || PERIOD_TIMES["1"];

    try {
      setSubmitting(true);
      const res = await attendanceApi.createClassSession({
        subjectId: selectedSubjectId,
        academicSessionId: currentSess._id,
        date: newDate,
        startTime: times.start,
        endTime: times.end,
        sessionType: "lecture",
        topic: newTopic,
        room: newRoom || "LH-101",
      });

      success("Class session scheduled successfully!");
      setIsModalOpen(false);
      setNewTopic("");

      const created = res?.data?.session;
      if (created) {
        setSessions((prev) => [created, ...prev]);
        setSelectedSession(created);
      }
    } catch (err) {
      error(formatApiError(err, "Failed to schedule class session"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkAll = (status) => {
    const updated = {};
    students.forEach((item) => {
      const sId = item.student?._id || item.student?.id || item._id;
      updated[sId] = status;
    });
    setAttendanceMap(updated);
  };

  const handleToggleStatus = (studentId, status) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleSubmitAttendance = async () => {
    if (!selectedSession) {
      warning("Please select or create a class session first.");
      return;
    }

    const records = Object.entries(attendanceMap).map(([studentId, status]) => ({
      studentId,
      status: status === "excused" ? "absent" : status, // Backend requires present, absent, or late
    }));

    try {
      setSubmitting(true);
      await attendanceApi.submitAttendance(selectedSession._id, records);
      success("Attendance successfully submitted & locked!");
      setSelectedSession((prev) => ({ ...prev, isAttendanceSubmitted: true }));
    } catch (err) {
      error(formatApiError(err, "Failed to submit attendance"));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading attendance management system..." />;
  }

  // Tally calculations
  const totalEnrolled = students.length;
  const presentCount = Object.values(attendanceMap).filter((s) => s === "present").length;
  const absentCount = Object.values(attendanceMap).filter((s) => s === "absent").length;
  const lateCount = Object.values(attendanceMap).filter((s) => s === "late").length;
  const attendanceRate = totalEnrolled > 0 ? Math.round((presentCount / totalEnrolled) * 100) : 0;

  const isLocked = selectedSession?.isAttendanceSubmitted;

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-alice tracking-tight">
            Class Session Attendance Roster
          </h1>
          <p className="text-xs text-alice-muted mt-1">
            Conduct daily roll call, mark statuses, and commit immutable attendance records with submission lock.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-downy text-charcoal font-bold text-xs uppercase tracking-wider hover:bg-downy-hover shadow-lg shadow-downy/20 transition-all cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule New Session</span>
        </button>
      </div>

      {/* Selectors Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-charcoal-card border border-charcoal-border space-y-1.5">
          <label className="text-xs font-semibold text-alice-muted uppercase tracking-wider">
            Select Course / Module
          </label>
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-elevated border border-charcoal-border text-alice text-sm font-medium outline-none focus:border-downy"
          >
            {subjects.map((s) => (
              <option key={s._id} value={s._id}>
                {s.code} — {s.name} (Sem {s.semester})
              </option>
            ))}
          </select>
        </div>

        <div className="p-4 rounded-2xl bg-charcoal-card border border-charcoal-border space-y-1.5">
          <label className="text-xs font-semibold text-alice-muted uppercase tracking-wider">
            Select Class Session
          </label>
          <select
            value={selectedSession?._id || ""}
            onChange={(e) => {
              const sess = sessions.find((s) => s._id === e.target.value);
              setSelectedSession(sess || null);
            }}
            className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-elevated border border-charcoal-border text-alice text-sm font-medium outline-none focus:border-downy"
          >
            {sessions.length > 0 ? (
              sessions.map((sess) => (
                <option key={sess._id} value={sess._id}>
                  {new Date(sess.date).toLocaleDateString()} — {sess.topic || "Class Lecture"} ({sess.startTime} - {sess.endTime}){" "}
                  {sess.isAttendanceSubmitted ? "[LOCKED]" : "[OPEN]"}
                </option>
              ))
            ) : (
              <option value="">No sessions scheduled yet</option>
            )}
          </select>
        </div>
      </div>

      {/* Session Details & Lock Status Banner */}
      {selectedSession && (
        <div className="p-5 rounded-2xl bg-charcoal-card border border-charcoal-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-alice">
                {selectedSession.topic || "Lecture Session"}
              </span>
              <Badge variant={isLocked ? "downy" : "warning"}>
                {isLocked ? (
                  <span className="flex items-center gap-1">
                    <Lock className="w-3 h-3" /> SUBMITTED & LOCKED
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Unlock className="w-3 h-3" /> PENDING SUBMISSION
                  </span>
                )}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-xs text-alice-dim">
              <span>Date: {new Date(selectedSession.date).toLocaleDateString()}</span>
              <span>•</span>
              <span>Time: {selectedSession.startTime} - {selectedSession.endTime}</span>
              <span>•</span>
              <span>Room: {selectedSession.room || "LH-101"}</span>
            </div>
          </div>

          {/* Quick Mark All Row */}
          {!isLocked && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-alice-muted font-medium">Quick Mark:</span>
              <button
                onClick={() => handleMarkAll("present")}
                className="px-3 py-1.5 rounded-lg bg-downy/15 text-downy border border-downy/30 hover:bg-downy/25 text-xs font-bold transition-all cursor-pointer"
              >
                All Present
              </button>
              <button
                onClick={() => handleMarkAll("absent")}
                className="px-3 py-1.5 rounded-lg bg-rose-500/15 text-rose-400 border border-rose-500/30 hover:bg-rose-500/25 text-xs font-bold transition-all cursor-pointer"
              >
                All Absent
              </button>
            </div>
          )}
        </div>
      )}

      {/* Real-time Tally Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-charcoal-card border border-charcoal-border text-center">
          <div className="text-[11px] text-alice-muted uppercase font-semibold">Total Students</div>
          <div className="text-xl font-bold text-alice mt-0.5">{totalEnrolled}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-charcoal-card border border-downy/30 text-center">
          <div className="text-[11px] text-downy uppercase font-semibold">Present</div>
          <div className="text-xl font-bold text-downy mt-0.5">{presentCount}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-charcoal-card border border-rose-500/30 text-center">
          <div className="text-[11px] text-rose-400 uppercase font-semibold">Absent</div>
          <div className="text-xl font-bold text-rose-400 mt-0.5">{absentCount}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-charcoal-card border border-jonquil/30 text-center">
          <div className="text-[11px] text-jonquil uppercase font-semibold">Session Rate</div>
          <div className="text-xl font-bold text-jonquil mt-0.5">{attendanceRate}%</div>
        </div>
      </div>

      {/* Student Roster Table */}
      <div className="rounded-3xl bg-charcoal-card border border-charcoal-border p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-alice">Enrolled Students Attendance Roster</h3>
          {!isLocked && (
            <button
              onClick={handleSubmitAttendance}
              disabled={submitting || totalEnrolled === 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-downy text-charcoal font-bold text-xs uppercase tracking-wider hover:bg-downy-hover shadow-lg shadow-downy/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{submitting ? "Submitting..." : "Submit & Lock Roster"}</span>
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-alice">
            <thead className="bg-charcoal-elevated/70 text-xs uppercase tracking-wider text-alice-muted border-b border-charcoal-border">
              <tr>
                <th className="py-3 px-4 font-semibold">#</th>
                <th className="py-3 px-4 font-semibold">Roll Number</th>
                <th className="py-3 px-4 font-semibold">Student Name</th>
                <th className="py-3 px-4 font-semibold text-center">Attendance Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal-border/50 text-xs">
              {students.length > 0 ? (
                students.map((item, idx) => {
                  const student = item.student || item;
                  const sId = student._id || student.id || item._id;
                  const currentStatus = attendanceMap[sId] || "present";

                  return (
                    <tr key={sId || idx} className="hover:bg-charcoal-elevated/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-alice-dim">{idx + 1}</td>
                      <td className="py-3.5 px-4 font-mono text-downy font-semibold">
                        {student.rollNumber || `BCA-0${idx + 1}`}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-alice">
                        {student.user?.name || student.name || "Student"}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-2">
                          {["present", "absent", "late"].map((st) => {
                            const isSelected = currentStatus === st;
                            let style = "bg-charcoal text-alice-dim hover:text-alice";
                            if (isSelected) {
                              if (st === "present") style = "bg-downy text-charcoal font-bold shadow-sm shadow-downy/30";
                              else if (st === "absent") style = "bg-rose-500 text-white font-bold shadow-sm shadow-rose-500/30";
                              else if (st === "late") style = "bg-jonquil text-charcoal font-bold shadow-sm shadow-jonquil/30";
                            }

                            return (
                              <button
                                key={st}
                                disabled={isLocked}
                                onClick={() => handleToggleStatus(sId, st)}
                                className={`px-3 py-1 rounded-lg text-xs uppercase tracking-wider transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer ${style}`}
                              >
                                {st}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-alice-muted">
                    No enrolled students found for this subject.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Schedule Class Session Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Schedule New Class Session"
        subtitle="Log lecture topics and generate attendance session slot"
      >
        <form onSubmit={handleCreateSession} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-alice-muted uppercase mb-1">
              Lecture Topic
            </label>
            <input
              type="text"
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              placeholder="e.g. Relational Normalization & 3NF"
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-elevated border border-charcoal-border text-alice text-sm outline-none focus:border-downy"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-alice-muted uppercase mb-1">
                Session Date
              </label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-elevated border border-charcoal-border text-alice text-sm outline-none focus:border-downy"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-alice-muted uppercase mb-1">
                Period Slot
              </label>
              <select
                value={newPeriod}
                onChange={(e) => setNewPeriod(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-elevated border border-charcoal-border text-alice text-sm outline-none focus:border-downy"
              >
                {Object.entries(PERIOD_TIMES).map(([num, val]) => (
                  <option key={num} value={num}>
                    {val.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-alice-muted uppercase mb-1">
              Lecture Hall / Lab
            </label>
            <input
              type="text"
              value={newRoom}
              onChange={(e) => setNewRoom(e.target.value)}
              placeholder="LH-101 or Computer Lab 2"
              className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-elevated border border-charcoal-border text-alice text-sm outline-none focus:border-downy"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-charcoal-elevated text-alice-muted hover:text-alice text-xs font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-downy text-charcoal font-bold text-xs uppercase hover:bg-downy-hover shadow-md shadow-downy/20 cursor-pointer"
            >
              {submitting ? "Creating..." : "Create Session"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
