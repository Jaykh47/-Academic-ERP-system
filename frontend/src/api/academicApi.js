import axiosClient from "./axiosClient";

export const academicApi = {
  // Subjects
  getSubjects: async (params = {}) => {
    const res = await axiosClient.get("/academic/subjects", { params });
    return res.data;
  },

  getSubjectById: async (subjectId) => {
    const res = await axiosClient.get(`/academic/subjects/${subjectId}`);
    return res.data;
  },

  createSubject: async (subjectData) => {
    const res = await axiosClient.post("/academic/subjects", subjectData);
    return res.data;
  },

  updateSubject: async (subjectId, updateData) => {
    const res = await axiosClient.patch(`/academic/subjects/${subjectId}`, updateData);
    return res.data;
  },

  assignFaculty: async (subjectId, facultyId) => {
    const res = await axiosClient.post(`/academic/subjects/${subjectId}/assign-faculty`, { facultyId });
    return res.data;
  },

  // Enrollments
  enrollSingleStudent: async (enrollmentData) => {
    const res = await axiosClient.post("/academic/enrollments", enrollmentData);
    return res.data;
  },

  batchEnrollSemester: async (batchData) => {
    const res = await axiosClient.post("/academic/enrollments/batch", batchData);
    return res.data;
  },

  getEnrolledStudents: async (subjectId) => {
    const res = await axiosClient.get(`/academic/enrollments/subject/${subjectId}`);
    return res.data;
  },

  getMyEnrolledSubjects: async () => {
    const res = await axiosClient.get("/academic/enrollments/my-subjects");
    return res.data;
  },

  getStudentEnrolledSubjects: async (studentId) => {
    const res = await axiosClient.get(`/academic/enrollments/student/${studentId}`);
    return res.data;
  },

  // DigiCampus Course Registration & Isolation
  getEnrollmentWindow: async () => {
    const res = await axiosClient.get("/academic/enrollment-window");
    return res.data;
  },

  getSessions: async () => {
    const res = await axiosClient.get("/academic/sessions");
    return res.data;
  },

  getAvailableSubjects: async () => {
    const res = await axiosClient.get("/academic/available-subjects");
    return res.data;
  },

  selfEnrollSubjects: async (subjectIds) => {
    const res = await axiosClient.post("/academic/enrollments/self", { subjectIds });
    return res.data;
  },

  selfDropSubject: async (subjectId) => {
    const res = await axiosClient.delete(`/academic/enrollments/self/${subjectId}`);
    return res.data;
  },

  getMyAssignedSubjects: async () => {
    const res = await axiosClient.get("/academic/my-assigned-subjects");
    return res.data;
  },
};
