import axiosInstance from "./axios.js";

export const sliderApi = {
  // UC-23: API lấy sliders công khai cho homepage
  // Endpoint: GET /api/sliders
  // Mô tả: Gọi API backend để lấy danh sách slider public hiển thị trên homepage carousel
  // Trả về: { success: true, message: "...", data: { sliders: [...] } }
  getPublicSliders: async () => {
    // Gửi GET request đến endpoint /sliders để lấy sliders công khai
    const response = await axiosInstance.get("/sliders");
    // Trả về data từ response
    return response.data;
  },

  getAllSlidersAdmin: async () => {
    // UC-23 (Admin view): lấy toàn bộ slider để hiển thị danh sách quản trị.
    const response = await axiosInstance.get("/admin/sliders");
    return response.data;
  },

  createSlider: async (formData) => {
    // UC-24: Tạo slider mới từ màn hình admin, payload có thể chứa ảnh upload.
    // Tạo slider mới, dùng multipart/form-data để gửi ảnh.
    const response = await axiosInstance.post("/admin/sliders", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  // UC-25: API sửa slider.
  // Frontend gọi từ màn hình SlidersManagement để cập nhật ảnh/thuộc tính slider hiện có.
  // Endpoint thực tế: PUT /api/admin/sliders/:id
  updateSlider: async (id, formData) => {
    // id: slider cần sửa; formData: dữ liệu mới (có thể có ảnh mới).
    const response = await axiosInstance.put(`/admin/sliders/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  // UC-26: API đổi trạng thái hiển thị slider.
  // Dùng cho thao tác Hide/Show của admin ngay trên danh sách slider.
  // Endpoint thực tế: PATCH /api/admin/sliders/:id/visibility
  updateVisibility: async (id, visibility) => {
    // Chỉ gửi trường visibility, backend sẽ cập nhật riêng field này.
    const response = await axiosInstance.patch(
      `/admin/sliders/${id}/visibility`,
      {
        visibility,
      },
    );
    return response.data;
  },

  // UC-16: API xóa slider (Admin)
  // Endpoint: DELETE /api/admin/sliders/:id
  // Mô tả: Gọi API backend để xóa slider khỏi hệ thống
  // Tham số: id - ID của slider cần xóa
  // Trả về: { success: true, message: "Slider deleted" }
  deleteSlider: async (id) => {
    // Gửi DELETE request đến endpoint admin/sliders/:id
    const response = await axiosInstance.delete(`/admin/sliders/${id}`);
    // Trả về data từ response
    return response.data;
  },
};
