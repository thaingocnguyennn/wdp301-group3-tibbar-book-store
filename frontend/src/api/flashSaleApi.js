import axiosInstance from "./axios";

export const flashSaleApi = {
  getActiveFlashSale: async () => {
    const response = await axiosInstance.get("/flash-sale/active");
    return response.data;
  },

  getCurrentFlashSaleAdmin: async () => {
    const response = await axiosInstance.get("/admin/flash-sale/current");
    return response.data;
  },

  upsertCurrentFlashSale: async (payload) => {
    const response = await axiosInstance.put("/admin/flash-sale/current", payload);
    return response.data;
  },

  clearCurrentFlashSale: async () => {
    const response = await axiosInstance.delete("/admin/flash-sale/current");
    return response.data;
  },
};
