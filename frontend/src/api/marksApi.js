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

  // Batch marks upload with validation
  batchUploadMarks: async (batchData) => {
    const res = await axiosClient.post("/marks/batch", batchData);
    return res.data;
  },

  // Student academic performance & SGPA
  getStudentPerformance: async (studentId, params = {}) => {
    const res = await axiosClient.get(`/marks/student/${studentId}/performance`, { params });
    return res.data;
  },

  // Class examination result sheet
  getExaminationResultSheet: async (examinationId) => {
    const res = await axiosClient.get(`/marks/examinations/${examinationId}/result-sheet`);
    return res.data;
  },
};
