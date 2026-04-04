import axiosInstance from "./axios.js";

export const sliderApi = {
  // UC-14: API lấy sliders công khai cho homepage
  // Endpoint: GET /api/sliders
  // Mô tả: Gọi API backend để lấy danh sách sliders hiển thị trên carousel homepage
  // Trả về: { success: true, message: "...", data: { sliders: [...] } }
  getPublicSliders: async () => {
    // Gửi GET request đến endpoint /sliders để lấy sliders công khai
    const response = await axiosInstance.get("/sliders");
    // Trả về data từ response
    return response.data;
  },

  getAllSlidersAdmin: async () => {
    const response = await axiosInstance.get("/admin/sliders");
    return response.data;
  },

  createSlider: async (formData) => {
    const response = await axiosInstance.post("/admin/sliders", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  updateSlider: async (id, formData) => {
    const response = await axiosInstance.put(`/admin/sliders/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  updateVisibility: async (id, visibility) => {
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
