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
      if (!studentId) {
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
  }, [studentId]);

  const handleDownloadReportCard = async () => {
    try {
      setDownloadingPdf(true);
      await reportApi.downloadMyReportCardPDF(
        `${user?.name?.replace(/\s+/g, "_")}_Academic_Report.pdf`
      );
      success("Report Card PDF generated & downloaded!");
    } catch (err) {
      error("Failed to download PDF report card.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Compiling CBCS semester performance and SGPA..." />;
  }

  const marksList = performance?.records || performance?.marks || [];
  const sgpa = performance?.sgpa ?? "N/A";
  const totalCredits = performance?.totalCredits ?? 0;

  const getGradeVariant = (grade) => {
    if (grade === "O") return "gradeO";
    if (grade === "A+" || grade === "A") return "gradeA";
    if (grade === "B+" || grade === "B") return "gradeB";
    if (grade === "F") return "gradeF";
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

        <button
          onClick={handleDownloadReportCard}
          disabled={downloadingPdf}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-downy text-charcoal font-bold text-xs uppercase tracking-wider hover:bg-downy-hover shadow-lg shadow-downy/20 transition-all cursor-pointer disabled:opacity-50 shrink-0"
        >
          <FileDown className="w-4 h-4" />
          <span>{downloadingPdf ? "Exporting PDF..." : "Download Official PDF"}</span>
        </button>
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
              {sgpa} <span className="text-sm font-normal text-alice-dim">/ 10.0</span>
            </h2>
            <p className="text-[11px] text-melrose font-medium mt-1">
              Credit-Weighted Performance Index
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
            <p className="text-[11px] text-alice-dim mt-1">Total credit weight evaluated</p>
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
            <h2 className="text-2xl font-extrabold text-alice tracking-tight mt-0.5">
              {marksList.length > 0 ? "PUBLISHED" : "PENDING"}
            </h2>
            <p className="text-[11px] text-alice-dim mt-1">
              {marksList.length} assessment record(s) indexed
            </p>
          </div>
        </div>
      </div>

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
                  const score = m.marksObtained ?? (m.isAbsent ? "ABS" : 0);
                  const max = m.examination?.maximumMarks || 100;
                  const pct = typeof score === "number" ? Math.round((score / max) * 100) : 0;
                  const grade = m.grade || "P";
                  const gp = m.gradePoint ?? 5;
                  const isPass = m.isPassed ?? (grade !== "F" && !m.isAbsent);

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
                        <span className="text-alice font-bold">{score}</span>
                        <span className="text-alice-dim"> / {max}</span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-alice-muted">
                        {pct}%
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Badge variant={getGradeVariant(grade)}>{grade}</Badge>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-alice">
                        {gp}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Badge variant={isPass ? "success" : "danger"}>
                          {isPass ? "PASS" : "FAIL"}
                        </Badge>
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
