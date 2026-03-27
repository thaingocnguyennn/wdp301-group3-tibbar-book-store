import apiClient from '../utils/api';
import { BOOK_ENDPOINTS, CATEGORY_ENDPOINTS } from '../constants/endpoints';

export const BookService = {
  async getAllBooks(page = 1, limit = 10, filters = {}) {
    try {
      const params = { page, limit, ...filters };
      const response = await apiClient.get(BOOK_ENDPOINTS.GET_ALL, { params });
      return response.data?.data?.books || response.data?.data || [];
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  async getBookById(id) {
    try {
      const url = BOOK_ENDPOINTS.GET_BY_ID.replace(':id', id);
      const response = await apiClient.get(url);
      return response.data?.data?.book || response.data?.data || null;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  async searchBooks(query, page = 1, limit = 10) {
    try {
      const response = await apiClient.get(BOOK_ENDPOINTS.SEARCH, {
        params: { search: query, page, limit },
      });
      return response.data?.data?.books || response.data?.data || [];
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  async getBooksByCategory(categoryId, page = 1, limit = 10) {
    try {
      const response = await apiClient.get(BOOK_ENDPOINTS.GET_BY_CATEGORY, {
        params: { category: categoryId, page, limit },
      });
      return response.data?.data?.books || response.data?.data || [];
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  async getCategories() {
    try {
      const response = await apiClient.get(CATEGORY_ENDPOINTS.GET_ALL);
      return response.data?.data || [];
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};
