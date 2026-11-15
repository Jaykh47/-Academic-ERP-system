import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { attendanceApi } from "../../api/attendanceApi";
import { marksApi } from "../../api/marksApi";
import { reportApi } from "../../api/reportApi";
import { academicApi } from "../../api/academicApi";
import { StatCard } from "../../components/common/StatCard";
import { Badge } from "../../components/common/Badge";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import {
  CalendarCheck,
  Award,
  BookOpen,
  FileDown,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  CheckCircle,
  Clock,
} from "lucide-react";

export const StudentDashboard = () => {
  const { user, profile } = useAuth();
  const { success, error } = useToast();

  const [loading, setLoading] = useState(true);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [enrolledSubjects, setEnrolledSubjects] = useState([]);

  const studentId = profile?._id || user?.studentProfile?._id || profile?.id;

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Fetch subjects
        const subjectsRes = await academicApi.getMyEnrolledSubjects();
        const subjects = subjectsRes?.data?.enrollments || [];
        setEnrolledSubjects(subjects);

        // Fetch attendance summary
        try {
          const attRes = await attendanceApi.getStudentSummary(studentId);
          setAttendanceSummary(attRes?.data?.summary || null);
        } catch {
          // Attendance summary may be empty if no classes held yet
        }

        // Fetch marks & SGPA
        try {
          const perfRes = await marksApi.getStudentPerformance(studentId);
          setPerformance(perfRes?.data || null);
        } catch {
          // Performance may be empty if no exams graded yet
        }
      } catch (err) {
        // Tolerant to initial empty state
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [studentId]);

  const handleDownloadReportCard = async () => {
    try {
      setDownloadingPdf(true);
      await reportApi.downloadMyReportCardPDF(
        `${user?.name?.replace(/\s+/g, "_")}_Report_Card.pdf`
      );
      success("Official PDF Report Card downloaded successfully!");
    } catch (err) {
      error("Failed to download PDF report card.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Fetching your academic profile..." />;
  }

  const overallAtt = attendanceSummary?.overallPercentage ?? 0;
  const isShortage = overallAtt < 75 && (attendanceSummary?.totalClasses || 0) > 0;
  const currentSgpa = performance?.sgpa ?? "N/A";

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-charcoal-card border border-charcoal-border p-6 md:p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-downy/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              to="/student/profile"
              className="relative group shrink-0"
              title="View & Edit Profile Photo"
            >
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl overflow-hidden bg-charcoal-elevated border-2 border-downy/40 group-hover:border-downy transition-colors flex items-center justify-center text-alice font-bold text-xl shadow-lg shadow-downy/10">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user?.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-downy">{user?.name ? user.name.charAt(0).toUpperCase() : "S"}</span>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 p-1 rounded-lg bg-downy text-charcoal shadow-sm">
                <User className="w-3 h-3" />
              </div>
            </Link>

            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-charcoal-elevated border border-charcoal-border text-xs text-alice-muted">
                <span>Roll No:</span>
                <span className="font-mono text-downy font-semibold">
                  {profile?.rollNumber || "BCA001"}
                </span>
                <span className="text-alice-dim">•</span>
                <span>Semester {profile?.currentSemester || 1}</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-alice">
                Welcome back, <span className="text-downy">{user?.name}</span>
              </h1>
              <p className="text-xs md:text-sm text-alice-muted max-w-xl">
                Monitor your class attendance, CBCS grade points, and predictive recovery forecasts in real time.
              </p>
            </div>
          </div>

          {/* Action button */}
          <button
            onClick={handleDownloadReportCard}
            disabled={downloadingPdf}
            className="inline-flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-downy text-charcoal font-bold text-xs uppercase tracking-wider hover:bg-downy-hover shadow-lg shadow-downy/20 transition-all cursor-pointer disabled:opacity-50 shrink-0"
          >
            <FileDown className="w-4 h-4" />
            <span>{downloadingPdf ? "Generating..." : "Download Report Card (PDF)"}</span>
          </button>
        </div>
      </div>

      {/* Attendance Shortage Alert Banner (if < 75%) */}
      {isShortage && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-jonquil/40 flex items-start gap-3.5 shadow-lg shadow-amber-500/5 animate-pulse">
          <AlertTriangle className="w-5 h-5 text-jonquil shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <h4 className="text-xs font-bold text-jonquil uppercase tracking-wider">
              Attendance Shortage Warning ({overallAtt}%)
            </h4>
            <p className="text-xs text-alice-muted">
              Your overall attendance is below the mandatory 75% institutional threshold. Visit the
              predictive recovery section to calculate required attendance to restore eligibility.
            </p>
          </div>
          <Link
            to="/student/attendance"
            className="text-xs font-bold text-jonquil underline hover:text-amber-300 self-center shrink-0"
          >
            Calculate Recovery &rarr;
          </Link>
        </div>
      )}

      {/* Course Registration Prompt Banner (if 0 enrolled subjects) */}
      {enrolledSubjects.length === 0 && (
        <div className="p-4 rounded-2xl bg-downy/10 border border-downy/30 flex items-center justify-between gap-3.5 shadow-lg shadow-downy/5">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-downy shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-alice">
                Semester Course Registration Pending
              </h4>
              <p className="text-xs text-alice-muted mt-0.5">
                You are currently not enrolled in any subjects for this semester.
              </p>
            </div>
          </div>
          <Link
            to="/student/enrollment"
            className="px-4 py-2 rounded-xl bg-downy text-charcoal font-bold text-xs uppercase tracking-wider hover:bg-downy-hover shadow-md shadow-downy/20 shrink-0"
          >
            Register Courses &rarr;
          </Link>
        </div>
      )}

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Overall Attendance"
          value={`${overallAtt}%`}
          subvalue={`${attendanceSummary?.totalAttended || 0}/${attendanceSummary?.totalClasses || 0} classes`}
          icon={CalendarCheck}
          accent={isShortage ? "jonquil" : "downy"}
          trend={isShortage ? "Below 75% minimum" : "Eligible for final exams"}
          trendType={isShortage ? "down" : "up"}
        />

        <StatCard
          title="Cumulative SGPA"
          value={currentSgpa}
          subvalue="CBCS 10-point scale"
          icon={Award}
          accent="melrose"
          trend="Calculated per UGC CBCS"
          trendType="neutral"
        />

        <StatCard
          title="Enrolled Subjects"
          value={enrolledSubjects.length || (attendanceSummary?.subjectWise?.length || 0)}
          subvalue="Current semester"
          icon={BookOpen}
          accent="downy"
          trend="Active enrollments"
          trendType="neutral"
        />

        <StatCard
          title="Academic Standing"
          value={overallAtt >= 75 ? "GOOD" : "AT RISK"}
          subvalue="Eligibility status"
          icon={TrendingUp}
          accent={overallAtt >= 75 ? "downy" : "rose"}
          trend={overallAtt >= 75 ? "Clear for exam admit card" : "Shortage remediation required"}
          trendType={overallAtt >= 75 ? "up" : "down"}
        />
      </div>

      {/* Subject-Wise Attendance Breakdown */}
      <div className="rounded-3xl bg-charcoal-card border border-charcoal-border p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-alice">Subject Attendance Overview</h3>
            <p className="text-xs text-alice-muted">
              Current attendance record across registered courses
            </p>
          </div>
          <Link
            to="/student/attendance"
            className="text-xs font-semibold text-downy hover:underline flex items-center gap-1"
          >
            <span>Detailed Forecast</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {attendanceSummary?.subjectWise && attendanceSummary.subjectWise.length > 0 ? (
            attendanceSummary.subjectWise.map((sub, idx) => {
              const pct = sub.percentage || 0;
              const subShortage = pct < 75;
              return (
                <div
                  key={sub.subjectId || idx}
                  className="p-4 rounded-2xl bg-charcoal-elevated border border-charcoal-border hover:border-downy/30 transition-all space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-charcoal text-alice-muted">
                        {sub.subjectCode || "SUB"}
                      </span>
                      <h4 className="text-sm font-bold text-alice mt-1">
                        {sub.subjectName || "Subject"}
                      </h4>
                    </div>
                    <Badge variant={subShortage ? "warning" : "downy"}>
                      {pct}%
                    </Badge>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="w-full h-2 rounded-full bg-charcoal overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          subShortage ? "bg-jonquil" : "bg-downy"
                        }`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-alice-dim">
                      <span>Attended: {sub.attended}</span>
                      <span>Total: {sub.total}</span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-8 text-center text-alice-muted text-xs">
              No class sessions recorded yet for this session.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
