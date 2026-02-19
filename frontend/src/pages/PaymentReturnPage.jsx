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

      // Check if this is a VNPAY callback (has vnp_ parameters)
      const isVNPayCallback = Object.keys(params).some((key) =>
        key.startsWith("vnp_"),
      );

      if (!isVNPayCallback) {
        // Not a VNPAY callback - show coming soon message
        setStatus("coming-soon");
        setMessage("Online payment integration is coming soon!");
        return;
      }

      // Extract order number from params
      const orderNumber = params.vnp_TxnRef || params.orderNumber;

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
            <div style={styles.spinner}></div>
            <h2 style={styles.title}>Processing Payment...</h2>
            <p style={styles.text}>
              Please wait while we confirm your payment. Do not close this page.
            </p>
          </div>
        );

      case "success":
        return (
          <div style={styles.content}>
            <div style={styles.iconSuccess}>✅</div>
            <h2 style={styles.titleSuccess}>Payment Successful!</h2>
            <p style={styles.text}>{message}</p>
            {order && (
              <div style={styles.orderInfo}>
                <p>
                  <strong>Order Number:</strong> {order.orderNumber}
                </p>
                <p>
                  <strong>Amount:</strong> ${order.total.toFixed(2)}
                </p>
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
              View Order Now
            </button>
          </div>
        );

      case "failed":
        return (
          <div style={styles.content}>
            <div style={styles.iconFailed}>❌</div>
            <h2 style={styles.titleFailed}>Payment Failed</h2>
            <p style={styles.text}>{message}</p>
            {order && (
              <div style={styles.orderInfo}>
                <p>
                  <strong>Order Number:</strong> {order.orderNumber}
                </p>
                <p style={styles.noteText}>
                  Your order has been created but payment was not completed. You
                  can retry payment or choose a different payment method.
                </p>
              </div>
            )}
            <div style={styles.actions}>
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
            <div style={styles.iconError}>⚠️</div>
            <h2 style={styles.titleError}>Error</h2>
            <p style={styles.text}>{message}</p>
            <div style={styles.actions}>
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

      case "coming-soon":
        return (
          <div style={styles.content}>
            <div style={styles.iconComingSoon}>🚧</div>
            <h2 style={styles.titleComingSoon}>Online Payment Coming Soon</h2>
            <p style={styles.text}>
              Online payment integration is currently being set up. Please use
              Cash on Delivery (COD) for now.
            </p>
            <div style={styles.infoBox}>
              <h3 style={styles.infoBoxTitle}>Payment Provider Setup</h3>
              <p style={styles.infoBoxText}>
                To enable VNPAY online payment, the system administrator needs
                to configure the payment gateway credentials in the backend
                environment settings.
              </p>
            </div>
            <div style={styles.actions}>
              <button
                style={styles.primaryButton}
                onClick={() => navigate("/checkout")}
              >
                Back to Checkout
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
  container: {
    maxWidth: "700px",
    margin: "4rem auto",
    padding: "0 1rem",
    minHeight: "60vh",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: "16px",
    boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
    padding: "3rem 2rem",
  },
  content: {
    textAlign: "center",
  },
  spinner: {
    width: "60px",
    height: "60px",
    border: "6px solid #f3f3f3",
    borderTop: "6px solid #667eea",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    margin: "0 auto 2rem",
  },
  iconSuccess: {
    fontSize: "5rem",
    marginBottom: "1rem",
  },
  iconFailed: {
    fontSize: "5rem",
    marginBottom: "1rem",
  },
  iconError: {
    fontSize: "5rem",
    marginBottom: "1rem",
  },
  iconComingSoon: {
    fontSize: "5rem",
    marginBottom: "1rem",
  },
  title: {
    fontSize: "2rem",
    color: "#2c3e50",
    marginBottom: "1rem",
  },
  titleSuccess: {
    fontSize: "2rem",
    color: "#28a745",
    marginBottom: "1rem",
  },
  titleFailed: {
    fontSize: "2rem",
    color: "#dc3545",
    marginBottom: "1rem",
  },
  titleError: {
    fontSize: "2rem",
    color: "#ff6b6b",
    marginBottom: "1rem",
  },
  titleComingSoon: {
    fontSize: "2rem",
    color: "#ffc107",
    marginBottom: "1rem",
  },
  text: {
    color: "#6c757d",
    fontSize: "1.1rem",
    lineHeight: 1.6,
    marginBottom: "2rem",
  },
  orderInfo: {
    backgroundColor: "#f8f9fa",
    padding: "1.5rem",
    borderRadius: "8px",
    marginBottom: "1.5rem",
    textAlign: "left",
  },
  noteText: {
    fontSize: "0.95rem",
    color: "#856404",
    marginTop: "1rem",
  },
  redirectText: {
    color: "#495057",
    fontSize: "0.9rem",
    marginBottom: "1rem",
  },
  infoBox: {
    backgroundColor: "#fff3cd",
    border: "1px solid #ffc107",
    borderRadius: "8px",
    padding: "1.5rem",
    marginBottom: "2rem",
    textAlign: "left",
  },
  infoBoxTitle: {
    fontSize: "1.1rem",
    color: "#856404",
    marginTop: 0,
    marginBottom: "0.75rem",
  },
  infoBoxText: {
    color: "#856404",
    fontSize: "0.95rem",
    margin: 0,
    lineHeight: 1.6,
  },
  actions: {
    display: "flex",
    gap: "1rem",
    justifyContent: "center",
    flexWrap: "wrap",
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

// Add keyframes animation for spinner
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}

export default PaymentReturnPage;
