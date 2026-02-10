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

      if (req.file) {
        payload.imageUrl = `/uploads/books/${req.file.filename}`;
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

      if (req.file) {
        payload.imageUrl = `/uploads/books/${req.file.filename}`;
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