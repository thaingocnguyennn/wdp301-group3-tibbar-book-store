import Constants from 'expo-constants';
import { Platform } from 'react-native';

const configuredApiUrl = Constants.expoConfig?.extra?.apiUrl;
const fallbackHost =
  Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
const baseHost = (configuredApiUrl || fallbackHost).replace(/\/+$/, '');

export const resolveImageUrl = (path) => {
  if (!path) return '';
  if (String(path).startsWith('http')) return path;
  return `${baseHost}/${String(path).replace(/^\/+/, '')}`;
};

export const formatCurrencyVND = (value) => {
  const amount = Number(value || 0);
  return `${amount.toLocaleString('vi-VN')}₫`;
};
