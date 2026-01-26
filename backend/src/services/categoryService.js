import Category from '../models/Category.js';
import Book from '../models/Book.js';
import ApiError from '../utils/ApiError.js';
import { MESSAGES } from '../config/constants.js';

class CategoryService {
  async getAllCategories() {
    const categories = await Category.find({ isDeleted: false })
      .sort({ name: 1 })
      .lean();

    return categories;
  }

  async getCategoryById(categoryId) {
    const category = await Category.findOne({
      _id: categoryId,
      isDeleted: false
    });

    if (!category) {
      throw ApiError.notFound(MESSAGES.NOT_FOUND);
    }

    return category;
  }

  async createCategory(categoryData) {
    const category = await Category.create(categoryData);
    return category;
  }

  async updateCategory(categoryId, updateData) {
    const category = await Category.findOneAndUpdate(
      { _id: categoryId, isDeleted: false },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!category) {
      throw ApiError.notFound(MESSAGES.NOT_FOUND);
    }

    return category;
  }

  async deleteCategory(categoryId) {
    const booksCount = await Book.countDocuments({ category: categoryId });
    
    if (booksCount > 0) {
      throw ApiError.badRequest(
        `Cannot delete category. ${booksCount} book(s) are associated with this category.`
      );
    }

    const category = await Category.findOneAndUpdate(
      { _id: categoryId, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );

    if (!category) {
      throw ApiError.notFound(MESSAGES.NOT_FOUND);
    }

    return category;
  }
}

export default new CategoryService();