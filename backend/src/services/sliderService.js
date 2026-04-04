import Slider from "../models/Slider.js";
import ApiError from "../utils/ApiError.js";
import { BOOK_VISIBILITY } from "../config/constants.js";

const MAX_SLIDERS = 5;

class SliderService {
  // UC-23: Hiển thị slider công khai trên homepage (View slider)
  // Luồng xử lý: Hiển thị carousel sách nổi bật trên trang chủ
  // Bắt đầu: HomePage gọi fetchSliders() trong useEffect
  // Xử lý chính: Query MongoDB lấy sliders có visibility PUBLIC, sort theo thời gian tạo mới nhất
  // Cuối cùng: Trả về danh sách sliders, frontend render thành carousel
  async getPublicSliders() {
    // Query lấy sliders có visibility PUBLIC
    return Slider.find({ visibility: BOOK_VISIBILITY.PUBLIC })
      .sort({ createdAt: -1 })  // Sort theo thời gian tạo giảm dần (mới nhất trước)
      .limit(MAX_SLIDERS)       // Giới hạn số lượng sliders tối đa
      .lean();                  // Trả về plain object
  }

  async getAllSliders() {
    // UC-23 (Admin view): Truy vấn toàn bộ slider, kể cả hidden, để admin quản trị.
    return Slider.find({})
      .populate("adminId", "email firstName lastName role")
      .sort({ createdAt: -1 })
      .lean();
  }

  async createSlider(data) {
    // UC-24: Giới hạn tối đa số lượng slider để tránh homepage quá tải.
    const total = await Slider.countDocuments();
    if (total >= MAX_SLIDERS) {
      throw ApiError.badRequest(`Slider limit reached (max ${MAX_SLIDERS})`);
    }

    // Tạo slider mới trong MongoDB từ payload đã được controller chuẩn hóa.
    const slider = await Slider.create(data);
    return slider;
  }

  async updateSlider(id, data) {
    // UC-25: Logic thật sự cập nhật slider nằm ở service này.
    // Dùng findByIdAndUpdate để ghi dữ liệu mới vào MongoDB.
    const slider = await Slider.findByIdAndUpdate(
      id,
      // Chỉ cập nhật các field có trong payload.
      { $set: data },
      // new: true để trả về bản ghi sau cập nhật; runValidators để kiểm tra schema.
      { new: true, runValidators: true },
    );

    if (!slider) {
      // Không tìm thấy slider theo ID thì trả lỗi 404.
      throw ApiError.notFound("Slider not found");
    }

    return slider;
  }

  async updateVisibility(id, visibility) {
    // UC-26: Logic thật sự bật/tắt hiển thị slider nằm ở đây.
    // Chỉ cập nhật trường visibility, giữ nguyên các trường còn lại.
    const slider = await Slider.findByIdAndUpdate(
      id,
      { visibility },
      { new: true, runValidators: true },
    );

    if (!slider) {
      // Nếu ID không hợp lệ hoặc không tồn tại, trả lỗi rõ ràng cho controller.
      throw ApiError.notFound("Slider not found");
    }

    return slider;
  }

  // UC-16: Xóa slider (Admin delete slider)
  // Luồng xử lý: Admin xóa slider khỏi hệ thống
  // Bắt đầu: Admin click delete button trên SlidersManagement page
  // Xử lý chính: Tìm và xóa slider theo ID từ MongoDB
  // Cuối cùng: Trả về slider đã xóa, frontend cập nhật UI
  async deleteSlider(id) {
    // Tìm và xóa slider theo ID
    const slider = await Slider.findByIdAndDelete(id);

    // Nếu không tìm thấy slider, throw error
    if (!slider) {
      throw ApiError.notFound("Slider not found");
    }

    // Trả về slider đã xóa
    return slider;
  }
}

export default new SliderService();
