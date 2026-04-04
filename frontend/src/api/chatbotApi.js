import axiosInstance from "./axios";

export const chatbotApi = {
  ask: async (payload) => {
    // API frontend cho chatbot.
    // Endpoint thực tế: POST /api/chatbot/ask
    // payload gồm: message, messages (history), context (page/auth/role).
    const response = await axiosInstance.post("/chatbot/ask", payload);
    return response.data;
  },
};
