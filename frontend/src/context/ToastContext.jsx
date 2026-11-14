import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message, type = "info", duration = 4000) => {
      const id = Date.now() + Math.random().toString(36).substring(2, 9);
      const newToast = { id, message, type };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
      return id;
    },
    [removeToast]
  );

  const success = useCallback((msg, duration) => addToast(msg, "success", duration), [addToast]);
  const error = useCallback((msg, duration) => addToast(msg, "error", duration), [addToast]);
  const warning = useCallback((msg, duration) => addToast(msg, "warning", duration), [addToast]);
  const info = useCallback((msg, duration) => addToast(msg, "info", duration), [addToast]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast, success, error, warning, info }}>
      {children}
      {/* Toast Notification Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => {
          let borderStyle = "border-charcoal-border";
          let icon = <Info className="w-5 h-5 text-melrose shrink-0" />;
          let bgStyle = "bg-charcoal-card/95";

          if (toast.type === "success") {
            borderStyle = "border-downy/40 shadow-lg shadow-downy/10";
            icon = <CheckCircle2 className="w-5 h-5 text-downy shrink-0" />;
          } else if (toast.type === "error") {
            borderStyle = "border-red-400/40 shadow-lg shadow-red-500/10";
            icon = <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />;
          } else if (toast.type === "warning") {
            borderStyle = "border-jonquil/40 shadow-lg shadow-jonquil/10";
            icon = <AlertTriangle className="w-5 h-5 text-jonquil shrink-0" />;
          } else if (toast.type === "info") {
            borderStyle = "border-melrose/40 shadow-lg shadow-melrose/10";
            icon = <Info className="w-5 h-5 text-melrose shrink-0" />;
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border backdrop-blur-md text-alice text-sm shadow-xl transition-all duration-300 animate-slide-in ${bgStyle} ${borderStyle}`}
            >
              {icon}
              <div className="flex-1 font-medium leading-snug">{toast.message}</div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-alice-muted hover:text-alice transition-colors p-0.5 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
