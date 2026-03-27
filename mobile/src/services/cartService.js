import apiClient from '../utils/api';
import { CART_ENDPOINTS } from '../constants/endpoints';

export const CartService = {
  async getCart() {
    try {
      const response = await apiClient.get(CART_ENDPOINTS.GET_ALL);
      const cart = response.data?.data?.cart || { items: [] };
      const items = (cart.items || []).map((item) => {
        const book = item.book || item.bookId;
        const bookId = book?._id || item.bookId || item._id;
        return {
          ...item,
          _id: bookId,
          bookId: book,
        };
      });

      return { ...cart, items };
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  async addToCart(bookId, quantity = 1) {
    try {
      const response = await apiClient.post(CART_ENDPOINTS.ADD_ITEM, {
        bookId,
        quantity,
      });
      return response.data?.data?.cart || response.data?.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  async updateCartItem(bookId, quantity) {
    try {
      const url = CART_ENDPOINTS.UPDATE_ITEM.replace(':bookId', bookId);
      const response = await apiClient.patch(url, { quantity });
      return response.data?.data?.cart || response.data?.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  async removeFromCart(bookId) {
    try {
      const url = CART_ENDPOINTS.REMOVE_ITEM.replace(':bookId', bookId);
      const response = await apiClient.delete(url);
      return response.data?.data?.cart || response.data?.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  async clearCart() {
    try {
      const cart = await this.getCart();
      const items = cart?.items || [];

      await Promise.all(
        items.map((item) => this.removeFromCart(item._id)),
      );

      return { items: [] };
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};
