import axiosInstance from "./axios.js";

/**
 * Cart API Client
 * All endpoints require authentication
 */
export const cartApi = {
  /**
   * Get current user's cart
   */
  getCart: async () => {
    const response = await axiosInstance.get("/cart");
    return response.data;
  },

  /**
   * Add item to cart
   * @param {string} bookId - Book ID to add
   * @param {number} quantity - Quantity to add (default: 1)
   */
  addToCart: async (bookId, quantity = 1) => {
    const response = await axiosInstance.post("/cart/items", {
      bookId,
      quantity,
    });
    return response.data;
  },

  /**
   * Update cart item quantity
   * @param {string} bookId - Book ID
   * @param {number} quantity - New quantity (0 = remove)
   */
  updateCartItem: async (bookId, quantity) => {
    const response = await axiosInstance.put(`/cart/items/${bookId}`, {
      quantity,
    });
    return response.data;
  },

  /**
   * Remove item from cart
   * @param {string} bookId - Book ID to remove
   */
  removeFromCart: async (bookId) => {
    const response = await axiosInstance.delete(`/cart/items/${bookId}`);
    return response.data;
  },

  /**
   * Clear entire cart
   */
  clearCart: async () => {
    const response = await axiosInstance.delete("/cart");
    return response.data;
  },

  /**
   * Validate cart before checkout
   * Checks stock availability and price changes
   */
  validateCart: async () => {
    const response = await axiosInstance.post("/cart/validate");
    return response.data;
  },
};
