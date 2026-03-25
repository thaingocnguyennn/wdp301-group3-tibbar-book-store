import { useEffect, useState } from "react";
import { notificationApi } from "../api/notificationApi";

export const useNotifications = () => {
    const [notifications, setNotifications] = useState([]);

    const fetchNotifications = async () => {
        const data = await notificationApi.getNotifications();
        console.log("FETCHED NOTIFICATIONS:", data); // ✅ log để kiểm tra
        setNotifications(data);
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 10000); // auto-refresh
        return () => clearInterval(interval);
    }, []);

    return { notifications, refetch: fetchNotifications };
};