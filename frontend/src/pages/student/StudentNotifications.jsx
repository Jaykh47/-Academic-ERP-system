import React, { useState, useEffect } from "react";
import { notificationApi } from "../../api/notificationApi";
import { useToast } from "../../context/ToastContext";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { Badge } from "../../components/common/Badge";
import { Bell, CheckCheck, Trash2, Calendar, Award, AlertTriangle, Info } from "lucide-react";

export const StudentNotifications = () => {
  const { success, error } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await notificationApi.getMyNotifications({ limit: 50 });
      setNotifications(res?.data?.notifications || []);
    } catch (err) {
      error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      success("Notification marked as read");
    } catch {
      error("Action failed");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      success("All notifications marked as read");
    } catch {
      error("Failed to update notifications");
    }
  };

  const handleDelete = async (id) => {
    try {
      await notificationApi.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      success("Notification removed");
    } catch {
      error("Failed to delete notification");
    }
  };

  if (loading) {
    return <LoadingSpinner label="Fetching your notifications..." />;
  }

  const getNotificationIcon = (type) => {
    if (type?.includes("attendance") || type?.includes("shortage")) {
      return <AlertTriangle className="w-5 h-5 text-jonquil" />;
    }
    if (type?.includes("marks") || type?.includes("grade") || type?.includes("exam")) {
      return <Award className="w-5 h-5 text-melrose" />;
    }
    return <Info className="w-5 h-5 text-downy" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-alice tracking-tight">
            Notifications & Academic Alerts
          </h1>
          <p className="text-xs text-alice-muted mt-1">
            Official broadcasts, attendance alerts, exam schedules, and marks publication notices.
          </p>
        </div>

        {notifications.some((n) => !n.isRead) && (
          <button
            onClick={handleMarkAllRead}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-charcoal-elevated border border-charcoal-border hover:border-downy text-xs font-bold text-alice transition-all self-start sm:self-auto"
          >
            <CheckCheck className="w-4 h-4 text-downy" />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      <div className="rounded-3xl bg-charcoal-card border border-charcoal-border p-6 shadow-xl space-y-3">
        {notifications.length > 0 ? (
          notifications.map((n) => (
            <div
              key={n._id}
              className={`p-4 rounded-2xl border transition-all flex items-start gap-4 ${
                n.isRead
                  ? "bg-charcoal-elevated/40 border-charcoal-border/70 text-alice-muted"
                  : "bg-charcoal-elevated border-downy/30 shadow-md shadow-downy/5 text-alice"
              }`}
            >
              <div className="p-2.5 rounded-xl bg-charcoal border border-charcoal-border shrink-0 mt-0.5">
                {getNotificationIcon(n.type)}
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-alice">{n.title}</h3>
                    {!n.isRead && <Badge variant="downy">NEW</Badge>}
                  </div>
                  <span className="text-[11px] text-alice-dim">
                    {new Date(n.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-xs text-alice-muted leading-relaxed">{n.message}</p>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {!n.isRead && (
                  <button
                    onClick={() => handleMarkAsRead(n._id)}
                    className="p-1.5 rounded-lg text-alice-muted hover:text-downy hover:bg-charcoal transition-colors"
                    title="Mark as read"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(n._id)}
                  className="p-1.5 rounded-lg text-alice-muted hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-16 space-y-2">
            <Bell className="w-8 h-8 text-alice-dim mx-auto" />
            <p className="text-sm font-bold text-alice">No notifications</p>
            <p className="text-xs text-alice-dim">You're all caught up on academic alerts.</p>
          </div>
        )}
      </div>
    </div>
  );
};
