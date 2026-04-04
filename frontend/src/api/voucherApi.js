import axiosInstance from "./axios.js";

export const voucherApi = {
  // ── Admin ────────────────────────────────────────────────────────────────
  getAllVouchers: async () => {
    // UC-47: Lấy toàn bộ voucher cho màn hình quản trị admin.
    // Endpoint: GET /api/admin/vouchers
    const response = await axiosInstance.get("/admin/vouchers");
    return response.data;
  },

  createVoucher: async (voucherData) => {
    // UC-48: Tạo voucher mới từ form admin.
    // Endpoint: POST /api/admin/vouchers
    const response = await axiosInstance.post("/admin/vouchers", voucherData);
    return response.data;
  },

  updateVoucher: async (voucherId, voucherData) => {
    // UC-47/48: Cập nhật voucher đã có (chỉnh rule, expiry, trạng thái active...).
    // Endpoint: PUT /api/admin/vouchers/:id
    const response = await axiosInstance.put(
      `/admin/vouchers/${voucherId}`,
      voucherData,
    );
    return response.data;
  },

  assignVoucherToUsers: async (voucherId, payload) => {
    // UC-93: Gán voucher cho user cụ thể hoặc user segment.
    // Endpoint: POST /api/admin/vouchers/:id/assign-users
    const response = await axiosInstance.post(
      `/admin/vouchers/${voucherId}/assign-users`,
      payload,
    );
    return response.data;
  },

  // ── Customer ─────────────────────────────────────────────────────────────
  /**
   * Returns active, non-expired vouchers whose minOrderValue ≤ subtotal.
   * @param {number} subtotal - Current cart subtotal in VND.
   */
  getAvailableVouchers: async (subtotal = 0) => {
    // UC-92: API này chỉ trả voucher còn hiệu lực tại thời điểm gọi.
    // subtotal được gửi để backend lọc minOrderValue phù hợp giỏ hàng hiện tại.
    const response = await axiosInstance.get("/vouchers/available", {
      params: { subtotal },
    });
    return response.data;
  },

  getMyVouchers: async () => {
    // UC-91 + UC-93: Lấy ví voucher cá nhân (trạng thái sử dụng + voucher được gán).
    // Endpoint: GET /api/vouchers/mine
    const response = await axiosInstance.get("/vouchers/mine");
    return response.data;
  },
};
