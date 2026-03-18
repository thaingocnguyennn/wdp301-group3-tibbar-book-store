import axiosInstance from './axios.js';

export const userApi = {
  getProfile: async () => {
    const response = await axiosInstance.get('/users/me');
    return response.data;
  },

  updateProfile: async (userData) => {
    const response = await axiosInstance.put('/users/me', userData);
    return response.data;
  },

  changePassword: async (currentPassword, newPassword) => {
    const response = await axiosInstance.put('/users/me/change-password', {
      currentPassword,
      newPassword
    });
    return response.data;
  }
};

export const adminUserApi = {
  getAllUsers: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.role) params.append('role', filters.role);
    if (filters.status) params.append('status', filters.status);
    if (filters.search) params.append('search', filters.search);
    
    const response = await axiosInstance.get(`/admin/users?${params.toString()}`);
    return response.data;
  },

  updateUserRole: async (userId, role) => {
    const response = await axiosInstance.put(`/admin/users/${userId}/role`, { role });
    return response.data;
  },

  toggleUserStatus: async (userId) => {
    const response = await axiosInstance.patch(`/admin/users/${userId}/toggle-status`);
    return response.data;
  }
};