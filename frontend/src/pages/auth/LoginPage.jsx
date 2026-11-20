import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { authApi } from "../../api/authApi";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  UserX,
  Loader2,
  GraduationCap,
  BookOpen,
  CalendarCheck,
  Award,
} from "lucide-react";

export const LoginPage = () => {
  const { login } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Email verification state
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [accountInfo, setAccountInfo] = useState(null); // { exists: bool, name, role, message }
  const debounceTimerRef = useRef(null);

  // Field-level validation error states
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [formError, setFormError] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);

  // Standard email regular expression
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  const validateEmailSyntax = (val) => {
    const trimmed = (val ?? "").trim();
    if (!trimmed) {
      return "Email address is required.";
    }
    if (!emailRegex.test(trimmed)) {
      return "Please enter a valid email address (e.g. user@college.edu).";
    }
    return "";
  };

  const validatePassword = (val) => {
    if (!val) {
      return "Password is required.";
    }
    if (val.length < 6) {
      return "Password must be at least 6 characters.";
    }
    return "";
  };

  // Perform async email check with the backend
  const verifyEmailWithServer = async (emailToVerify) => {
    const trimmed = (emailToVerify || "").trim().toLowerCase();
    if (!emailRegex.test(trimmed)) {
      setAccountInfo(null);
      return;
    }

    try {
      setCheckingEmail(true);
      const res = await authApi.checkEmail(trimmed);
      const data = res?.data;
      if (data?.exists) {
        setAccountInfo({
          exists: true,
          name: data.name,
          role: data.role,
          message: data.message,
        });
        setEmailError("");
      } else {
        setAccountInfo({
          exists: false,
          name: null,
          role: null,
          message: data?.message || "No registered account found with this email.",
        });
        setEmailError("No account found with this email address. Please check spelling.");
      }
    } catch (err) {
      setAccountInfo(null);
    } finally {
      setCheckingEmail(false);
    }
  };

  // Handle email changes with debounce
  const handleEmailChange = (e) => {
    const val = e.target.value;
    setEmail(val);
    setEmailTouched(true);
    setFormError("");

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const trimmed = val.trim();
    if (!trimmed) {
      setEmailError("Email address is required.");
      setAccountInfo(null);
      return;
    }

    if (!emailRegex.test(trimmed)) {
      setEmailError("Please enter a valid email address format.");
      setAccountInfo(null);
      return;
    }

    setEmailError("");
    debounceTimerRef.current = setTimeout(() => {
      verifyEmailWithServer(trimmed);
    }, 450);
  };

  const handleEmailBlur = () => {
    setEmailTouched(true);
    const syntaxErr = validateEmailSyntax(email);
    setEmailError(syntaxErr);
    if (!syntaxErr && !accountInfo && !checkingEmail) {
      verifyEmailWithServer(email.trim());
    }
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    setFormError("");
    if (passwordError) {
      setPasswordError(validatePassword(e.target.value));
    }
  };

  const handleManualLogin = async (e) => {
    e.preventDefault();

    const emailErr = validateEmailSyntax(email);
    const passErr = validatePassword(password);
    setEmailError(emailErr);
    setPasswordError(passErr);
    setFormError("");

    if (emailErr || passErr) {
      return;
    }

    if (accountInfo && accountInfo.exists === false) {
      setEmailError("No account found with this email address. Please verify your email.");
      return;
    }

    try {
      setLoading(true);
      const trimmedEmail = email.trim().toLowerCase();
      const res = await login(trimmedEmail, password);
      success(`Welcome back, ${res.data.user.name}!`);

      const userRole = res.data.user.role.toLowerCase();
      if (userRole === "admin") navigate("/admin");
      else if (userRole === "faculty" || userRole === "hod") navigate("/faculty");
      else navigate("/student");
    } catch (err) {
      const status = err.response?.status;
      const serverMsg =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.message ||
        "Login failed. Please check your credentials.";

      if (status === 404) {
        setEmailError("No account found with this email address. Please check your email.");
        setAccountInfo({
          exists: false,
          message: "No account found with this email address.",
        });
        setFormError(serverMsg);
      } else if (status === 401) {
        setPasswordError("Incorrect password. Please verify your password and try again.");
        setFormError("Incorrect password. Please check your password.");
      } else {
        setFormError(serverMsg);
      }
      error(serverMsg);
    } finally {
      setLoading(false);
    }
  };

  const isEmailValid = emailTouched && !emailError && emailRegex.test(email.trim());

  return (
    <div className="min-h-screen bg-[#080B11] text-[#F8FAFC] flex items-center justify-center p-4 md:p-8 relative overflow-hidden font-sans">
      <div className="absolute inset-0 bg-grid-subtle opacity-60 pointer-events-none" />

      {/* Main Split Layout */}
      <div className="w-full max-w-4xl relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Panel: College Information */}
        <div className="lg:col-span-6 space-y-6 hidden lg:block">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0D131F] border border-white/[0.08] text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-teal-400" />
              <span className="text-slate-300">COLLEGE PORTAL</span>
              <span className="text-slate-600">•</span>
              <span className="text-teal-400">2024–2025</span>
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight text-white leading-tight">
              Academia<span className="text-teal-400">Portal</span>
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              Official academic portal for students, faculty members, and administrative staff.
            </p>
          </div>

          {/* Student & Faculty Feature Highlights */}
          <div className="p-4 rounded-xl bg-[#0D121D]/80 border border-white/[0.07] space-y-3">
            <p className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
              ACADEMIC SERVICES
            </p>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="p-3 rounded-lg bg-[#080C14] border border-white/[0.04] space-y-1">
                <div className="flex items-center gap-1.5 text-teal-400">
                  <CalendarCheck className="w-3.5 h-3.5" />
                  <span className="font-semibold text-white">Attendance</span>
                </div>
                <p className="text-[11px] text-slate-400">Daily subject attendance tracking</p>
              </div>

              <div className="p-3 rounded-lg bg-[#080C14] border border-white/[0.04] space-y-1">
                <div className="flex items-center gap-1.5 text-indigo-400">
                  <Award className="w-3.5 h-3.5" />
                  <span className="font-semibold text-white">Examination</span>
                </div>
                <p className="text-[11px] text-slate-400">Marks entry & SGPA report cards</p>
              </div>

              <div className="p-3 rounded-lg bg-[#080C14] border border-white/[0.04] space-y-1">
                <div className="flex items-center gap-1.5 text-amber-400">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span className="font-semibold text-white">Courses</span>
                </div>
                <p className="text-[11px] text-slate-400">Semester course registration</p>
              </div>

              <div className="p-3 rounded-lg bg-[#080C14] border border-white/[0.04] space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span className="font-semibold text-white">Grading</span>
                </div>
                <p className="text-[11px] text-slate-400">UGC 10-point standard scale</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Sign In Card */}
        <div className="lg:col-span-6 w-full max-w-md mx-auto">
          <div className="rounded-xl bg-[#0D121D]/90 backdrop-blur-2xl border border-white/[0.08] p-6 sm:p-8 shadow-[0_4px_30px_-2px_rgba(0,0,0,0.6)] space-y-5">
            {/* Header */}
            <div className="pb-3 border-b border-white/[0.06] flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Sign In
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Enter your email and password to access your account
                </p>
              </div>
              <div className="p-2 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>

            {/* Error alert */}
            {formError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/25 flex items-start gap-2.5 text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleManualLogin} noValidate className="space-y-4">
              {/* Email Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-wider">
                    Email Address
                  </label>
                  {checkingEmail && (
                    <span className="text-[11px] text-teal-400 flex items-center gap-1 font-mono">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Checking email...
                    </span>
                  )}
                </div>

                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    onBlur={handleEmailBlur}
                    placeholder="name@college.edu"
                    autoComplete="email"
                    autoCapitalize="none"
                    spellCheck="false"
                    disabled={loading}
                    className={`w-full pl-9 pr-9 py-2.5 rounded-lg bg-[#080C14] border text-white text-xs outline-none transition-all placeholder:text-slate-600 font-mono ${
                      emailError || (accountInfo && !accountInfo.exists)
                        ? "border-rose-500/60 focus:border-rose-500"
                        : accountInfo?.exists
                        ? "border-teal-500/60 focus:border-teal-500"
                        : isEmailValid
                        ? "border-teal-500/40 focus:border-teal-500"
                        : "border-white/[0.08] focus:border-teal-400/50"
                    }`}
                  />

                  {/* Right Input Status Indicator */}
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                    {checkingEmail ? (
                      <Loader2 className="w-4 h-4 text-teal-400 animate-spin" />
                    ) : accountInfo?.exists ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" title="Account recognized" />
                    ) : accountInfo && !accountInfo.exists ? (
                      <UserX className="w-4 h-4 text-rose-400" title="Account not found" />
                    ) : isEmailValid && !emailError ? (
                      <CheckCircle2 className="w-4 h-4 text-teal-400/50" />
                    ) : null}
                  </div>
                </div>

                {/* Account info pill when verified */}
                {accountInfo?.exists && (
                  <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs animate-in fade-in duration-150">
                    <span className="text-emerald-300 font-medium">{accountInfo.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 uppercase font-bold">
                      {accountInfo.role}
                    </span>
                  </div>
                )}

                {/* Email error message */}
                {emailError && (
                  <p className="text-[11px] text-rose-400 flex items-center gap-1 font-mono">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {emailError}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-wider">
                    Password
                  </label>
                </div>

                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={handlePasswordChange}
                    placeholder="Enter account password"
                    autoComplete="current-password"
                    disabled={loading}
                    className={`w-full pl-9 pr-9 py-2.5 rounded-lg bg-[#080C14] border text-white text-xs outline-none transition-all placeholder:text-slate-600 font-mono ${
                      passwordError
                        ? "border-rose-500/60 focus:border-rose-500"
                        : "border-white/[0.08] focus:border-teal-400/50"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {passwordError && (
                  <p className="text-[11px] text-rose-400 flex items-center gap-1 font-mono">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {passwordError}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || (accountInfo && !accountInfo.exists)}
                className="w-full py-2.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-[#080B11] font-semibold text-xs tracking-wider uppercase transition-all shadow-[0_1px_3px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.3)] hover:shadow-[0_0_16px_rgba(45,212,191,0.35)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Institutional Seal */}
            <div className="pt-3 border-t border-white/[0.06] text-center text-[10px] font-mono text-slate-500">
              Official College Academic Portal
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
