import axiosInstance from "./axios";

export const chatbotApi = {
  ask: async (payload) => {
    // UC-128: API frontend cho chatbot.
    // Endpoint thực tế: POST /api/chatbot/ask
    // payload gồm: message, messages (history), context (page/auth/role)
    // để bot tự động gợi ý thông tin cơ bản theo ngữ cảnh khách hàng.
    const response = await axiosInstance.post("/chatbot/ask", payload);
    return response.data;
  },
};
