import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const configuredApiUrl = Constants.expoConfig?.extra?.apiUrl;
const fallbackHost = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
const baseHost = (configuredApiUrl || fallbackHost).replace(/\/+$/, '');
const API_URL = `${baseHost}/api`;

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'X-Client-Platform': 'mobile',
  },
});

// Request interceptor to add JWT token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userData');
    }
    return Promise.reject(error);
  }
);

export default apiClient;
