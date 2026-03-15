import axiosInstance from "./axios.js";

export const supportApi = {
  getMyConversation: async () => {
    const response = await axiosInstance.get("/support/conversation");
    return response.data;
  },

  sendMyMessage: async (content) => {
    const response = await axiosInstance.post("/support/messages", { content });
    return response.data;
  },

  getAdminConversations: async () => {
    const response = await axiosInstance.get("/admin/support/conversations");
    return response.data;
  },

  getAdminConversationMessages: async (conversationId) => {
    const response = await axiosInstance.get(
      `/admin/support/conversations/${conversationId}/messages`,
    );
    return response.data;
  },

  sendAdminMessage: async (conversationId, content) => {
    const response = await axiosInstance.post(
      `/admin/support/conversations/${conversationId}/messages`,
      { content },
    );
    return response.data;
  },

  getAdminUnreadSummary: async () => {
    const response = await axiosInstance.get("/admin/support/unread-summary");
    return response.data;
  },
};
