import axiosClient from "./axiosClient";

export const attendanceApi = {
  // Class sessions (scheduling & listing)
  getClassSessions: async (params = {}) => {
    const res = await axiosClient.get("/attendance/sessions", { params });
    return res.data;
  },

  getClassSessionById: async (sessionId) => {
    const res = await axiosClient.get(`/attendance/sessions/${sessionId}`);
    return res.data;
  },

  createClassSession: async (sessionData) => {
    const res = await axiosClient.post("/attendance/sessions", sessionData);
    return res.data;
  },

  // Attendance submission (bulk) - posts to /attendance/submit with classSessionId and records array
  submitAttendance: async (classSessionId, records) => {
    const res = await axiosClient.post("/attendance/submit", {
      classSessionId,
      records,
    });
    return res.data;
  },

  // Audit update single attendance record
  updateAttendanceRecord: async (attendanceId, updateData) => {
    const res = await axiosClient.patch(`/attendance/${attendanceId}/correct`, updateData);
    return res.data;
  },

  // Student-specific metrics & shortage alerts
  getStudentSummary: async (studentId, params = {}) => {
    const endpoint = studentId ? `/attendance/student/${studentId}/summary` : `/attendance/my-summary`;
    const res = await axiosClient.get(endpoint, { params });
    return res.data;
  },

  // Predictive attendance recovery forecast
  getPredictiveRecovery: async (studentId, params = {}) => {
    const endpoint = studentId ? `/attendance/student/${studentId}/predictive-recovery` : `/attendance/my-recovery`;
    const res = await axiosClient.get(endpoint, { params });
    return res.data;
  },
};
