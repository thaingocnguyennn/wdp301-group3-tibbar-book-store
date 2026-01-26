import Slider from "../models/Slider.js";
import Book from "../models/Book.js";
import ApiError from "../utils/ApiError.js";
import { HTTP_STATUS } from "../config/constants.js";

/**
 * SliderService - Xử lý business logic cho Slider Management
 *
 * CLEAN CODE PRINCIPLES:
 * ✅ Single Responsibility: Mỗi method chỉ làm 1 việc
 * ✅ DRY (Don't Repeat Yourself): Tách logic validation thành method riêng
 * ✅ Error Handling: Xử lý lỗi rõ ràng với ApiError
 * ✅ Readable Code: Tên biến/method mô tả rõ chức năng
 *
 * FLOW XỬ LÝ:
 * 1. Controller nhận request -> gọi Service
 * 2. Service xử lý business logic -> tương tác với Model
 * 3. Model xử lý database operations
 * 4. Service trả về kết quả cho Controller
 * 5. Controller format response và gửi về client
 */
class SliderService {
  maxSliders = 5;
  /**
   * [PUBLIC API] Lấy danh sách slider đang hiển thị
   * Dùng cho homepage - không cần authentication
   *
   * @returns {Promise<Array>} Danh sách slider visible
   */
  async getVisibleSliders() {
    try {
      const sliders = await Slider.getVisibleSliders();
      return sliders;
    } catch (error) {
      throw new ApiError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "Failed to fetch visible sliders",
      );
    }
  }

  /**
   * [ADMIN API] Lấy tất cả sliders (bao gồm hidden)
   * Dùng cho admin panel
   *
   * @param {Object} filters - Bộ lọc (visibility, sort)
   * @returns {Promise<Array>} Danh sách tất cả sliders
   */
  async getAllSliders(filters = {}) {
    try {
      const { visibility, sortBy = "order", sortOrder = "asc" } = filters;

      // Xây dựng query
      const query = {};
      if (visibility) {
        query.visibility = visibility;
      }

      // Xây dựng sort
      const sort = {};
      sort[sortBy] = sortOrder === "desc" ? -1 : 1;

      const sliders = await Slider.find(query)
        .populate("bookId", "title author price imageUrl description")
        .sort(sort)
        .lean();

      return sliders;
    } catch (error) {
      throw new ApiError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "Failed to fetch sliders",
      );
    }
  }

  /**
   * [ADMIN API] Lấy slider theo ID
   *
   * @param {string} sliderId - ID của slider
   * @returns {Promise<Object>} Slider object
   */
  async getSliderById(sliderId) {
    const slider = await Slider.findById(sliderId).populate(
      "bookId",
      "title author price imageUrl description",
    );

    if (!slider) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, "Slider not found");
    }

    return slider;
  }

  /**
   * [ADMIN API] Tạo slider mới
   *
   * VALIDATION:
   * - Title, imageUrl bắt buộc
   * - Nếu có bookId -> kiểm tra book tồn tại
   * - Order phải >= 0
   *
   * @param {Object} sliderData - Dữ liệu slider mới
   * @returns {Promise<Object>} Slider vừa tạo
   */
  async createSlider(sliderData) {
    if (!sliderData.bookId) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Book ID is required");
    }

    const sliderCount = await Slider.countDocuments();
    if (sliderCount >= this.maxSliders) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        `Maximum ${this.maxSliders} sliders allowed`,
      );
    }

    const book = await this._validateBook(sliderData.bookId);
    const preparedData = this._buildSliderFromBook(book);

    try {
      const slider = await Slider.create(preparedData);

      // Populate book info nếu có
      await slider.populate(
        "bookId",
        "title author price imageUrl description",
      );

      return slider;
    } catch (error) {
      if (error.name === "ValidationError") {
        throw new ApiError(
          HTTP_STATUS.BAD_REQUEST,
          this._formatValidationError(error),
        );
      }
      throw error;
    }
  }

  /**
   * [ADMIN API] Cập nhật slider
   *
   * @param {string} sliderId - ID của slider cần update
   * @param {Object} updateData - Dữ liệu cập nhật
   * @returns {Promise<Object>} Slider sau khi update
   */
  async updateSlider(sliderId, updateData) {
    // Kiểm tra slider tồn tại
    const slider = await this.getSliderById(sliderId);

    if (!updateData.bookId) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Book ID is required");
    }

    let preparedData = updateData;
    if (updateData.bookId !== slider.bookId?._id?.toString()) {
      const book = await this._validateBook(updateData.bookId);
      preparedData = this._buildSliderFromBook(book);
    }

    try {
      // Update với options: new = true (trả về doc sau update), runValidators = true
      const updatedSlider = await Slider.findByIdAndUpdate(
        sliderId,
        preparedData,
        { new: true, runValidators: true },
      ).populate("bookId", "title author price imageUrl description");

      return updatedSlider;
    } catch (error) {
      if (error.name === "ValidationError") {
        throw new ApiError(
          HTTP_STATUS.BAD_REQUEST,
          this._formatValidationError(error),
        );
      }
      throw error;
    }
  }

  /**
   * [ADMIN API] Thay đổi visibility của slider
   * Chỉ cập nhật trường visibility, không ảnh hưởng các trường khác
   *
   * @param {string} sliderId - ID của slider
   * @param {string} visibility - 'visible' hoặc 'hidden'
   * @returns {Promise<Object>} Slider sau khi update
   */
  async toggleVisibility(sliderId, visibility) {
    // Validate visibility value
    if (!["visible", "hidden"].includes(visibility)) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'Visibility must be either "visible" or "hidden"',
      );
    }

    const slider = await Slider.findByIdAndUpdate(
      sliderId,
      { visibility },
      { new: true },
    ).populate("bookId", "title author price imageUrl");

    if (!slider) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, "Slider not found");
    }

    return slider;
  }

  /**
   * [ADMIN API] Xóa slider
   *
   * @param {string} sliderId - ID của slider cần xóa
   * @returns {Promise<Object>} Slider đã xóa
   */
  async deleteSlider(sliderId) {
    const slider = await Slider.findByIdAndDelete(sliderId);

    if (!slider) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, "Slider not found");
    }

    return slider;
  }

  /**
   * PRIVATE METHOD: Validate book tồn tại
   * Tách thành method riêng để tái sử dụng (DRY principle)
   *
   * @param {string} bookId - ID của book cần validate
   * @throws {ApiError} Nếu book không tồn tại
   */
  async _validateBook(bookId) {
    const book = await Book.findById(bookId);
    if (!book) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, "Book not found");
    }

    return book;
  }

  _buildSliderFromBook(book) {
    const imageUrl = this._normalizeImageUrl(book.imageUrl);
    return {
      title: book.title || "",
      description: book.description || book.title || "",
      imageUrl,
      bookId: book._id,
      visibility: "visible",
      order: 0,
    };
  }

  _normalizeImageUrl(url) {
    const fallback =
      "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1600&q=80";

    if (!url) return fallback;

    try {
      const parsedUrl = new URL(url);

      if (parsedUrl.hostname.includes("images.unsplash.com")) {
        parsedUrl.searchParams.set("auto", "format");
        parsedUrl.searchParams.set("fit", "crop");
        parsedUrl.searchParams.set("w", "1600");
        parsedUrl.searchParams.set("q", "80");
        return parsedUrl.toString();
      }

      return url;
    } catch (error) {
      return fallback;
    }
  }

  /**
   * PRIVATE METHOD: Format lỗi validation từ Mongoose
   *
   * @param {Error} error - Mongoose validation error
   * @returns {string} Thông báo lỗi dễ đọc
   */
  _formatValidationError(error) {
    const errors = Object.values(error.errors).map((err) => err.message);
    return errors.join(", ");
  }
}

// Export singleton instance
export default new SliderService();
