import axiosClient from "./axiosClient";

const triggerBlobDownload = (blob, defaultFilename) => {
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
  downloadMyReportCardPDF: async (filename = "My_Academic_Report_Card.pdf") => {
    const res = await axiosClient.get("/reports/pdf/my-report-card", {
      responseType: "blob",
    });
    triggerBlobDownload(res.data, filename);
  },

  downloadStudentReportCardPDF: async (studentId, filename = "Student_Report_Card.pdf") => {
    const res = await axiosClient.get(`/reports/pdf/student/${studentId}`, {
      responseType: "blob",
    });
    triggerBlobDownload(res.data, filename);
  },

  // Subject attendance PDF
  downloadSubjectAttendancePDF: async (subjectId, filename = "Attendance_Roster.pdf") => {
    const res = await axiosClient.get(`/reports/pdf/subject/${subjectId}/attendance`, {
      responseType: "blob",
    });
    triggerBlobDownload(res.data, filename);
  },

  // Subject attendance Excel
  downloadSubjectAttendanceExcel: async (subjectId, filename = "Attendance_Roster.xlsx") => {
    const res = await axiosClient.get(`/reports/excel/subject/${subjectId}/attendance`, {
      responseType: "blob",
    });
    triggerBlobDownload(res.data, filename);
  },

  // Exam results Excel
  downloadExaminationResultsExcel: async (examinationId, filename = "Examination_Results.xlsx") => {
    const res = await axiosClient.get(`/reports/excel/examination/${examinationId}/results`, {
      responseType: "blob",
    });
    triggerBlobDownload(res.data, filename);
  },
};
