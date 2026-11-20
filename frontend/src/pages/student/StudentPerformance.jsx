import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { marksApi } from "../../api/marksApi";
import { reportApi } from "../../api/reportApi";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { Badge } from "../../components/common/Badge";
import {
  Award,
  FileDown,
  Sparkles,
  BookOpen,
  CheckCircle,
  AlertCircle,
  HelpCircle,
} from "lucide-react";

export const StudentPerformance = () => {
  const { user, profile } = useAuth();
  const { success, error } = useToast();

  const [loading, setLoading] = useState(true);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [performance, setPerformance] = useState(null);

  const studentId = profile?._id || user?.studentProfile?._id || profile?.id;

  useEffect(() => {
    const fetchPerformance = async () => {
      if (!studentId && user?.role !== "student") {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const res = await marksApi.getStudentPerformance(studentId);
        setPerformance(res?.data || null);
      } catch (err) {
        // Marks may be unrecorded yet
      } finally {
        setLoading(false);
      }
    };

    fetchPerformance();
  }, [studentId, user?.role]);

  const handleDownloadReportCard = async () => {
    try {
      setDownloadingPdf(true);
      await reportApi.downloadMyReportCardPDF(
        `${user?.name?.replace(/\s+/g, "_")}_Academic_Report.pdf`,
        { semester: profile?.currentSemester || 1 }
      );
      success("Report Card PDF generated & downloaded!");
    } catch (err) {
      error(err.message || err.response?.data?.message || "Failed to download PDF report card.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Compiling CBCS semester performance and SGPA..." />;
  }

  const marksList = performance?.records || performance?.marks || [];
  const isComplete = Boolean(performance?.isComplete);
  const sgpa = isComplete && performance?.sgpa !== null && performance?.sgpa !== undefined ? performance.sgpa : null;
  const totalCredits = performance?.totalCredits ?? 0;
  const pendingCount = performance?.pendingCoursesCount ?? 0;
  const evaluatedCount = performance?.evaluatedCoursesCount ?? marksList.filter((m) => !m.isPending && m.grade !== "PENDING").length;
  const totalCourses = performance?.totalEnrolledCourses ?? marksList.length;

  const getGradeVariant = (grade) => {
    if (grade === "O") return "gradeO";
    if (grade === "A+" || grade === "A") return "gradeA";
    if (grade === "B+" || grade === "B") return "gradeB";
    if (grade === "F") return "gradeF";
    if (grade === "PENDING") return "warning";
    return "neutral";
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-alice tracking-tight">
            Academic Performance & CBCS Grade Sheet
          </h1>
          <p className="text-xs text-alice-muted mt-1">
            UGC 10-Point Choice Based Credit System (CBCS) Evaluation & Semester SGPA.
          </p>
        </div>

        <div className="flex flex-col sm:items-end gap-1 shrink-0">
          <button
            onClick={handleDownloadReportCard}
            disabled={downloadingPdf || !isComplete}
            title={!isComplete ? "Report card download will unlock once all semester subjects are evaluated." : "Download Official PDF"}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-downy text-charcoal font-bold text-xs uppercase tracking-wider hover:bg-downy-hover shadow-lg shadow-downy/20 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            <FileDown className="w-4 h-4" />
            <span>
              {downloadingPdf
                ? "Exporting PDF..."
                : !isComplete
                ? "Report Card Locked"
                : "Download Official PDF"}
            </span>
          </button>
          {!isComplete && (
            <span className="text-[10px] text-amber-400 font-medium">
              Available when all {totalCourses} subjects are graded
            </span>
          )}
        </div>
      </div>

      {/* SGPA & Credits Hero Box */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 rounded-3xl bg-charcoal-card border border-melrose/30 shadow-xl shadow-melrose/5 flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-melrose/10 border border-melrose/30 flex items-center justify-center text-melrose shrink-0">
            <Award className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider font-semibold text-alice-muted">
              Current Semester SGPA
            </p>
            <h2 className="text-3xl font-extrabold text-alice tracking-tight mt-0.5">
              {isComplete ? (
                <>
                  {sgpa} <span className="text-sm font-normal text-alice-dim">/ 10.0</span>
                </>
              ) : (
                <span className="text-amber-400 text-2xl font-bold">PENDING</span>
              )}
            </h2>
            <p className="text-[11px] text-melrose font-medium mt-1">
              {isComplete
                ? "Credit-Weighted Performance Index"
                : `Awaiting evaluation (${pendingCount} subject(s) pending)`}
            </p>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-charcoal-card border border-charcoal-border shadow-xl flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-downy/10 border border-downy/30 flex items-center justify-center text-downy shrink-0">
            <BookOpen className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider font-semibold text-alice-muted">
              Registered Credits
            </p>
            <h2 className="text-3xl font-extrabold text-alice tracking-tight mt-0.5">
              {totalCredits}
            </h2>
            <p className="text-[11px] text-alice-dim mt-1">Total credit weight enrolled</p>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-charcoal-card border border-charcoal-border shadow-xl flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-jonquil/10 border border-jonquil/30 flex items-center justify-center text-jonquil shrink-0">
            <Sparkles className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider font-semibold text-alice-muted">
              Evaluation Status
            </p>
            <h2 className={`text-2xl font-extrabold tracking-tight mt-0.5 ${isComplete ? "text-emerald-400" : "text-amber-400"}`}>
              {isComplete ? "PUBLISHED" : "IN PROGRESS"}
            </h2>
            <p className="text-[11px] text-alice-dim mt-1">
              {evaluatedCount} of {totalCourses} course(s) graded
            </p>
          </div>
        </div>
      </div>

      {/* In-progress Banner */}
      {!isComplete && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center gap-3 text-xs text-amber-200">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <span className="font-bold uppercase tracking-wider text-amber-300">Semester Grading In Progress: </span>
            SGPA calculation and official grade card download will activate once marks for all {totalCourses} enrolled subjects are evaluated by faculty.
          </div>
        </div>
      )}

      {/* Marks & CBCS Grades Table */}
      <div className="rounded-3xl bg-charcoal-card border border-charcoal-border p-6 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-alice">Semester Examination Results</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-alice">
            <thead className="bg-charcoal-elevated/70 text-xs uppercase tracking-wider text-alice-muted border-b border-charcoal-border">
              <tr>
                <th className="py-3 px-4 font-semibold">Course & Examination</th>
                <th className="py-3 px-4 font-semibold text-center">Score / Max</th>
                <th className="py-3 px-4 font-semibold text-center">Percentage</th>
                <th className="py-3 px-4 font-semibold text-center">Letter Grade</th>
                <th className="py-3 px-4 font-semibold text-center">Grade Point</th>
                <th className="py-3 px-4 font-semibold text-center">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal-border/50 text-xs">
              {marksList.length > 0 ? (
                marksList.map((m, idx) => {
                  const subjectName = m.subject?.name || m.examination?.subject?.name || "Course Subject";
                  const subjectCode = m.subject?.code || m.examination?.subject?.code || "SUB";
                  const examTitle = m.examination?.name || m.examination?.examType || "Assessment";
                  const isPending = m.isPending || m.grade === "PENDING" || m.marksObtained === null;
                  const score = isPending ? null : (m.marksObtained ?? (m.isAbsent ? "ABS" : 0));
                  const max = m.examination?.maximumMarks || 100;
                  const pct = typeof score === "number" ? Math.round((score / max) * 100) : null;
                  const grade = isPending ? "PENDING" : (m.grade || "P");
                  const gp = isPending ? null : (m.gradePoint ?? 5);
                  const isPass = isPending ? null : (m.isPassed ?? (grade !== "F" && !m.isAbsent));

                  return (
                    <tr key={m._id || idx} className="hover:bg-charcoal-elevated/40 transition-colors">
                      <td className="py-3.5 px-4 font-medium">
                        <div className="font-bold text-alice">{subjectName}</div>
                        <div className="text-[11px] text-alice-dim flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-downy">{subjectCode}</span>
                          <span>•</span>
                          <span>{examTitle}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono">
                        {isPending ? (
                          <span className="text-alice-dim italic">-- / --</span>
                        ) : (
                          <>
                            <span className="text-alice font-bold">{score}</span>
                            <span className="text-alice-dim"> / {max}</span>
                          </>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-alice-muted">
                        {isPending ? "--" : `${pct}%`}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Badge variant={getGradeVariant(grade)}>{grade}</Badge>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-alice">
                        {isPending ? "--" : gp}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {isPending ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            AWAITING
                          </span>
                        ) : (
                          <Badge variant={isPass ? "success" : "danger"}>
                            {isPass ? "PASS" : "FAIL"}
                          </Badge>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-alice-muted">
                    No examination records published for this semester yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* UGC CBCS 10-Point Scale Legend */}
      <div className="rounded-2xl bg-charcoal-card/70 border border-charcoal-border p-4 space-y-2 text-xs text-alice-muted">
        <div className="flex items-center gap-2 font-bold text-alice text-xs uppercase tracking-wider">
          <HelpCircle className="w-4 h-4 text-downy" />
          <span>UGC CBCS 10-Point Grading Standard Reference</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2 pt-2 text-center text-[11px]">
          <div className="p-2 rounded-xl bg-charcoal-elevated border border-charcoal-border">
            <div className="font-bold text-downy">O (10)</div>
            <div className="text-[10px] text-alice-dim">90 - 100%</div>
          </div>
          <div className="p-2 rounded-xl bg-charcoal-elevated border border-charcoal-border">
            <div className="font-bold text-melrose">A+ (9)</div>
            <div className="text-[10px] text-alice-dim">80 - 89%</div>
          </div>
          <div className="p-2 rounded-xl bg-charcoal-elevated border border-charcoal-border">
            <div className="font-bold text-melrose">A (8)</div>
            <div className="text-[10px] text-alice-dim">70 - 79%</div>
          </div>
          <div className="p-2 rounded-xl bg-charcoal-elevated border border-charcoal-border">
            <div className="font-bold text-jonquil">B+ (7)</div>
            <div className="text-[10px] text-alice-dim">60 - 69%</div>
          </div>
          <div className="p-2 rounded-xl bg-charcoal-elevated border border-charcoal-border">
            <div className="font-bold text-jonquil">B (6)</div>
            <div className="text-[10px] text-alice-dim">55 - 59%</div>
          </div>
          <div className="p-2 rounded-xl bg-charcoal-elevated border border-charcoal-border">
            <div className="font-bold text-alice">C (5)</div>
            <div className="text-[10px] text-alice-dim">50 - 54%</div>
          </div>
          <div className="p-2 rounded-xl bg-charcoal-elevated border border-charcoal-border">
            <div className="font-bold text-alice-dim">P (4)</div>
            <div className="text-[10px] text-alice-dim">40 - 49%</div>
          </div>
          <div className="p-2 rounded-xl bg-charcoal-elevated border border-charcoal-border">
            <div className="font-bold text-rose-400">F (0)</div>
            <div className="text-[10px] text-alice-dim">&lt; 40%</div>
          </div>
        </div>
      </div>
    </div>
  );
};
