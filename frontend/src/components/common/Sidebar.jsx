import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard,
  CalendarCheck,
  Award,
  Bell,
  User,
  Users,
  BookOpen,
  CheckSquare,
  Shield,
  GraduationCap,
  Sparkles,
  ChevronRight,
  Layers,
  Terminal,
} from "lucide-react";

export const Sidebar = ({ isOpen, onClose }) => {
  const { role, user } = useAuth();

  const getLinks = () => {
    switch (role) {
      case "student":
        return [
          { to: "/student", label: "Overview Console", icon: LayoutDashboard },
          { to: "/student/profile", label: "Student Dossier", icon: User },
          { to: "/student/enrollment", label: "Course Enrollment", icon: BookOpen },
          { to: "/student/attendance", label: "Attendance Ledger", icon: CalendarCheck },
          { to: "/student/performance", label: "Grades & Transcript", icon: Award },
          { to: "/student/notifications", label: "Notice Board", icon: Bell },
        ];
      case "faculty":
      case "hod":
        return [
          { to: "/faculty", label: "Faculty Terminal", icon: LayoutDashboard },
          { to: "/faculty/profile", label: "Staff Profile", icon: User },
          { to: "/faculty/attendance", label: "Session Attendance", icon: CheckSquare },
          { to: "/faculty/marks", label: "Examination Scoring", icon: Award },
        ];
      case "admin":
        return [
          { to: "/admin", label: "Command Center", icon: LayoutDashboard },
          { to: "/admin/profile", label: "Administrator ID", icon: User },
          { to: "/admin/users", label: "Directory & Access", icon: Users },
          { to: "/admin/academic", label: "Curriculum Setup", icon: BookOpen },
        ];
      default:
        return [];
    }
  };

  const navLinks = getLinks();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      {/* Bespoke Institutional Sidebar */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 bg-[#0A0E17]/95 backdrop-blur-2xl border-r border-white/[0.07] transition-transform duration-300 md:translate-x-0 flex flex-col justify-between ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 space-y-5">
          {/* Executive User Chip */}
          <NavLink
            to="/profile"
            className="group relative p-3 rounded-xl bg-[#0F1624] border border-white/[0.08] hover:border-teal-500/40 transition-all flex items-center gap-3 overflow-hidden"
            title="View Profile Dossier"
          >
            <div className="relative w-9 h-9 rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center text-teal-400 shrink-0 overflow-hidden shadow-inner">
              {user?.avatar ? (
                <img src={user.avatar} alt={user?.name || "User"} className="w-full h-full object-cover" />
              ) : (
                <>
                  {role === "admin" && <Shield className="w-4 h-4 text-teal-400" />}
                  {role === "faculty" && <Sparkles className="w-4 h-4 text-indigo-400" />}
                  {role === "hod" && <Sparkles className="w-4 h-4 text-indigo-400" />}
                  {role === "student" && <GraduationCap className="w-4 h-4 text-amber-400" />}
                </>
              )}
            </div>

            <div className="overflow-hidden flex-1 min-w-0">
              <div className="text-xs font-semibold text-slate-100 truncate group-hover:text-teal-300 transition-colors">
                {user?.name || "Authorized User"}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold truncate">
                  {role} // ACTIVE
                </span>
              </div>
            </div>

            <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-300 transition-colors shrink-0" />
          </NavLink>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <div className="flex items-center justify-between px-2.5 pb-2">
              <span className="text-[10px] font-mono font-semibold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                <Terminal className="w-3 h-3 text-teal-400/60" />
                DIRECTORY
              </span>
              <span className="text-[9px] font-mono text-slate-600">v2.4</span>
            </div>

            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/student" || item.to === "/faculty" || item.to === "/admin"}
                  onClick={() => onClose && onClose()}
                  className={({ isActive }) =>
                    `group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium tracking-wide transition-all ${
                      isActive
                        ? "text-white bg-gradient-to-r from-teal-500/15 via-teal-500/5 to-transparent border-l-2 border-teal-400 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] font-semibold"
                        : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.03] border-l-2 border-transparent"
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0 transition-colors group-hover:text-teal-400" />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer: Institutional Compliance & Architecture */}
        <div className="p-4 border-t border-white/[0.06] space-y-3">
          <div className="p-3 rounded-lg bg-[#0C111C] border border-white/[0.05] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold tracking-wider text-slate-300 flex items-center gap-1">
                <Layers className="w-3 h-3 text-teal-400" />
                CBCS 10-POINT
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-300 border border-teal-500/20 font-semibold">
                UGC A++
              </span>
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Standardized relative grading, credit audit, and institutional compliance ledger.
            </p>
          </div>

          <div className="flex items-center justify-between px-1 text-[10px] font-mono text-slate-600">
            <span>SECURE INSTANCE</span>
            <span>PORT 5000</span>
          </div>
        </div>
      </aside>
    </>
  );
};
