import axiosInstance from "./axios.js";

export const supportSystemApi = {
  getIssueCatalog: async () => {
    const response = await axiosInstance.get("/support-system/issues");
    return response.data;
  },

  createTicket: async (payload) => {
    const response = await axiosInstance.post("/support-system/tickets", payload);
    return response.data;
  },

  getMyTicketHistory: async () => {
    const response = await axiosInstance.get("/support-system/tickets/history");
    return response.data;
  },

  getAdminTickets: async (params = {}) => {
    const response = await axiosInstance.get("/admin/support-system/tickets", { params });
    return response.data;
  },

  getAdminTicketHistory: async () => {
    const response = await axiosInstance.get("/admin/support-system/tickets/history");
    return response.data;
  },

  addAdminReply: async (ticketId, content) => {
    const response = await axiosInstance.post(`/admin/support-system/tickets/${ticketId}/replies`, {
      content,
    });
    return response.data;
  },

  updateAdminTicketStatus: async (ticketId, status, note = "") => {
    const response = await axiosInstance.patch(`/admin/support-system/tickets/${ticketId}/status`, {
      status,
      note,
    });
    return response.data;
  },
};
