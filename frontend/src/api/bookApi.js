import axiosInstance from './axios.js';

export const bookApi = {
  getPublicBooks: async (params) => {
    const response = await axiosInstance.get('/books', { params });
    return response.data;
  },

  getNewestBooks: async (limit = 10) => {
    const response = await axiosInstance.get('/books/newest', { params: { limit } });
    return response.data;
  },

  getBestSellingBooks: async (limit = 8) => {
    const response = await axiosInstance.get('/books/best-selling', { params: { limit } });
    return response.data;
  },

  getBookById: async (id) => {
    const response = await axiosInstance.get(`/books/${id}`);
    return response.data;
  },

  // Admin endpoints
  getAllBooksAdmin: async (params) => {
    const response = await axiosInstance.get('/admin/books', { params });
    return response.data;
  },

  createBook: async (bookData) => {
    const isFormData = bookData instanceof FormData;
    const response = await axiosInstance.post(
      '/admin/books',
      bookData,
      isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined
    );
    return response.data;
  },

  updateBook: async (id, bookData) => {
    const isFormData = bookData instanceof FormData;
    const response = await axiosInstance.put(
      `/admin/books/${id}`,
      bookData,
      isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined
    );
    return response.data;
  },

  updateVisibility: async (id, visibility) => {
    const response = await axiosInstance.patch(`/admin/books/${id}/visibility`, { visibility });
    return response.data;
  },

  deleteBook: async (id) => {
    const response = await axiosInstance.delete(`/admin/books/${id}`);
    return response.data;
  }
};