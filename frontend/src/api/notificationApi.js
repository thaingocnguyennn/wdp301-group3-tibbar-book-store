import axios from "axios";

const API_URL = "http://localhost:5000/api";

export const notificationApi = {
    getNotifications: async () => {
        const token = localStorage.getItem("accessToken"); // ✅ sửa token key
        if (!token) return [];

        try {
            const res = await axios.get(`${API_URL}/notifications`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return res.data.data || [];
        } catch (err) {
            console.error("Failed to fetch notifications:", err.response?.data || err);
            return [];
        }
    },

    markAsRead: async (id) => {
        const token = localStorage.getItem("accessToken"); // ✅ sửa token key
        if (!token) return;

        try {
            await axios.patch(
                `${API_URL}/notifications/${id}/read`,
                null,
                { headers: { Authorization: `Bearer ${token}` } }
            );
        } catch (err) {
            console.error("Failed to mark notification as read:", err.response?.data || err);
        }
    },
};