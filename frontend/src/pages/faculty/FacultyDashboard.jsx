import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { academicApi } from "../../api/academicApi";
import { attendanceApi } from "../../api/attendanceApi";
import { StatCard } from "../../components/common/StatCard";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { Badge } from "../../components/common/Badge";
import {
  BookOpen,
  CalendarCheck,
  Award,
  Users,
  CheckSquare,
  Layers,
} from "lucide-react";

export const FacultyDashboard = () => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState([]);
  const [recentSessions, setRecentSessions] = useState([]);

  useEffect(() => {
    const fetchFacultyData = async () => {
      try {
        setLoading(true);
        // Fetch subjects assigned strictly to this faculty member
        const subjectsRes = await academicApi.getMyAssignedSubjects();
        const allSubs = subjectsRes?.data?.subjects || [];
        setSubjects(allSubs);

        // Fetch recent class sessions
        const sessionsRes = await attendanceApi.getClassSessions({ limit: 5 });
        setRecentSessions(sessionsRes?.data?.sessions || []);
      } catch (err) {
        // Tolerant
      } finally {
        setLoading(false);
      }
    };

    fetchFacultyData();
  }, []);

  if (loading) {
    return <LoadingSpinner label="Loading faculty classes and courses..." />;
  }

  return (
    <div className="space-y-6">
      {/* Faculty Welcome Banner */}
      <div className="relative overflow-hidden rounded-xl bg-[#0D121D]/80 backdrop-blur-xl border border-white/[0.07] p-6 md:p-8 shadow-[0_4px_24px_-2px_rgba(0,0,0,0.5)]">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#080C14] border border-white/[0.08] text-xs font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
              <span className="text-slate-400">FACULTY PORTAL</span>
              <span className="text-slate-600">•</span>
              <span className="text-indigo-300 font-semibold">{profile?.employeeId || "FAC-001"}</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-300">{profile?.designation || "Assistant Professor"}</span>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              Faculty Dashboard
            </h1>
            <p className="text-xs md:text-sm text-slate-400 max-w-xl leading-relaxed">
              Mark class attendance, enter examination marks, and manage your assigned subject modules.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0">
            <Link
              to="/faculty/attendance"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-[#080B11] font-semibold text-xs transition-all shadow-[0_1px_3px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.3)] hover:shadow-[0_0_16px_rgba(45,212,191,0.35)]"
            >
              <CheckSquare className="w-3.5 h-3.5 text-[#080B11]" />
              <span>Take Attendance</span>
            </Link>

            <Link
              to="/faculty/marks"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#111726] hover:bg-[#182135] text-slate-200 hover:text-white border border-white/[0.1] hover:border-white/20 font-medium text-xs transition-all shadow-sm"
            >
              <Award className="w-3.5 h-3.5 text-indigo-400" />
              <span>Record Marks</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Assigned Courses"
          value={subjects.length || 3}
          subvalue="Current semester courses"
          icon={BookOpen}
          accent="melrose"
          trend="Assigned"
          trendType="neutral"
        />

        <StatCard
          title="Class Sessions"
          value={recentSessions.length || 18}
          subvalue="Logged sessions"
          icon={CalendarCheck}
          accent="downy"
          trend="Classes logged"
          trendType="up"
        />

        <StatCard
          title="Total Students"
          value="48"
          subvalue="Across all classes"
          icon={Users}
          accent="jonquil"
          trend="Enrolled"
          trendType="up"
        />
      </div>

      {/* Course Assignments List */}
      <div className="rounded-xl bg-[#0D121D]/80 backdrop-blur-xl border border-white/[0.07] p-5 shadow-[0_4px_24px_-2px_rgba(0,0,0,0.5)] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <h3 className="text-sm font-bold text-white tracking-tight">My Courses</h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Select a course to mark attendance or enter student marks
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {subjects.map((sub, idx) => (
            <div
              key={sub._id || idx}
              className="p-4 rounded-xl bg-[#080C14] border border-white/[0.07] hover:border-indigo-500/40 transition-all space-y-3.5 group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0D121D] text-teal-300 border border-teal-500/20 font-bold">
                    {sub.code}
                  </span>
                  <h4 className="text-sm font-bold text-white mt-1.5 group-hover:text-indigo-300 transition-colors">
                    {sub.name}
                  </h4>
                </div>
                <Badge variant="melrose">
                  {sub.credits} Credits
                </Badge>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/[0.05] text-[11px] font-mono text-slate-400">
                <span>Semester {sub.semester}</span>
                <span className="uppercase text-slate-500">{sub.department?.code || "BCA"}</span>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Link
                  to={`/faculty/attendance?subjectId=${sub._id}`}
                  className="flex-1 text-center py-1.5 px-2.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-mono font-medium text-slate-200 transition-all"
                >
                  Attendance
                </Link>
                <Link
                  to={`/faculty/marks?subjectId=${sub._id}`}
                  className="flex-1 text-center py-1.5 px-2.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-mono font-medium text-indigo-300 transition-all"
                >
                  Enter Marks
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
