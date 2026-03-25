import axiosInstance from "./axios";

/**
 * Lấy danh sách tồn kho cho admin
 */
export const getInventoryStockApi = (params) => {
  return axiosInstance.get("/admin/inventory/stock", { params });
};