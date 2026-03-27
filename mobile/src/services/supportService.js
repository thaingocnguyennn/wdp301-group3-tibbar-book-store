import apiClient from '../utils/api';
import { SUPPORT_ENDPOINTS } from '../constants/endpoints';

export const SupportService = {
  async getConversations() {
    try {
      const response = await apiClient.get(SUPPORT_ENDPOINTS.GET_CONVERSATIONS);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  async getMessages(conversationId) {
    try {
      const url = SUPPORT_ENDPOINTS.GET_MESSAGES.replace(
        ':conversationId',
        conversationId
      );
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  async sendMessage(conversationId, message) {
    try {
      const response = await apiClient.post(SUPPORT_ENDPOINTS.SEND_MESSAGE, {
        conversationId,
        message,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  async createConversation(subject) {
    try {
      const response = await apiClient.post(SUPPORT_ENDPOINTS.CREATE_CONVERSATION, {
        subject,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};
