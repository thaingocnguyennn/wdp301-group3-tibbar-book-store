import axiosInstance from "./axios";

export const cvApi = {
  uploadMyCv: async (formData) => {
    const response = await axiosInstance.post("/cvs/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  getMyCvApplications: async () => {
    const response = await axiosInstance.get("/cvs/my-applications");
    return response.data;
  },

  getAdminCvApplications: async (params = {}) => {
    const response = await axiosInstance.get("/admin/cvs", { params });
    return response.data;
  },

  updateAdminCvStatus: async (id, payload) => {
    const response = await axiosInstance.patch(`/admin/cvs/${id}/status`, payload);
    return response.data;
  },
};
