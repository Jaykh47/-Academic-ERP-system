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
  UserCheck,
  UserX,
  Loader2,
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
          message: `Account verified: ${data.name} (${data.role.toUpperCase()})`,
        });
        setEmailError("");
      } else {
        setAccountInfo({
          exists: false,
          message: "No account found with this email address.",
        });
        setEmailError("This email address is not registered in the system.");
      }
    } catch {
      // Network or API failure: don't aggressively block user, let submit handle it
      setAccountInfo(null);
    } finally {
      setCheckingEmail(false);
    }
  };

  const handleEmailChange = (e) => {
    const val = e.target.value;
    setEmail(val);
    setFormError("");
    setAccountInfo(null);

    const syntaxErr = validateEmailSyntax(val);
    if (emailTouched) {
      setEmailError(syntaxErr);
    }

    // Debounce verification check while typing if valid syntax
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!syntaxErr && val.trim().length > 5) {
      debounceTimerRef.current = setTimeout(() => {
        verifyEmailWithServer(val);
      }, 600);
    }
  };

  const handleEmailBlur = () => {
    setEmailTouched(true);
    const syntaxErr = validateEmailSyntax(email);
    setEmailError(syntaxErr);

    if (!syntaxErr && email.trim()) {
      verifyEmailWithServer(email);
    }
  };

  const handlePasswordChange = (e) => {
    const val = e.target.value;
    setPassword(val);
    setFormError("");
    if (passwordError) {
      setPasswordError(validatePassword(val));
    }
  };

  const handleManualLogin = async (e) => {
    e.preventDefault();
    setEmailTouched(true);

    const emailErr = validateEmailSyntax(email);
    const passErr = validatePassword(password);

    setEmailError(emailErr);
    setPasswordError(passErr);
    setFormError("");

    if (emailErr || passErr) {
      return;
    }

    // If pre-check explicitly confirmed account does not exist
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
        "Authentication failed. Please verify your credentials.";

      if (status === 404) {
        // Email does not exist
        setEmailError("No account found with this email address. Please check your email.");
        setAccountInfo({
          exists: false,
          message: "No account found with this email address.",
        });
        setFormError(serverMsg);
      } else if (status === 401) {
        // Password incorrect
        setPasswordError("Incorrect password. Please verify your password and try again.");
        setFormError("Incorrect password. Please verify your credentials.");
      } else if (status === 403) {
        // Account deactivated
        setFormError(serverMsg);
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
    <div className="min-h-screen bg-charcoal text-alice flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Ambient background glows */}
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
            Official Institutional Portal • Sign in with your registered college account.
          </p>
        </div>

        {/* Credentials Form */}
        <div className="rounded-3xl bg-charcoal-card border border-charcoal-border p-6 sm:p-8 shadow-2xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-charcoal-border/70">
            <div>
              <h2 className="text-base font-bold text-alice">Account Authentication</h2>
              <p className="text-xs text-alice-muted mt-0.5">
                Verify email and enter password to access portal
              </p>
            </div>
            <div className="p-2 rounded-xl bg-downy/10 border border-downy/20 text-downy">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>

          {/* Form-level error alert */}
          {formError && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-300 text-xs animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleManualLogin} noValidate className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-alice-muted uppercase tracking-wider">
                  Email Address
                </label>
                {checkingEmail && (
                  <span className="text-[11px] text-downy flex items-center gap-1 font-medium">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Authenticating email...
                  </span>
                )}
              </div>

              <div className="relative">
                <Mail className="w-4 h-4 text-alice-dim absolute left-3.5 top-1/2 -translate-y-1/2" />
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
                  className={`w-full pl-10 pr-10 py-2.5 rounded-xl bg-charcoal-elevated border text-alice text-sm outline-none transition-all placeholder:text-alice-dim/60 ${
                    emailError || (accountInfo && !accountInfo.exists)
                      ? "border-rose-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                      : accountInfo?.exists
                      ? "border-downy focus:border-downy focus:ring-1 focus:ring-downy shadow-sm shadow-downy/10"
                      : isEmailValid
                      ? "border-downy/50 focus:border-downy focus:ring-1 focus:ring-downy"
                      : "border-charcoal-border focus:border-downy focus:ring-1 focus:ring-downy"
                  }`}
                />

                {/* Right Input Status Indicator */}
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center">
                  {checkingEmail ? (
                    <Loader2 className="w-4 h-4 text-downy animate-spin" />
                  ) : accountInfo?.exists ? (
                    <CheckCircle2 className="w-4 h-4 text-downy" title="Account recognized" />
                  ) : accountInfo && !accountInfo.exists ? (
                    <UserX className="w-4 h-4 text-rose-400" title="Account not found" />
                  ) : isEmailValid && !emailError ? (
                    <CheckCircle2 className="w-4 h-4 text-downy/60" />
                  ) : null}
                </div>
              </div>

              {/* Verified Account Banner */}
              {accountInfo?.exists && !emailError && (
                <div className="p-2.5 rounded-xl bg-downy/10 border border-downy/30 flex items-center gap-2 text-downy text-xs font-semibold animate-in fade-in duration-200">
                  <UserCheck className="w-4 h-4 shrink-0" />
                  <span>
                    Account verified: <strong>{accountInfo.name}</strong> ({accountInfo.role.toUpperCase()})
                  </span>
                </div>
              )}

              {/* Email Not Found Banner */}
              {((accountInfo && !accountInfo.exists) || emailError) && (
                <p className="text-[11px] text-rose-400 font-medium flex items-center gap-1.5 mt-1 animate-in fade-in duration-150">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{emailError || accountInfo?.message}</span>
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-alice-muted uppercase tracking-wider">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-alice-dim absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  disabled={loading}
                  className={`w-full pl-10 pr-10 py-2.5 rounded-xl bg-charcoal-elevated border text-alice text-sm outline-none transition-all placeholder:text-alice-dim/60 ${
                    passwordError
                      ? "border-rose-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                      : "border-charcoal-border focus:border-downy focus:ring-1 focus:ring-downy"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-alice-dim hover:text-alice transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwordError && (
                <p className="text-[11px] text-rose-400 font-medium flex items-center gap-1 mt-1 animate-in fade-in duration-150">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{passwordError}</span>
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || checkingEmail}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-downy text-charcoal font-bold text-sm tracking-wide hover:bg-downy-hover shadow-lg shadow-downy/20 hover:shadow-downy/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-2"
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

          {/* Help Notice */}
          <div className="pt-2 border-t border-charcoal-border/50 text-center">
            <p className="text-[11px] text-alice-dim leading-relaxed">
              For account access issues, password resets, or enrollment status, please contact your Academic Administrator or Department Coordinator.
            </p>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] text-alice-dim">
          MERN Academic ERP • Multi-role RBAC Protected
        </p>
      </div>
    </div>
  );
};
