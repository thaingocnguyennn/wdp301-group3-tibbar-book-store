import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { orderApi } from "../api/orderApi";

const ORDER_STEPS = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED"];
const ORDER_STATUS_CONFIG = {
  PENDING: { icon: "⏳", label: "Pending", color: "#f59e0b" },
  PROCESSING: { icon: "📦", label: "Processing", color: "#0284c7" },
  SHIPPED: { icon: "🚚", label: "Shipped", color: "#4f46e5" },
  DELIVERED: { icon: "✅", label: "Delivered", color: "#16a34a" },
  CANCELLED: { icon: "✕", label: "Cancelled", color: "#dc2626" },
};
const PAYMENT_STATUS_CONFIG = {
  PENDING: { icon: "○", label: "Unpaid", bg: "#fff8e1", color: "#d97706", border: "#fcd34d" },
  PAID: { icon: "●", label: "Paid", bg: "#dcfce7", color: "#16a34a", border: "#86efac" },
  FAILED: { icon: "!", label: "Failed", bg: "#fee2e2", color: "#dc2626", border: "#fca5a5" },
  REFUNDED: { icon: "↩", label: "Refunded", bg: "#f3f4f6", color: "#6b7280", border: "#d1d5db" },
};
const PAYMENT_METHOD_LABELS = {
  COD: "Cash on Delivery",
  VNPAY: "VNPay Online Payment",
};

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

  const getCurrentStepIndex = () => {
    if (!order) return 0;
    if (order.orderStatus === "CANCELLED") return -1;
    return ORDER_STEPS.indexOf(order.orderStatus);
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
          <div style={styles.errorIcon}>⚠</div>
          <h2 style={styles.errorTitle}>{error || "Order not found"}</h2>
          <button style={styles.backButton} onClick={() => navigate("/orders")}>
            ← Back to Orders
          </button>
        </div>
      </div>
    );
  }

  const statusConfig = ORDER_STATUS_CONFIG[order.orderStatus] || ORDER_STATUS_CONFIG.PENDING;
  const paymentConfig = PAYMENT_STATUS_CONFIG[order.paymentStatus] || PAYMENT_STATUS_CONFIG.PENDING;
  const currentStep = getCurrentStepIndex();

  return (
    <div style={styles.container}>
      {/* Top Navigation */}
      <div style={styles.topNav}>
        <button style={styles.backButton} onClick={() => navigate("/orders")}>
          ← Back to Orders
        </button>
        <div style={styles.orderIdHeader}>
          <span style={styles.orderLabel}>Order</span>
          <span style={styles.orderNumber}>{order.orderNumber}</span>
        </div>
      </div>

      {error && (
        <div style={styles.errorBanner}>
          <span>⚠ {error}</span>
        </div>
      )}

      {/* Status Timeline */}
      {order.orderStatus !== "CANCELLED" ? (
        <div style={styles.timelineCard}>
          <div style={styles.timeline}>
            {ORDER_STEPS.map((step, i) => {
              const stepConfig = ORDER_STATUS_CONFIG[step];
              const isCompleted = i <= currentStep;
              const isCurrent = i === currentStep;
              return (
                <div key={step} style={styles.timelineStep}>
                  <div
                    style={{
                      ...styles.timelineDot,
                      backgroundColor: isCompleted ? stepConfig.color : "#e2e8f0",
                      boxShadow: isCurrent ? `0 0 0 4px ${stepConfig.color}33` : "none",
                      transform: isCurrent ? "scale(1.2)" : "scale(1)",
                    }}
                  >
                    <span style={{ fontSize: "0.75rem" }}>
                      {isCompleted ? stepConfig.icon : ""}
                    </span>
                  </div>
                  {i < ORDER_STEPS.length - 1 && (
                    <div
                      style={{
                        ...styles.timelineLine,
                        backgroundColor: i < currentStep ? ORDER_STATUS_CONFIG[ORDER_STEPS[i + 1]].color : "#e2e8f0",
                      }}
                    />
                  )}
                  <span
                    style={{
                      ...styles.timelineLabel,
                      color: isCompleted ? "#1e293b" : "#94a3b8",
                      fontWeight: isCurrent ? 700 : 500,
                    }}
                  >
                    {stepConfig.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div style={styles.cancelledBanner}>
          <span style={styles.cancelledIcon}>✕</span>
          <span style={styles.cancelledText}>This order has been cancelled</span>
        </div>
      )}

      {/* Info Cards Grid */}
      <div style={styles.infoGrid}>
        <div style={styles.infoCard}>
          <div style={styles.infoCardIcon}>📅</div>
          <div style={styles.infoCardContent}>
            <span style={styles.infoCardLabel}>Order Date</span>
            <span style={styles.infoCardValue}>
              {new Date(order.createdAt).toLocaleDateString("vi-VN", {
                day: "2-digit", month: "2-digit", year: "numeric",
              })}
              {" "}
              {new Date(order.createdAt).toLocaleTimeString("vi-VN", {
                hour: "2-digit", minute: "2-digit",
              })}
            </span>
          </div>
        </div>

        <div style={styles.infoCard}>
          <div style={styles.infoCardIcon}>
            {order.paymentMethod === "VNPAY" ? "🏦" : "💵"}
          </div>
          <div style={styles.infoCardContent}>
            <span style={styles.infoCardLabel}>Payment Method</span>
            <span style={styles.infoCardValue}>
              {PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod}
            </span>
          </div>
        </div>

        <div style={styles.infoCard}>
          <div style={styles.infoCardIcon}>{paymentConfig.icon}</div>
          <div style={styles.infoCardContent}>
            <span style={styles.infoCardLabel}>Payment Status</span>
            <span
              style={{
                ...styles.statusBadge,
                backgroundColor: paymentConfig.bg,
                color: paymentConfig.color,
                borderColor: paymentConfig.border,
              }}
            >
              {paymentConfig.label}
            </span>
          </div>
        </div>

        <div style={styles.infoCard}>
          <div style={styles.infoCardIcon}>{statusConfig.icon}</div>
          <div style={styles.infoCardContent}>
            <span style={styles.infoCardLabel}>Order Status</span>
            <span style={{ ...styles.infoCardValue, color: statusConfig.color, fontWeight: 700 }}>
              {statusConfig.label}
            </span>
          </div>
        </div>
      </div>

      {/* Shipping Address */}
      {order.shippingAddress && order.shippingAddress.fullName && (
        <div style={styles.sectionCard}>
          <h3 style={styles.sectionTitle}>
            <span style={styles.sectionIcon}>📍</span>
            Shipping Address
          </h3>
          <div style={styles.addressContent}>
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

      {/* Order Items */}
      <div style={styles.sectionCard}>
        <h3 style={styles.sectionTitle}>
          <span style={styles.sectionIcon}>🛍</span>
          Order Items
          <span style={styles.itemCount}>{order.items.length} item{order.items.length > 1 ? "s" : ""}</span>
        </h3>

        <div style={styles.itemsContainer}>
          {/* Table Header */}
          <div style={styles.tableHead}>
            <span style={styles.colProduct}>Product</span>
            <span style={styles.colCenter}>Qty</span>
            <span style={styles.colRight}>Price</span>
            <span style={styles.colRight}>Subtotal</span>
          </div>

          {/* Table Rows */}
          {order.items.map((item) => (
            <div
              key={`${item.book?._id || item.title}-${item.quantity}`}
              style={styles.tableRow}
            >
              <span style={styles.colProduct}>
                <span style={styles.productTitle}>{item.title}</span>
              </span>
              <span style={styles.colCenter}>
                <span style={styles.qtyBadge}>{item.quantity}</span>
              </span>
              <span style={styles.colRight}>
                {Number(item.price || 0).toLocaleString("vi-VN")}₫
              </span>
              <span style={{ ...styles.colRight, fontWeight: 700, color: "#1e293b" }}>
                {Number(item.subtotal || 0).toLocaleString("vi-VN")}₫
              </span>
            </div>
          ))}
        </div>
      </div>
      {/* Delivery Proof */}
      {order.orderStatus === "DELIVERED" && order.deliveryProof?.imageUrl && (
        <div style={styles.sectionCard}>
          <h3 style={styles.sectionTitle}>
            <span style={styles.sectionIcon}>📸</span>
            Delivery Proof
          </h3>

          <div style={styles.deliveryProofContainer}>
            <img
              src={`http://localhost:5000${order.deliveryProof.imageUrl}`}
              alt="Delivery Proof"
              style={styles.deliveryProofImage}
            />

            <p style={styles.deliveryProofTime}>
              Uploaded at:{" "}
              {new Date(order.deliveryProof.uploadedAt).toLocaleString("vi-VN")}
            </p>
          </div>
        </div>
      )}
      {/* Summary */}
      <div style={styles.summaryCard}>
        <h3 style={styles.sectionTitle}>
          <span style={styles.sectionIcon}>💰</span>
          Order Summary
        </h3>
        <div style={styles.summaryContent}>
          <div style={styles.summaryRow}>
            <span style={styles.summaryLabel}>Subtotal</span>
            <span style={styles.summaryValue}>
              {Number(order.subtotal || 0).toLocaleString("vi-VN")}₫
            </span>
          </div>
          <div style={styles.summaryRow}>
            <span style={styles.summaryLabel}>Discount</span>
            <span style={{ ...styles.summaryValue, color: "#ef4444" }}>
              -{Number(order.discount || 0).toLocaleString("vi-VN")}₫
            </span>
          </div>
          {order.coinsUsed > 0 && (
            <div style={styles.summaryRow}>
              <span style={styles.summaryLabel}>
                <span style={styles.coinIcon}>💰</span>
                Coins Used
              </span>
              <span style={{ ...styles.summaryValue, color: "#f39c12" }}>
                -{Number(order.coinsUsed || 0).toLocaleString("vi-VN")}₫
              </span>
            </div>
          )}
          <div style={styles.summaryRow}>
            <span style={styles.summaryLabel}>Shipping Fee</span>
            <span style={styles.summaryValue}>
              {Number(order.shippingFee || 0) === 0 ? (
                <span style={{ color: "#16a34a", fontWeight: 600 }}>Free</span>
              ) : (
                `${Number(order.shippingFee || 0).toLocaleString("vi-VN")}₫`
              )}
            </span>
          </div>
          <div style={styles.summaryDivider} />
          <div style={styles.summaryTotalRow}>
            <span style={styles.summaryTotalLabel}>Total</span>
            <span style={styles.summaryTotalValue}>
              {Number(order.total || 0).toLocaleString("vi-VN")}₫
            </span>
          </div>
        </div>
      </div>

      {/* Cancel Action */}
      {order.orderStatus === "PENDING" && (
        <div style={styles.cancelSection}>
          <button
            type="button"
            style={styles.cancelOrderButton}
            onClick={handleCancelOrder}
            disabled={isCancelling}
          >
            {isCancelling ? "Cancelling..." : "Cancel Order"}
          </button>
        </div>
      )}
    </div>
  );
};

const styles = {
  /* ─── Layout ─── */
  container: {
    maxWidth: "880px",
    margin: "0 auto",
    padding: "2rem 1.5rem",
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
  errorIcon: {
    fontSize: "3rem",
    marginBottom: "1rem",
  },
  errorTitle: {
    fontSize: "1.2rem",
    color: "#64748b",
    fontWeight: 600,
    marginBottom: "1.5rem",
  },
  errorBanner: {
    display: "flex",
    alignItems: "center",
    gap: "0.6rem",
    backgroundColor: "#fef2f2",
    color: "#dc2626",
    padding: "0.85rem 1.15rem",
    borderRadius: "10px",
    marginBottom: "1.25rem",
    border: "1px solid #fecaca",
    fontSize: "0.9rem",
    fontWeight: 500,
  },

  /* ─── Top Nav ─── */
  topNav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "1.5rem",
  },
  backButton: {
    backgroundColor: "#fff",
    color: "#667eea",
    border: "1.5px solid #e0e7ff",
    borderRadius: "10px",
    padding: "0.5rem 1rem",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "0.85rem",
    transition: "all 0.2s",
  },
  orderIdHeader: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  orderLabel: {
    fontSize: "0.78rem",
    color: "#94a3b8",
    fontWeight: 500,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },
  orderNumber: {
    fontSize: "1rem",
    fontWeight: 700,
    color: "#1e293b",
    fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
  },

  /* ─── Timeline ─── */
  timelineCard: {
    backgroundColor: "#fff",
    borderRadius: "14px",
    padding: "1.75rem 2rem",
    marginBottom: "1.25rem",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)",
    border: "1px solid #f1f5f9",
  },
  timeline: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    position: "relative",
  },
  timelineStep: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.6rem",
    flex: 1,
    position: "relative",
  },
  timelineDot: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
    transition: "all 0.3s",
  },
  timelineLine: {
    position: "absolute",
    top: "15px",
    left: "calc(50% + 18px)",
    width: "calc(100% - 36px)",
    height: "3px",
    borderRadius: "2px",
    transition: "background-color 0.3s",
  },
  timelineLabel: {
    fontSize: "0.78rem",
    textAlign: "center",
    whiteSpace: "nowrap",
    transition: "all 0.3s",
  },

  /* ─── Cancelled Banner ─── */
  cancelledBanner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.7rem",
    backgroundColor: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: "14px",
    padding: "1.15rem",
    marginBottom: "1.25rem",
  },
  cancelledIcon: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    backgroundColor: "#dc2626",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: "0.85rem",
  },
  cancelledText: {
    color: "#dc2626",
    fontWeight: 600,
    fontSize: "0.95rem",
  },

  /* ─── Info Grid ─── */
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "0.85rem",
    marginBottom: "1.25rem",
  },
  infoCard: {
    display: "flex",
    alignItems: "center",
    gap: "0.85rem",
    backgroundColor: "#fff",
    borderRadius: "12px",
    padding: "1rem 1.15rem",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)",
    border: "1px solid #f1f5f9",
  },
  infoCardIcon: {
    fontSize: "1.4rem",
    width: "40px",
    height: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8fafc",
    borderRadius: "10px",
    flexShrink: 0,
  },
  infoCardContent: {
    display: "flex",
    flexDirection: "column",
    gap: "0.2rem",
    minWidth: 0,
  },
  infoCardLabel: {
    fontSize: "0.72rem",
    color: "#94a3b8",
    fontWeight: 500,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  infoCardValue: {
    fontSize: "0.9rem",
    color: "#1e293b",
    fontWeight: 600,
  },
  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.3rem",
    fontSize: "0.78rem",
    fontWeight: 600,
    padding: "0.25rem 0.6rem",
    borderRadius: "6px",
    border: "1px solid",
    width: "fit-content",
  },

  /* ─── Section Card ─── */
  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: "14px",
    padding: "1.5rem",
    marginBottom: "1.25rem",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)",
    border: "1px solid #f1f5f9",
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
  addressContent: {
    backgroundColor: "#f8fafc",
    borderRadius: "10px",
    padding: "1rem 1.15rem",
    border: "1px solid #e2e8f0",
  },
  addressNameRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    marginBottom: "0.4rem",
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

  /* ─── Items Table ─── */
  itemsContainer: {
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
    overflow: "hidden",
  },
  tableHead: {
    display: "grid",
    gridTemplateColumns: "2.2fr 0.6fr 1fr 1fr",
    gap: "0.75rem",
    padding: "0.75rem 1rem",
    backgroundColor: "#f8fafc",
    fontWeight: 700,
    fontSize: "0.78rem",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    borderBottom: "1px solid #e2e8f0",
  },
  tableRow: {
    display: "grid",
    gridTemplateColumns: "2.2fr 0.6fr 1fr 1fr",
    gap: "0.75rem",
    padding: "0.85rem 1rem",
    borderBottom: "1px solid #f1f5f9",
    alignItems: "center",
    fontSize: "0.9rem",
    color: "#475569",
  },
  colProduct: {
    minWidth: 0,
  },
  colCenter: {
    textAlign: "center",
  },
  colRight: {
    textAlign: "right",
  },
  productTitle: {
    fontWeight: 600,
    color: "#1e293b",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    display: "block",
  },
  qtyBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "28px",
    height: "28px",
    borderRadius: "8px",
    backgroundColor: "#f1f5f9",
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "#475569",
  },

  /* ─── Summary ─── */
  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: "14px",
    padding: "1.5rem",
    marginBottom: "1.25rem",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)",
    border: "1px solid #f1f5f9",
  },
  summaryContent: {
    maxWidth: "400px",
    marginLeft: "auto",
  },
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "0.65rem",
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
  coinIcon: {
    marginRight: "0.3rem",
    fontSize: "0.85rem",
  },
  summaryDivider: {
    height: "1px",
    backgroundColor: "#e2e8f0",
    margin: "0.75rem 0",
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

  /* ─── Cancel ─── */
  cancelSection: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: "0.5rem",
  },
  cancelOrderButton: {
    backgroundColor: "#fff",
    color: "#ef4444",
    border: "1.5px solid #fca5a5",
    borderRadius: "10px",
    padding: "0.6rem 1.5rem",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "0.9rem",
    transition: "all 0.2s",
  },
  deliveryProofContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.75rem",
  },

  deliveryProofImage: {
    width: "100%",
    maxWidth: "420px",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
  },

  deliveryProofTime: {
    fontSize: "0.85rem",
    color: "#64748b",
  },
};

export default OrderDetailPage;
