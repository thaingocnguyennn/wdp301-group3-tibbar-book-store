import axiosInstance from "./axios.js";

// API client cho các chức năng Review
export const reviewApi = {
  // Admin: Lấy tất cả review (hỗ trợ lọc rating, tìm kiếm, lọc status trả lời)
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

  // UC-83: Lấy danh sách review của sách (hỗ trợ lọc theo sao)
  getBookReviews: async (bookId, page = 1, limit = 10, rating = "") => {
    const response = await axiosInstance.get(`/reviews/book/${bookId}`, {
      params: { page, limit, rating: rating || undefined },
    });
    return response.data;
  },

  // Lấy review của chính mình cho sách này
  getMyReviewForBook: async (bookId) => {
    const response = await axiosInstance.get(`/reviews/book/${bookId}/me`);
    return response.data;
  },

  // UC-87: Tạo review mới với upload ảnh
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

  // Sửa review của chính mình
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

  // UC-82: Xóa review của chính mình
  deleteReview: async (reviewId) => {
    const response = await axiosInstance.delete(`/reviews/${reviewId}`);
    return response.data;
  },

  // UC-84: Thêm phản ứng (helpful/dislike) vào review
  reactToReview: async (reviewId, type) => {
    const response = await axiosInstance.patch(
      `/reviews/${reviewId}/reaction`,
      {
        type,
      },
    );
    return response.data;
  },

  // UC-85: Trả lời review (admin hay customer đều có thể)
  replyToReview: async (reviewId, comment) => {
    const response = await axiosInstance.post(`/reviews/${reviewId}/replies`, {
      comment,
    });
    return response.data;
  },
};
