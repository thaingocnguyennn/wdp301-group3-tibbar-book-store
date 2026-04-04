import axiosInstance from './axios';

const BASE_URL = '/coins';

export const coinApi = {
  // Daily check-in
  checkIn: async () => {
    const response = await axiosInstance.post(`${BASE_URL}/check-in`);
    return response.data;
  },

  // Get coin status
  getCoinStatus: async () => {
    const response = await axiosInstance.get(`${BASE_URL}/status`);
    return response.data;
  },

  // Get transaction history
  getTransactionHistory: async (page = 1, limit = 20) => {
    const response = await axiosInstance.get(`${BASE_URL}/transactions`, {
      params: { page, limit }
    });
    return response.data;
  }
};

export default coinApi;
