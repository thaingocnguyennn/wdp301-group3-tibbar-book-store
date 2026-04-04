import axiosInstance from "./axios.js";

export const bookApi = {
  // UC-11: API lấy danh sách sách công khai với bộ lọc
  // Endpoint: GET /api/books
  // Query params: category, author, minPrice, maxPrice, search, page, limit
  // Mô tả: Gọi API backend để lấy danh sách sách với các filter criteria và pagination
  // Trả về: { success: true, message: "...", data: { books: [...], pagination: {...} } }
  getPublicBooks: async (params) => {
    // Gửi GET request đến endpoint /books với query params chứa filters
    const response = await axiosInstance.get("/books", { params });
    // Trả về data từ response
    return response.data;
  },

  // UC-13: API lấy sách mới nhất
  // Endpoint: GET /api/books/newest?limit=10
  // Mô tả: Gọi API backend để lấy sách được thêm gần đây nhất
  // Tham số: limit - số lượng sách trả về (mặc định 10)
  // Trả về: { success: true, message: "...", data: { books: [...] } }
  getNewestBooks: async (limit = 10) => {
    // Gửi GET request đến endpoint newest với query param limit
    const response = await axiosInstance.get("/books/newest", {
      params: { limit },
    });
    // Trả về data từ response
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

  // UC-15: API lấy thông tin chi tiết của một cuốn sách
  // Endpoint: GET /api/books/:id
  // Mô tả: Gọi API backend để lấy thông tin đầy đủ của một cuốn sách cụ thể
  // Tham số: id - ID của cuốn sách
  // Trả về: { success: true, message: "...", data: { book: {...} } }
  getBookById: async (id) => {
    // Gửi GET request đến endpoint /books/:id để lấy chi tiết sách
    const response = await axiosInstance.get(`/books/${id}`);
    // Trả về data từ response
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
