import axiosClient from "./axiosClient";

export const marksApi = {
  // Examinations
  getExaminations: async (params = {}) => {
    const res = await axiosClient.get("/marks/examinations", { params });
    return res.data;
  },

  createExamination: async (examData) => {
    const res = await axiosClient.post("/marks/examinations", examData);
    return res.data;
  },

  // Marks upload - posts to /marks/submit with { examinationId, marks: [{ studentId, obtainedMarks, isAbsent, remarks }] }
  submitMarks: async (examinationId, marks) => {
    const res = await axiosClient.post("/marks/submit", {
      examinationId,
      marks,
    });
    return res.data;
  },

  // Student academic performance & SGPA
  getStudentPerformance: async (studentId, params = {}) => {
    const endpoint = studentId ? `/marks/student/${studentId}/performance` : `/marks/my-performance`;
    const res = await axiosClient.get(endpoint, { params });
    return res.data;
  },

  // Class examination result sheet
  getExaminationResultSheet: async (examinationId) => {
    const res = await axiosClient.get(`/marks/examinations/${examinationId}/results`);
    return res.data;
  },
};
