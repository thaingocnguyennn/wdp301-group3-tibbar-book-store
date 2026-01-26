import axiosInstance from './axios.js';

export const userApi = {
  getProfile: async () => {
    const response = await axiosInstance.get('/users/me');
    return response.data;
  },

  updateProfile: async (userData) => {
    const response = await axiosInstance.put('/users/me', userData);
    return response.data;
  }
};