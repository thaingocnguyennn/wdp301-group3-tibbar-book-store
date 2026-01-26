import bookService from '../services/bookService.js';
import ApiResponse from '../utils/ApiResponse.js';
import { HTTP_STATUS, MESSAGES } from '../config/constants.js';

class BookController {
  async getPublicBooks(req, res, next) {
    try {
      const result = await bookService.getPublicBooks(req.query);

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

  async getNewestBooks(req, res, next) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 10;
      const books = await bookService.getNewestBooks(limit);

      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        MESSAGES.BOOKS_FETCHED,
        { books }
      );
    } catch (error) {
      next(error);
    }
  }

  async getBookById(req, res, next) {
    try {
      const book = await bookService.getBookById(req.params.id);

      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        MESSAGES.BOOK_FETCHED,
        { book }
      );
    } catch (error) {
      next(error);
    }
  }
}

export default new BookController();