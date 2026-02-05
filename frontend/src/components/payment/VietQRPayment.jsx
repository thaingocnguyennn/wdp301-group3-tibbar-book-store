import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { orderApi } from "../../api/orderApi";

const VietQRPayment = ({ paymentInfo, orderNumber, onBack }) => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(false);
  const [checkCount, setCheckCount] = useState(0);
  const [countdown, setCountdown] = useState(360); // 6 minutes in seconds

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Check payment status
  const checkPaymentStatus = async () => {
    setChecking(true);
    try {
      const response = await orderApi.getOrderByNumber(orderNumber);
      const order = response.data.order;
      
      if (order.paymentStatus === "PAID") {
        // Payment successful - show success message and redirect
        alert("✅ Payment successful! Your order is being processed.");
        setTimeout(() => {
          navigate(`/order-success/${orderNumber}`, {
            state: { order },
          });
        }, 1000);
      } else {
        setCheckCount(prev => prev + 1);
        if (checkCount >= 2) {
          alert("⏳ Payment not received yet.\n\nPlease ensure:\n• Transfer amount: " + paymentInfo.amount?.toLocaleString('vi-VN') + "₫\n• Transfer content: " + paymentInfo.description + "\n\nThe system will automatically check and update when payment is received.");
        } else {
          alert("⏳ Checking transaction...\n\nIf you have already paid, please wait a moment. The system will automatically confirm.");
        }
      }
    } catch (error) {
      console.error("Error checking payment:", error);
      alert("❌ Unable to check payment status. Please try again later.");
    } finally {
      setChecking(false);
    }
  };

  // Countdown timer (updates every second)
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          return 360; // Reset to 6 minutes
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Auto check payment status every 6 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      checkPaymentStatus();
      setCountdown(360); // Reset countdown after check
    }, 360000); // Check every 6 minutes

    return () => clearInterval(interval);
  }, [orderNumber]);

  // Format countdown as MM:SS
  const formatCountdown = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Payment</h1>
        <div style={styles.subtitle}>Payment by Bank Transfer</div>

        <div style={styles.amountSection}>
          <div style={styles.amountLabel}>Total Amount:</div>
          <div style={styles.amountValue}>
            {paymentInfo.amount?.toLocaleString('vi-VN')}₫
          </div>
          <div style={styles.countdownTimer}>
            {formatCountdown(countdown)}
          </div>
        </div>

        {/* QR Code Section */}
        <div style={styles.qrSection}>
          <img
            src={paymentInfo.qrCodeUrl}
            alt="VietQR Payment QR Code"
            style={styles.qrImage}
          />
          <div style={styles.qrLogos}>
            <img
              src="https://vietqr.io/img/logo.svg"
              alt="VietQR"
              style={styles.vietqrLogo}
            />
            <div style={styles.logoSeparator}>|</div>
            <div style={styles.bankLogo}>
              {paymentInfo.bankInfo?.bankId || 'BIDV'}
            </div>
          </div>
          <div style={styles.qrFooter}>
            <div style={styles.accountName}>{paymentInfo.bankInfo?.accountName}</div>
            <div style={styles.accountNumber}>Account No: {paymentInfo.bankInfo?.accountNo}</div>
          </div>
        </div>

        {/* Instructions */}
        <div style={styles.instructions}>
          <div style={styles.instructionTitle}>
            Follow these instructions to complete payment:
          </div>
          <div style={styles.steps}>
            <div style={styles.step}>
              <span style={styles.stepNumber}>Step 1:</span> Open your{" "}
              <strong>Mobile Banking</strong> app
            </div>
            <div style={styles.step}>
              <span style={styles.stepNumber}>Step 2:</span> Select "
              <strong>Payment</strong>" and scan the QR code below
            </div>
            <div style={styles.step}>
              <span style={styles.stepNumber}>Step 3:</span> Enter the amount to
              transfer:{" "}
              <strong style={styles.highlightAmount}>
                {paymentInfo.amount?.toLocaleString('vi-VN')}₫
              </strong>{" "}
              and transfer content{" "}
              <div style={styles.transferContent}>
                <strong style={styles.transferCode}>
                  {paymentInfo.description}
                </strong>
                <button
                  style={styles.copyButton}
                  onClick={() => copyToClipboard(paymentInfo.description)}
                >
                  {copied ? "✓ Copied" : "Copy"}
                </button>
              </div>
              <div style={styles.transferNote}>
                ({paymentInfo.description || "ORDER + Order Code"})
              </div>
            </div>
            <div style={styles.step}>
              <div style={styles.bankDetails}>
                <div style={styles.bankDetailRow}>
                  <span>Bank:</span>
                  <strong>{paymentInfo.bankInfo?.bankId}</strong>
                </div>
                <div style={styles.bankDetailRow}>
                  <span>Name:</span>
                  <strong>{paymentInfo.bankInfo?.accountName}</strong>
                </div>
                <div style={styles.bankDetailRow}>
                  <span>Account No:</span>
                  <strong>{paymentInfo.bankInfo?.accountNo}</strong>
                </div>
                <div style={styles.bankDetailRow}>
                  <span>Branch:</span>
                  <strong>{paymentInfo.bankInfo?.branch}</strong>
                </div>
              </div>
            </div>
            <div style={styles.step}>
              <span style={styles.stepNumber}>Step 4:</span> Complete payment
              <div style={styles.stepNote}>
                💡 After successful transfer, click "Check Transaction" button 
                or wait for automatic confirmation (checks every 6 minutes)
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={styles.actions}>
          <button style={styles.backButton} onClick={onBack}>
            ← Back
          </button>
          <button
            style={{
              ...styles.checkButton,
              ...(checking ? styles.checkButtonDisabled : {}),
            }}
            onClick={checkPaymentStatus}
            disabled={checking}
          >
            {checking ? "⏳ Checking..." : "🔍 Check Transaction"}
          </button>
        </div>

        {/* Order Info */}
        <div style={styles.orderInfo}>
          <div style={styles.orderLabel}>Order Code:</div>
          <div style={styles.orderValue}>{orderNumber}</div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#f5f5f5",
    padding: "2rem",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: "16px",
    padding: "2.5rem",
    maxWidth: "600px",
    width: "100%",
    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
  },
  title: {
    fontSize: "2rem",
    fontWeight: "700",
    color: "#2c3e50",
    margin: "0 0 0.5rem 0",
    textAlign: "center",
  },
  subtitle: {
    fontSize: "1rem",
    color: "#7f8c8d",
    textAlign: "center",
    marginBottom: "1.5rem",
  },
  amountSection: {
    backgroundColor: "#f8f9fa",
    padding: "1.25rem",
    borderRadius: "12px",
    marginBottom: "2rem",
    textAlign: "center",
  },
  amountLabel: {
    fontSize: "0.95rem",
    color: "#6c757d",
    marginBottom: "0.5rem",
  },
  amountValue: {
    fontSize: "2rem",
    fontWeight: "700",
    color: "#e74c3c",
  },
  countdownTimer: {
    fontSize: "1.1rem",
    fontWeight: "600",
    color: "#667eea",
    marginTop: "0.75rem",
    letterSpacing: "0.05em",
  },
  qrSection: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "1.5rem",
    backgroundColor: "#fff",
    borderRadius: "12px",
    border: "2px solid #e9ecef",
    marginBottom: "2rem",
  },
  qrImage: {
    width: "280px",
    height: "280px",
    marginBottom: "1rem",
  },
  qrLogos: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    marginBottom: "1rem",
  },
  vietqrLogo: {
    height: "24px",
  },
  logoSeparator: {
    color: "#dee2e6",
    fontSize: "1.5rem",
  },
  bankLogo: {
    fontSize: "1.2rem",
    fontWeight: "700",
    color: "#1e88e5",
  },
  qrFooter: {
    textAlign: "center",
  },
  accountName: {
    fontSize: "1rem",
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: "0.25rem",
  },
  accountNumber: {
    fontSize: "0.9rem",
    color: "#6c757d",
  },
  instructions: {
    backgroundColor: "#f8f9fa",
    padding: "1.5rem",
    borderRadius: "12px",
    marginBottom: "2rem",
  },
  instructionTitle: {
    fontSize: "1rem",
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: "1rem",
  },
  steps: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  step: {
    fontSize: "0.95rem",
    color: "#495057",
    lineHeight: "1.6",
  },
  stepNumber: {
    fontWeight: "600",
    color: "#667eea",
  },
  stepNote: {
    marginTop: "0.5rem",
    padding: "0.75rem",
    backgroundColor: "#fff",
    borderRadius: "6px",
    fontSize: "0.9rem",
    color: "#667eea",
    borderLeft: "3px solid #667eea",
  },
  highlightAmount: {
    color: "#e74c3c",
  },
  transferContent: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    marginTop: "0.5rem",
    padding: "0.75rem",
    backgroundColor: "#fff",
    borderRadius: "8px",
    border: "1px solid #dee2e6",
  },
  transferCode: {
    flex: 1,
    color: "#667eea",
    fontSize: "1rem",
  },
  copyButton: {
    padding: "0.4rem 0.8rem",
    backgroundColor: "#667eea",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.85rem",
    fontWeight: "500",
    transition: "background-color 0.2s",
  },
  transferNote: {
    fontSize: "0.8rem",
    color: "#6c757d",
    fontStyle: "italic",
    marginTop: "0.25rem",
  },
  bankDetails: {
    backgroundColor: "#fff",
    padding: "1rem",
    borderRadius: "8px",
    marginTop: "0.5rem",
    border: "1px solid #dee2e6",
  },
  bankDetailRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "0.5rem 0",
    borderBottom: "1px solid #f1f3f5",
    fontSize: "0.9rem",
  },
  actions: {
    display: "flex",
    gap: "1rem",
    marginBottom: "1.5rem",
  },
  backButton: {
    flex: 1,
    padding: "0.9rem",
    backgroundColor: "#fff",
    color: "#667eea",
    border: "2px solid #667eea",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "0.95rem",
    fontWeight: "600",
    transition: "all 0.2s",
  },
  checkButton: {
    flex: 1,
    padding: "0.9rem",
    backgroundColor: "#667eea",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "0.95rem",
    fontWeight: "600",
    transition: "background-color 0.2s",
  },
  checkButtonDisabled: {
    backgroundColor: "#95a5a6",
    cursor: "not-allowed",
  },
  orderInfo: {
    textAlign: "center",
    padding: "1rem",
    backgroundColor: "#f8f9fa",
    borderRadius: "8px",
  },
  orderLabel: {
    fontSize: "0.85rem",
    color: "#6c757d",
    marginBottom: "0.25rem",
  },
  orderValue: {
    fontSize: "1.1rem",
    fontWeight: "600",
    color: "#2c3e50",
  },
};

export default VietQRPayment;
