import axiosClient from "./axiosClient";

export const analyticsApi = {
  getDepartmentAnalytics: async (departmentId, params = {}) => {
    const res = await axiosClient.get(`/analytics/department/${departmentId}`, { params });
    return res.data;
  },

  getSubjectAnalytics: async (subjectId) => {
    const res = await axiosClient.get(`/analytics/subject/${subjectId}`);
    return res.data;
  },

  getCohortAnalytics: async (params) => {
    const res = await axiosClient.get("/analytics/cohort", { params });
    return res.data;
  },

  getAcademicRiskReport: async (params = {}) => {
    const res = await axiosClient.get("/analytics/risk-detection", { params });
    return res.data;
  },
};
