import axiosInstance from "./axios.js";

export const bookApi = {
  getPublicBooks: async (params) => {
    const response = await axiosInstance.get("/books", { params });
    return response.data;
  },

  getNewestBooks: async (limit = 10) => {
    const response = await axiosInstance.get("/books/newest", {
      params: { limit },
    });
    return response.data;
  },

  // UC-60: Lấy sách bán chạy nhất cho homepage
  // UC-60: API lấy danh sách sách bán chạy nhất
  // Endpoint: GET /api/books/best-selling?limit=8
  // Mô tả: Gọi API backend để lấy sách bán chạy nhất cho homepage
  // Tham số: limit - số lượng sách trả về (mặc định 8)
  // Trả về: { success: true, message: "...", data: { books: [...] } }
  getBestSellingBooks: async (limit = 8) => {
    // Gửi GET request đến endpoint best-selling với query param limit
    const response = await axiosInstance.get("/books/best-selling", {
      params: { limit },
    });
    // Trả về data từ response (đã được xử lý bởi axiosInstance)
    return response.data;
  },

  getPersonalizedBooks: async (limit = 8) => {
    const response = await axiosInstance.get("/books/personalized", {
      params: { limit },
    });
    return response.data;
  },

  getBookById: async (id) => {
    const response = await axiosInstance.get(`/books/${id}`);
    return response.data;
  },

  checkEbookAccess: async (bookId) => {
    const response = await axiosInstance.get(`/books/${bookId}/ebook-access`);
    return response.data;
  },

  getEbookReaderState: async (bookId) => {
    const response = await axiosInstance.get(`/books/${bookId}/reader-state`);
    return response.data;
  },

  saveEbookReaderProgress: async (bookId, payload) => {
    const response = await axiosInstance.put(
      `/books/${bookId}/reader-state/progress`,
      payload,
    );
    return response.data;
  },

  saveEbookReaderSettings: async (bookId, payload) => {
    const response = await axiosInstance.put(
      `/books/${bookId}/reader-state/settings`,
      payload,
    );
    return response.data;
  },

  addEbookBookmark: async (bookId, payload) => {
    const response = await axiosInstance.post(
      `/books/${bookId}/reader-state/bookmarks`,
      payload,
    );
    return response.data;
  },

  deleteEbookBookmark: async (bookId, bookmarkId) => {
    const response = await axiosInstance.delete(
      `/books/${bookId}/reader-state/bookmarks/${bookmarkId}`,
    );
    return response.data;
  },

  addEbookAnnotation: async (bookId, payload) => {
    const response = await axiosInstance.post(
      `/books/${bookId}/reader-state/annotations`,
      payload,
    );
    return response.data;
  },

  updateEbookAnnotation: async (bookId, annotationId, payload) => {
    const response = await axiosInstance.put(
      `/books/${bookId}/reader-state/annotations/${annotationId}`,
      payload,
    );
    return response.data;
  },

  deleteEbookAnnotation: async (bookId, annotationId) => {
    const response = await axiosInstance.delete(
      `/books/${bookId}/reader-state/annotations/${annotationId}`,
    );
    return response.data;
  },

  getMyEbooks: async () => {
    const response = await axiosInstance.get("/books/my-ebooks");
    return response.data;
  },

  // Admin endpoints
  getAllBooksAdmin: async (params) => {
    const response = await axiosInstance.get("/admin/books", { params });
    return response.data;
  },

  createBook: async (bookData) => {
    const isFormData = bookData instanceof FormData;
    const response = await axiosInstance.post(
      "/admin/books",
      bookData,
      isFormData
        ? { headers: { "Content-Type": "multipart/form-data" } }
        : undefined,
    );
    return response.data;
  },

  updateBook: async (id, bookData) => {
    const isFormData = bookData instanceof FormData;
    const response = await axiosInstance.put(
      `/admin/books/${id}`,
      bookData,
      isFormData
        ? { headers: { "Content-Type": "multipart/form-data" } }
        : undefined,
    );
    return response.data;
  },

  updateVisibility: async (id, visibility) => {
    const response = await axiosInstance.patch(
      `/admin/books/${id}/visibility`,
      { visibility },
    );
    return response.data;
  },

  uploadBookPreview: async (id, previewData) => {
    const response = await axiosInstance.post(
      `/admin/books/${id}/preview`,
      previewData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return response.data;
  },

  updateBookPreview: async (id, previewData) => {
    const response = await axiosInstance.put(
      `/admin/books/${id}/preview`,
      previewData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return response.data;
  },

  manageBookPreviewPage: async (id, payload) => {
    const response = await axiosInstance.patch(
      `/admin/books/${id}/preview/manage`,
      payload,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return response.data;
  },

  deleteBook: async (id) => {
    const response = await axiosInstance.delete(`/admin/books/${id}`);
    return response.data;
  },
};
