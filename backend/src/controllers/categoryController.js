import categoryService from '../services/categoryService.js';
import ApiResponse from '../utils/ApiResponse.js';
import { HTTP_STATUS, MESSAGES } from '../config/constants.js';

class CategoryController {
  async getAllCategories(req, res, next) {
    try {
      const categories = await categoryService.getAllCategories();

      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        MESSAGES.CATEGORIES_FETCHED,
        { categories }
      );
    } catch (error) {
      next(error);
    }
  }

  async createCategory(req, res, next) {
    try {
      const category = await categoryService.createCategory(req.body);

      return ApiResponse.success(
        res,
        HTTP_STATUS.CREATED,
        MESSAGES.CATEGORY_CREATED,
        { category }
      );
    } catch (error) {
      next(error);
    }
  }

  async updateCategory(req, res, next) {
    try {
      const category = await categoryService.updateCategory(req.params.id, req.body);

      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        MESSAGES.CATEGORY_UPDATED,
        { category }
      );
    } catch (error) {
      next(error);
    }
  }

  async deleteCategory(req, res, next) {
    try {
      await categoryService.deleteCategory(req.params.id);

      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        MESSAGES.CATEGORY_DELETED
      );
    } catch (error) {
      next(error);
    }
  }
}

export default new CategoryController();