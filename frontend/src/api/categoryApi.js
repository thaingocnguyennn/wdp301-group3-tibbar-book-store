import axiosInstance from './axios.js';

export const categoryApi = {
  // Public endpoint - no auth required
  getCategories: async () => {
    const response = await axiosInstance.get('/categories');
    return response.data;
  },

  // Admin endpoints
  getAllCategories: async () => {
    const response = await axiosInstance.get('/admin/categories');
    return response.data;
  },

  createCategory: async (categoryData) => {
    const response = await axiosInstance.post('/admin/categories', categoryData);
    return response.data;
  },

  updateCategory: async (id, categoryData) => {
    const response = await axiosInstance.put(`/admin/categories/${id}`, categoryData);
    return response.data;
  },

  deleteCategory: async (id) => {
    const response = await axiosInstance.delete(`/admin/categories/${id}`);
    return response.data;
  }
};