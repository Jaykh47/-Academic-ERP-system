import axiosClient from "./axiosClient";

const triggerBlobDownload = async (blob, defaultFilename) => {
  // If the server returned an error payload as JSON in a blob:
  if (blob instanceof Blob && blob.type === "application/json") {
    const text = await blob.text();
    try {
      const json = JSON.parse(text);
      throw new Error(json.message || "Failed to download document");
    } catch (e) {
      if (e.message && !e.message.includes("JSON")) throw e;
    }
  }

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", defaultFilename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const reportApi = {
  // Student report card PDF
  downloadMyReportCardPDF: async (filename = "My_Academic_Report_Card.pdf", params = {}) => {
    try {
      const res = await axiosClient.get("/reports/pdf/my-report-card", {
        params,
        responseType: "blob",
      });
      await triggerBlobDownload(res.data, filename);
    } catch (err) {
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const json = JSON.parse(text);
          if (json.message) {
            const parsedErr = new Error(json.message);
            parsedErr.response = err.response;
            throw parsedErr;
          }
        } catch (e) {
          if (e.message && !e.message.includes("JSON")) throw e;
        }
      }
      throw err;
    }
  },

  downloadStudentReportCardPDF: async (studentId, filename = "Student_Report_Card.pdf", params = {}) => {
    try {
      const res = await axiosClient.get(`/reports/pdf/student/${studentId}`, {
        params,
        responseType: "blob",
      });
      await triggerBlobDownload(res.data, filename);
    } catch (err) {
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const json = JSON.parse(text);
          if (json.message) {
            const parsedErr = new Error(json.message);
            parsedErr.response = err.response;
            throw parsedErr;
          }
        } catch (e) {
          if (e.message && !e.message.includes("JSON")) throw e;
        }
      }
      throw err;
    }
  },

  // Subject attendance PDF
  downloadSubjectAttendancePDF: async (subjectId, filename = "Attendance_Roster.pdf", params = {}) => {
    const res = await axiosClient.get(`/reports/pdf/subject/${subjectId}/attendance`, {
      params,
      responseType: "blob",
    });
    await triggerBlobDownload(res.data, filename);
  },

  // Subject attendance Excel
  downloadSubjectAttendanceExcel: async (subjectId, filename = "Attendance_Roster.xlsx", params = {}) => {
    const res = await axiosClient.get(`/reports/excel/subject/${subjectId}/attendance`, {
      params,
      responseType: "blob",
    });
    await triggerBlobDownload(res.data, filename);
  },

  // Exam results Excel
  downloadExaminationResultsExcel: async (examinationId, filename = "Examination_Results.xlsx", params = {}) => {
    const res = await axiosClient.get(`/reports/excel/examination/${examinationId}/results`, {
      params,
      responseType: "blob",
    });
    await triggerBlobDownload(res.data, filename);
  },
};
