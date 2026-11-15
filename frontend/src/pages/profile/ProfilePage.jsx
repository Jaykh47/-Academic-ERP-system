import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { authApi } from "../../api/authApi";
import { Badge } from "../../components/common/Badge";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import {
  Camera,
  Trash2,
  Upload,
  User,
  Mail,
  Phone,
  MapPin,
  Shield,
  GraduationCap,
  Briefcase,
  BookOpen,
  Calendar,
  Building,
  Key,
  Save,
  CheckCircle,
  Copy,
  AlertCircle,
  Sparkles,
} from "lucide-react";

/**
 * Compress an image file using an offscreen canvas to keep
 * payloads lightweight (<100KB) and crisp.
 */
const compressImage = (file, maxWidth = 500, maxHeight = 500, quality = 0.85) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

export const ProfilePage = () => {
  const { user, profile, role, updateUserProfile } = useAuth();
  const { success, error, warning } = useToast();

  const fileInputRef = useRef(null);

  const [saving, setSaving] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  // Form state
  const [avatar, setAvatar] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [guardianName, setGuardianName] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");
  const [qualification, setQualification] = useState("");

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // Synchronize state from user and profile
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setAvatar(user.avatar || "");
    }
    if (profile) {
      setPhone(profile.phone || "");
      setAddress(profile.address || "");
      setGuardianName(profile.guardianName || "");
      setGuardianPhone(profile.guardianPhone || "");
      setQualification(profile.qualification || "");
    }
  }, [user, profile]);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      warning("Please select a valid image file (PNG, JPG, WebP).");
      return;
    }

    try {
      const compressedDataUrl = await compressImage(file);
      setAvatar(compressedDataUrl);
      success("Profile photo preview updated. Click 'Save Profile' to apply changes.");
    } catch {
      error("Failed to process image. Please try another image.");
    }
  };

  const handleRemoveAvatar = () => {
    setAvatar("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    success("Photo removed. Click 'Save Profile' to apply changes.");
  };

  const handleCopy = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    success(`Copied ${fieldName} to clipboard!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      warning("Name cannot be empty.");
      return;
    }

    try {
      setSaving(true);
      await updateUserProfile({
        name: name.trim(),
        avatar,
        phone: phone.trim(),
        address: address.trim(),
        guardianName: guardianName.trim(),
        guardianPhone: guardianPhone.trim(),
        qualification: qualification.trim(),
      });
      success("Profile details updated successfully!");
    } catch (err) {
      error(err.response?.data?.message || "Failed to update profile details.");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      warning("Please fill in all password fields.");
      return;
    }

    if (newPassword.length < 8) {
      warning("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      warning("New passwords do not match.");
      return;
    }

    try {
      setChangingPassword(true);
      await authApi.changePassword({ currentPassword, newPassword });
      success("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      error(err.response?.data?.message || "Failed to update password.");
    } finally {
      setChangingPassword(false);
    }
  };

  const getRoleVariant = () => {
    if (role === "admin") return "downy";
    if (role === "faculty" || role === "hod") return "melrose";
    return "jonquil";
  };

  const departmentName =
    profile?.departmentId?.name ||
    (typeof profile?.departmentId === "string" ? profile.departmentId : "Computer Applications");
  const departmentCode = profile?.departmentId?.code || "BCA";
  const sessionLabel = profile?.admissionSessionId?.label || "2024-2025";

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-alice tracking-tight">
            User Profile & Academic Credentials
          </h1>
          <p className="text-xs text-alice-muted mt-1">
            Manage your personal profile, institutional details, and update your official photo.
          </p>
        </div>
        <Badge variant={getRoleVariant()} className="self-start sm:self-auto text-xs py-1 px-3 uppercase tracking-wider font-bold">
          {role?.toUpperCase()} ACCOUNT
        </Badge>
      </div>

      {/* Top Hero Section: Photo & Identity */}
      <div className="relative overflow-hidden rounded-3xl bg-charcoal-card border border-charcoal-border p-6 md:p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-downy/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
          {/* Avatar Container */}
          <div className="relative group shrink-0">
            <div className="w-32 h-32 md:w-36 md:h-36 rounded-3xl overflow-hidden bg-charcoal-elevated border-2 border-downy/40 shadow-xl shadow-downy/10 flex items-center justify-center text-alice">
              {avatar ? (
                <img
                  src={avatar}
                  alt={user?.name || "Profile Photo"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-1">
                  <span className="text-4xl font-extrabold text-downy">
                    {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                  </span>
                  <span className="text-[10px] text-alice-dim uppercase tracking-wider">No Photo</span>
                </div>
              )}
            </div>

            {/* Quick Upload Hover Overlay */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 bg-charcoal/80 backdrop-blur-sm rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 text-alice cursor-pointer border-2 border-downy"
              title="Change Photo"
            >
              <Camera className="w-6 h-6 text-downy" />
              <span className="text-[11px] font-bold">Change Photo</span>
            </button>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/png, image/jpeg, image/jpg, image/webp"
            className="hidden"
          />

          {/* Identity & Photo Actions */}
          <div className="flex-1 text-center md:text-left space-y-3">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                <h2 className="text-2xl font-extrabold text-alice">{user?.name}</h2>
                <Badge variant={getRoleVariant()}>
                  {role === "admin" && <Shield className="w-3.5 h-3.5" />}
                  {role === "student" && <GraduationCap className="w-3.5 h-3.5" />}
                  {(role === "faculty" || role === "hod") && <Briefcase className="w-3.5 h-3.5" />}
                  <span>{role}</span>
                </Badge>
              </div>
              <p className="text-xs text-alice-muted flex items-center justify-center md:justify-start gap-1.5">
                <Mail className="w-3.5 h-3.5 text-downy" />
                <span>{user?.email}</span>
                <span className="text-[10px] text-emerald-400 font-semibold">• Active</span>
              </p>
            </div>

            {/* Photo Action Buttons */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-downy text-charcoal font-bold text-xs hover:bg-downy-hover shadow-sm shadow-downy/20 transition-all cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Photo</span>
              </button>

              {avatar && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-charcoal-elevated border border-rose-500/40 text-rose-400 font-medium text-xs hover:bg-rose-500/10 transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              )}

              <span className="text-[11px] text-alice-dim ml-1">
                Supports JPG, PNG, WebP (Max 5MB)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Details Form & Academic Credentials */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Editable Personal Info Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSaveProfile} className="rounded-3xl bg-charcoal-card border border-charcoal-border p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-charcoal-border pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-downy/10 text-downy">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-alice">Personal Information</h3>
                  <p className="text-xs text-alice-muted">
                    Update your display name, contact phone, and residential address.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-alice-muted uppercase tracking-wider">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter full name"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-elevated border border-charcoal-border text-alice text-sm font-medium outline-none focus:border-downy transition-colors"
                />
              </div>

              {/* Email (Read Only) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-alice-muted uppercase tracking-wider flex items-center justify-between">
                  <span>Institutional Email</span>
                  <span className="text-[10px] text-alice-dim lowercase">Read-Only</span>
                </label>
                <input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal border border-charcoal-border/60 text-alice-muted text-sm font-medium cursor-not-allowed opacity-80"
                />
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-alice-muted uppercase tracking-wider">
                  Contact Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 9876543210"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-elevated border border-charcoal-border text-alice text-sm font-medium outline-none focus:border-downy transition-colors"
                />
              </div>

              {/* Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-alice-muted uppercase tracking-wider">
                  Residential Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Campus Residence, Block C"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-elevated border border-charcoal-border text-alice text-sm font-medium outline-none focus:border-downy transition-colors"
                />
              </div>

              {/* Student-specific Guardian info */}
              {role === "student" && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-alice-muted uppercase tracking-wider">
                      Guardian / Parent Name
                    </label>
                    <input
                      type="text"
                      value={guardianName}
                      onChange={(e) => setGuardianName(e.target.value)}
                      placeholder="e.g. Ramesh Sharma"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-elevated border border-charcoal-border text-alice text-sm font-medium outline-none focus:border-downy transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-alice-muted uppercase tracking-wider">
                      Guardian Emergency Contact
                    </label>
                    <input
                      type="tel"
                      value={guardianPhone}
                      onChange={(e) => setGuardianPhone(e.target.value)}
                      placeholder="e.g. +91 9811223344"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-elevated border border-charcoal-border text-alice text-sm font-medium outline-none focus:border-downy transition-colors"
                    />
                  </div>
                </>
              )}

              {/* Faculty-specific Qualification info */}
              {(role === "faculty" || role === "hod") && (
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-semibold text-alice-muted uppercase tracking-wider">
                    Highest Academic Qualification
                  </label>
                  <input
                    type="text"
                    value={qualification}
                    onChange={(e) => setQualification(e.target.value)}
                    placeholder="e.g. Ph.D. in Computer Science & Engineering"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-elevated border border-charcoal-border text-alice text-sm font-medium outline-none focus:border-downy transition-colors"
                  />
                </div>
              )}
            </div>

            {/* Save Button */}
            <div className="pt-3 border-t border-charcoal-border flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-downy text-charcoal font-bold text-xs uppercase tracking-wider hover:bg-downy-hover shadow-lg shadow-downy/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? "Saving Changes..." : "Save Profile"}</span>
              </button>
            </div>
          </form>

          {/* Change Password Card */}
          <form onSubmit={handleChangePassword} className="rounded-3xl bg-charcoal-card border border-charcoal-border p-6 shadow-xl space-y-5">
            <div className="flex items-center gap-2.5 border-b border-charcoal-border pb-4">
              <div className="p-2 rounded-xl bg-melrose/10 text-melrose">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-alice">Account Security</h3>
                <p className="text-xs text-alice-muted">
                  Update your authentication password to safeguard your account.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-alice-muted uppercase tracking-wider">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-elevated border border-charcoal-border text-alice text-sm outline-none focus:border-melrose transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-alice-muted uppercase tracking-wider">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-elevated border border-charcoal-border text-alice text-sm outline-none focus:border-melrose transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-alice-muted uppercase tracking-wider">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-elevated border border-charcoal-border text-alice text-sm outline-none focus:border-melrose transition-colors"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={changingPassword}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-charcoal-elevated border border-melrose/40 text-melrose font-bold text-xs uppercase tracking-wider hover:bg-melrose/10 transition-all cursor-pointer disabled:opacity-50"
              >
                <Key className="w-4 h-4" />
                <span>{changingPassword ? "Updating Password..." : "Update Password"}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column (1 Col): Institutional Credentials */}
        <div className="space-y-6">
          {/* Student Credentials */}
          {role === "student" && (
            <div className="rounded-3xl bg-charcoal-card border border-charcoal-border p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-2.5 border-b border-charcoal-border pb-3">
                <div className="p-2 rounded-xl bg-jonquil/10 text-jonquil">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-alice">Student Credentials</h3>
                  <p className="text-[11px] text-alice-muted">Official University Record</p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                {/* Roll Number */}
                <div className="p-3 rounded-2xl bg-charcoal-elevated border border-charcoal-border/70 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-alice-dim uppercase tracking-wider font-semibold">
                      College Roll Number
                    </span>
                    <div className="text-sm font-mono font-bold text-downy mt-0.5">
                      {profile?.rollNumber || "BCA001"}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(profile?.rollNumber || "BCA001", "Roll Number")}
                    className="p-1.5 rounded-lg text-alice-muted hover:text-alice hover:bg-charcoal transition-colors cursor-pointer"
                    title="Copy Roll Number"
                  >
                    {copiedField === "Roll Number" ? <CheckCircle className="w-4 h-4 text-downy" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                {/* Enrollment Number */}
                <div className="p-3 rounded-2xl bg-charcoal-elevated border border-charcoal-border/70 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-alice-dim uppercase tracking-wider font-semibold">
                      University Enrollment
                    </span>
                    <div className="text-sm font-mono font-bold text-alice mt-0.5">
                      {profile?.enrollmentNumber || "0801BCA24001"}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(profile?.enrollmentNumber || "0801BCA24001", "Enrollment Number")}
                    className="p-1.5 rounded-lg text-alice-muted hover:text-alice hover:bg-charcoal transition-colors cursor-pointer"
                    title="Copy Enrollment"
                  >
                    {copiedField === "Enrollment Number" ? <CheckCircle className="w-4 h-4 text-downy" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                {/* Department */}
                <div className="p-3 rounded-2xl bg-charcoal-elevated border border-charcoal-border/70 space-y-1">
                  <span className="text-[10px] text-alice-dim uppercase tracking-wider font-semibold">
                    Department & Program
                  </span>
                  <div className="text-xs font-bold text-alice flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-melrose" />
                    <span>{departmentName}</span>
                  </div>
                </div>

                {/* Semester & Session */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-2xl bg-charcoal-elevated border border-charcoal-border/70 space-y-0.5">
                    <span className="text-[10px] text-alice-dim uppercase tracking-wider font-semibold">
                      Current Sem
                    </span>
                    <div className="text-xs font-bold text-jonquil">
                      Semester {profile?.currentSemester || 1}
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-charcoal-elevated border border-charcoal-border/70 space-y-0.5">
                    <span className="text-[10px] text-alice-dim uppercase tracking-wider font-semibold">
                      Session
                    </span>
                    <div className="text-xs font-bold text-alice">
                      {sessionLabel}
                    </div>
                  </div>
                </div>

                {/* Academic Status */}
                <div className="p-3 rounded-2xl bg-charcoal-elevated/40 border border-charcoal-border/50 flex items-center justify-between">
                  <span className="text-alice-muted">Enrollment Status</span>
                  <Badge variant="success">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>{profile?.status?.toUpperCase() || "ACTIVE"}</span>
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Faculty Credentials */}
          {(role === "faculty" || role === "hod") && (
            <div className="rounded-3xl bg-charcoal-card border border-charcoal-border p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-2.5 border-b border-charcoal-border pb-3">
                <div className="p-2 rounded-xl bg-melrose/10 text-melrose">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-alice">Faculty Credentials</h3>
                  <p className="text-[11px] text-alice-muted">Departmental Affiliation</p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-2xl bg-charcoal-elevated border border-charcoal-border/70 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-alice-dim uppercase tracking-wider font-semibold">
                      Employee ID
                    </span>
                    <div className="text-sm font-mono font-bold text-downy mt-0.5">
                      {profile?.employeeId || "FAC-2024-001"}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(profile?.employeeId || "FAC-2024-001", "Employee ID")}
                    className="p-1.5 rounded-lg text-alice-muted hover:text-alice hover:bg-charcoal transition-colors cursor-pointer"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-3 rounded-2xl bg-charcoal-elevated border border-charcoal-border/70 space-y-1">
                  <span className="text-[10px] text-alice-dim uppercase tracking-wider font-semibold">
                    Academic Designation
                  </span>
                  <div className="text-xs font-bold text-alice">
                    {profile?.designation || "Assistant Professor"}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-charcoal-elevated border border-charcoal-border/70 space-y-1">
                  <span className="text-[10px] text-alice-dim uppercase tracking-wider font-semibold">
                    Department
                  </span>
                  <div className="text-xs font-bold text-alice flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-melrose" />
                    <span>{departmentName}</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-charcoal-elevated/40 border border-charcoal-border/50 flex items-center justify-between">
                  <span className="text-alice-muted">Assigned Courses</span>
                  <Badge variant="downy">
                    {(profile?.subjects?.length || 0)} Subject(s)
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Admin Credentials */}
          {role === "admin" && (
            <div className="rounded-3xl bg-charcoal-card border border-charcoal-border p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-2.5 border-b border-charcoal-border pb-3">
                <div className="p-2 rounded-xl bg-downy/10 text-downy">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-alice">System Authority</h3>
                  <p className="text-[11px] text-alice-muted">Superadmin Security Context</p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-2xl bg-charcoal-elevated border border-charcoal-border/70 space-y-1">
                  <span className="text-[10px] text-alice-dim uppercase tracking-wider font-semibold">
                    Administrative Scope
                  </span>
                  <div className="text-xs font-bold text-alice">
                    Root Platform Administrator
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-charcoal-elevated border border-charcoal-border/70 space-y-1">
                  <span className="text-[10px] text-alice-dim uppercase tracking-wider font-semibold">
                    Privilege Level
                  </span>
                  <div className="text-xs font-bold text-downy">
                    Level 5 Master Authority
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Support / Info Card */}
          <div className="rounded-3xl bg-charcoal-card border border-charcoal-border p-5 text-xs text-alice-muted space-y-2">
            <div className="flex items-center gap-2 text-alice font-bold">
              <Sparkles className="w-4 h-4 text-downy" />
              <span>Campus Identity System</span>
            </div>
            <p className="text-[11px] text-alice-dim leading-relaxed">
              Official roll numbers, enrollment numbers, and department affiliations are locked to ensure institutional audit integrity. Contact the registrar for modifications.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
