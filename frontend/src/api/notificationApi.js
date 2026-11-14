import axiosClient from "./axiosClient";

export const notificationApi = {
  getMyNotifications: async (params = {}) => {
    const res = await axiosClient.get("/notifications", { params });
    return res.data;
  },

  markAsRead: async (notificationId) => {
    const res = await axiosClient.patch(`/notifications/${notificationId}/read`);
    return res.data;
  },

  markAllAsRead: async () => {
    const res = await axiosClient.patch("/notifications/read-all");
    return res.data;
  },

  deleteNotification: async (notificationId) => {
    const res = await axiosClient.delete(`/notifications/${notificationId}`);
    return res.data;
  },
};
