import axiosInstance from "./axios";

export const chatbotApi = {
  ask: async (payload) => {
    const response = await axiosInstance.post("/chatbot/ask", payload);
    return response.data;
  },
};
