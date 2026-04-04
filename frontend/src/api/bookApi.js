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

  // UC-86: API lấy danh sách sách cá nhân hóa dựa trên giỏ hàng
  // Endpoint: GET /api/books/personalized?limit=8
  // Mô tả: 
  // - Guest users (không login): Hiển thị sách mới nhất (fallback-newest)
  // - Authenticated users với giỏ hàng: 
  //   Recommend sách cùng tác giả + danh mục từ items trong giỏ (cart-author-category)
  //   Scoring logic: Author match (+8) > Category match (+6) > Freshness (+0-4)
  // - Fallback: Nếu không tìm được → Hiển thị sách mới nhất (fallback-newest-relaxed)
  //
  // Response: { success: true, data: { 
  //   books: [...],                    // Mảng 8 sách recommend
  //   strategy: "cart-author-category", // Loại recommendation dùng
  //   signals: {                         // Metadata để frontend debug
  //     hasCartHistory: true,
  //     hasAuthorInterest: true,
  //     hasCategoryInterest: false
  //   }
  // }}
  //
  // Tham số:
  // - limit: Số lượng sách trả về (mặc định 8)
  //
  // Ví dụ cụ thể:
  // User's Cart: [
  //   { book: "Python 101", author: "Ngô Thế Phương", category: "IT" },
  //   { book: "Data Science", author: "Lê Văn A", category: "IT" }
  // ]
  // → API tìm kiếm sách NOT IN cart nhưng có author MATCH ("Ngô Thế Phương" hoặc "Lê Văn A")
  //   HOẶC category MATCH ("IT")
  // → Recommend: [Sách khác của "Ngô Thế Phương" (score: 8), Sách IT khác (score: 6), ...]
  getPersonalizedBooks: async (limit = 8) => {
    // Gửi GET request đến endpoint /books/personalized với query param limit
    // Ví dụ: GET /api/books/personalized?limit=8
    const response = await axiosInstance.get("/books/personalized", {
      params: { limit },  // Query params: { limit: 8 }
    });
    // Trả về data từ response (đã được xử lý bởi axiosInstance response interceptor)
    // Response format: { success: true, message, data: { books, strategy, signals } }
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

  //-------------------------------
  //API quản lý sách cho admin - lấy danh sách tất cả sách với bộ lọc
  getAllBooksAdmin: async (params) => {
    const response = await axiosInstance.get("/admin/books", { params });
    return response.data;
  },

  //API quản lý sách cho admin - tạo mới một cuốn sách
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

  //API quản lý sách cho admin - cập nhật thông tin một cuốn sách
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

  //API quản lý sách cho admin - cập nhật trạng thái hiển thị của một cuốn sách
  updateVisibility: async (id, visibility) => {
    const response = await axiosInstance.patch(
      `/admin/books/${id}/visibility`,
      { visibility },
    );
    return response.data;
  },

  //API quản lý sách cho admin - tải lên preview cho một cuốn sách
  uploadBookPreview: async (id, previewData) => {
    const response = await axiosInstance.post(
      `/admin/books/${id}/preview`,
      previewData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return response.data;
  },

  //API quản lý sách cho admin - cập nhật một trang preview cụ thể của một cuốn sách
  updateBookPreview: async (id, previewData) => {
    const response = await axiosInstance.put(
      `/admin/books/${id}/preview`,
      previewData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return response.data;
  },

  //ham manageBookPreviewPage để quản lý trang preview của sách, có thể dùng để thêm mới, 
  // thay thế hoặc xóa một trang preview cụ thể trong danh sách trang preview của sách
  manageBookPreviewPage: async (id, payload) => {
    const response = await axiosInstance.patch(
      `/admin/books/${id}/preview/manage`,
      payload,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return response.data;
  },

  //API quản lý sách cho admin - xóa một cuốn sách
  deleteBook: async (id) => {
    const response = await axiosInstance.delete(`/admin/books/${id}`);
    return response.data;
  },
};
