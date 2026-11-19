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
  ChevronDown,
  CheckCircle,
  ExternalLink,
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

  const getRoleBadgeVariant = (r) => {
    if (r === "admin") return "downy";
    if (r === "faculty" || r === "hod") return "melrose";
    return "jonquil";
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 bg-charcoal-card/90 backdrop-blur-md border-b border-charcoal-border">
      {/* Left: Mobile hamburger & branding */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 rounded-lg text-alice-muted hover:text-alice hover:bg-charcoal-elevated transition-colors"
          aria-label="Toggle Navigation"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-downy animate-pulse shadow-sm shadow-downy" />
          <span className="font-bold tracking-tight text-alice text-base md:text-lg">
            Academia<span className="text-downy">Tracker</span>
          </span>
          <span className="hidden lg:inline-block text-xs px-2 py-0.5 rounded-md bg-charcoal-elevated text-alice-dim font-mono">
            ERP v1.0
          </span>
        </div>
      </div>

      {/* Right: Role indicator, Notifications, User info, Logout */}
      <div className="flex items-center gap-2.5 md:gap-4">
        {/* User Role Badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-charcoal-border bg-charcoal-elevated text-xs font-medium text-alice">
          {role === "admin" && <Shield className="w-3.5 h-3.5 text-downy" />}
          {(role === "faculty" || role === "hod") && <Briefcase className="w-3.5 h-3.5 text-melrose" />}
          {role === "student" && <GraduationCap className="w-3.5 h-3.5 text-[#bfd948]" />}
          <span className="text-alice-muted">Portal:</span>
          <span className="uppercase text-downy font-bold tracking-wide">{role || "User"}</span>
        </div>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="relative p-2 rounded-xl text-alice-muted hover:text-alice hover:bg-charcoal-elevated transition-colors border border-transparent hover:border-charcoal-border"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-jonquil animate-ping" />
            )}
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-jonquil" />
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-charcoal-card border border-charcoal-border shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-charcoal-border">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-alice uppercase tracking-wider">
                    Notifications
                  </span>
                  {unreadCount > 0 && (
                    <Badge variant="jonquil">{unreadCount} new</Badge>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-downy hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      className={`p-2.5 rounded-xl border text-xs transition-colors ${
                        n.isRead
                          ? "bg-charcoal-elevated/30 border-charcoal-border text-alice-muted"
                          : "bg-charcoal-elevated border-downy/30 text-alice"
                      }`}
                    >
                      <div className="font-semibold text-alice flex items-center justify-between">
                        <span>{n.title}</span>
                        <span className="text-[10px] text-alice-dim">
                          {new Date(n.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-alice-muted mt-1 leading-snug">{n.message}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-6 text-xs text-alice-muted">
                    No recent notifications
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Pill & Logout */}
        <div className="flex items-center gap-2 pl-2 border-l border-charcoal-border">
          <Link
            to="/profile"
            className="flex items-center gap-2.5 hover:opacity-90 transition-opacity group"
            title="View My Profile"
          >
            <div className="w-8 h-8 rounded-full bg-charcoal-elevated border border-charcoal-border group-hover:border-downy/60 transition-colors flex items-center justify-center text-alice font-bold text-xs uppercase overflow-hidden shrink-0">
              {user?.avatar ? (
                <img src={user.avatar} alt={user?.name || "User"} className="w-full h-full object-cover" />
              ) : (
                user?.name ? user.name.charAt(0).toUpperCase() : "U"
              )}
            </div>
            <div className="hidden md:block text-left">
              <div className="text-xs font-bold text-alice leading-tight truncate max-w-[120px] group-hover:text-downy transition-colors">
                {user?.name || "User"}
              </div>
              <div className="text-[10px] text-alice-muted uppercase tracking-wider">
                {role}
              </div>
            </div>
          </Link>

          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg text-alice-muted hover:text-rose-400 hover:bg-rose-500/10 transition-colors ml-1 cursor-pointer"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
