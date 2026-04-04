import axiosInstance from "./axios";

/**
 * UC-126: Lấy dữ liệu tồn kho cho trang Inventory Management của admin.
 * Endpoint: GET /api/admin/inventory/stock
 * Params: page, limit, q
 * Kết quả: danh sách đầu sách + meta (totalTypes, totalRemaining, totalPages...)
 */
export const getInventoryStockApi = (params) => {
  return axiosInstance.get("/admin/inventory/stock", { params });
};