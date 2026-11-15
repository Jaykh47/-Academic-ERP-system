import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { ProtectedRoute } from "./components/common/ProtectedRoute";
import { AppLayout } from "./layouts/AppLayout";

// Auth Pages
import { LoginPage } from "./pages/auth/LoginPage";

// Student Pages
import { StudentDashboard } from "./pages/student/StudentDashboard";
import { StudentAttendance } from "./pages/student/StudentAttendance";
import { StudentPerformance } from "./pages/student/StudentPerformance";
import { StudentNotifications } from "./pages/student/StudentNotifications";
import { StudentEnrollmentPage } from "./pages/student/StudentEnrollmentPage";

// Faculty & HOD Pages
import { FacultyDashboard } from "./pages/faculty/FacultyDashboard";
import { ClassAttendancePage } from "./pages/faculty/ClassAttendancePage";
import { MarksEntryPage } from "./pages/faculty/MarksEntryPage";
import { DepartmentAnalyticsPage } from "./pages/faculty/DepartmentAnalyticsPage";

// Admin Pages
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { UserManagementPage } from "./pages/admin/UserManagementPage";
import { AcademicSetupPage } from "./pages/admin/AcademicSetupPage";
import { SystemRiskPage } from "./pages/admin/SystemRiskPage";

// Root Redirect component based on logged-in role
const RootRedirect = () => {
  const { isAuthenticated, role, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role === "admin") return <Navigate to="/admin" replace />;
  if (role === "faculty" || role === "hod") return <Navigate to="/faculty" replace />;
  return <Navigate to="/student" replace />;
};

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<RootRedirect />} />

            {/* Student Protected Routes */}
            <Route element={<ProtectedRoute allowedRoles={["student"]} />}>
              <Route element={<AppLayout />}>
                <Route path="/student" element={<StudentDashboard />} />
                <Route path="/student/enrollment" element={<StudentEnrollmentPage />} />
                <Route path="/student/attendance" element={<StudentAttendance />} />
                <Route path="/student/performance" element={<StudentPerformance />} />
                <Route path="/student/notifications" element={<StudentNotifications />} />
              </Route>
            </Route>

            {/* Faculty & HOD Protected Routes */}
            <Route element={<ProtectedRoute allowedRoles={["faculty", "hod", "admin"]} />}>
              <Route element={<AppLayout />}>
                <Route path="/faculty" element={<FacultyDashboard />} />
                <Route path="/faculty/attendance" element={<ClassAttendancePage />} />
                <Route path="/faculty/marks" element={<MarksEntryPage />} />
                <Route path="/faculty/analytics" element={<DepartmentAnalyticsPage />} />
              </Route>
            </Route>

            {/* Admin Protected Routes */}
            <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
              <Route element={<AppLayout />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<UserManagementPage />} />
                <Route path="/admin/academic" element={<AcademicSetupPage />} />
                <Route path="/admin/risk" element={<SystemRiskPage />} />
              </Route>
            </Route>

            {/* 404 Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
