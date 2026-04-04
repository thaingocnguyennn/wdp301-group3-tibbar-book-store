import bookService from '../services/bookService.js';
import ApiResponse from '../utils/ApiResponse.js';
import { HTTP_STATUS, MESSAGES } from '../config/constants.js';

class AdminBookController {
  //hàm getAllBooks để lấy danh sách tất cả sách
  async getAllBooks(req, res, next) {
    try {
      //gọi hàm getAllBooksAdmin trong bookService để lấy danh sách tất cả sách với bộ lọc từ query params
      const result = await bookService.getAllBooksAdmin(req.query);

      //trả về response với dữ liệu sách đã lấy được
      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        MESSAGES.BOOKS_FETCHED,
        result
      );
    } catch (error) {
      next(error);
    }
  }

  //hàm createBook để tạo mới một cuốn sách
  async createBook(req, res, next) {
    try {
      //tạo payload từ body của request
      const payload = { ...req.body };
      
      if (payload.isEbook !== undefined) {
        payload.isEbook = payload.isEbook === 'true' || payload.isEbook === true;
      }

      //nếu có file ảnh được tải lên, thêm URL của ảnh vào payload
      if (req.files?.image?.[0]) {
        payload.imageUrl = `/uploads/books/${req.files.image[0].filename}`;
      }
      if (req.files?.ebook?.[0]) {
        payload.ebookFile = `/uploads/ebooks/${req.files.ebook[0].filename}`;
      }

      //gọi hàm createBook trong bookService để tạo mới một cuốn sách với payload đã chuẩn bị
      const book = await bookService.createBook(payload);

      //trả về response với dữ liệu cuốn sách đã được tạo
      return ApiResponse.success(
        res,
        HTTP_STATUS.CREATED,
        MESSAGES.BOOK_CREATED,
        { book }
      );
    } catch (error) {
      next(error);
    }
  }

  //hàm updateBook để cập nhật thông tin một cuốn sách
  async updateBook(req, res, next) {
    try {
      const payload = { ...req.body };

      // Handle isEbook coercion from string to boolean
      if (payload.isEbook !== undefined) {
        payload.isEbook = payload.isEbook === 'true' || payload.isEbook === true;
      }

      //nếu có file ảnh được tải lên, thêm URL của ảnh vào payload
      if (req.files?.image?.[0]) {
        payload.imageUrl = `/uploads/books/${req.files.image[0].filename}`;
      }
      if (req.files?.ebook?.[0]) {
        payload.ebookFile = `/uploads/ebooks/${req.files.ebook[0].filename}`;
      }

      //gọi hàm updateBook trong bookService để cập nhật thông tin một cuốn sách với payload đã chuẩn bị
      const book = await bookService.updateBook(req.params.id, payload);

      //trả về response với dữ liệu cuốn sách đã được cập nhật
      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        MESSAGES.BOOK_UPDATED,
        { book }
      );
    } catch (error) {
      next(error);
    }
  }

  //hàm updateVisibility để cập nhật trạng thái hiển thị của một cuốn sách
  async updateVisibility(req, res, next) {
    try {
      const { visibility } = req.body;
      //gọi hàm updateVisibility trong bookService để cập nhật trạng thái hiển thị của một cuốn sách
      const book = await bookService.updateVisibility(req.params.id, visibility);

      //trả về response với dữ liệu cuốn sách đã được cập nhật
      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        MESSAGES.VISIBILITY_UPDATED,
        { book }
      );
    } catch (error) {
      next(error);
    }
  }

  //hàm updatePreviewPages để cập nhật danh sách trang preview của một cuốn sách
    async updatePreviewPages(req, res, next) {
      try {
        //nếu có file preview được tải lên, tạo danh sách URL của các trang preview
        const files = Array.isArray(req.files) ? req.files : [];

        //tạo danh sách URL của các trang preview từ file đã tải lên
        const previewPages = files.map((file) => `/uploads/book-previews/${file.filename}`);

        //gọi hàm updatePreviewPages trong bookService để cập nhật danh sách trang preview của một cuốn sách
        const book = await bookService.updatePreviewPages(req.params.id, previewPages);

        //trả về response với dữ liệu cuốn sách đã được cập nhật
        return ApiResponse.success(
          res,
          HTTP_STATUS.OK,
          'Book preview pages updated successfully',
          { book }
        );
      } catch (error) {
        next(error);
      }
    }

    //hàm managePreviewPage để quản lý trang preview của sách, có thể dùng để thêm mới, 
    // thay thế hoặc xóa một trang preview cụ thể trong danh sách trang preview của sách
  async managePreviewPage(req, res, next) {
    try {
      //lấy operation và pageNumber từ body của request, và URL của trang preview mới nếu có file được tải lên
      const { operation, pageNumber } = req.body;
      //nếu có file preview được tải lên, tạo URL của trang preview mới
      const previewPageUrl = req.file ? `/uploads/book-previews/${req.file.filename}` : undefined;

      //gọi hàm managePreviewPage trong bookService để quản lý trang preview của sách
      const book = await bookService.managePreviewPage(req.params.id, {
        operation,
        pageNumber,
        previewPageUrl
      });

      //trả về response với dữ liệu cuốn sách đã được cập nhật
      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        'Book preview page managed successfully',
        { book }
      );
    } catch (error) {
      next(error);
    }
  }

  //hàm deleteBook để xóa một cuốn sách
  async deleteBook(req, res, next) {
    try {
      //gọi hàm deleteBook trong bookService để xóa một cuốn sách
      await bookService.deleteBook(req.params.id);

      //trả về response xác nhận đã xóa sách
      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        MESSAGES.BOOK_DELETED
      );
    } catch (error) {
      next(error);
    }
  }
}

export default new AdminBookController();