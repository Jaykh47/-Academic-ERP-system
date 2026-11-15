import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { academicApi } from "../../api/academicApi";
import { marksApi } from "../../api/marksApi";
import { adminApi } from "../../api/adminApi";
import { useToast } from "../../context/ToastContext";
import { formatApiError } from "../../utils/errorHelper";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { Badge } from "../../components/common/Badge";
import { Modal } from "../../components/common/Modal";
import {
  Award,
  Save,
  Plus,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Sparkles,
} from "lucide-react";

export const MarksEntryPage = () => {
  const [searchParams] = useSearchParams();
  const initialSubjectId = searchParams.get("subjectId");
  const { success, error, warning } = useToast();

  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState([]);
  const [academicSessions, setAcademicSessions] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState(initialSubjectId || "");
  const [examinations, setExaminations] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [students, setStudents] = useState([]);
  const [marksMap, setMarksMap] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Modal for scheduling exam
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [examName, setExamName] = useState("");
  const [examType, setExamType] = useState("semester"); // "internal_test" | "semester" | "assignment" | "practical" | "quiz" | "viva"
  const [maxMarks, setMaxMarks] = useState(70);
  const [passMarks, setPassMarks] = useState(28);
  const [weightage, setWeightage] = useState(40);

  // Helper for UGC 10-point CBCS grading
  const calculateGrade = (score, max) => {
    if (score === null || score === undefined || isNaN(score)) return { grade: "-", gp: 0 };
    const pct = (score / max) * 100;
    if (pct >= 90) return { grade: "O", gp: 10 };
    if (pct >= 80) return { grade: "A+", gp: 9 };
    if (pct >= 70) return { grade: "A", gp: 8 };
    if (pct >= 60) return { grade: "B+", gp: 7 };
    if (pct >= 55) return { grade: "B", gp: 6 };
    if (pct >= 50) return { grade: "C", gp: 5 };
    if (pct >= 40) return { grade: "P", gp: 4 };
    return { grade: "F", gp: 0 };
  };

  useEffect(() => {
    const fetchInit = async () => {
      try {
        setLoading(true);
        const [subsRes, sessRes] = await Promise.allSettled([
          academicApi.getMyAssignedSubjects(),
          academicApi.getSessions(),
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

  useEffect(() => {
    if (!selectedSubjectId) return;

    const fetchExamsAndStudents = async () => {
      try {
        const [examsRes, enrollRes] = await Promise.all([
          marksApi.getExaminations({ subjectId: selectedSubjectId }),
          academicApi.getEnrolledStudents(selectedSubjectId),
        ]);

        const examList = examsRes?.data?.examinations || [];
        setExaminations(examList);
        if (examList.length > 0) {
          setSelectedExam(examList[0]);
        } else {
          setSelectedExam(null);
        }

        const enrolled = enrollRes?.data?.enrollments || [];
        setStudents(enrolled);

        // Initialize marks map
        const initial = {};
        enrolled.forEach((item) => {
          const sId =
            (item.studentId && typeof item.studentId === "object" ? item.studentId._id : item.studentId) ||
            item.student?._id ||
            item.student?.id ||
            item._id;
          if (sId) {
            initial[sId] = { marksObtained: "", isAbsent: false };
          }
        });
        setMarksMap(initial);
      } catch (err) {
        // Tolerant
      }
    };

    fetchExamsAndStudents();
  }, [selectedSubjectId]);

  // Load existing results sheet if an exam is selected
  useEffect(() => {
    if (!selectedExam?._id) return;
    const fetchExistingMarks = async () => {
      try {
        const res = await marksApi.getExaminationResultSheet(selectedExam._id);
        const results = res?.data?.results || [];
        if (results.length > 0) {
          const loadedMap = {};
          results.forEach((r) => {
            const sid =
              r.studentId?._id ||
              (typeof r.studentId === "string" ? r.studentId : null);
            if (sid) {
              loadedMap[sid] = {
                marksObtained: r.isAbsent ? "" : r.obtainedMarks,
                isAbsent: Boolean(r.isAbsent),
              };
            }
          });
          setMarksMap((prev) => ({ ...prev, ...loadedMap }));
        }
      } catch {
        // Tolerant
      }
    };
    fetchExistingMarks();
  }, [selectedExam?._id]);

  const handleCreateExam = async (e) => {
    e.preventDefault();
    if (!examName) {
      warning("Please provide an examination title.");
      return;
    }

    const currentSess = academicSessions.find((s) => s.isCurrent) || academicSessions[0];
    if (!currentSess) {
      warning("No academic session available.");
      return;
    }

    const selectedSubject = subjects.find((s) => s._id === selectedSubjectId);
    const semester = selectedSubject?.semester || 1;
    const max = parseFloat(maxMarks) || 100;
    const pass = parseFloat(passMarks) || Math.round(max * 0.4);

    if (pass > max) {
      warning("Pass marks cannot exceed maximum marks.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await marksApi.createExamination({
        name: examName,
        examType,
        subjectId: selectedSubjectId,
        academicSessionId: currentSess._id,
        semester,
        maximumMarks: max,
        passMarks: pass,
        weightage: parseFloat(weightage) || 30,
      });

      success("Examination created successfully!");
      setIsModalOpen(false);
      setExamName("");

      const created = res?.data?.examination;
      if (created) {
        setExaminations((prev) => [created, ...prev]);
        setSelectedExam(created);
      }
    } catch (err) {
      error(formatApiError(err, "Failed to create examination"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleScoreChange = (studentId, val) => {
    const num = val === "" ? "" : Number(val);
    const limit = selectedExam?.maximumMarks || 100;

    if (num !== "" && (num < 0 || num > limit)) {
      warning(`Score cannot exceed maximum marks (${limit}).`);
      return;
    }

    setMarksMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        marksObtained: num,
      },
    }));
  };

  const handleAbsentToggle = (studentId) => {
    setMarksMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        isAbsent: !prev[studentId]?.isAbsent,
        marksObtained: !prev[studentId]?.isAbsent ? 0 : "",
      },
    }));
  };

  const handleSubmitMarks = async () => {
    if (!selectedExam) {
      warning("Please select or schedule an examination first.");
      return;
    }

    const marks = Object.entries(marksMap)
      .filter(([_, item]) => item.isAbsent || item.marksObtained !== "")
      .map(([studentId, item]) => ({
        studentId,
        obtainedMarks: item.isAbsent ? 0 : Number(item.marksObtained),
        isAbsent: Boolean(item.isAbsent),
      }));

    if (marks.length === 0) {
      warning("Please input scores for at least one student.");
      return;
    }

    try {
      setSubmitting(true);
      await marksApi.submitMarks(selectedExam._id, marks);

      success(`Successfully published grades for ${marks.length} students!`);
    } catch (err) {
      error(formatApiError(err, "Failed to upload marks"));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading examination scoring sheets..." />;
  }

  const currentMax = selectedExam?.maximumMarks || 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-alice tracking-tight">
            Examination Marks Entry & CBCS Grading
          </h1>
          <p className="text-xs text-alice-muted mt-1">
            Input assessment scores, enforce ceiling limits (&le; Max Marks), and calculate credit-weighted CBCS letter grades.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-melrose text-charcoal font-bold text-xs uppercase tracking-wider hover:bg-melrose-light shadow-lg shadow-melrose/20 transition-all cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Examination</span>
        </button>
      </div>

      {/* Course & Exam Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-charcoal-card border border-charcoal-border space-y-1.5">
          <label className="text-xs font-semibold text-alice-muted uppercase tracking-wider">
            Select Course / Subject
          </label>
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-elevated border border-charcoal-border text-alice text-sm font-medium outline-none focus:border-melrose"
          >
            {subjects.map((s) => (
              <option key={s._id} value={s._id}>
                {s.code} — {s.name} (Semester {s.semester}, Credits: {s.credits})
              </option>
            ))}
          </select>
        </div>

        <div className="p-4 rounded-2xl bg-charcoal-card border border-charcoal-border space-y-1.5">
          <label className="text-xs font-semibold text-alice-muted uppercase tracking-wider">
            Select Examination
          </label>
          <select
            value={selectedExam?._id || ""}
            onChange={(e) => {
              const ex = examinations.find((x) => x._id === e.target.value);
              setSelectedExam(ex || null);
            }}
            className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-elevated border border-charcoal-border text-alice text-sm font-medium outline-none focus:border-melrose"
          >
            {examinations.length > 0 ? (
              examinations.map((ex) => (
                <option key={ex._id} value={ex._id}>
                  {ex.name} — {ex.examType?.replace("_", " ")?.toUpperCase()} (Max: {ex.maximumMarks}, Weight: {ex.weightage}%)
                </option>
              ))
            ) : (
              <option value="">No examinations created yet</option>
            )}
          </select>
        </div>
      </div>

      {/* Exam Specs Card */}
      {selectedExam && (
        <div className="p-4 rounded-2xl bg-charcoal-card border border-charcoal-border flex items-center justify-between text-xs text-alice-muted">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-alice-dim uppercase">Assessment:</span>{" "}
              <strong className="text-alice">{selectedExam.name}</strong>
            </div>
            <div>
              <span className="text-alice-dim uppercase">Max Marks:</span>{" "}
              <strong className="text-downy">{selectedExam.maximumMarks}</strong>
            </div>
            <div>
              <span className="text-alice-dim uppercase">Pass Marks:</span>{" "}
              <strong className="text-jonquil">{selectedExam.passMarks}</strong>
            </div>
            <div>
              <span className="text-alice-dim uppercase">Weightage:</span>{" "}
              <strong className="text-melrose">{selectedExam.weightage}%</strong>
            </div>
          </div>
          <Badge variant="melrose">CBCS Indexed</Badge>
        </div>
      )}

      {/* Marks Entry Table */}
      <div className="rounded-3xl bg-charcoal-card border border-charcoal-border p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-alice">Student Score Input Sheet</h3>
            <p className="text-xs text-alice-muted">
              Live calculation of letter grades based on UGC 10-point scale
            </p>
          </div>

          <button
            onClick={handleSubmitMarks}
            disabled={submitting || students.length === 0}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-downy text-charcoal font-bold text-xs uppercase tracking-wider hover:bg-downy-hover shadow-lg shadow-downy/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{submitting ? "Uploading..." : "Save & Publish Grades"}</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-alice">
            <thead className="bg-charcoal-elevated/70 text-xs uppercase tracking-wider text-alice-muted border-b border-charcoal-border">
              <tr>
                <th className="py-3 px-4 font-semibold">Roll Number</th>
                <th className="py-3 px-4 font-semibold">Student Name</th>
                <th className="py-3 px-4 font-semibold text-center">Score (Max: {currentMax})</th>
                <th className="py-3 px-4 font-semibold text-center">Absent?</th>
                <th className="py-3 px-4 font-semibold text-center">Percentage</th>
                <th className="py-3 px-4 font-semibold text-center">CBCS Grade</th>
                <th className="py-3 px-4 font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal-border/50 text-xs">
              {students.length > 0 ? (
                students.map((item, idx) => {
                  const sId =
                    (item.studentId && typeof item.studentId === "object" ? item.studentId._id : item.studentId) ||
                    item.student?._id ||
                    item.student?.id ||
                    item._id;
                  const studentObj =
                    (item.student && typeof item.student === "object" ? item.student : null) ||
                    (item.studentId && typeof item.studentId === "object" ? item.studentId : null) ||
                    item;
                  const studentName =
                    item.studentName ||
                    studentObj?.name ||
                    studentObj?.userId?.name ||
                    studentObj?.user?.name ||
                    item.name ||
                    "Student";
                  const rollNumber =
                    item.rollNumber ||
                    studentObj?.rollNumber ||
                    item.student?.rollNumber ||
                    `BCA-00${idx + 1}`;
                  const state = marksMap[sId] || { marksObtained: "", isAbsent: false };
                  const isAbs = state.isAbsent;
                  const score = state.marksObtained;
                  const pct = typeof score === "number" ? Math.round((score / currentMax) * 100) : 0;
                  const { grade, gp } = isAbs ? { grade: "F", gp: 0 } : calculateGrade(score, currentMax);
                  const isPass = grade !== "F" && !isAbs && score !== "" && score >= (selectedExam?.passMarks || 0);

                  return (
                    <tr key={sId || idx} className="hover:bg-charcoal-elevated/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-downy font-semibold">
                        {rollNumber}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-alice">
                        {studentName}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="number"
                          min="0"
                          max={currentMax}
                          disabled={isAbs}
                          value={isAbs ? "" : score}
                          onChange={(e) => handleScoreChange(sId, e.target.value)}
                          placeholder={`0 - ${currentMax}`}
                          className="w-24 px-3 py-1.5 rounded-lg bg-charcoal border border-charcoal-border text-center text-alice font-mono font-bold focus:border-downy outline-none disabled:opacity-30"
                        />
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isAbs}
                          onChange={() => handleAbsentToggle(sId)}
                          className="w-4 h-4 rounded bg-charcoal accent-rose-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono">
                        {isAbs ? "0%" : score !== "" ? `${pct}%` : "-"}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {score !== "" || isAbs ? (
                          <Badge variant={grade === "O" ? "gradeO" : grade.startsWith("A") ? "gradeA" : grade === "F" ? "gradeF" : "gradeB"}>
                            {grade} ({gp} GP)
                          </Badge>
                        ) : (
                          <span className="text-alice-dim">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {score !== "" || isAbs ? (
                          <Badge variant={isPass ? "success" : "danger"}>
                            {isPass ? "PASS" : "FAIL"}
                          </Badge>
                        ) : (
                          <span className="text-alice-dim">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-alice-muted">
                    No enrolled students for this course.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Exam Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Schedule Assessment / Examination"
        subtitle="Define examination type, ceiling marks, and semester weighting"
      >
        <form onSubmit={handleCreateExam} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-alice-muted uppercase mb-1">
              Examination Title
            </label>
            <input
              type="text"
              value={examName}
              onChange={(e) => setExamName(e.target.value)}
              placeholder="e.g. End Semester Theory Examination 2026"
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-elevated border border-charcoal-border text-alice text-sm outline-none focus:border-melrose"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-alice-muted uppercase mb-1">
                Assessment Type
              </label>
              <select
                value={examType}
                onChange={(e) => setExamType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-elevated border border-charcoal-border text-alice text-sm outline-none focus:border-melrose"
              >
                <option value="semester">End-Term / Semester Exam</option>
                <option value="internal_test">Mid-Term / Internal Test</option>
                <option value="quiz">Class Quiz</option>
                <option value="assignment">Assignment / Coursework</option>
                <option value="practical">Practical / Lab Exam</option>
                <option value="viva">Viva Voce</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-alice-muted uppercase mb-1">
                Maximum Marks
              </label>
              <input
                type="number"
                min="10"
                max="200"
                value={maxMarks}
                onChange={(e) => {
                  const m = parseFloat(e.target.value) || 0;
                  setMaxMarks(e.target.value);
                  setPassMarks(Math.round(m * 0.4));
                }}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-elevated border border-charcoal-border text-alice text-sm outline-none focus:border-melrose"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-alice-muted uppercase mb-1">
                Passing Marks (min 40%)
              </label>
              <input
                type="number"
                min="0"
                max={maxMarks}
                value={passMarks}
                onChange={(e) => setPassMarks(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-elevated border border-charcoal-border text-alice text-sm outline-none focus:border-melrose"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-alice-muted uppercase mb-1">
                Semester Weightage (%)
              </label>
              <input
                type="number"
                min="5"
                max="100"
                value={weightage}
                onChange={(e) => setWeightage(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-elevated border border-charcoal-border text-alice text-sm outline-none focus:border-melrose"
              />
            </div>
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
              className="px-5 py-2 rounded-xl bg-melrose text-charcoal font-bold text-xs uppercase hover:bg-melrose-light shadow-md shadow-melrose/20 cursor-pointer"
            >
              {submitting ? "Creating..." : "Save Assessment"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
