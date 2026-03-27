import apiClient from '../utils/api';
import { NEWS_ENDPOINTS, REVIEW_ENDPOINTS } from '../constants/endpoints';

export const NewsService = {
  async getAllNews(page = 1, limit = 10) {
    try {
      const response = await apiClient.get(NEWS_ENDPOINTS.GET_ALL, {
        params: { page, limit },
      });
      return response.data?.data?.news || response.data?.data || [];
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  async getNewsById(newsId) {
    try {
      const url = NEWS_ENDPOINTS.GET_BY_ID.replace(':newsId', newsId);
      const response = await apiClient.get(url);
      return response.data?.data?.news || response.data?.data || null;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export const ReviewService = {
  async getReviewsByBook(bookId) {
    try {
      const url = REVIEW_ENDPOINTS.GET_BY_BOOK.replace(':bookId', bookId);
      const response = await apiClient.get(url);
      return response.data?.data?.reviews || response.data?.data || [];
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  async createReview(bookId, reviewData) {
    try {
      const response = await apiClient.post(REVIEW_ENDPOINTS.CREATE, {
        bookId,
        ...reviewData,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};
