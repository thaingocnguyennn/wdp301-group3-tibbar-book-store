import AsyncStorage from '@react-native-async-storage/async-storage';

export const StorageKeys = {
  AUTH_TOKEN: 'authToken',
  USER_DATA: 'userData',
  CART: 'cart',
};

export const Storage = {
  async setAuthToken(token) {
    try {
      await AsyncStorage.setItem(StorageKeys.AUTH_TOKEN, token);
    } catch (error) {
      console.error('Error saving auth token:', error);
    }
  },

  async getAuthToken() {
    try {
      return await AsyncStorage.getItem(StorageKeys.AUTH_TOKEN);
    } catch (error) {
      console.error('Error retrieving auth token:', error);
      return null;
    }
  },

  async clearAuthToken() {
    try {
      await AsyncStorage.removeItem(StorageKeys.AUTH_TOKEN);
    } catch (error) {
      console.error('Error clearing auth token:', error);
    }
  },

  async setUserData(userData) {
    try {
      await AsyncStorage.setItem(StorageKeys.USER_DATA, JSON.stringify(userData));
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  },

  async getUserData() {
    try {
      const data = await AsyncStorage.getItem(StorageKeys.USER_DATA);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error retrieving user data:', error);
      return null;
    }
  },

  async clearUserData() {
    try {
      await AsyncStorage.removeItem(StorageKeys.USER_DATA);
    } catch (error) {
      console.error('Error clearing user data:', error);
    }
  },

  async setCart(cartData) {
    try {
      await AsyncStorage.setItem(StorageKeys.CART, JSON.stringify(cartData));
    } catch (error) {
      console.error('Error saving cart:', error);
    }
  },

  async getCart() {
    try {
      const data = await AsyncStorage.getItem(StorageKeys.CART);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error retrieving cart:', error);
      return [];
    }
  },

  async clearCart() {
    try {
      await AsyncStorage.removeItem(StorageKeys.CART);
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  },

  async clearAll() {
    try {
      await AsyncStorage.multiRemove([
        StorageKeys.AUTH_TOKEN,
        StorageKeys.USER_DATA,
        StorageKeys.CART,
      ]);
    } catch (error) {
      console.error('Error clearing all storage:', error);
    }
  },
};
