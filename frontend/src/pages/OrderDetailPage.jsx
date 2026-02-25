import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { orderApi } from "../api/orderApi";

const OrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    fetchOrderDetail();
  }, [id]);

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await orderApi.getOrderById(id);
      setOrder(response.data.order);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load order detail");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order || order.orderStatus !== "PENDING") return;

    try {
      setIsCancelling(true);
      setError("");
      const response = await orderApi.cancelOrder(order._id);
      setOrder(response.data.order);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to cancel order");
    } finally {
      setIsCancelling(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>Loading order detail...</div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.error}>{error || "Order not found"}</div>
          <button
            style={styles.secondaryButton}
            onClick={() => navigate("/orders")}
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <button
            style={styles.secondaryButton}
            onClick={() => navigate("/orders")}
          >
            ← Back to Orders
          </button>
          <h1 style={styles.title}>Order Detail</h1>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.infoGrid}>
          <div>
            <strong>Order Number:</strong> {order.orderNumber}
          </div>
          <div>
            <strong>Created At:</strong>{" "}
            {new Date(order.createdAt).toLocaleString()}
          </div>
          <div>
            <strong>Payment Method:</strong> {order.paymentMethod}
          </div>
          <div>
            <strong>Payment Status:</strong>{" "}
            <span style={getPaymentStyle(order.paymentStatus)}>
              {order.paymentStatus}
            </span>
          </div>
          <div>
            <strong>Order Status:</strong>{" "}
            <span style={getOrderStyle(order.orderStatus)}>
              {order.orderStatus}
            </span>
          </div>
        </div>

        {order.shippingAddress && order.shippingAddress.fullName && (
          <>
            <h3 style={styles.sectionTitle}>📍 Shipping Address</h3>
            <div style={styles.addressBox}>
              <p style={styles.addressLine}>
                <strong>{order.shippingAddress.fullName}</strong>
                <span style={styles.addressPhone}>&nbsp;|&nbsp;{order.shippingAddress.phone}</span>
              </p>
              <p style={styles.addressLine}>
                {order.shippingAddress.description}, {order.shippingAddress.commune},&nbsp;
                {order.shippingAddress.district}, {order.shippingAddress.province}
              </p>
            </div>
          </>
        )}

        <h3 style={styles.sectionTitle}>Items</h3>
        <div style={styles.itemsTable}>
          <div style={styles.itemsHead}>
            <span>Book</span>
            <span>Qty</span>
            <span>Price</span>
            <span>Subtotal</span>
          </div>
          {order.items.map((item) => (
            <div
              key={`${item.book?._id || item.title}-${item.quantity}`}
              style={styles.itemsRow}
            >
              <span>{item.title}</span>
              <span>{item.quantity}</span>
              <span>{Number(item.price || 0).toLocaleString("vi-VN")}₫</span>
              <span>{Number(item.subtotal || 0).toLocaleString("vi-VN")}₫</span>
            </div>
          ))}
        </div>

        <h3 style={styles.sectionTitle}>Summary</h3>
        <div style={styles.summary}>
          <div style={styles.summaryRow}>
            <span>Subtotal</span>
            <strong>
              {Number(order.subtotal || 0).toLocaleString("vi-VN")}₫
            </strong>
          </div>
          <div style={styles.summaryRow}>
            <span>Discount</span>
            <strong>
              -{Number(order.discount || 0).toLocaleString("vi-VN")}₫
            </strong>
          </div>
          <div style={styles.summaryRow}>
            <span>Shipping Fee</span>
            <strong>
              {Number(order.shippingFee || 0).toLocaleString("vi-VN")}₫
            </strong>
          </div>
          <div style={styles.summaryTotal}>
            <span>Total</span>
            <strong>{Number(order.total || 0).toLocaleString("vi-VN")}₫</strong>
          </div>
        </div>

        {order.orderStatus === "PENDING" && (
          <div style={styles.cancelSection}>
            <button
              type="button"
              style={styles.dangerButton}
              onClick={handleCancelOrder}
              disabled={isCancelling}
            >
              {isCancelling ? "Cancelling..." : "Cancel Order"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const getOrderStyle = (status) => {
  const map = {
    PENDING: "#f39c12",
    PROCESSING: "#3498db",
    SHIPPED: "#2980b9",
    DELIVERED: "#27ae60",
    CANCELLED: "#e74c3c",
  };
  return { ...styles.badge, backgroundColor: map[status] || "#7f8c8d" };
};

const getPaymentStyle = (status) => {
  const map = {
    PENDING: "#f39c12",
    PAID: "#27ae60",
    FAILED: "#e74c3c",
    REFUNDED: "#7f8c8d",
  };
  return { ...styles.badge, backgroundColor: map[status] || "#7f8c8d" };
};

const styles = {
  container: {
    maxWidth: "1000px",
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
    display: "flex",
    alignItems: "center",
    gap: "1rem",
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
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "0.8rem",
    backgroundColor: "#f8f9fa",
    borderRadius: "10px",
    padding: "1rem",
    marginBottom: "1.2rem",
  },
  sectionTitle: {
    color: "#34495e",
    margin: "1rem 0 0.6rem",
  },
  itemsTable: {
    border: "1px solid #ecf0f1",
    borderRadius: "10px",
    overflow: "hidden",
  },
  itemsHead: {
    display: "grid",
    gridTemplateColumns: "2fr 0.7fr 1fr 1fr",
    gap: "0.75rem",
    backgroundColor: "#f7f9fc",
    padding: "0.75rem",
    fontWeight: 700,
    color: "#34495e",
  },
  itemsRow: {
    display: "grid",
    gridTemplateColumns: "2fr 0.7fr 1fr 1fr",
    gap: "0.75rem",
    padding: "0.75rem",
    borderTop: "1px solid #ecf0f1",
    color: "#2c3e50",
  },
  summary: {
    border: "1px solid #ecf0f1",
    borderRadius: "10px",
    padding: "0.8rem",
  },
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "0.5rem",
  },
  summaryTotal: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "0.7rem",
    paddingTop: "0.7rem",
    borderTop: "1px solid #ecf0f1",
    fontSize: "1.05rem",
  },
  addressBox: {
    backgroundColor: "#f8f9fa",
    border: "1px solid #dee2e6",
    borderRadius: "8px",
    padding: "0.85rem 1rem",
    marginBottom: "1.2rem",
  },
  addressLine: {
    margin: "0 0 0.3rem 0",
    color: "#2c3e50",
    fontSize: "0.9rem",
    lineHeight: 1.5,
  },
  addressPhone: {
    color: "#6c757d",
    fontSize: "0.88rem",
  },
  cancelSection: {
    marginTop: "1rem",
    display: "flex",
    justifyContent: "flex-end",
  },
  badge: {
    color: "#fff",
    borderRadius: "999px",
    fontSize: "0.75rem",
    fontWeight: 600,
    padding: "0.25rem 0.6rem",
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
    padding: "0.55rem 1rem",
    cursor: "pointer",
    fontWeight: 600,
  },
};

export default OrderDetailPage;
