import axiosInstance from './axios.js';

export const authApi = {
  register: async (userData) => {
    const response = await axiosInstance.post('/auth/register', userData);
    return response.data;
  },

  login: async (credentials) => {
    const response = await axiosInstance.post('/auth/login', credentials);
    return response.data;
  },

  googleLogin: async (data) => {
    const response = await axiosInstance.post('/auth/google-login', data);
    return response.data;
  },

  logout: async () => {
    const response = await axiosInstance.post('/auth/logout');
    return response.data;
  },

  refreshToken: async () => {
    const response = await axiosInstance.post('/auth/refresh');
    return response.data;
  },

  forgotPassword: async (data) => {
    const response = await axiosInstance.post('/auth/forgot-password', data);
    return response.data;
  },

  verifyOTP: async (data) => {
    const response = await axiosInstance.post('/auth/verify-otp', data);
    return response.data;
  },

  resetPassword: async (data) => {
    const response = await axiosInstance.post('/auth/reset-password', data);
    return response.data;
  }
};

export default authApi;