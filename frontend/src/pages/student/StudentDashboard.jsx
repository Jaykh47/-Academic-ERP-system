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
  User,
  GraduationCap,
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
      <div className="relative overflow-hidden rounded-xl bg-[#0D121D]/80 backdrop-blur-xl border border-white/[0.07] p-6 md:p-8 shadow-[0_4px_24px_-2px_rgba(0,0,0,0.5)]">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <Link
              to="/student/profile"
              className="relative group shrink-0"
              title="View & Edit Profile Photo"
            >
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 group-hover:border-teal-400 transition-colors flex items-center justify-center text-white font-mono font-bold text-lg shadow-sm">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user?.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-teal-400">{user?.name ? user.name.charAt(0).toUpperCase() : "S"}</span>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 p-1 rounded-md bg-teal-500 text-[#080B11] shadow-sm">
                <User className="w-2.5 h-2.5" />
              </div>
            </Link>

            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#080C14] border border-white/[0.08] text-xs font-mono">
                <span className="text-slate-400">Roll No:</span>
                <span className="text-teal-400 font-semibold">
                  {profile?.rollNumber || "BCA-2026-001"}
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-300">Semester {profile?.currentSemester || 1}</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
                Student Academic Console
              </h1>
              <p className="text-xs md:text-sm text-slate-400 max-w-xl">
                Continuous attendance monitoring, CBCS transcript calculations, and examination dossiers.
              </p>
            </div>
          </div>

          {/* Action button */}
          <button
            onClick={handleDownloadReportCard}
            disabled={downloadingPdf}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-[#080B11] font-semibold text-xs transition-all shadow-[0_1px_3px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.3)] hover:shadow-[0_0_16px_rgba(45,212,191,0.35)] cursor-pointer disabled:opacity-50 shrink-0"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>{downloadingPdf ? "Generating..." : "Download Report Card (PDF)"}</span>
          </button>
        </div>
      </div>

      {/* Attendance Shortage Alert Banner (if < 75%) */}
      {isShortage && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3 shadow-sm">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-0.5">
            <h4 className="text-xs font-mono font-bold text-amber-300 uppercase tracking-wider">
              Attendance Shortage Warning ({overallAtt}%)
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your overall attendance is below the mandatory 75% institutional threshold. Please attend upcoming lectures to maintain final examination eligibility.
            </p>
          </div>
          <Link
            to="/student/attendance"
            className="text-xs font-mono font-semibold text-amber-300 underline hover:text-amber-200 self-center shrink-0"
          >
            View Records &rarr;
          </Link>
        </div>
      )}

      {/* Course Registration Prompt Banner (if 0 enrolled subjects) */}
      {enrolledSubjects.length === 0 && (
        <div className="p-3.5 rounded-xl bg-teal-500/10 border border-teal-500/25 flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <BookOpen className="w-4 h-4 text-teal-400 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-white">
                Semester Course Enrollment Pending
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                You are currently not registered in any subject modules for this active term.
              </p>
            </div>
          </div>
          <Link
            to="/student/enrollment"
            className="px-3 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-[#080B11] font-semibold text-xs shadow-sm shrink-0 transition-all"
          >
            Enroll Courses &rarr;
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
          trend={isShortage ? "Below 75% threshold" : "Exam eligible"}
          trendType={isShortage ? "down" : "up"}
        />

        <StatCard
          title="Current SGPA"
          value={typeof currentSgpa === "number" ? currentSgpa.toFixed(2) : currentSgpa}
          subvalue="UGC CBCS 10-Point"
          icon={Award}
          accent="melrose"
          trend="Semester aggregate"
          trendType="neutral"
        />

        <StatCard
          title="Total Earned Credits"
          value={performance?.totalCreditsEarned ?? 0}
          subvalue="Towards degree requirement"
          icon={BookOpen}
          accent="jonquil"
          trend="Audit passing"
          trendType="neutral"
        />

        <StatCard
          title="Active Courses"
          value={enrolledSubjects.length || 0}
          subvalue="Semester modules"
          icon={GraduationCap}
          accent="downy"
          trend="All registered"
          trendType="neutral"
        />
      </div>
    </div>
  );
};
