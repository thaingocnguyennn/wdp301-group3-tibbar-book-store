import apiClient from '../utils/api';
import { USER_ENDPOINTS } from '../constants/endpoints';

export const UserService = {
  async getProfile() {
    try {
      const response = await apiClient.get(USER_ENDPOINTS.GET_PROFILE);
      return response.data?.data?.user || response.data?.data || null;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  async updateProfile(userData) {
    try {
      const response = await apiClient.put(USER_ENDPOINTS.UPDATE_PROFILE, userData);
      return response.data?.data?.user || response.data?.data || null;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  async changePassword(oldPassword, newPassword) {
    try {
      const response = await apiClient.put(USER_ENDPOINTS.CHANGE_PASSWORD, {
        currentPassword: oldPassword,
        newPassword,
      });
      return response.data?.data || response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  async getAddresses() {
    try {
      const response = await apiClient.get(USER_ENDPOINTS.GET_ADDRESSES);
      return response.data?.data || response.data || [];
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  async addAddress(addressData) {
    try {
      const response = await apiClient.post(USER_ENDPOINTS.ADD_ADDRESS, addressData);
      return response.data?.data || response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  async updateAddress(addressId, addressData) {
    try {
      const url = USER_ENDPOINTS.UPDATE_ADDRESS.replace(':addressId', addressId);
      const response = await apiClient.put(url, addressData);
      return response.data?.data || response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  async deleteAddress(addressId) {
    try {
      const url = USER_ENDPOINTS.DELETE_ADDRESS.replace(':addressId', addressId);
      const response = await apiClient.delete(url);
      return response.data?.data || response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};
