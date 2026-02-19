import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { orderApi } from "../api/orderApi";

const OrderSuccessPage = () => {
  const { orderNumber } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [order, setOrder] = useState(location.state?.order || null);
  const [loading, setLoading] = useState(!location.state?.order);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!order && orderNumber) {
      fetchOrder();
    }
  }, [orderNumber, order]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const response = await orderApi.getOrderByNumber(orderNumber);
      setOrder(response.data.order);
    } catch (err) {
      console.error("Failed to fetch order:", err);
      setError("Failed to load order details");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading order details...</div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div style={styles.container}>
        <div style={styles.errorContainer}>
          <h2 style={styles.errorTitle}>❌ Order Not Found</h2>
          <p style={styles.errorText}>
            {error || "We couldn't find your order."}
          </p>
          <button style={styles.primaryButton} onClick={() => navigate("/")}>
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  const getPaymentStatusBadge = () => {
    const status = order.paymentStatus;
    const badges = {
      PENDING: { text: "⏳ Payment Pending", color: "#ffc107" },
      PAID: { text: "✅ Paid", color: "#28a745" },
      FAILED: { text: "❌ Payment Failed", color: "#dc3545" },
      REFUNDED: { text: "💰 Refunded", color: "#6c757d" },
    };
    const badge = badges[status] || badges.PENDING;
    return (
      <span style={{ ...styles.badge, backgroundColor: badge.color }}>
        {badge.text}
      </span>
    );
  };

  const getOrderStatusBadge = () => {
    const status = order.orderStatus;
    const badges = {
      PENDING: { text: "⏳ Pending", color: "#ffc107" },
      PROCESSING: { text: "📦 Processing", color: "#17a2b8" },
      SHIPPED: { text: "🚚 Shipped", color: "#007bff" },
      DELIVERED: { text: "✅ Delivered", color: "#28a745" },
      CANCELLED: { text: "❌ Cancelled", color: "#dc3545" },
    };
    const badge = badges[status] || badges.PENDING;
    return (
      <span style={{ ...styles.badge, backgroundColor: badge.color }}>
        {badge.text}
      </span>
    );
  };

  return (
    <div style={styles.container}>
      <div style={styles.successCard}>
        {/* Success Header */}
        <div style={styles.successHeader}>
          <div style={styles.successIcon}>✅</div>
          <h1 style={styles.successTitle}>Order Placed Successfully!</h1>
          <p style={styles.successSubtitle}>
            Thank you for your purchase. Your order has been received.
          </p>
        </div>

        {/* Order Info */}
        <div style={styles.orderInfo}>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Order Number:</span>
            <strong style={styles.infoValue}>{order.orderNumber}</strong>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Payment Method:</span>
            <strong style={styles.infoValue}>
              {order.paymentMethod === "COD"
                ? "Cash on Delivery"
                : order.paymentMethod}
            </strong>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Payment Status:</span>
            {getPaymentStatusBadge()}
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Order Status:</span>
            {getOrderStatusBadge()}
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Order Date:</span>
            <span style={styles.infoValue}>
              {new Date(order.createdAt).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Order Items */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>📦 Order Items</h2>
          <div style={styles.items}>
            {order.items.map((item) => (
              <div key={item.book?._id || item._id} style={styles.item}>
                <div style={styles.itemInfo}>
                  <span style={styles.itemTitle}>{item.title}</span>
                  <span style={styles.itemAuthor}>by {item.author}</span>
                  <span style={styles.itemPrice}>
                    {item.price.toLocaleString("vi-VN")}₫ x {item.quantity}
                  </span>
                </div>
                <div style={styles.itemSubtotal}>
                  {item.subtotal.toLocaleString("vi-VN")}₫
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>💰 Order Summary</h2>
          <div style={styles.summary}>
            <div style={styles.summaryRow}>
              <span>Subtotal</span>
              <span>{order.subtotal.toLocaleString("vi-VN")}₫</span>
            </div>
            <div style={styles.summaryRow}>
              <span>Discount</span>
              <span>-{order.discount.toLocaleString("vi-VN")}₫</span>
            </div>
            <div style={styles.summaryRow}>
              <span>Shipping Fee</span>
              <span>
                {order.shippingFee === 0
                  ? "Free"
                  : `${order.shippingFee.toLocaleString("vi-VN")}₫`}
              </span>
            </div>
            <div style={styles.summaryDivider}></div>
            <div style={styles.summaryTotal}>
              <strong>Total</strong>
              <strong>{order.total.toLocaleString("vi-VN")}₫</strong>
            </div>
          </div>
        </div>

        {/* Payment Instructions (for COD) */}
        {order.paymentMethod === "COD" && order.paymentStatus === "PENDING" && (
          <div style={styles.infoBox}>
            <h3 style={styles.infoBoxTitle}>💵 Payment Instructions</h3>
            <p style={styles.infoBoxText}>
              You have selected Cash on Delivery. Please prepare the exact
              amount of <strong>{order.total.toLocaleString("vi-VN")}₫</strong>{" "}
              to pay when you receive your order.
            </p>
          </div>
        )}

        {/* Notes */}
        {order.notes && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>📝 Order Notes</h2>
            <p style={styles.notes}>{order.notes}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div style={styles.actions}>
          <button
            style={styles.primaryButton}
            onClick={() => navigate("/orders")}
          >
            View My Orders
          </button>
          <button style={styles.secondaryButton} onClick={() => navigate("/")}>
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: "800px",
    margin: "2rem auto",
    padding: "0 1rem",
    minHeight: "80vh",
  },
  loading: {
    textAlign: "center",
    padding: "4rem",
    fontSize: "1.2rem",
    color: "#7f8c8d",
  },
  errorContainer: {
    backgroundColor: "#fff",
    padding: "3rem",
    borderRadius: "16px",
    boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
    textAlign: "center",
  },
  errorTitle: {
    fontSize: "2rem",
    color: "#dc3545",
    margin: "0 0 1rem 0",
  },
  errorText: {
    color: "#6c757d",
    marginBottom: "2rem",
  },
  successCard: {
    backgroundColor: "#fff",
    borderRadius: "16px",
    boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
    overflow: "hidden",
  },
  successHeader: {
    backgroundColor: "#f0f8ff",
    padding: "3rem 2rem",
    textAlign: "center",
    borderBottom: "1px solid #e9ecef",
  },
  successIcon: {
    fontSize: "4rem",
    marginBottom: "1rem",
  },
  successTitle: {
    fontSize: "2rem",
    color: "#28a745",
    margin: "0 0 0.5rem 0",
  },
  successSubtitle: {
    color: "#6c757d",
    fontSize: "1.1rem",
    margin: 0,
  },
  orderInfo: {
    padding: "2rem",
    backgroundColor: "#f8f9fa",
    borderBottom: "1px solid #e9ecef",
  },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0.75rem 0",
    borderBottom: "1px solid #dee2e6",
  },
  infoLabel: {
    color: "#6c757d",
    fontSize: "0.95rem",
  },
  infoValue: {
    color: "#2c3e50",
    fontSize: "0.95rem",
  },
  badge: {
    padding: "0.35rem 0.75rem",
    borderRadius: "20px",
    color: "#fff",
    fontSize: "0.85rem",
    fontWeight: "600",
  },
  section: {
    padding: "2rem",
    borderBottom: "1px solid #e9ecef",
  },
  sectionTitle: {
    fontSize: "1.3rem",
    color: "#2c3e50",
    marginTop: 0,
    marginBottom: "1.5rem",
  },
  items: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  item: {
    display: "flex",
    justifyContent: "space-between",
    padding: "1rem",
    backgroundColor: "#f8f9fa",
    borderRadius: "8px",
  },
  itemInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
  },
  itemTitle: {
    fontWeight: "600",
    color: "#2c3e50",
  },
  itemAuthor: {
    fontSize: "0.9rem",
    color: "#6c757d",
  },
  itemPrice: {
    fontSize: "0.85rem",
    color: "#495057",
  },
  itemSubtotal: {
    fontWeight: "700",
    fontSize: "1.1rem",
    color: "#2c3e50",
  },
  summary: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    color: "#495057",
  },
  summaryDivider: {
    height: "1px",
    backgroundColor: "#dee2e6",
    margin: "0.5rem 0",
  },
  summaryTotal: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "1.3rem",
    color: "#2c3e50",
  },
  infoBox: {
    margin: "2rem",
    padding: "1.5rem",
    backgroundColor: "#fff3cd",
    border: "1px solid #ffc107",
    borderRadius: "8px",
  },
  infoBoxTitle: {
    fontSize: "1.1rem",
    color: "#856404",
    marginTop: 0,
    marginBottom: "0.75rem",
  },
  infoBoxText: {
    color: "#856404",
    margin: 0,
    lineHeight: 1.6,
  },
  notes: {
    backgroundColor: "#f8f9fa",
    padding: "1rem",
    borderRadius: "8px",
    color: "#495057",
    margin: 0,
    lineHeight: 1.6,
  },
  actions: {
    padding: "2rem",
    display: "flex",
    gap: "1rem",
    justifyContent: "center",
  },
  primaryButton: {
    backgroundColor: "#667eea",
    color: "#fff",
    border: "none",
    padding: "0.9rem 1.8rem",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "#fff",
    color: "#667eea",
    border: "2px solid #667eea",
    padding: "0.9rem 1.8rem",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: "600",
  },
};

export default OrderSuccessPage;
