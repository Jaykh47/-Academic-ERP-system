import axiosClient from "./axiosClient";

export const attendanceApi = {
  // Class sessions (scheduling & listing)
  getClassSessions: async (params = {}) => {
    const res = await axiosClient.get("/attendance/sessions", { params });
    return res.data;
  },

  createClassSession: async (sessionData) => {
    const res = await axiosClient.post("/attendance/sessions", sessionData);
    return res.data;
  },

  // Attendance submission (bulk)
  submitAttendance: async (sessionId, attendanceData) => {
    const res = await axiosClient.post(`/attendance/sessions/${sessionId}/records`, attendanceData);
    return res.data;
  },

  // Audit update single attendance record
  updateAttendanceRecord: async (attendanceId, updateData) => {
    const res = await axiosClient.patch(`/attendance/records/${attendanceId}`, updateData);
    return res.data;
  },

  // Student-specific metrics & shortage alerts
  getStudentSummary: async (studentId, params = {}) => {
    const res = await axiosClient.get(`/attendance/student/${studentId}/summary`, { params });
    return res.data;
  },

  // Predictive attendance recovery forecast
  getPredictiveRecovery: async (studentId, params = {}) => {
    const res = await axiosClient.get(`/attendance/student/${studentId}/predictive-recovery`, { params });
    return res.data;
  },
};
