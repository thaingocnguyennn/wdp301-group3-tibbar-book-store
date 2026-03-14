import axiosInstance from "./axios.js";

export const reviewApi = {
  getAdminReviews: async ({
    page = 1,
    limit = 20,
    search = "",
    rating = "",
    replyStatus = "all",
  } = {}) => {
    const response = await axiosInstance.get("/reviews/admin/list", {
      params: {
        page,
        limit,
        search: search || undefined,
        rating: rating || undefined,
        replyStatus: replyStatus || "all",
      },
    });
    return response.data;
  },

  getBookReviews: async (bookId, page = 1, limit = 10, rating = "") => {
    const response = await axiosInstance.get(`/reviews/book/${bookId}`, {
      params: { page, limit, rating: rating || undefined },
    });
    return response.data;
  },

  getMyReviewForBook: async (bookId) => {
    const response = await axiosInstance.get(`/reviews/book/${bookId}/me`);
    return response.data;
  },

  createReview: async (bookId, payload, isMultipart = false) => {
    const response = await axiosInstance.post(
      `/reviews/book/${bookId}`,
      payload,
      isMultipart
        ? {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        : undefined,
    );
    return response.data;
  },

  updateReview: async (reviewId, payload, isMultipart = false) => {
    const response = await axiosInstance.put(
      `/reviews/${reviewId}`,
      payload,
      isMultipart
        ? {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        : undefined,
    );
    return response.data;
  },

  deleteReview: async (reviewId) => {
    const response = await axiosInstance.delete(`/reviews/${reviewId}`);
    return response.data;
  },

  reactToReview: async (reviewId, type) => {
    const response = await axiosInstance.patch(
      `/reviews/${reviewId}/reaction`,
      {
        type,
      },
    );
    return response.data;
  },

  replyToReview: async (reviewId, comment) => {
    const response = await axiosInstance.post(`/reviews/${reviewId}/replies`, {
      comment,
    });
    return response.data;
  },
};
