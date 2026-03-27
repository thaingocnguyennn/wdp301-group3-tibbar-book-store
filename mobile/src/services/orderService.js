import apiClient from '../utils/api';
import { ORDER_ENDPOINTS, VOUCHER_ENDPOINTS } from '../constants/endpoints';

export const OrderService = {
  async getOrders(page = 1, limit = 10) {
    try {
      const response = await apiClient.get(ORDER_ENDPOINTS.GET_ALL, {
        params: { page, limit },
      });
      const orders = response.data?.data?.orders || [];
      return orders.map((order) => ({
        ...order,
        status: order.orderStatus || order.status,
        totalAmount: order.total ?? order.totalAmount ?? 0,
      }));
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  async getOrderById(orderId) {
    try {
      const url = ORDER_ENDPOINTS.GET_BY_ID.replace(':id', orderId);
      const response = await apiClient.get(url);
      const order = response.data?.data?.order || null;

      if (!order) return null;

      return {
        ...order,
        status: order.orderStatus || order.status,
        totalAmount: order.total ?? order.totalAmount ?? 0,
        addressId: order.shippingAddress || order.addressId,
        items: (order.items || []).map((item) => ({
          ...item,
          bookId: item.book || item.bookId,
        })),
      };
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  async createOrder(orderData) {
    try {
      const response = await apiClient.post(ORDER_ENDPOINTS.CREATE, orderData);
      return response.data?.data || response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  async cancelOrder(orderId) {
    try {
      const url = ORDER_ENDPOINTS.CANCEL.replace(':id', orderId);
      const response = await apiClient.patch(url);
      return response.data?.data || response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  async validateVoucher(voucherCode) {
    try {
      const response = await apiClient.post(ORDER_ENDPOINTS.VALIDATE_VOUCHER, {
        voucherCode,
      });
      return response.data?.data || response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  async getVouchers() {
    try {
      const response = await apiClient.get(VOUCHER_ENDPOINTS.GET_ALL);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};
