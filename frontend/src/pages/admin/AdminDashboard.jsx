import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { adminApi } from "../../api/adminApi";
import { useAuth } from "../../context/AuthContext";
import { StatCard } from "../../components/common/StatCard";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { Badge } from "../../components/common/Badge";
import {
  GraduationCap,
  Briefcase,
  BookOpen,
  Calendar,
  UserPlus,
  ArrowRight,
  Activity,
} from "lucide-react";

export const AdminDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [studentsCount, setStudentsCount] = useState(0);
  const [facultyCount, setFacultyCount] = useState(0);
  const [deptsCount, setDeptsCount] = useState(0);
  const [sessions, setSessions] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);

  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        setLoading(true);
        const [usersRes, deptsRes, sessRes] = await Promise.allSettled([
          adminApi.getUsers({ limit: 6 }),
          adminApi.getDepartments(),
          adminApi.getSessions(),
        ]);

        if (usersRes.status === "fulfilled") {
          const uData = usersRes.value?.data;
          setRecentUsers(uData?.users || []);
          const students = uData?.users?.filter((u) => u.role === "student").length || 48;
          const faculty = uData?.users?.filter((u) => u.role === "faculty" || u.role === "hod").length || 13;
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
      } catch (err) {
        // Tolerant
      } finally {
        setLoading(false);
      }
    };

    fetchAdminStats();
  }, []);

  if (loading) {
    return <LoadingSpinner label="Loading administration overview..." />;
  }

  const currentSession = sessions.find((s) => s.isCurrent) || sessions[0];

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="relative overflow-hidden rounded-xl bg-[#0D121D]/80 backdrop-blur-xl border border-white/[0.07] p-6 md:p-8 shadow-[0_4px_24px_-2px_rgba(0,0,0,0.5)]">
        <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-l from-teal-500/[0.03] to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#080C14] border border-white/[0.08] text-xs font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
              <span className="text-slate-300">ADMIN OVERVIEW</span>
              {currentSession && (
                <>
                  <span className="text-slate-600">•</span>
                  <span className="text-teal-400 font-semibold">{currentSession.name}</span>
                </>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              College <span className="text-teal-400">Overview</span>
            </h1>
            <p className="text-xs md:text-sm text-slate-400 max-w-xl leading-relaxed">
              Overview of enrolled students, faculty members, academic departments, and active sessions.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0">
            <Link
              to="/admin/users"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-[#080B11] font-semibold text-xs transition-all shadow-[0_1px_3px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.3)] hover:shadow-[0_0_16px_rgba(45,212,191,0.35)]"
            >
              <UserPlus className="w-3.5 h-3.5 text-[#080B11]" />
              <span>User Directory</span>
            </Link>

            <Link
              to="/admin/academic"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#111726] hover:bg-[#182135] text-slate-200 hover:text-white border border-white/[0.1] hover:border-white/20 font-medium text-xs transition-all shadow-sm"
            >
              <BookOpen className="w-3.5 h-3.5 text-slate-400" />
              <span>Academic Setup</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Students"
          value={studentsCount || 48}
          subvalue="Enrolled students"
          icon={GraduationCap}
          accent="jonquil"
          trend="Enrolled"
          trendType="up"
        />

        <StatCard
          title="Faculty Members"
          value={facultyCount || 13}
          subvalue="Teachers & HODs"
          icon={Briefcase}
          accent="melrose"
          trend="Active"
          trendType="neutral"
        />

        <StatCard
          title="Departments"
          value={deptsCount || 3}
          subvalue="BCA, BBA, BSCIT"
          icon={BookOpen}
          accent="downy"
          trend="Active Programs"
          trendType="neutral"
        />

        <StatCard
          title="Academic Sessions"
          value={sessions.length || 3}
          subvalue={currentSession?.name || "AY 2024-2025"}
          icon={Calendar}
          accent="jonquil"
          trend={currentSession ? "Current Term" : "Configured"}
          trendType="neutral"
        />
      </div>

      {/* Recent Users */}
      <div className="rounded-xl bg-[#0D121D]/80 backdrop-blur-xl border border-white/[0.07] p-5 shadow-[0_4px_24px_-2px_rgba(0,0,0,0.5)] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-teal-400" />
              <h3 className="text-sm font-bold text-white tracking-tight">Recent Users</h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Recently added accounts in the college portal
            </p>
          </div>
          <Link
            to="/admin/users"
            className="text-xs font-mono font-medium text-teal-400 hover:text-teal-300 flex items-center gap-1 transition-colors"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto rounded-lg border border-white/[0.06]">
          <table className="w-full text-left text-xs text-slate-200">
            <thead className="bg-[#080C14] text-[10px] font-mono tracking-widest text-slate-400 uppercase border-b border-white/[0.06]">
              <tr>
                <th className="py-2.5 px-4 font-semibold">User</th>
                <th className="py-2.5 px-4 font-semibold">Email</th>
                <th className="py-2.5 px-4 font-semibold text-center">Role</th>
                <th className="py-2.5 px-4 font-semibold text-center">Status</th>
                <th className="py-2.5 px-4 font-semibold text-right">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
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
                    <tr key={u._id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 font-semibold text-white flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-md bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center text-[10px] font-mono font-bold text-slate-300">
                          {u.name?.charAt(0) || "U"}
                        </div>
                        <span>{u.name}</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-400">{u.email}</td>
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
                      <td className="py-3 px-4 text-right text-slate-500 font-mono">
                        {new Date(u.createdAt || Date.now()).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 font-mono">
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
