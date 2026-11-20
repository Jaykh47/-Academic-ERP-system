import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { notificationApi } from "../../api/notificationApi";
import {
  Bell,
  LogOut,
  User,
  Shield,
  GraduationCap,
  Briefcase,
} from "lucide-react";
import { Badge } from "./Badge";

export const Navbar = ({ onToggleSidebar }) => {
  const { user, role, logout } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await notificationApi.getMyNotifications({ limit: 5 });
      if (res?.data?.notifications) {
        setNotifications(res.data.notifications);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch {
      // Ignore background notification fetch errors
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [user]);

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      success("All notifications marked as read");
    } catch (err) {
      error("Failed to mark notifications as read");
    }
  };

  const handleLogout = async () => {
    await logout();
    success("Logged out successfully");
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 bg-[#080B11]/90 backdrop-blur-xl border-b border-white/[0.07]">
      {/* Left: Mobile hamburger & College Branding */}
      <div className="flex items-center gap-3.5">
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors border border-white/[0.06]"
          aria-label="Toggle Navigation"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-gradient-to-br from-teal-500/20 via-teal-500/10 to-transparent border border-teal-500/30 flex items-center justify-center text-teal-300 font-mono font-bold text-xs shadow-sm">
            Δ
          </div>

          <span className="font-bold tracking-tight text-white text-base md:text-lg">
            Academia<span className="text-teal-400">Portal</span>
          </span>
        </div>
      </div>

      {/* Center: Live Academic Term Indicator */}
      <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-[#0D131F] border border-white/[0.06] text-xs font-mono">
        <span className="text-slate-400">Academic Year 2024–2025</span>
        <span className="text-slate-600">•</span>
        <span className="text-teal-400 font-medium">Active Term</span>
      </div>

      {/* Right: Actions, Notifications, Role chip & Logout */}
      <div className="flex items-center gap-2 md:gap-3.5">
        {/* Role Pill */}
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg border border-white/[0.08] bg-[#0E1523] text-xs font-mono">
          {role === "admin" && <Shield className="w-3.5 h-3.5 text-teal-400" />}
          {(role === "faculty" || role === "hod") && <Briefcase className="w-3.5 h-3.5 text-indigo-400" />}
          {role === "student" && <GraduationCap className="w-3.5 h-3.5 text-amber-400" />}
          <span className="uppercase text-slate-300 font-semibold tracking-wider text-[11px]">{role}</span>
        </div>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors border border-transparent hover:border-white/[0.08]"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 ring-4 ring-[#080B11]" />
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-[#0F1624] border border-white/[0.1] shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="p-3 border-b border-white/[0.07] flex items-center justify-between bg-[#0B101A]">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono uppercase tracking-wider text-slate-300 font-bold">
                    Announcements
                  </span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      {unreadCount} unread
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-teal-400 hover:text-teal-300 font-medium transition-colors"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-white/[0.04]">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500 font-mono">
                    No new announcements
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      className={`p-3 text-xs transition-colors hover:bg-white/[0.02] ${
                        !n.isRead ? "bg-teal-500/[0.03]" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-slate-200">{n.title}</span>
                        {!n.isRead && (
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {n.message}
                      </p>
                      <span className="text-[10px] font-mono text-slate-500 mt-1.5 block">
                        {new Date(n.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar & Logout */}
        <div className="flex items-center gap-2 pl-2 border-l border-white/[0.08]">
          <Link
            to="/profile"
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/[0.05] text-slate-300 hover:text-white transition-colors"
            title="My Profile"
          >
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-slate-700 to-slate-900 border border-white/10 flex items-center justify-center text-xs font-mono font-bold text-slate-200">
              {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
            <span className="hidden md:inline-block text-xs font-medium max-w-[110px] truncate text-slate-200">
              {user?.name}
            </span>
          </Link>

          <button
            onClick={handleLogout}
            className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors border border-transparent hover:border-rose-500/20"
            title="Sign Out"
            aria-label="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
