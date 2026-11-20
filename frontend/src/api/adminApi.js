import axiosClient from "./axiosClient";

export const adminApi = {
  // Users list with search, role, status, page, limit
  getUsers: async (params = {}) => {
    const res = await axiosClient.get("/admin/users", { params });
    return res.data;
  },

  getUserById: async (userId) => {
    const res = await axiosClient.get(`/admin/users/${userId}`);
    return res.data;
  },

  toggleUserStatus: async (userId) => {
    const res = await axiosClient.patch(`/admin/users/${userId}/toggle-status`);
    return res.data;
  },

  // Student creation & list
  createStudent: async (studentData) => {
    const res = await axiosClient.post("/admin/students", studentData);
    return res.data;
  },

  getStudents: async (params = {}) => {
    const res = await axiosClient.get("/admin/students", { params });
    return res.data;
  },

  updateStudent: async (studentId, data) => {
    const res = await axiosClient.patch(`/admin/students/${studentId}`, data);
    return res.data;
  },

  // Faculty creation & list
  createFaculty: async (facultyData) => {
    const res = await axiosClient.post("/admin/faculty", facultyData);
    return res.data;
  },

  getFaculty: async (params = {}) => {
    const res = await axiosClient.get("/admin/faculty", { params });
    return res.data;
  },

  // Departments
  getDepartments: async (params = {}) => {
    const res = await axiosClient.get("/admin/departments", { params });
    return res.data;
  },

  createDepartment: async (deptData) => {
    const res = await axiosClient.post("/admin/departments", deptData);
    return res.data;
  },

  // Academic Sessions
  getSessions: async (params = {}) => {
    const res = await axiosClient.get("/admin/sessions", { params });
    return res.data;
  },

  createSession: async (sessionData) => {
    const rawLabel = (sessionData.label || sessionData.name || "").trim().replace(/[\u2013\u2014\u2212]/g, "-");
    const payload = {
      ...sessionData,
      label: rawLabel,
      name: rawLabel,
    };
    const res = await axiosClient.post("/admin/sessions", payload);
    return res.data;
  },

  updateEnrollmentWindow: async (sessionId, data) => {
    const res = await axiosClient.patch(`/admin/sessions/${sessionId}/enrollment-window`, data);
    return res.data;
  },
};
