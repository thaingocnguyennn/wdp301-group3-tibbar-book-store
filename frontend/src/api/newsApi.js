import axiosInstance from "./axios.js";

export const newsApi = {
  //ham lay danh sach news cho homepage
  getHomepageNews: async () => {
    const response = await axiosInstance.get("/news/homepage");
    return response.data;
  },

  //ham lay danh sach news cho public
  getNewsById: async (id) => {
    const response = await axiosInstance.get(`/news/${id}`);
    return response.data;
  },

  //ham lay danh sach news cho admin
  getAllNewsAdmin: async () => {
    const response = await axiosInstance.get("/admin/news");
    return response.data;
  },

  //ham tao news moi
  createNews: async (formData) => {
    const response = await axiosInstance.post("/admin/news", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  //  ham update news
  updateNews: async (id, formData) => {
    const response = await axiosInstance.put(`/admin/news/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  //ham delete news
  deleteNews: async (id) => {
    const response = await axiosInstance.delete(`/admin/news/${id}`);
    return response.data;
  },
};
