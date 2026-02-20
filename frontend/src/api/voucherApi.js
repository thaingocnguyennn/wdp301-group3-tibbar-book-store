import axiosInstance from "./axios.js";

export const voucherApi = {
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
};
