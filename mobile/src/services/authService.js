import apiClient from '../utils/api';
import { AUTH_ENDPOINTS } from '../constants/endpoints';
import { Storage } from '../utils/storage';

export const AuthService = {
  async register(userData) {
    try {
      const response = await apiClient.post(AUTH_ENDPOINTS.REGISTER, userData);
      const { accessToken, user } = response.data.data;
      
      await Storage.setAuthToken(accessToken);
      await Storage.setUserData(user);
      
      return { user, accessToken };
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  async login(email, password) {
    try {
      const response = await apiClient.post(AUTH_ENDPOINTS.LOGIN, { email, password });
      const { accessToken, user } = response.data.data;
      
      await Storage.setAuthToken(accessToken);
      await Storage.setUserData(user);
      
      return { user, accessToken };
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  async logout() {
    try {
      await apiClient.post(AUTH_ENDPOINTS.LOGOUT);
      await Storage.clearAll();
      return true;
    } catch (error) {
      await Storage.clearAll();
      throw error;
    }
  },

  async refreshToken() {
    try {
      const response = await apiClient.post(AUTH_ENDPOINTS.REFRESH_TOKEN);
      const { accessToken } = response.data.data;
      
      await Storage.setAuthToken(accessToken);
      return { accessToken };
    } catch (error) {
      await Storage.clearAll();
      throw error.response?.data || error;
    }
  },
};
