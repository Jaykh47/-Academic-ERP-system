import axiosClient, { setAccessToken } from "./axiosClient";

export const authApi = {
  login: async (credentials) => {
    const res = await axiosClient.post("/auth/login", credentials);
    if (res.data?.data?.accessToken) {
      setAccessToken(res.data.data.accessToken);
    }
    return res.data;
  },

  logout: async () => {
    try {
      await axiosClient.post("/auth/logout");
    } finally {
      setAccessToken(null);
    }
  },

  getMe: async () => {
    const res = await axiosClient.get("/auth/me");
    return res.data;
  },

  refreshToken: async () => {
    const res = await axiosClient.post("/auth/refresh-token");
    if (res.data?.data?.accessToken) {
      setAccessToken(res.data.data.accessToken);
    }
    return res.data;
  },

  changePassword: async (passwords) => {
    const res = await axiosClient.post("/auth/change-password", passwords);
    return res.data;
  },

  forgotPassword: async (email) => {
    const res = await axiosClient.post("/auth/forgot-password", { email });
    return res.data;
  },

  resetPassword: async (token, password) => {
    const res = await axiosClient.post(`/auth/reset-password/${token}`, { password });
    return res.data;
  },
};
