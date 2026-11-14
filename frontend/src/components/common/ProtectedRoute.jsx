import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { LoadingSpinner } from "./LoadingSpinner";

export const ProtectedRoute = ({ allowedRoles }) => {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-charcoal flex items-center justify-center">
        <LoadingSpinner size="lg" label="Verifying security credentials..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    // Redirect to user's assigned home portal
    if (role === "admin") return <Navigate to="/admin" replace />;
    if (role === "faculty" || role === "hod") return <Navigate to="/faculty" replace />;
    return <Navigate to="/student" replace />;
  }

  return <Outlet />;
};
