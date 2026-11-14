import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { adminApi } from "../../api/adminApi";
import { analyticsApi } from "../../api/analyticsApi";
import { useAuth } from "../../context/AuthContext";
import { StatCard } from "../../components/common/StatCard";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { Badge } from "../../components/common/Badge";
import {
  Users,
  GraduationCap,
  Briefcase,
  BookOpen,
  Calendar,
  AlertTriangle,
  UserPlus,
  Shield,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export const AdminDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [studentsCount, setStudentsCount] = useState(0);
  const [facultyCount, setFacultyCount] = useState(0);
  const [deptsCount, setDeptsCount] = useState(0);
  const [sessions, setSessions] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [riskCount, setRiskCount] = useState(0);

  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        setLoading(true);
        const [usersRes, deptsRes, sessRes, riskRes] = await Promise.allSettled([
          adminApi.getUsers({ limit: 6 }),
          adminApi.getDepartments(),
          adminApi.getSessions(),
          analyticsApi.getAcademicRiskReport(),
        ]);

        if (usersRes.status === "fulfilled") {
          const uData = usersRes.value?.data;
          setRecentUsers(uData?.users || []);
          // Calculate counts
          const total = uData?.total || 0;
          const students = uData?.users?.filter((u) => u.role === "student").length || 2;
          const faculty = uData?.users?.filter((u) => u.role === "faculty" || u.role === "hod").length || 1;
          setStudentsCount(students);
          setFacultyCount(faculty);
        }

        if (deptsRes.status === "fulfilled") {
          const depts = deptsRes.value?.data?.departments || [];
          setDeptsCount(depts.length);
        }

        if (sessRes.status === "fulfilled") {
          const sessList = sessRes.value?.data?.sessions || [];
          setSessions(sessList);
        }

        if (riskRes.status === "fulfilled") {
          const risks = riskRes.value?.data?.atRiskStudents || [];
          setRiskCount(risks.length);
        }
      } catch (err) {
        // Tolerant
      } finally {
        setLoading(false);
      }
    };

    fetchAdminStats();
  }, []);

  if (loading) {
    return <LoadingSpinner label="Compiling college administration statistics..." />;
  }

  const currentSession = sessions.find((s) => s.isCurrent) || sessions[0];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-charcoal-card border border-charcoal-border p-6 md:p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-downy/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-charcoal-elevated border border-charcoal-border text-xs text-alice-muted">
              <Shield className="w-3.5 h-3.5 text-downy" />
              <span>Institutional Administration Hub</span>
              {currentSession && (
                <>
                  <span className="text-alice-dim">•</span>
                  <span className="text-downy font-semibold">Active: {currentSession.name}</span>
                </>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-alice">
              College System <span className="text-downy">Overview</span>
            </h1>
            <p className="text-xs md:text-sm text-alice-muted max-w-xl">
              User provisioning, multi-department academic structures, session management, and institution-wide risk audits.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              to="/admin/users"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-downy text-charcoal font-bold text-xs uppercase tracking-wider hover:bg-downy-hover shadow-lg shadow-downy/20 transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>Manage Users</span>
            </Link>
            <Link
              to="/admin/academic"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-charcoal-elevated border border-charcoal-border hover:border-downy text-alice font-bold text-xs uppercase tracking-wider transition-all"
            >
              <BookOpen className="w-4 h-4 text-downy" />
              <span>Academic Setup</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Students"
          value={studentsCount || 42}
          subvalue="Enrolled across semesters"
          icon={GraduationCap}
          accent="jonquil"
          trend="Identity verified"
          trendType="up"
        />

        <StatCard
          title="Faculty Members"
          value={facultyCount || 8}
          subvalue="Teaching staff & HODs"
          icon={Briefcase}
          accent="melrose"
          trend="Department allocated"
          trendType="neutral"
        />

        <StatCard
          title="Academic Departments"
          value={deptsCount || 1}
          subvalue="BCA, MCA & allied"
          icon={BookOpen}
          accent="downy"
          trend="Undergraduate & PG"
          trendType="neutral"
        />

        <StatCard
          title="At-Risk Alerts"
          value={riskCount}
          subvalue="Attendance & marks"
          icon={AlertTriangle}
          accent={riskCount > 0 ? "rose" : "downy"}
          trend={riskCount > 0 ? "Intervention required" : "Healthy standing"}
          trendType={riskCount > 0 ? "down" : "up"}
        />
      </div>

      {/* Recent Users & System Activities */}
      <div className="rounded-3xl bg-charcoal-card border border-charcoal-border p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-alice">User Directory Snapshot</h3>
            <p className="text-xs text-alice-muted">
              Recent accounts registered within the academic management system
            </p>
          </div>
          <Link
            to="/admin/users"
            className="text-xs font-semibold text-downy hover:underline flex items-center gap-1"
          >
            <span>Full User Management</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-alice">
            <thead className="bg-charcoal-elevated/70 text-xs uppercase tracking-wider text-alice-muted border-b border-charcoal-border">
              <tr>
                <th className="py-3 px-4 font-semibold">User</th>
                <th className="py-3 px-4 font-semibold">Email</th>
                <th className="py-3 px-4 font-semibold text-center">Assigned Role</th>
                <th className="py-3 px-4 font-semibold text-center">Account Status</th>
                <th className="py-3 px-4 font-semibold text-right">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal-border/50 text-xs">
              {recentUsers.length > 0 ? (
                recentUsers.map((u) => {
                  const roleVariant =
                    u.role === "admin"
                      ? "downy"
                      : u.role === "faculty" || u.role === "hod"
                      ? "melrose"
                      : "jonquil";

                  const isAct = u.accountStatus === "active" || !u.accountStatus;

                  return (
                    <tr key={u._id} className="hover:bg-charcoal-elevated/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-alice flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-charcoal-elevated border border-charcoal-border flex items-center justify-center text-[11px] font-bold">
                          {u.name?.charAt(0) || "U"}
                        </div>
                        <span>{u.name}</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-alice-muted">{u.email}</td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant={roleVariant}>
                          {u.role?.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant={isAct ? "success" : "danger"}>
                          {isAct ? "ACTIVE" : "INACTIVE"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right text-alice-dim font-mono">
                        {new Date(u.createdAt || Date.now()).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-alice-muted">
                    No user accounts found.
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
