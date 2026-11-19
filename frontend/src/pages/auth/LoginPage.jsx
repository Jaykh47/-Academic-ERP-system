import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, DEMO_ACCOUNTS } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import {
  Shield,
  Briefcase,
  GraduationCap,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
} from "lucide-react";

export const LoginPage = () => {
  const { login, demoLogin } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleManualLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      error("Please enter both email and password.");
      return;
    }

    try {
      setLoading(true);
      const res = await login(email, password);
      success(`Welcome back, ${res.data.user.name}!`);

      const userRole = res.data.user.role.toLowerCase();
      if (userRole === "admin") navigate("/admin");
      else if (userRole === "faculty" || userRole === "hod") navigate("/faculty");
      else navigate("/student");
    } catch (err) {
      error(err.response?.data?.message || "Invalid credentials. Please verify your email and password.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoClick = async (roleKey) => {
    try {
      setLoading(true);
      const creds = DEMO_ACCOUNTS[roleKey];
      setEmail(creds.email);
      setPassword(creds.password);
      const res = await demoLogin(roleKey);
      success(`Signed in as ${res.data.user.name} (${creds.label})`);

      if (roleKey === "admin") navigate("/admin");
      else if (roleKey === "faculty") navigate("/faculty");
      else navigate("/student");
    } catch (err) {
      error(err.response?.data?.message || "Demo login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-charcoal text-alice flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background ambient glow matching Downy & Melrose */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-downy/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-melrose/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-charcoal-card border border-charcoal-border text-xs text-alice-muted">
            <span className="w-2 h-2 rounded-full bg-downy animate-pulse" />
            <span>Academic ERP & Attendance Suite</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-alice">
            Academia<span className="text-downy">Tracker</span>
          </h1>
          <p className="text-xs text-alice-muted max-w-xs mx-auto">
            Real-time attendance intelligence & CBCS grading engine.
          </p>
        </div>

        {/* 1-Click Demo Logins Card */}
        <div className="rounded-2xl bg-charcoal-card border border-charcoal-border/80 p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-alice-muted flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-jonquil" />
              1-Click Demo Evaluation
            </span>
            <span className="text-[10px] text-alice-dim">Instant role access</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleDemoClick("admin")}
              disabled={loading}
              className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-charcoal-elevated border border-downy/30 hover:border-downy hover:bg-downy/10 text-alice transition-all group"
            >
              <Shield className="w-4 h-4 text-downy mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold">Admin</span>
              <span className="text-[10px] text-alice-dim">System</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoClick("faculty")}
              disabled={loading}
              className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-charcoal-elevated border border-melrose/30 hover:border-melrose hover:bg-melrose/10 text-alice transition-all group"
            >
              <Briefcase className="w-4 h-4 text-melrose mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold">Faculty</span>
              <span className="text-[10px] text-alice-dim">HOD / Staff</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoClick("student")}
              disabled={loading}
              className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-charcoal-elevated border border-jonquil/30 hover:border-jonquil hover:bg-jonquil/10 text-alice transition-all group"
            >
              <GraduationCap className="w-4 h-4 text-[#bfd948] mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold">Student</span>
              <span className="text-[10px] text-alice-dim">Ravi (BCA)</span>
            </button>
          </div>
        </div>

        {/* Credentials Form */}
        <div className="rounded-2xl bg-charcoal-card border border-charcoal-border p-6 shadow-2xl space-y-4">
          <form onSubmit={handleManualLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-alice-muted uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-alice-dim absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@college.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-charcoal-elevated border border-charcoal-border focus:border-downy focus:ring-1 focus:ring-downy text-alice text-sm outline-none transition-all placeholder:text-alice-dim"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-alice-muted uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-alice-dim absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-charcoal-elevated border border-charcoal-border focus:border-downy focus:ring-1 focus:ring-downy text-alice text-sm outline-none transition-all placeholder:text-alice-dim"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-alice-dim hover:text-alice transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-downy text-charcoal font-bold text-sm tracking-wide hover:bg-downy-hover shadow-lg shadow-downy/20 hover:shadow-downy/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-charcoal border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] text-alice-dim">
          MERN Academic ERP • Multi-role RBAC Protected
        </p>
      </div>
    </div>
  );
};
