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

  // Get user's orders
  getUserOrders: async (page = 1, limit = 10) => {
    const response = await axiosInstance.get("/orders", {
      params: { page, limit },
    });
    return response.data;
  },

  // Get order by ID
  getOrderById: async (orderId) => {
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
    const response = await axiosInstance.patch(`/orders/${orderId}/cancel`);
    return response.data;
  },

  // Confirm payment (for VNPAY callback)
  confirmPayment: async (queryParams) => {
    const response = await axiosInstance.get("/orders/payment/confirm", {
      params: queryParams,
    });
    return response.data;
  },

  // Confirm VietQR payment manually (Admin only)
  confirmVietQRPayment: async (orderNumber) => {
    const response = await axiosInstance.post(`/orders/vietqr/confirm/${orderNumber}`);
    return response.data;
  },

  // Generate VietQR payment QR code (secure - amount from server)
  generateVietQRPayment: async (orderId) => {
    const response = await axiosInstance.post("/payments/vietqr/create", { orderId });
    return response.data;
  },

  // Get VietQR payment details (idempotent - for refresh)
  getVietQRPayment: async (orderId) => {
    const response = await axiosInstance.get(`/payments/vietqr/${orderId}`);
    return response.data;
  },
};
