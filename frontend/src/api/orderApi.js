import axiosInstance from "./axios.js";

export const orderApi = {
  // Get available payment methods
  getPaymentMethods: async () => {
    const response = await axiosInstance.get("/orders/payment-methods");
    return response.data;
  },

  // Create order (checkout)
  createOrder: async (orderData) => {
    const response = await axiosInstance.post("/orders", orderData);
    return response.data;
  },

  // Validate voucher with current cart
  validateVoucher: async (voucherCode) => {
    const response = await axiosInstance.post("/orders/voucher/validate", {
      voucherCode,
    });
    return response.data;
  },

  // Get user's orders
  getUserOrders: async (page = 1, limit = 10) => {
    // UC-44: Lấy lịch sử đơn hàng (đơn cũ + đơn hiện tại) của user theo phân trang.
    // Endpoint thực tế: GET /api/orders?page=&limit=
    const response = await axiosInstance.get("/orders", {
      params: { page, limit },
    });
    return response.data;
  },

  // Get order by ID
  getOrderById: async (orderId) => {
    // UC-45: Lấy thông tin chi tiết của một đơn hàng cụ thể.
    // Endpoint thực tế: GET /api/orders/:id
    const response = await axiosInstance.get(`/orders/${orderId}`);
    return response.data;
  },

  // Get order by order number
  getOrderByNumber: async (orderNumber) => {
    const response = await axiosInstance.get(`/orders/number/${orderNumber}`);
    return response.data;
  },

  // Cancel order
  cancelOrder: async (orderId) => {
    // UC-46: Hủy đơn hàng chỉ khi đơn còn trạng thái PENDING.
    // Endpoint thực tế: PATCH /api/orders/:id/cancel
    const response = await axiosInstance.patch(`/orders/${orderId}/cancel`);
    return response.data;
  },

  // Reorder from a previous order
  reorderOrder: async (orderId, payload = {}) => {
    // UC-88: Đặt lại đơn dựa trên đơn cũ, backend sẽ kiểm tra tồn kho/địa chỉ/thanh toán.
    // Endpoint thực tế: POST /api/orders/:id/reorder
    const response = await axiosInstance.post(
      `/orders/${orderId}/reorder`,
      payload,
    );
    return response.data;
  },

  // Download invoice (returns HTML blob)
  downloadInvoice: async (orderId, download = true) => {
    // UC-89: Tải hoặc in hóa đơn (download=true => tải file, false => mở để in).
    // Endpoint thực tế: GET /api/orders/:id/invoice?download=true|false
    const response = await axiosInstance.get(`/orders/${orderId}/invoice`, {
      params: { download },
      responseType: "blob",
    });
    return response;
  },

  // Submit return / refund request
  submitReturnRefundRequest: async (orderId, payload) => {
    // UC-90: Gửi yêu cầu trả hàng/hoàn tiền trong thời hạn cho phép sau khi đã giao.
    // Endpoint thực tế: POST /api/orders/:id/return-refund
    const response = await axiosInstance.post(
      `/orders/${orderId}/return-refund`,
      payload,
    );
    return response.data;
  },

  // Confirm payment (for VNPAY callback)
  confirmPayment: async (queryParams) => {
    const response = await axiosInstance.get("/orders/payment/confirm", {
      params: queryParams,
    });
    return response.data;
  },
  getShipperFeedbacks: async () => {
    const response = await axiosInstance.get("/orders/admin/feedbacks");
    return response.data;
  },
  getShipperStats: async () => {
    const res = await axiosInstance.get("/orders/admin/shipper-stats");
    return res.data;
  },
};

export const adminOrderApi = {
  // UC-61: Lấy tất cả orders cho admin với filter status/date
  // UC-61: API lấy danh sách tất cả đơn hàng với bộ lọc (Admin)
  // Endpoint: GET /api/admin/orders
  // Query params: page, limit, status, paymentStatus, search, userId, fromDate, toDate
  // Mô tả: Gọi API backend để lấy danh sách orders với các bộ lọc và pagination
  // Trả về: { success: true, data: { orders: [...], pagination: {...} } }
  getAllOrders: async (params = {}) => {
    // Gửi GET request đến endpoint admin/orders với query params
    // params có thể bao gồm: page, limit, status, paymentStatus, search, userId, fromDate, toDate
    const response = await axiosInstance.get("/admin/orders", { params });

    // Trả về data từ response
    return response.data;
  },

  getRecentCustomerRequests: async (limit = 8) => {
    const response = await axiosInstance.get("/admin/orders/requests/recent", {
      params: { limit },
    });
    return response.data;
  },

  getOrderById: async (orderId) => {
    const response = await axiosInstance.get(`/admin/orders/${orderId}`);
    return response.data;
  },

  updateOrderStatus: async (orderId, status) => {
    const response = await axiosInstance.patch(
      `/admin/orders/${orderId}/status`,
      { status },
    );
    return response.data;
  },
  reviewReturnRefundRequest: async (orderId, payload) => {
    const response = await axiosInstance.patch(
      `/admin/orders/${orderId}/return-refund`,
      payload,
    );
    return response.data;
  },
  assignShipper: async (orderId, shipperId) => {
    const response = await axiosInstance.patch(
      `/orders/admin/orders/${orderId}/assign-shipper`,
      { shipperId },
    );
    return response.data;
  },

};
