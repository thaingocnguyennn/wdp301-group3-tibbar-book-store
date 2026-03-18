import axiosInstance from './axios.js';

export const shipperApi = {
  // Get shipper dashboard with statistics
  getDashboard: async () => {
    const response = await axiosInstance.get('/shipper/dashboard');
    return response.data;
  },

  // Get shipper profile with statistics
  getProfile: async () => {
    const response = await axiosInstance.get('/shipper/profile');
    return response.data;
  },

  // Get all orders assigned to shipper
  getOrders: async (params = {}) => {
    const response = await axiosInstance.get('/shipper/orders', { params });
    return response.data;
  },

  // Get order details with address
  getOrderDetails: async (orderId) => {
    const response = await axiosInstance.get(`/shipper/orders/${orderId}`);
    return response.data;
  },

  // Update order status
  updateOrderStatus: async (orderId, status) => {
    const response = await axiosInstance.put(`/shipper/orders/${orderId}/status`, { status });
    return response.data;
  },
  respondAssignment: async (orderId, action) => {
    const response = await axiosInstance.post(
      `/shipper/orders/${orderId}/respond`,
      { action }
    );
    return response.data;
  },
  uploadDeliveryProof: async (orderId, formData) => {
    const response = await axiosInstance.post(
      `/shipper/orders/${orderId}/upload-proof`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      }
    );
    return response.data;
  },
  // Get assignment history
  getAssignmentHistory: async () => {
  const response = await axiosInstance.get("/shipper/assignment-history");
  return response.data;
},
};
