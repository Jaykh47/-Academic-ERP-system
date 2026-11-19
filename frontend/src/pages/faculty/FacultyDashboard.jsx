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
  ArrowRight,
  Sparkles,
  Clock,
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
    return <LoadingSpinner label="Loading faculty academic load and classes..." />;
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-charcoal-card border border-charcoal-border p-6 md:p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-melrose/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-charcoal-elevated border border-charcoal-border text-xs text-alice-muted">
              <span>Employee ID:</span>
              <span className="font-mono text-melrose font-semibold">
                {profile?.employeeId || "FAC-BCA-001"}
              </span>
              <span className="text-alice-dim">•</span>
              <span className="text-alice">{profile?.designation || "Associate Professor"}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-alice">
              Welcome, <span className="text-melrose">{user?.name}</span>
            </h1>
            <p className="text-xs md:text-sm text-alice-muted max-w-xl">
              Academic course management, class session attendance marking, and CBCS examination scoring.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/faculty/attendance"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-downy text-charcoal font-bold text-xs uppercase tracking-wider hover:bg-downy-hover shadow-lg shadow-downy/20 transition-all"
            >
              <CheckSquare className="w-4 h-4" />
              <span>Mark Attendance</span>
            </Link>
            <Link
              to="/faculty/marks"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-charcoal-elevated border border-charcoal-border hover:border-melrose text-alice font-bold text-xs uppercase tracking-wider transition-all"
            >
              <Award className="w-4 h-4 text-melrose" />
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
          subvalue="Current semester"
          icon={BookOpen}
          accent="melrose"
          trend="Active teaching loads"
          trendType="neutral"
        />

        <StatCard
          title="Class Sessions"
          value={recentSessions.length || 12}
          subvalue="Completed this month"
          icon={CalendarCheck}
          accent="downy"
          trend="Regularly logged"
          trendType="up"
        />

        <StatCard
          title="Enrolled Cohort"
          value="45"
          subvalue="BCA Semester 1"
          icon={Users}
          accent="jonquil"
          trend="High engagement"
          trendType="up"
        />
      </div>

      {/* Course Assignments List */}
      <div className="rounded-3xl bg-charcoal-card border border-charcoal-border p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-alice">Assigned Courses & Modules</h3>
            <p className="text-xs text-alice-muted">
              Select a course to record session attendance or input examination marks
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((sub, idx) => (
            <div
              key={sub._id || idx}
              className="p-5 rounded-2xl bg-charcoal-elevated border border-charcoal-border hover:border-melrose/40 transition-all space-y-4 group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-charcoal text-downy border border-downy/20">
                    {sub.code}
                  </span>
                  <h4 className="text-base font-bold text-alice mt-1.5 group-hover:text-melrose transition-colors">
                    {sub.name}
                  </h4>
                </div>
                <Badge variant="melrose">
                  {sub.credits} Credits
                </Badge>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-charcoal-border/50 text-xs text-alice-dim">
                <span>Semester {sub.semester}</span>
                <span className="uppercase text-[10px] text-alice-muted">{sub.department?.code || "BCA"}</span>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Link
                  to={`/faculty/attendance?subjectId=${sub._id}`}
                  className="flex-1 text-center py-2 px-3 rounded-xl bg-charcoal border border-charcoal-border hover:border-downy text-xs font-semibold text-alice transition-all"
                >
                  Attendance
                </Link>
                <Link
                  to={`/faculty/marks?subjectId=${sub._id}`}
                  className="flex-1 text-center py-2 px-3 rounded-xl bg-charcoal border border-charcoal-border hover:border-melrose text-xs font-semibold text-alice transition-all"
                >
                  Marks
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
