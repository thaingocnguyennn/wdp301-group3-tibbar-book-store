import axiosInstance from "./axios.js";

export const cartApi = {
  getCart: async () => {
    const response = await axiosInstance.get("/cart");
    return response.data;
  },

  addToCart: async (bookId, quantity = 1) => {
    const response = await axiosInstance.post("/cart/items", {
      bookId,
      quantity,
    });
    return response.data;
  },

  updateCartItem: async (bookId, quantity) => {
    const response = await axiosInstance.patch(`/cart/items/${bookId}`, {
      quantity,
    });
    return response.data;
  },

  removeCartItem: async (bookId) => {
    const response = await axiosInstance.delete(`/cart/items/${bookId}`);
    return response.data;
  },

  validateCart: async () => {
    const response = await axiosInstance.get("/cart/validate");
    return response.data;
  },
};
