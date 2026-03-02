import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { orderApi } from "../api/orderApi";

const PaymentReturnPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState("loading"); // loading, success, failed, error
  const [order, setOrder] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    confirmPayment();
  }, []);

  const confirmPayment = async () => {
    try {
      // Get all query parameters
      const params = {};
      searchParams.forEach((value, key) => {
        params[key] = value;
      });

      // Check if this is a VNPay callback (has vnp_ parameters)
      const isVNPayCallback = Object.keys(params).some((key) =>
        key.startsWith("vnp_"),
      );

      if (!isVNPayCallback) {
        setStatus("error");
        setMessage("Invalid payment callback. No payment parameters found.");
        return;
      }

      // Extract order number from params
      const orderNumber = params.vnp_TxnRef;

      if (!orderNumber) {
        setStatus("error");
        setMessage("Invalid payment callback: Order number not found");
        return;
      }

      // Confirm payment with backend
      const response = await orderApi.confirmPayment(params);
      const { order: confirmedOrder, payment } = response.data;

      setOrder(confirmedOrder);

      if (payment.success) {
        setStatus("success");
        setMessage(payment.message || "Payment completed successfully!");

        // Redirect to order success page after 3 seconds
        setTimeout(() => {
          navigate(`/order-success/${confirmedOrder.orderNumber}`, {
            state: { order: confirmedOrder },
          });
        }, 3000);
      } else {
        setStatus("failed");
        setMessage(
          payment.message ||
            "Payment failed. Please try again or contact support.",
        );
      }
    } catch (error) {
      console.error("Payment confirmation error:", error);
      setStatus("error");
      setMessage(
        error.response?.data?.message ||
          "An error occurred while confirming payment. Please contact support.",
      );
    }
  };

  const renderContent = () => {
    switch (status) {
      case "loading":
        return (
          <div style={styles.content}>
            <div style={styles.spinnerContainer}>
              <div style={styles.spinner}></div>
              <div style={styles.spinnerPulse}></div>
            </div>
            <h2 style={styles.loadingTitle}>Processing Payment</h2>
            <p style={styles.loadingText}>
              Please wait while we confirm your payment with VNPay.
              <br />Do not close this page.
            </p>
            <div style={styles.progressBar}>
              <div style={styles.progressFill}></div>
            </div>
          </div>
        );

      case "success":
        return (
          <div style={styles.content}>
            <div style={styles.successCircle}>
              <span style={styles.successCheck}>✓</span>
            </div>
            <h2 style={styles.successTitle}>Payment Successful!</h2>
            <p style={styles.resultText}>{message}</p>
            {order && (
              <div style={styles.orderInfoBox}>
                <div style={styles.orderInfoRow}>
                  <span style={styles.orderInfoLabel}>Order Number</span>
                  <span style={styles.orderInfoValueMono}>{order.orderNumber}</span>
                </div>
                <div style={styles.orderInfoDivider} />
                <div style={styles.orderInfoRow}>
                  <span style={styles.orderInfoLabel}>Amount Paid</span>
                  <span style={styles.orderInfoValueBold}>
                    {order.total.toLocaleString('vi-VN')}₫
                  </span>
                </div>
              </div>
            )}
            <p style={styles.redirectText}>
              Redirecting to order details in 3 seconds...
            </p>
            <button
              style={styles.primaryButton}
              onClick={() =>
                navigate(`/order-success/${order.orderNumber}`, {
                  state: { order },
                })
              }
            >
              View Order Now →
            </button>
          </div>
        );

      case "failed":
        return (
          <div style={styles.content}>
            <div style={styles.failedCircle}>
              <span style={styles.failedX}>✕</span>
            </div>
            <h2 style={styles.failedTitle}>Payment Failed</h2>
            <p style={styles.resultText}>{message}</p>
            {order && (
              <div style={styles.orderInfoBox}>
                <div style={styles.orderInfoRow}>
                  <span style={styles.orderInfoLabel}>Order Number</span>
                  <span style={styles.orderInfoValueMono}>{order.orderNumber}</span>
                </div>
                <div style={styles.orderInfoDivider} />
                <p style={styles.failedNote}>
                  Your order has been created but payment was not completed. You can retry payment or choose a different payment method.
                </p>
              </div>
            )}
            <div style={styles.actionGroup}>
              <button
                style={styles.primaryButton}
                onClick={() => navigate("/cart")}
              >
                Back to Cart
              </button>
              <button
                style={styles.secondaryButton}
                onClick={() => navigate("/")}
              >
                Go to Homepage
              </button>
            </div>
          </div>
        );

      case "error":
        return (
          <div style={styles.content}>
            <div style={styles.errorCircle}>
              <span style={styles.errorExclaim}>!</span>
            </div>
            <h2 style={styles.errorTitle}>Something went wrong</h2>
            <p style={styles.resultText}>{message}</p>
            <div style={styles.actionGroup}>
              <button
                style={styles.primaryButton}
                onClick={() => navigate("/orders")}
              >
                View My Orders
              </button>
              <button
                style={styles.secondaryButton}
                onClick={() => navigate("/")}
              >
                Go to Homepage
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>{renderContent()}</div>
    </div>
  );
};

const styles = {
  /* ─── Layout ─── */
  container: {
    maxWidth: "560px",
    margin: "4rem auto",
    padding: "0 1.5rem",
    minHeight: "60vh",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: "18px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.06)",
    padding: "3rem 2.5rem",
    border: "1px solid #f1f5f9",
  },
  content: {
    textAlign: "center",
  },

  /* ─── Loading ─── */
  spinnerContainer: {
    position: "relative",
    width: "64px",
    height: "64px",
    margin: "0 auto 1.75rem",
  },
  spinner: {
    width: "64px",
    height: "64px",
    border: "4px solid #e2e8f0",
    borderTop: "4px solid #667eea",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
    position: "absolute",
    top: 0,
    left: 0,
  },
  spinnerPulse: {
    width: "64px",
    height: "64px",
    borderRadius: "50%",
    backgroundColor: "rgba(102,126,234,0.08)",
    animation: "pulse 2s ease-in-out infinite",
    position: "absolute",
    top: 0,
    left: 0,
  },
  loadingTitle: {
    fontSize: "1.4rem",
    color: "#1e293b",
    fontWeight: 700,
    marginBottom: "0.6rem",
  },
  loadingText: {
    color: "#94a3b8",
    fontSize: "0.9rem",
    lineHeight: 1.6,
    marginBottom: "1.75rem",
  },
  progressBar: {
    width: "200px",
    height: "4px",
    backgroundColor: "#e2e8f0",
    borderRadius: "2px",
    margin: "0 auto",
    overflow: "hidden",
  },
  progressFill: {
    width: "40%",
    height: "100%",
    background: "linear-gradient(90deg, #667eea, #764ba2)",
    borderRadius: "2px",
    animation: "progressSlide 1.5s ease-in-out infinite",
  },

  /* ─── Success ─── */
  successCircle: {
    width: "72px",
    height: "72px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #16a34a, #22c55e)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 1.5rem",
    boxShadow: "0 6px 20px rgba(22,163,106,0.25)",
    animation: "fadeInUp 0.5s ease-out",
  },
  successCheck: {
    color: "#fff",
    fontSize: "2rem",
    fontWeight: 700,
  },
  successTitle: {
    fontSize: "1.5rem",
    color: "#16a34a",
    fontWeight: 800,
    marginBottom: "0.6rem",
  },

  /* ─── Failed ─── */
  failedCircle: {
    width: "72px",
    height: "72px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #dc2626, #ef4444)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 1.5rem",
    boxShadow: "0 6px 20px rgba(220,38,38,0.25)",
    animation: "fadeInUp 0.5s ease-out",
  },
  failedX: {
    color: "#fff",
    fontSize: "2rem",
    fontWeight: 700,
  },
  failedTitle: {
    fontSize: "1.5rem",
    color: "#dc2626",
    fontWeight: 800,
    marginBottom: "0.6rem",
  },
  failedNote: {
    fontSize: "0.85rem",
    color: "#92400e",
    margin: 0,
    lineHeight: 1.55,
  },

  /* ─── Error ─── */
  errorCircle: {
    width: "72px",
    height: "72px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #f59e0b, #fbbf24)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 1.5rem",
    boxShadow: "0 6px 20px rgba(245,158,11,0.25)",
    animation: "fadeInUp 0.5s ease-out",
  },
  errorExclaim: {
    color: "#fff",
    fontSize: "2rem",
    fontWeight: 700,
  },
  errorTitle: {
    fontSize: "1.5rem",
    color: "#f59e0b",
    fontWeight: 800,
    marginBottom: "0.6rem",
  },

  /* ─── Shared ─── */
  resultText: {
    color: "#64748b",
    fontSize: "0.95rem",
    lineHeight: 1.6,
    marginBottom: "1.75rem",
  },
  orderInfoBox: {
    backgroundColor: "#f8fafc",
    padding: "1.15rem 1.35rem",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    marginBottom: "1.5rem",
    textAlign: "left",
  },
  orderInfoRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0.35rem 0",
  },
  orderInfoLabel: {
    fontSize: "0.82rem",
    color: "#94a3b8",
    fontWeight: 500,
  },
  orderInfoValueMono: {
    fontSize: "0.9rem",
    color: "#1e293b",
    fontWeight: 700,
    fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
  },
  orderInfoValueBold: {
    fontSize: "1.1rem",
    color: "#1e293b",
    fontWeight: 800,
  },
  orderInfoDivider: {
    height: "1px",
    backgroundColor: "#e2e8f0",
    margin: "0.5rem 0",
  },
  redirectText: {
    color: "#94a3b8",
    fontSize: "0.82rem",
    marginBottom: "1rem",
    fontWeight: 500,
  },

  /* ─── Actions ─── */
  actionGroup: {
    display: "flex",
    gap: "0.75rem",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  primaryButton: {
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "#fff",
    border: "none",
    padding: "0.8rem 1.75rem",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "0.92rem",
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
    fontSize: "0.92rem",
    fontWeight: 600,
  },
};

// Add keyframes animations
if (typeof document !== "undefined") {
  const existingStyle = document.getElementById("payment-return-animations");
  if (!existingStyle) {
    const style = document.createElement("style");
    style.id = "payment-return-animations";
    style.textContent = `
      @keyframes progressSlide {
        0% { transform: translateX(-100%); }
        50% { transform: translateX(150%); }
        100% { transform: translateX(-100%); }
      }
      @keyframes pulse {
        0%, 100% { transform: scale(1); opacity: 0.3; }
        50% { transform: scale(1.3); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }
}

export default PaymentReturnPage;
