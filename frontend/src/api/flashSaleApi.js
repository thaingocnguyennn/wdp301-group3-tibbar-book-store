import axiosInstance from "./axios";

// API client cho flash sale - quản lý tất cả requests liên quan đến flash sale
export const flashSaleApi = {
  // Lấy chiến dịch flash sale hiện tại đang hoạt động
  // Dùng bởi: HomePage, BookDetailPage, CartPage, CheckoutPage
  getActiveFlashSale: async () => {
    const response = await axiosInstance.get("/flash-sale/active");
    return response.data;
  },

  // Lấy thông tin flash sale hiện tại cho admin panel
  // Dùng bởi: FlashSaleManagement (admin page)
  getCurrentFlashSaleAdmin: async () => {
    const response = await axiosInstance.get("/admin/flash-sale/current");
    return response.data;
  },

  // Tạo mới hoặc cập nhật chiến dịch flash sale
  // Dùng bởi: FlashSaleManagement (admin page)
  upsertCurrentFlashSale: async (payload) => {
    const response = await axiosInstance.put("/admin/flash-sale/current", payload);
    return response.data;
  },

  // Xóa/hủy chiến dịch flash sale hiện tại
  // Dùng bởi: FlashSaleManagement (admin page)
  clearCurrentFlashSale: async () => {
    const response = await axiosInstance.delete("/admin/flash-sale/current");
    return response.data;
  },
};
