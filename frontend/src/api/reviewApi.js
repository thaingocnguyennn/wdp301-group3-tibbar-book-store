import axiosInstance from "./axios.js";

export const reviewApi = {
  getBookReviews: async (bookId, page = 1, limit = 10) => {
    const response = await axiosInstance.get(`/reviews/book/${bookId}`, {
      params: { page, limit },
    });
    return response.data;
  },

  getMyReviewForBook: async (bookId) => {
    const response = await axiosInstance.get(`/reviews/book/${bookId}/me`);
    return response.data;
  },

  createReview: async (bookId, payload) => {
    const response = await axiosInstance.post(
      `/reviews/book/${bookId}`,
      payload,
    );
    return response.data;
  },

  updateReview: async (reviewId, payload) => {
    const response = await axiosInstance.put(`/reviews/${reviewId}`, payload);
    return response.data;
  },
};
