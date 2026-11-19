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
} from "lucide-react";

export const Sidebar = ({ isOpen, onClose }) => {
  const { role, user } = useAuth();

  const getLinks = () => {
    switch (role) {
      case "student":
        return [
          { to: "/student", label: "Dashboard", icon: LayoutDashboard },
          { to: "/student/profile", label: "My Profile", icon: User },
          { to: "/student/enrollment", label: "Course Registration", icon: BookOpen },
          { to: "/student/attendance", label: "Attendance Records", icon: CalendarCheck },
          { to: "/student/performance", label: "Grades & SGPA", icon: Award },
          { to: "/student/notifications", label: "Notifications", icon: Bell },
        ];
      case "faculty":
      case "hod":
        return [
          { to: "/faculty", label: "Overview", icon: LayoutDashboard },
          { to: "/faculty/profile", label: "My Profile", icon: User },
          { to: "/faculty/attendance", label: "Class Attendance", icon: CheckSquare },
          { to: "/faculty/marks", label: "Exam Marks Entry", icon: Award },
        ];
      case "admin":
        return [
          { to: "/admin", label: "System Overview", icon: LayoutDashboard },
          { to: "/admin/profile", label: "My Profile", icon: User },
          { to: "/admin/users", label: "User Directory", icon: Users },
          { to: "/admin/academic", label: "Academic Setup", icon: BookOpen },
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
          className="fixed inset-0 z-40 bg-[#0D141C]/80 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 bg-charcoal-card border-r border-charcoal-border transition-transform duration-300 md:translate-x-0 flex flex-col justify-between ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 space-y-6">
          {/* User Role Card */}
          <NavLink
            to="/profile"
            className="p-3.5 rounded-2xl bg-charcoal-elevated/70 border border-charcoal-border/80 flex items-center gap-3 hover:border-downy/40 transition-colors group"
            title="View Profile"
          >
            <div className="w-9 h-9 rounded-xl bg-downy/10 border border-downy/30 flex items-center justify-center text-downy shrink-0 overflow-hidden">
              {user?.avatar ? (
                <img src={user.avatar} alt={user?.name || "User"} className="w-full h-full object-cover" />
              ) : (
                <>
                  {role === "admin" && <Shield className="w-5 h-5" />}
                  {role === "faculty" && <Sparkles className="w-5 h-5" />}
                  {role === "hod" && <Sparkles className="w-5 h-5" />}
                  {role === "student" && <GraduationCap className="w-5 h-5" />}
                </>
              )}
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-bold text-alice truncate group-hover:text-downy transition-colors">
                {user?.name}
              </div>
              <div className="text-[11px] uppercase tracking-wider text-downy font-semibold">
                {role} portal
              </div>
            </div>
          </NavLink>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-alice-dim">
              Navigation
            </p>
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/student" || item.to === "/faculty" || item.to === "/admin"}
                  onClick={() => onClose && onClose()}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                      isActive
                        ? "bg-downy/15 text-downy border border-downy/30 shadow-sm shadow-downy/10"
                        : "text-alice-muted hover:text-alice hover:bg-charcoal-elevated border border-transparent"
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer info badge */}
        <div className="p-4 border-t border-charcoal-border/70">
          <div className="p-3 rounded-xl bg-charcoal-elevated/40 border border-charcoal-border/50 text-[11px] text-alice-muted space-y-1">
            <div className="flex items-center justify-between text-alice font-medium">
              <span>CBCS 10-Point</span>
              <span className="text-downy font-bold">UGC</span>
            </div>
            <p className="text-[10px] text-alice-dim leading-relaxed">
              Calculates real-time SGPA & CBCS academic standing.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
