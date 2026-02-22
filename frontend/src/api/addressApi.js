import axiosInstance from './axios.js';

export const addressApi = {
  // Get all addresses
  getAddresses: async () => {
    const response = await axiosInstance.get('/addresses');
    return response.data;
  },

  // Add new address
  addAddress: async (addressData) => {
    const response = await axiosInstance.post('/addresses', addressData);
    return response.data;
  },

  // Update address
  updateAddress: async (addressId, addressData) => {
    const response = await axiosInstance.put(`/addresses/${addressId}`, addressData);
    return response.data;
  },

  // Delete address
  deleteAddress: async (addressId) => {
    const response = await axiosInstance.delete(`/addresses/${addressId}`);
    return response.data;
  },

  // Set default address
  setDefaultAddress: async (addressId) => {
    const response = await axiosInstance.patch(`/addresses/${addressId}/default`);
    return response.data;
  }
};
