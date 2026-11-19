import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { attendanceApi } from "../../api/attendanceApi";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { Badge } from "../../components/common/Badge";
import { StatCard } from "../../components/common/StatCard";
import {
  CalendarCheck,
  CheckCircle,
  AlertTriangle,
  Clock,
  BookOpen,
} from "lucide-react";

export const StudentAttendance = () => {
  const { user, profile } = useAuth();
  const { error } = useToast();

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);

  const studentId = profile?._id || user?.studentProfile?._id || profile?.id;

  useEffect(() => {
    const fetchData = async () => {
      if (!studentId && user?.role !== "student") {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const sumRes = await attendanceApi.getStudentSummary(studentId);
        setSummary(sumRes?.data?.summary || null);
      } catch (err) {
        error("Failed to load attendance records");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [studentId, user?.role]);

  if (loading) {
    return <LoadingSpinner label="Calculating attendance statistics..." />;
  }

  const subjectList = summary?.subjectWise || [];
  const overallPct = summary?.overallPercentage ?? 0;
  const isShortage = overallPct < 75 && (summary?.totalClasses || 0) > 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-alice tracking-tight">
            Attendance Records
          </h1>
          <p className="text-xs text-alice-muted mt-1">
            Monitor your class attendance and verify your eligibility across enrolled subjects.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={overallPct >= 75 ? "downy" : "warning"}>
            Overall: {overallPct}% ({overallPct >= 75 ? "Eligible" : "Shortage"})
          </Badge>
          <Badge variant="melrose">Threshold: 75%</Badge>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Overall Attendance"
          value={`${overallPct}%`}
          subvalue={isShortage ? "Below 75% minimum" : "Eligible for examinations"}
          icon={CalendarCheck}
          accent={isShortage ? "jonquil" : "downy"}
          trend={isShortage ? "Action required" : "Good standing"}
          trendType={isShortage ? "down" : "up"}
        />

        <StatCard
          title="Classes Attended"
          value={summary?.totalAttended || 0}
          subvalue={`Out of ${summary?.totalClasses || 0} total classes`}
          icon={CheckCircle}
          accent="downy"
          trend="Present sessions"
          trendType="up"
        />

        <StatCard
          title="Enrolled Subjects"
          value={subjectList.length || 0}
          subvalue="Current semester courses"
          icon={BookOpen}
          accent="melrose"
          trend="Active enrollment"
          trendType="neutral"
        />
      </div>

      {/* Comprehensive Attendance Records Table */}
      <div className="rounded-3xl bg-charcoal-card border border-charcoal-border p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-alice">Subject Attendance Breakdown</h3>
          <span className="text-xs text-alice-muted">
            Minimum 75% attendance required in each subject
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-alice">
            <thead className="bg-charcoal-elevated/70 text-xs uppercase tracking-wider text-alice-muted border-b border-charcoal-border">
              <tr>
                <th className="py-3 px-4 font-semibold">Subject</th>
                <th className="py-3 px-4 font-semibold text-center">Total Sessions</th>
                <th className="py-3 px-4 font-semibold text-center">Attended</th>
                <th className="py-3 px-4 font-semibold text-center">Missed</th>
                <th className="py-3 px-4 font-semibold text-center">Percentage</th>
                <th className="py-3 px-4 font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal-border/50 text-xs">
              {subjectList.length > 0 ? (
                subjectList.map((s, idx) => {
                  const pct = s.percentage || 0;
                  const isEligible = pct >= 75;
                  const missed = (s.total || 0) - (s.attended || 0);

                  return (
                    <tr key={s.subjectId || idx} className="hover:bg-charcoal-elevated/40 transition-colors">
                      <td className="py-3.5 px-4 font-medium">
                        <div className="font-bold text-alice">{s.subjectName || "Subject"}</div>
                        <div className="text-[11px] text-alice-dim font-mono">{s.subjectCode}</div>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono">{s.total}</td>
                      <td className="py-3.5 px-4 text-center font-mono text-downy font-semibold">
                        {s.attended}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-rose-400">
                        {missed}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`font-mono font-bold ${isEligible ? "text-downy" : "text-jonquil"}`}>
                          {pct}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Badge variant={isEligible ? "downy" : "warning"}>
                          {isEligible ? "ELIGIBLE" : "SHORTAGE"}
                        </Badge>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-alice-muted">
                    No attendance records found for this semester.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
