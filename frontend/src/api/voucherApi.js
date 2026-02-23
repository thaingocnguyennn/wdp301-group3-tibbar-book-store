import axiosInstance from "./axios.js";

export const voucherApi = {
  // ── Admin ────────────────────────────────────────────────────────────────
  getAllVouchers: async () => {
    const response = await axiosInstance.get("/admin/vouchers");
    return response.data;
  },

  createVoucher: async (voucherData) => {
    const response = await axiosInstance.post("/admin/vouchers", voucherData);
    return response.data;
  },

  updateVoucher: async (voucherId, voucherData) => {
    const response = await axiosInstance.put(`/admin/vouchers/${voucherId}`, voucherData);
    return response.data;
  },

  // ── Customer ─────────────────────────────────────────────────────────────
  /**
   * Returns active, non-expired vouchers whose minOrderValue ≤ subtotal.
   * @param {number} subtotal - Current cart subtotal in VND.
   */
  getAvailableVouchers: async (subtotal = 0) => {
    const response = await axiosInstance.get("/vouchers/available", {
      params: { subtotal },
    });
    return response.data;
  },
};
