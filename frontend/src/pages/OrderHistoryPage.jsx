import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { orderApi } from "../api/orderApi";

const OrderHistoryPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
    limit: 10,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState("");

  useEffect(() => {
    fetchOrders(1);
  }, []);

  const fetchOrders = async (page = 1) => {
    try {
      setLoading(true);
      setError("");
      const response = await orderApi.getUserOrders(page, pagination.limit);
      setOrders(response.data.orders || []);
      setPagination(
        response.data.pagination || {
          page: 1,
          totalPages: 1,
          total: 0,
          limit: 10,
        },
      );
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load order history");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    try {
      setActionLoadingId(orderId);
      setError("");
      await orderApi.cancelOrder(orderId);
      setOrders((prev) =>
        prev.map((order) =>
          order._id === orderId
            ? { ...order, orderStatus: "CANCELLED" }
            : order,
        ),
      );
    } catch (err) {
      setError(err.response?.data?.message || "Failed to cancel order");
    } finally {
      setActionLoadingId("");
    }
  };

  const goToPage = (newPage) => {
    if (newPage < 1 || newPage > (pagination.totalPages || 1)) return;
    fetchOrders(newPage);
  };

  const canCancel = (order) => order.orderStatus === "PENDING";

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>Loading order history...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>My Orders</h1>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        {orders.length === 0 ? (
          <div style={styles.empty}>You have no orders yet.</div>
        ) : (
          <>
            <div style={styles.list}>
              {orders.map((order) => (
                <div key={order._id} style={styles.item}>
                  <div style={styles.itemMain}>
                    <div style={styles.orderNumber}>{order.orderNumber}</div>
                    <div style={styles.meta}>
                      <span>{new Date(order.createdAt).toLocaleString()}</span>
                      <span style={styles.dot}>•</span>
                      <span>{order.paymentMethod}</span>
                    </div>
                  </div>

                  <div style={styles.itemRight}>
                    <div style={styles.total}>
                      {Number(order.total || 0).toLocaleString("vi-VN")}₫
                    </div>
                    <div style={styles.statusRow}>
                      <span style={getStatusStyle(order.orderStatus)}>
                        {order.orderStatus}
                      </span>
                      <span style={getPaymentStyle(order.paymentStatus)}>
                        {order.paymentStatus}
                      </span>
                    </div>
                  </div>

                  <div style={styles.actions}>
                    <button
                      type="button"
                      style={styles.secondaryButton}
                      onClick={() => navigate(`/orders/${order._id}`)}
                    >
                      View Detail
                    </button>
                    {canCancel(order) && (
                      <button
                        type="button"
                        style={styles.dangerButton}
                        disabled={actionLoadingId === order._id}
                        onClick={() => handleCancelOrder(order._id)}
                      >
                        {actionLoadingId === order._id
                          ? "Cancelling..."
                          : "Cancel Order"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div style={styles.pagination}>
              <button
                type="button"
                style={styles.pageButton}
                onClick={() => goToPage((pagination.page || 1) - 1)}
                disabled={(pagination.page || 1) <= 1}
              >
                Previous
              </button>
              <span style={styles.pageInfo}>
                Page {pagination.page || 1} / {pagination.totalPages || 1}
              </span>
              <button
                type="button"
                style={styles.pageButton}
                onClick={() => goToPage((pagination.page || 1) + 1)}
                disabled={
                  (pagination.page || 1) >= (pagination.totalPages || 1)
                }
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const getStatusStyle = (status) => {
  const map = {
    PENDING: "#f39c12",
    PROCESSING: "#3498db",
    SHIPPED: "#2980b9",
    DELIVERED: "#27ae60",
    CANCELLED: "#e74c3c",
  };

  return {
    ...styles.badge,
    backgroundColor: map[status] || "#7f8c8d",
  };
};

const getPaymentStyle = (status) => {
  const map = {
    PENDING: "#f39c12",
    PAID: "#27ae60",
    FAILED: "#e74c3c",
    REFUNDED: "#7f8c8d",
  };

  return {
    ...styles.badge,
    backgroundColor: map[status] || "#7f8c8d",
  };
};

const styles = {
  container: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "2rem",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
    padding: "1.5rem",
  },
  header: {
    marginBottom: "1rem",
  },
  title: {
    margin: 0,
    color: "#2c3e50",
  },
  error: {
    backgroundColor: "#ffe6e6",
    color: "#e74c3c",
    padding: "0.75rem",
    borderRadius: "8px",
    marginBottom: "1rem",
  },
  empty: {
    color: "#7f8c8d",
    padding: "1rem 0",
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  item: {
    border: "1px solid #ecf0f1",
    borderRadius: "10px",
    padding: "1rem",
    display: "grid",
    gridTemplateColumns: "1.3fr 1fr auto",
    alignItems: "center",
    gap: "1rem",
  },
  itemMain: {
    display: "flex",
    flexDirection: "column",
    gap: "0.4rem",
  },
  orderNumber: {
    fontWeight: 700,
    color: "#2c3e50",
  },
  meta: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    color: "#7f8c8d",
    fontSize: "0.9rem",
  },
  dot: {
    opacity: 0.7,
  },
  itemRight: {
    display: "flex",
    flexDirection: "column",
    gap: "0.4rem",
    alignItems: "flex-start",
  },
  total: {
    fontWeight: 700,
    color: "#2c3e50",
  },
  statusRow: {
    display: "flex",
    gap: "0.5rem",
    flexWrap: "wrap",
  },
  badge: {
    color: "#fff",
    borderRadius: "999px",
    fontSize: "0.75rem",
    fontWeight: 600,
    padding: "0.25rem 0.6rem",
  },
  actions: {
    display: "flex",
    gap: "0.5rem",
    justifyContent: "flex-end",
    flexWrap: "wrap",
  },
  secondaryButton: {
    border: "1px solid #667eea",
    color: "#667eea",
    backgroundColor: "#fff",
    borderRadius: "8px",
    padding: "0.45rem 0.8rem",
    cursor: "pointer",
    fontWeight: 600,
  },
  dangerButton: {
    border: "1px solid #e74c3c",
    color: "#fff",
    backgroundColor: "#e74c3c",
    borderRadius: "8px",
    padding: "0.45rem 0.8rem",
    cursor: "pointer",
    fontWeight: 600,
  },
  pagination: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "1rem",
    marginTop: "1.25rem",
  },
  pageButton: {
    border: "1px solid #ddd",
    backgroundColor: "#fff",
    borderRadius: "8px",
    padding: "0.45rem 0.8rem",
    cursor: "pointer",
  },
  pageInfo: {
    color: "#34495e",
    fontWeight: 600,
  },
};

export default OrderHistoryPage;
