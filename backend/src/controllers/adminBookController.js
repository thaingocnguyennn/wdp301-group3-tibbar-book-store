import bookService from '../services/bookService.js';
import ApiResponse from '../utils/ApiResponse.js';
import { HTTP_STATUS, MESSAGES } from '../config/constants.js';

class AdminBookController {
  async getAllBooks(req, res, next) {
    try {
      const result = await bookService.getAllBooksAdmin(req.query);

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

  async createBook(req, res, next) {
    try {
      const payload = { ...req.body };

      // Handle isEbook coercion from string to boolean
      if (payload.isEbook !== undefined) {
        payload.isEbook = payload.isEbook === 'true' || payload.isEbook === true;
      }

      if (req.files?.image?.[0]) {
        payload.imageUrl = `/uploads/books/${req.files.image[0].filename}`;
      }
      if (req.files?.ebook?.[0]) {
        payload.ebookFile = `/uploads/ebooks/${req.files.ebook[0].filename}`;
      }

      const book = await bookService.createBook(payload);

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

  async updateBook(req, res, next) {
    try {
      const payload = { ...req.body };

      // Handle isEbook coercion from string to boolean
      if (payload.isEbook !== undefined) {
        payload.isEbook = payload.isEbook === 'true' || payload.isEbook === true;
      }

      if (req.files?.image?.[0]) {
        payload.imageUrl = `/uploads/books/${req.files.image[0].filename}`;
      }
      if (req.files?.ebook?.[0]) {
        payload.ebookFile = `/uploads/ebooks/${req.files.ebook[0].filename}`;
      }

      const book = await bookService.updateBook(req.params.id, payload);

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

  async updateVisibility(req, res, next) {
    try {
      const { visibility } = req.body;
      const book = await bookService.updateVisibility(req.params.id, visibility);

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

    async updatePreviewPages(req, res, next) {
      try {
        const files = Array.isArray(req.files) ? req.files : [];

        const previewPages = files.map((file) => `/uploads/book-previews/${file.filename}`);

        const book = await bookService.updatePreviewPages(req.params.id, previewPages);

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

  async managePreviewPage(req, res, next) {
    try {
      const { operation, pageNumber } = req.body;
      const previewPageUrl = req.file ? `/uploads/book-previews/${req.file.filename}` : undefined;

      const book = await bookService.managePreviewPage(req.params.id, {
        operation,
        pageNumber,
        previewPageUrl
      });

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

  async deleteBook(req, res, next) {
    try {
      await bookService.deleteBook(req.params.id);

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