import { notificationApi } from "../../api/notificationApi";
import { useNotifications } from "../../hooks/useNotifications";
import { FiBell, FiCheck } from "react-icons/fi";

const NotificationPage = () => {
  const { notifications, refetch } = useNotifications();

  const handleRead = async (id) => {
    await notificationApi.markAsRead(id);
    refetch();
  };

  return (
    <div className="notification-page">
      <h1>Notifications</h1>

      {notifications.length === 0 ? (
        <p className="no-noti">No notifications</p>
      ) : (
        <div className="noti-list">
          {notifications.map((noti) => (
            <div
              key={noti._id}
              onClick={() => handleRead(noti._id)}
              className={`noti-item ${noti.isRead ? "read" : "unread"}`}
            >
              <div className="noti-icon">
                {noti.isRead ? <FiCheck /> : <FiBell />}
              </div>
              <div className="noti-content">
                <p className="noti-title">{noti.title}</p>
                <p className="noti-message">{noti.message}</p>
                <p className="noti-time">
                  {new Date(noti.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .notification-page {
          max-width: 600px;
          margin: 2rem auto;
          padding: 1rem 2rem;
          background: #f9fafb;
          border-radius: 12px;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.05);
        }

        h1 {
          font-size: 2rem;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 1.5rem;
          text-align: center;
        }

        .no-noti {
          text-align: center;
          color: #9ca3af;
          font-size: 1rem;
          margin-top: 4rem;
        }

        .noti-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .noti-item {
          display: flex;
          gap: 1rem;
          padding: 1rem;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s ease-in-out;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
        }

        .noti-item.unread {
          background-color: #fef3c7;
        }

        .noti-item.unread:hover {
          background-color: #fde68a;
        }

        .noti-item.read {
          background-color: #f3f4f6;
        }

        .noti-item.read:hover {
          background-color: #e5e7eb;
        }

        .noti-icon {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
        }

        .noti-icon svg {
          width: 1.5rem;
          height: 1.5rem;
        }

        .noti-icon .text-green-500 {
          color: #10b981;
        }

        .noti-icon .text-yellow-700 {
          color: #b45309;
          animation: pulse 2s infinite;
        }

        .noti-content {
          flex: 1;
        }

        .noti-title {
          font-weight: 600;
          color: #111827;
          margin-bottom: 0.25rem;
        }

        .noti-message {
          color: #374151;
          font-size: 0.95rem;
        }

        .noti-time {
          font-size: 0.8rem;
          color: #9ca3af;
          margin-top: 0.25rem;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.6;
          }
        }
      `}</style>
    </div>
  );
};

export default NotificationPage;