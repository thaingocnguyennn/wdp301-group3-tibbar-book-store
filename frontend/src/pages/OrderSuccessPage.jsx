import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { orderApi } from "../api/orderApi";

const PAYMENT_STATUS_CONFIG = {
  PENDING: { icon: "○", label: "Payment Pending", bg: "#fff8e1", color: "#d97706", border: "#fcd34d" },
  PAID: { icon: "●", label: "Paid", bg: "#dcfce7", color: "#16a34a", border: "#86efac" },
  FAILED: { icon: "!", label: "Payment Failed", bg: "#fee2e2", color: "#dc2626", border: "#fca5a5" },
  REFUNDED: { icon: "↩", label: "Refunded", bg: "#f3f4f6", color: "#6b7280", border: "#d1d5db" },
};

const ORDER_STATUS_CONFIG = {
  PENDING: { icon: "⏳", label: "Pending", bg: "#fff8e1", color: "#f59e0b", border: "#fcd34d" },
  PROCESSING: { icon: "📦", label: "Processing", bg: "#e0f2fe", color: "#0284c7", border: "#7dd3fc" },
  SHIPPED: { icon: "🚚", label: "Shipped", bg: "#e0e7ff", color: "#4f46e5", border: "#a5b4fc" },
  DELIVERED: { icon: "✅", label: "Delivered", bg: "#dcfce7", color: "#16a34a", border: "#86efac" },
  CANCELLED: { icon: "✕", label: "Cancelled", bg: "#fee2e2", color: "#dc2626", border: "#fca5a5" },
};

const PAYMENT_METHOD_LABELS = {
  COD: "Cash on Delivery",
  VNPAY: "VNPay Online Payment",
};

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
        <div style={styles.loadingContainer}>
          <div style={styles.spinner} />
          <p style={styles.loadingText}>Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div style={styles.container}>
        <div style={styles.errorCard}>
          <div style={styles.errorIconBig}>⚠</div>
          <h2 style={styles.errorTitle}>Order Not Found</h2>
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

  const paymentConfig = PAYMENT_STATUS_CONFIG[order.paymentStatus] || PAYMENT_STATUS_CONFIG.PENDING;
  const statusConfig = ORDER_STATUS_CONFIG[order.orderStatus] || ORDER_STATUS_CONFIG.PENDING;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* ─── Success Header ─── */}
        <div style={styles.header}>
          <div style={styles.successCircle}>
            <span style={styles.successCheck}>✓</span>
          </div>
          <h1 style={styles.successTitle}>Order Placed Successfully!</h1>
          <p style={styles.successSubtitle}>
            Thank you for your purchase. Your order has been received and is being processed.
          </p>
        </div>

        {/* ─── Order Info Grid ─── */}
        <div style={styles.infoSection}>
          <div style={styles.infoGrid}>
            <div style={styles.infoItem}>
              <span style={styles.infoItemLabel}>Order Number</span>
              <span style={styles.infoItemValueMono}>{order.orderNumber}</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoItemLabel}>Order Date</span>
              <span style={styles.infoItemValue}>
                {new Date(order.createdAt).toLocaleDateString("vi-VN", {
                  day: "2-digit", month: "2-digit", year: "numeric",
                })}
              </span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoItemLabel}>Payment Method</span>
              <span style={styles.infoItemValue}>
                {PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod}
              </span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoItemLabel}>Total Amount</span>
              <span style={styles.infoItemValueTotal}>
                {order.total.toLocaleString("vi-VN")}₫
              </span>
            </div>
          </div>

          {/* Status Badges */}
          <div style={styles.statusRow}>
            <span
              style={{
                ...styles.statusBadge,
                backgroundColor: statusConfig.bg,
                color: statusConfig.color,
                borderColor: statusConfig.border,
              }}
            >
              <span>{statusConfig.icon}</span> {statusConfig.label}
            </span>
            <span
              style={{
                ...styles.statusBadge,
                backgroundColor: paymentConfig.bg,
                color: paymentConfig.color,
                borderColor: paymentConfig.border,
              }}
            >
              <span>{paymentConfig.icon}</span> {paymentConfig.label}
            </span>
          </div>
        </div>

        {/* ─── Shipping Address ─── */}
        {order.shippingAddress && order.shippingAddress.fullName && (
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>
              <span style={styles.sectionIcon}>📍</span>
              Shipping Address
            </h3>
            <div style={styles.addressBox}>
              <div style={styles.addressNameRow}>
                <strong style={styles.addressName}>{order.shippingAddress.fullName}</strong>
                <span style={styles.addressDivider}>|</span>
                <span style={styles.addressPhone}>{order.shippingAddress.phone}</span>
              </div>
              <p style={styles.addressDetail}>
                {order.shippingAddress.description}, {order.shippingAddress.commune},&nbsp;
                {order.shippingAddress.district}, {order.shippingAddress.province}
              </p>
            </div>
          </div>
        )}

        {/* ─── Order Items ─── */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>
            <span style={styles.sectionIcon}>🛍</span>
            Order Items
            <span style={styles.itemCount}>{order.items.length} item{order.items.length > 1 ? "s" : ""}</span>
          </h3>
          <div style={styles.itemsList}>
            {order.items.map((item) => (
              <div key={item.book?._id || item._id} style={styles.itemCard}>
                <div style={styles.itemInfo}>
                  <span style={styles.itemTitle}>{item.title}</span>
                  <span style={styles.itemAuthor}>by {item.author}</span>
                  <span style={styles.itemPriceQty}>
                    {item.price.toLocaleString("vi-VN")}₫ × {item.quantity}
                  </span>
                </div>
                <div style={styles.itemSubtotal}>
                  {item.subtotal.toLocaleString("vi-VN")}₫
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Price Summary ─── */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>
            <span style={styles.sectionIcon}>💰</span>
            Price Summary
          </h3>
          <div style={styles.summaryBox}>
            <div style={styles.summaryRow}>
              <span style={styles.summaryLabel}>Subtotal</span>
              <span style={styles.summaryValue}>{order.subtotal.toLocaleString("vi-VN")}₫</span>
            </div>
            <div style={styles.summaryRow}>
              <span style={styles.summaryLabel}>Discount</span>
              <span style={{ ...styles.summaryValue, color: "#ef4444" }}>
                -{order.discount.toLocaleString("vi-VN")}₫
              </span>
            </div>
            {order.coinsUsed > 0 && (
              <div style={styles.summaryRow}>
                <span style={styles.summaryLabel}>💰 Coin Discount</span>
                <span style={{ ...styles.summaryValue, color: "#f39c12" }}>
                  -{order.coinsUsed.toLocaleString("vi-VN")}₫
                </span>
              </div>
            )}
            <div style={styles.summaryRow}>
              <span style={styles.summaryLabel}>Shipping Fee</span>
              <span style={styles.summaryValue}>
                {order.shippingFee === 0 ? (
                  <span style={{ color: "#16a34a", fontWeight: 600 }}>Free</span>
                ) : (
                  `${order.shippingFee.toLocaleString("vi-VN")}₫`
                )}
              </span>
            </div>
            <div style={styles.summaryDivider} />
            <div style={styles.summaryTotalRow}>
              <span style={styles.summaryTotalLabel}>Total</span>
              <span style={styles.summaryTotalValue}>
                {order.total.toLocaleString("vi-VN")}₫
              </span>
            </div>
          </div>
        </div>

        {/* ─── COD Payment Instructions ─── */}
        {order.paymentMethod === "COD" && order.paymentStatus === "PENDING" && (
          <div style={styles.codInfoBox}>
            <div style={styles.codInfoIcon}>💵</div>
            <div>
              <h4 style={styles.codInfoTitle}>Payment Instructions</h4>
              <p style={styles.codInfoText}>
                You selected Cash on Delivery. Please prepare the exact amount of{" "}
                <strong>{order.total.toLocaleString("vi-VN")}₫</strong> when you receive your order.
              </p>
            </div>
          </div>
        )}

        {/* ─── Coin Savings Info ─── */}
        {order.coinsUsed > 0 && (
          <div style={styles.coinSavingsBox}>
            <div style={styles.coinSavingsIcon}>🎉</div>
            <div>
              <h4 style={styles.coinSavingsTitle}>Coins Applied!</h4>
              <p style={styles.coinSavingsText}>
                You saved <strong>{order.coinsUsed.toLocaleString("vi-VN")}₫</strong> using your coin balance on this order.
              </p>
            </div>
          </div>
        )}

        {/* ─── Notes ─── */}
        {order.notes && (
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>
              <span style={styles.sectionIcon}>📝</span>
              Order Notes
            </h3>
            <p style={styles.notesText}>{order.notes}</p>
          </div>
        )}

        {/* ─── Actions ─── */}
        <div style={styles.actions}>
          <button style={styles.primaryButton} onClick={() => navigate("/orders")}>
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
  /* ─── Layout ─── */
  container: {
    maxWidth: "780px",
    margin: "2rem auto",
    padding: "0 1.5rem",
    minHeight: "80vh",
  },

  /* ─── Loading ─── */
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "5rem 0",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "4px solid #e2e8f0",
    borderTopColor: "#667eea",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
    marginBottom: "1rem",
  },
  loadingText: {
    color: "#94a3b8",
    fontSize: "0.95rem",
  },

  /* ─── Error ─── */
  errorCard: {
    textAlign: "center",
    padding: "4rem 2rem",
    backgroundColor: "#fff",
    borderRadius: "16px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 6px 24px rgba(0,0,0,0.04)",
  },
  errorIconBig: {
    fontSize: "3.5rem",
    marginBottom: "1rem",
  },
  errorTitle: {
    fontSize: "1.35rem",
    color: "#dc2626",
    fontWeight: 700,
    margin: "0 0 0.5rem",
  },
  errorText: {
    color: "#94a3b8",
    marginBottom: "2rem",
    fontSize: "0.95rem",
  },

  /* ─── Card ─── */
  card: {
    backgroundColor: "#fff",
    borderRadius: "18px",
    overflow: "hidden",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.06)",
    border: "1px solid #f1f5f9",
  },

  /* ─── Success Header ─── */
  header: {
    background: "linear-gradient(135deg, #667eea15, #764ba215)",
    padding: "2.5rem 2rem",
    textAlign: "center",
    borderBottom: "1px solid #f1f5f9",
  },
  successCircle: {
    width: "64px",
    height: "64px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #16a34a, #22c55e)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 1.25rem",
    boxShadow: "0 4px 14px rgba(22,163,106,0.3)",
    animation: "fadeInUp 0.6s ease-out",
  },
  successCheck: {
    color: "#fff",
    fontSize: "1.8rem",
    fontWeight: 700,
  },
  successTitle: {
    fontSize: "1.6rem",
    fontWeight: 800,
    color: "#1e293b",
    margin: "0 0 0.4rem",
    letterSpacing: "-0.02em",
  },
  successSubtitle: {
    color: "#64748b",
    fontSize: "0.95rem",
    margin: 0,
    lineHeight: 1.5,
    maxWidth: "420px",
    marginLeft: "auto",
    marginRight: "auto",
  },

  /* ─── Info Section ─── */
  infoSection: {
    padding: "1.75rem 2rem",
    borderBottom: "1px solid #f1f5f9",
    backgroundColor: "#f8fafc",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "1.15rem",
    marginBottom: "1rem",
  },
  infoItem: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
  },
  infoItemLabel: {
    fontSize: "0.72rem",
    color: "#94a3b8",
    fontWeight: 500,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },
  infoItemValue: {
    fontSize: "0.95rem",
    color: "#1e293b",
    fontWeight: 600,
  },
  infoItemValueMono: {
    fontSize: "0.95rem",
    color: "#1e293b",
    fontWeight: 700,
    fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
  },
  infoItemValueTotal: {
    fontSize: "1.2rem",
    color: "#1e293b",
    fontWeight: 800,
    letterSpacing: "-0.01em",
  },
  statusRow: {
    display: "flex",
    gap: "0.6rem",
    flexWrap: "wrap",
  },
  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.35rem",
    fontSize: "0.78rem",
    fontWeight: 600,
    padding: "0.3rem 0.75rem",
    borderRadius: "8px",
    border: "1px solid",
  },

  /* ─── Sections ─── */
  section: {
    padding: "1.75rem 2rem",
    borderBottom: "1px solid #f1f5f9",
  },
  sectionTitle: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    fontSize: "1rem",
    fontWeight: 700,
    color: "#1e293b",
    margin: "0 0 1rem",
  },
  sectionIcon: {
    fontSize: "1.1rem",
  },
  itemCount: {
    marginLeft: "auto",
    fontSize: "0.78rem",
    color: "#94a3b8",
    fontWeight: 500,
  },

  /* ─── Address ─── */
  addressBox: {
    backgroundColor: "#f8fafc",
    borderRadius: "10px",
    padding: "1rem 1.15rem",
    border: "1px solid #e2e8f0",
  },
  addressNameRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    marginBottom: "0.35rem",
  },
  addressName: {
    color: "#1e293b",
    fontSize: "0.95rem",
  },
  addressDivider: {
    color: "#cbd5e1",
    fontSize: "0.85rem",
  },
  addressPhone: {
    color: "#64748b",
    fontSize: "0.88rem",
  },
  addressDetail: {
    margin: 0,
    color: "#64748b",
    fontSize: "0.88rem",
    lineHeight: 1.5,
  },

  /* ─── Items ─── */
  itemsList: {
    display: "flex",
    flexDirection: "column",
    gap: "0.6rem",
  },
  itemCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0.85rem 1rem",
    backgroundColor: "#f8fafc",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
  },
  itemInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "0.2rem",
    minWidth: 0,
    flex: 1,
  },
  itemTitle: {
    fontWeight: 600,
    color: "#1e293b",
    fontSize: "0.95rem",
  },
  itemAuthor: {
    fontSize: "0.82rem",
    color: "#94a3b8",
  },
  itemPriceQty: {
    fontSize: "0.82rem",
    color: "#64748b",
  },
  itemSubtotal: {
    fontWeight: 700,
    fontSize: "1.05rem",
    color: "#1e293b",
    flexShrink: 0,
    marginLeft: "1rem",
  },

  /* ─── Summary ─── */
  summaryBox: {
    maxWidth: "380px",
    marginLeft: "auto",
  },
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "0.6rem",
  },
  summaryLabel: {
    fontSize: "0.9rem",
    color: "#64748b",
  },
  summaryValue: {
    fontSize: "0.95rem",
    color: "#1e293b",
    fontWeight: 500,
  },
  summaryDivider: {
    height: "1px",
    backgroundColor: "#e2e8f0",
    margin: "0.65rem 0",
  },
  summaryTotalRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryTotalLabel: {
    fontSize: "1.1rem",
    color: "#1e293b",
    fontWeight: 700,
  },
  summaryTotalValue: {
    fontSize: "1.35rem",
    fontWeight: 800,
    color: "#1e293b",
    letterSpacing: "-0.01em",
  },

  /* ─── COD Info ─── */
  codInfoBox: {
    display: "flex",
    gap: "1rem",
    alignItems: "flex-start",
    margin: "0 2rem",
    padding: "1.25rem",
    backgroundColor: "#fffbeb",
    border: "1px solid #fcd34d",
    borderRadius: "12px",
    marginTop: "1.5rem",
  },
  codInfoIcon: {
    fontSize: "1.5rem",
    flexShrink: 0,
    marginTop: "2px",
  },
  codInfoTitle: {
    fontSize: "0.95rem",
    color: "#92400e",
    fontWeight: 700,
    margin: "0 0 0.35rem",
  },
  codInfoText: {
    color: "#92400e",
    fontSize: "0.88rem",
    margin: 0,
    lineHeight: 1.55,
  },

  /* ─── Coin Savings Info ─── */
  coinSavingsBox: {
    display: "flex",
    gap: "1rem",
    alignItems: "flex-start",
    margin: "0 2rem",
    padding: "1.25rem",
    backgroundColor: "#fff9e6",
    border: "1px solid #f39c12",
    borderRadius: "12px",
    marginTop: "1.5rem",
  },
  coinSavingsIcon: {
    fontSize: "1.5rem",
    flexShrink: 0,
    marginTop: "2px",
  },
  coinSavingsTitle: {
    fontSize: "0.95rem",
    color: "#92400e",
    fontWeight: 700,
    margin: "0 0 0.35rem",
  },
  coinSavingsText: {
    color: "#92400e",
    fontSize: "0.88rem",
    margin: 0,
    lineHeight: 1.55,
  },

  /* ─── Notes ─── */
  notesText: {
    backgroundColor: "#f8fafc",
    padding: "1rem 1.15rem",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
    color: "#475569",
    margin: 0,
    lineHeight: 1.6,
    fontSize: "0.92rem",
  },

  /* ─── Actions ─── */
  actions: {
    padding: "2rem",
    display: "flex",
    gap: "0.85rem",
    justifyContent: "center",
  },
  primaryButton: {
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "#fff",
    border: "none",
    padding: "0.8rem 1.75rem",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "0.95rem",
    fontWeight: 600,
    letterSpacing: "0.01em",
  },
  secondaryButton: {
    backgroundColor: "#fff",
    color: "#667eea",
    border: "1.5px solid #e0e7ff",
    padding: "0.8rem 1.75rem",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "0.95rem",
    fontWeight: 600,
  },
};

export default OrderSuccessPage;
