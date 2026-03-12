import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { orderApi } from "../api/orderApi";

const ORDER_STATUS_CONFIG = {
  PENDING: { icon: "⏳", label: "Pending", bg: "#fff8e1", color: "#f59e0b", border: "#fcd34d" },
  PROCESSING: { icon: "📦", label: "Processing", bg: "#e0f2fe", color: "#0284c7", border: "#7dd3fc" },
  SHIPPED: { icon: "🚚", label: "Shipped", bg: "#e0e7ff", color: "#4f46e5", border: "#a5b4fc" },
  DELIVERED: { icon: "✅", label: "Delivered", bg: "#dcfce7", color: "#16a34a", border: "#86efac" },
  CANCELLED: { icon: "✕", label: "Cancelled", bg: "#fee2e2", color: "#dc2626", border: "#fca5a5" },
};

const PAYMENT_STATUS_CONFIG = {
  PENDING: { icon: "○", label: "Unpaid", bg: "#fff8e1", color: "#d97706", border: "#fcd34d" },
  PAID: { icon: "●", label: "Paid", bg: "#dcfce7", color: "#16a34a", border: "#86efac" },
  FAILED: { icon: "!", label: "Failed", bg: "#fee2e2", color: "#dc2626", border: "#fca5a5" },
  REFUNDED: { icon: "↩", label: "Refunded", bg: "#f3f4f6", color: "#6b7280", border: "#d1d5db" },
};

const PAYMENT_METHOD_LABELS = {
  COD: "Cash on Delivery",
  VNPAY: "VNPay",
};

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

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.pageHeader}>
          <h1 style={styles.pageTitle}>My Orders</h1>
        </div>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner} />
          <p style={styles.loadingText}>Loading your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Page Header */}
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>My Orders</h1>
          <p style={styles.pageSubtitle}>
            {pagination.total > 0
              ? `${pagination.total} order${pagination.total > 1 ? "s" : ""} found`
              : "Track and manage your orders"}
          </p>
        </div>
      </div>

      {error && (
        <div style={styles.errorBanner}>
          <span style={styles.errorIcon}>⚠</span>
          <span>{error}</span>
        </div>
      )}

      {orders.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>📋</div>
          <h2 style={styles.emptyTitle}>No orders yet</h2>
          <p style={styles.emptyText}>
            When you place an order, it will appear here for you to track.
          </p>
          <button style={styles.shopButton} onClick={() => navigate("/")}>
            Start Shopping
          </button>
        </div>
      ) : (
        <>
          {/* Order List */}
          <div style={styles.orderList}>
            {orders.map((order) => {
              const statusConfig = ORDER_STATUS_CONFIG[order.orderStatus] || ORDER_STATUS_CONFIG.PENDING;
              const paymentConfig = PAYMENT_STATUS_CONFIG[order.paymentStatus] || PAYMENT_STATUS_CONFIG.PENDING;

              return (
                <div
                  key={order._id}
                  style={styles.orderCard}
                  className="order-card"
                  onClick={() => navigate(`/orders/${order._id}`)}
                >
                  {/* Card top color strip */}
                  <div
                    style={{
                      ...styles.cardStrip,
                      background: `linear-gradient(90deg, ${statusConfig.color}, ${statusConfig.color}88)`,
                    }}
                  />

                  <div style={styles.cardBody}>
                    {/* Row 1: Order number + date */}
                    <div style={styles.cardTopRow}>
                      <div style={styles.orderIdGroup}>
                        <span style={styles.orderLabel}>Order</span>
                        <span style={styles.orderId}>{order.orderNumber}</span>
                      </div>
                      <div style={styles.dateGroup}>
                        <span style={styles.dateText}>{formatDate(order.createdAt)}</span>
                        <span style={styles.timeText}>{formatTime(order.createdAt)}</span>
                      </div>
                    </div>

                    {/* Row 2: Payment method + total */}
                    <div style={styles.cardMiddleRow}>
                      <div style={styles.paymentMethodTag}>
                        <span style={styles.paymentMethodIcon}>
                          {order.paymentMethod === "VNPAY" ? "🏦" : "💵"}
                        </span>
                        <span style={styles.paymentMethodText}>
                          {PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod}
                        </span>
                      </div>
                      <div style={styles.totalAmount}>
                        {Number(order.total || 0).toLocaleString("vi-VN")}₫
                      </div>
                    </div>

                    {/* Row 2.5: Price Breakdown (if discount or coins used) */}
                    {(order.discount > 0 || order.coinsUsed > 0) && (
                      <div style={styles.priceBreakdown}>
                        {order.discount > 0 && (
                          <span style={styles.breakdownItem}>
                            <span style={styles.breakdownLabel}>Discount:</span>
                            <span style={styles.breakdownValueDiscount}>
                              -{Number(order.discount || 0).toLocaleString("vi-VN")}₫
                            </span>
                          </span>
                        )}
                        {order.coinsUsed > 0 && (
                          <span style={styles.breakdownItem}>
                            <span style={styles.breakdownLabel}>Coins:</span>
                            <span style={styles.breakdownValueCoins}>
                              -<span style={styles.coinIcon}>💰</span>
                              {Number(order.coinsUsed || 0).toLocaleString("vi-VN")}₫
                            </span>
                          </span>
                        )}
                      </div>
                    )}

                    {/* Row 3: Status badges + actions */}
                    <div style={styles.cardBottomRow}>
                      <div style={styles.badgeGroup}>
                        <span
                          style={{
                            ...styles.statusBadge,
                            backgroundColor: statusConfig.bg,
                            color: statusConfig.color,
                            borderColor: statusConfig.border,
                          }}
                        >
                          <span style={styles.badgeIcon}>{statusConfig.icon}</span>
                          {statusConfig.label}
                        </span>
                        <span
                          style={{
                            ...styles.statusBadge,
                            backgroundColor: paymentConfig.bg,
                            color: paymentConfig.color,
                            borderColor: paymentConfig.border,
                          }}
                        >
                          <span style={styles.badgeIcon}>{paymentConfig.icon}</span>
                          {paymentConfig.label}
                        </span>
                      </div>

                      <div style={styles.actionGroup} onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          style={styles.viewButton}
                          onClick={() => navigate(`/orders/${order._id}`)}
                        >
                          View Details →
                        </button>
                        {canCancel(order) && (
                          <button
                            type="button"
                            style={styles.cancelButton}
                            disabled={actionLoadingId === order._id}
                            onClick={() => handleCancelOrder(order._id)}
                          >
                            {actionLoadingId === order._id
                              ? "Cancelling..."
                              : "Cancel"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {(pagination.totalPages || 1) > 1 && (
            <div style={styles.pagination}>
              <button
                type="button"
                style={{
                  ...styles.pageBtn,
                  ...((pagination.page || 1) <= 1 ? styles.pageBtnDisabled : {}),
                }}
                onClick={() => goToPage((pagination.page || 1) - 1)}
                disabled={(pagination.page || 1) <= 1}
              >
                ← Previous
              </button>

              <div style={styles.pageNumbers}>
                {Array.from({ length: pagination.totalPages || 1 }, (_, i) => i + 1).map(
                  (pageNum) => (
                    <button
                      key={pageNum}
                      type="button"
                      style={{
                        ...styles.pageNumBtn,
                        ...(pageNum === (pagination.page || 1) ? styles.pageNumBtnActive : {}),
                      }}
                      onClick={() => goToPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  ),
                )}
              </div>

              <button
                type="button"
                style={{
                  ...styles.pageBtn,
                  ...((pagination.page || 1) >= (pagination.totalPages || 1)
                    ? styles.pageBtnDisabled
                    : {}),
                }}
                onClick={() => goToPage((pagination.page || 1) + 1)}
                disabled={
                  (pagination.page || 1) >= (pagination.totalPages || 1)
                }
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const styles = {
  /* ─── Layout ─── */
  container: {
    maxWidth: "900px",
    margin: "0 auto",
    padding: "2rem 1.5rem",
    minHeight: "80vh",
  },

  /* ─── Page Header ─── */
  pageHeader: {
    marginBottom: "2rem",
  },
  pageTitle: {
    margin: 0,
    fontSize: "1.75rem",
    fontWeight: 800,
    color: "#1a1a2e",
    letterSpacing: "-0.02em",
  },
  pageSubtitle: {
    margin: "0.35rem 0 0",
    fontSize: "0.9rem",
    color: "#94a3b8",
    fontWeight: 400,
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
  errorIcon: {
    fontSize: "1.1rem",
    flexShrink: 0,
  },

  /* ─── Empty State ─── */
  emptyState: {
    textAlign: "center",
    padding: "4rem 2rem",
    backgroundColor: "#fff",
    borderRadius: "16px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 6px 24px rgba(0,0,0,0.04)",
  },
  emptyIcon: {
    fontSize: "3.5rem",
    marginBottom: "1rem",
  },
  emptyTitle: {
    fontSize: "1.35rem",
    color: "#1e293b",
    fontWeight: 700,
    margin: "0 0 0.5rem",
  },
  emptyText: {
    color: "#94a3b8",
    fontSize: "0.95rem",
    marginBottom: "1.75rem",
    maxWidth: "320px",
    marginLeft: "auto",
    marginRight: "auto",
    lineHeight: 1.5,
  },
  shopButton: {
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "#fff",
    border: "none",
    padding: "0.75rem 2rem",
    borderRadius: "10px",
    fontSize: "0.95rem",
    fontWeight: 600,
    cursor: "pointer",
    letterSpacing: "0.01em",
  },

  /* ─── Order List ─── */
  orderList: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },

  /* ─── Order Card ─── */
  orderCard: {
    backgroundColor: "#fff",
    borderRadius: "14px",
    overflow: "hidden",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)",
    cursor: "pointer",
    transition: "all 0.25s cubic-bezier(.4,0,.2,1)",
    border: "1px solid #f1f5f9",
  },
  cardStrip: {
    height: "3px",
  },
  cardBody: {
    padding: "1.15rem 1.35rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.85rem",
  },

  /* Card rows */
  cardTopRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  orderIdGroup: {
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
  orderId: {
    fontSize: "0.95rem",
    fontWeight: 700,
    color: "#1e293b",
    fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
    letterSpacing: "0.02em",
  },
  dateGroup: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "0.1rem",
  },
  dateText: {
    fontSize: "0.82rem",
    color: "#64748b",
    fontWeight: 500,
  },
  timeText: {
    fontSize: "0.75rem",
    color: "#94a3b8",
  },

  cardMiddleRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  paymentMethodTag: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.4rem",
    backgroundColor: "#f8fafc",
    padding: "0.3rem 0.7rem",
    borderRadius: "6px",
    border: "1px solid #e2e8f0",
  },
  paymentMethodIcon: {
    fontSize: "0.85rem",
  },
  paymentMethodText: {
    fontSize: "0.8rem",
    color: "#475569",
    fontWeight: 500,
  },
  totalAmount: {
    fontSize: "1.2rem",
    fontWeight: 800,
    color: "#1e293b",
    letterSpacing: "-0.01em",
  },

  /* ─── Price Breakdown ─── */
  priceBreakdown: {
    display: "flex",
    gap: "1rem",
    flexWrap: "wrap",
    fontSize: "0.8rem",
    paddingTop: "0.5rem",
  },
  breakdownItem: {
    display: "flex",
    gap: "0.4rem",
    alignItems: "center",
  },
  breakdownLabel: {
    color: "#64748b",
    fontWeight: 500,
  },
  breakdownValueDiscount: {
    color: "#ef4444",
    fontWeight: 600,
  },
  breakdownValueCoins: {
    display: "flex",
    alignItems: "center",
    gap: "0.2rem",
    color: "#f39c12",
    fontWeight: 600,
  },
  coinIcon: {
    fontSize: "0.75rem",
  },

  cardBottomRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: "0.7rem",
    borderTop: "1px solid #f1f5f9",
  },
  badgeGroup: {
    display: "flex",
    gap: "0.5rem",
    flexWrap: "wrap",
  },
  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.3rem",
    fontSize: "0.75rem",
    fontWeight: 600,
    padding: "0.3rem 0.7rem",
    borderRadius: "8px",
    border: "1px solid",
    whiteSpace: "nowrap",
  },
  badgeIcon: {
    fontSize: "0.7rem",
  },

  /* Actions */
  actionGroup: {
    display: "flex",
    gap: "0.5rem",
    alignItems: "center",
  },
  viewButton: {
    backgroundColor: "transparent",
    color: "#667eea",
    border: "1.5px solid #667eea",
    borderRadius: "8px",
    padding: "0.4rem 0.9rem",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "0.8rem",
    transition: "all 0.2s",
    whiteSpace: "nowrap",
  },
  cancelButton: {
    backgroundColor: "transparent",
    color: "#ef4444",
    border: "1.5px solid #fca5a5",
    borderRadius: "8px",
    padding: "0.4rem 0.9rem",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "0.8rem",
    transition: "all 0.2s",
    whiteSpace: "nowrap",
  },

  /* ─── Pagination ─── */
  pagination: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "0.5rem",
    marginTop: "2rem",
    padding: "1rem 0",
  },
  pageBtn: {
    backgroundColor: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    padding: "0.5rem 1rem",
    cursor: "pointer",
    fontWeight: 500,
    fontSize: "0.85rem",
    color: "#475569",
    transition: "all 0.2s",
  },
  pageBtnDisabled: {
    opacity: 0.4,
    cursor: "not-allowed",
  },
  pageNumbers: {
    display: "flex",
    gap: "0.3rem",
  },
  pageNumBtn: {
    width: "36px",
    height: "36px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "0.85rem",
    fontWeight: 500,
    color: "#475569",
    transition: "all 0.2s",
  },
  pageNumBtnActive: {
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "#fff",
    borderColor: "transparent",
    fontWeight: 700,
  },
};

export default OrderHistoryPage;
