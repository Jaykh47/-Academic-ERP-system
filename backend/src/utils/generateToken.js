import jwt from "jsonwebtoken";
import crypto from "crypto";

/**
 * TOKEN UTILITIES
 *
 * This module handles all JWT and cookie operations.
 * Keeping token logic here (not scattered in controllers) means:
 * - One place to change token settings.
 * - Controllers stay clean and focused on business logic.
 *
 * Token Strategy:
 * ┌─────────────────┬────────────────────────────────────────────────┐
 * │ Access Token    │ Short-lived (15m). Sent in cookie + body.      │
 * │                 │ Used to authenticate every API request.        │
 * ├─────────────────┼────────────────────────────────────────────────┤
 * │ Refresh Token   │ Long-lived (7d). Sent in cookie ONLY.          │
 * │                 │ Used to generate a new access token.           │
 * │                 │ Stored HASHED in DB for revocation support.    │
 * └─────────────────┴────────────────────────────────────────────────┘
 */

// ─────────────────────────────────────────────────────────────────────────────
// GENERATE ACCESS TOKEN
// Payload: { id, role } — minimal data to avoid bloating every request header.
// ─────────────────────────────────────────────────────────────────────────────
export const generateAccessToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m" }
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// GENERATE REFRESH TOKEN
// Payload: { id } only — minimal, since we look up the user from DB anyway.
// ─────────────────────────────────────────────────────────────────────────────
export const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d" }
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// HASH A REFRESH TOKEN
// We store a SHA-256 hash of the refresh token in MongoDB, not the raw token.
// Even if the database is compromised, the attacker cannot use the leaked hash
// to forge a valid token (they need the raw token, which is only in the cookie).
// ─────────────────────────────────────────────────────────────────────────────
export const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

// ─────────────────────────────────────────────────────────────────────────────
// PARSE JWT EXPIRY STRING → milliseconds
// jwt accepts "15m", "7d", etc. but cookie maxAge needs milliseconds.
// This parser converts the string so cookies expire at the same time as tokens.
// ─────────────────────────────────────────────────────────────────────────────
export const parseExpiryToMs = (expiryStr) => {
  const unit = expiryStr.slice(-1);           // "m", "h", "d"
  const value = parseInt(expiryStr.slice(0, -1)); // the number part
  const unitMap = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return value * (unitMap[unit] || 60_000);
};

// ─────────────────────────────────────────────────────────────────────────────
// SET AUTH COOKIES
// Sets both tokens as HTTP-only cookies on the response.
//
// HTTP-only cookies:
// - Cannot be read by JavaScript (document.cookie) in the browser.
// - Immune to XSS attacks that try to steal tokens.
// - Automatically sent with every request to the same domain.
//
// Cookie settings explained:
// - httpOnly: true       → JS cannot access this cookie.
// - secure: true         → Only sent over HTTPS (enforced in production).
// - sameSite: "strict"   → Cookie is NOT sent with cross-site requests
//                          (protects against CSRF).
// - maxAge               → When the cookie expires (milliseconds).
// ─────────────────────────────────────────────────────────────────────────────
export const setAuthCookies = (res, accessToken, refreshToken) => {
  const isProduction = process.env.NODE_ENV === "production";

  const cookieDefaults = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "strict" : "lax", // "lax" allows Postman testing in dev
  };

  // Access token cookie
  res.cookie("accessToken", accessToken, {
    ...cookieDefaults,
    maxAge: parseExpiryToMs(process.env.JWT_ACCESS_EXPIRES_IN || "15m"),
  });

  // Refresh token cookie
  res.cookie("refreshToken", refreshToken, {
    ...cookieDefaults,
    maxAge: parseExpiryToMs(process.env.JWT_REFRESH_EXPIRES_IN || "7d"),
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// CLEAR AUTH COOKIES
// Called on logout to remove both token cookies from the browser.
// ─────────────────────────────────────────────────────────────────────────────
export const clearAuthCookies = (res) => {
  const isProduction = process.env.NODE_ENV === "production";

  const cookieDefaults = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "strict" : "lax",
  };

  res.clearCookie("accessToken", cookieDefaults);
  res.clearCookie("refreshToken", cookieDefaults);
};

// ─────────────────────────────────────────────────────────────────────────────
// GENERATE CRYPTO RESET TOKEN (for password reset)
// This is NOT a JWT — it is a random hex string.
// We generate the raw token, send it to the user (via email in production),
// and store only its SHA-256 hash in the database.
// ─────────────────────────────────────────────────────────────────────────────
export const generatePasswordResetToken = () => {
  // 32 random bytes → 64-character hex string
  const rawToken = crypto.randomBytes(32).toString("hex");
  // Store only the hash in DB
  const hashedToken = hashToken(rawToken);
  // Expires in 10 minutes from now
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  return { rawToken, hashedToken, expiresAt };
};

