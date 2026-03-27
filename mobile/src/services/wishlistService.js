import apiClient from '../utils/api';
import { WISHLIST_ENDPOINTS } from '../constants/endpoints';

export const WishlistService = {
  async getWishlist() {
    try {
      const response = await apiClient.get(WISHLIST_ENDPOINTS.GET_ALL);
      const books = response.data?.wishlist?.books || response.data?.data?.wishlist?.books || [];
      return books.map((book) => ({
        _id: book._id,
        bookId: book,
      }));
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  async addToWishlist(bookId) {
    try {
      const url = WISHLIST_ENDPOINTS.ADD.replace(':bookId', bookId);
      const response = await apiClient.post(url);
      const books = response.data?.wishlist?.books || [];
      return books.map((book) => ({
        _id: book._id,
        bookId: book,
      }));
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  async removeFromWishlist(bookId) {
    try {
      const url = WISHLIST_ENDPOINTS.REMOVE.replace(':bookId', bookId);
      const response = await apiClient.delete(url);
      const books = response.data?.wishlist?.books || [];
      return books.map((book) => ({
        _id: book._id,
        bookId: book,
      }));
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};
