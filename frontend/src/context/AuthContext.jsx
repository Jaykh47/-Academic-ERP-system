import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authApi } from "../api/authApi";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth on page mount: try refresh token or getMe
  const checkAuth = useCallback(async () => {
    try {
      setLoading(true);
      // Attempt silent refresh first
      try {
        await authApi.refreshToken();
      } catch (e) {
        // Refresh token might not be present, ignore
      }

      // Fetch active user profile
      const res = await authApi.getMe();
      if (res?.data?.user) {
        setUser(res.data.user);
        setProfile(res.data.profile || null);
      } else {
        setUser(null);
        setProfile(null);
      }
    } catch (err) {
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    if (res?.data?.user) {
      setUser(res.data.user);
      // Also fetch full profile
      try {
        const meRes = await authApi.getMe();
        setProfile(meRes?.data?.profile || null);
      } catch {
        setProfile(null);
      }
    }
    return res;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      setProfile(null);
    }
  };

  const updateUserProfile = async (data) => {
    const res = await authApi.updateProfile(data);
    if (res?.data?.user) {
      setUser(res.data.user);
      if (res.data.profile) {
        setProfile(res.data.profile);
      }
    }
    return res;
  };

  const role = user?.role?.toLowerCase() || null;
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        isAuthenticated,
        loading,
        login,
        logout,
        checkAuth,
        updateUserProfile,
        setUser,
        setProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
