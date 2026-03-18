import axiosInstance from "./axios.js";

export const newsApi = {
  getHomepageNews: async () => {
    const response = await axiosInstance.get("/news/homepage");
    return response.data;
  },

  getPublicNews: async () => {
    const response = await axiosInstance.get("/news");
    return response.data;
  },

  getNewsById: async (id) => {
    const response = await axiosInstance.get(`/news/${id}`);
    return response.data;
  },

  getAllNewsAdmin: async () => {
    const response = await axiosInstance.get("/admin/news");
    return response.data;
  },

  createNews: async (formData) => {
    const response = await axiosInstance.post("/admin/news", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  updateNews: async (id, formData) => {
    const response = await axiosInstance.put(`/admin/news/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  deleteNews: async (id) => {
    const response = await axiosInstance.delete(`/admin/news/${id}`);
    return response.data;
  },
};
