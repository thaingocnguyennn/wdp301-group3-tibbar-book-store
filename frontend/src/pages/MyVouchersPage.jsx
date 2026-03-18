import { useEffect, useState } from "react";
import { voucherApi } from "../api/voucherApi";

const getStatusLabel = (status) => {
  if (status === "USED") return "Used";
  if (status === "EXPIRED") return "Expired";
  return "Available";
};

const getStatusColor = (status) => {
  if (status === "USED") return "#6b7280";
  if (status === "EXPIRED") return "#dc2626";
  return "#16a34a";
};

const MyVouchersPage = () => {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await voucherApi.getMyVouchers();
        setVouchers(response.data?.vouchers || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load your vouchers");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div style={styles.state}>Loading vouchers...</div>;
  }

  if (error) {
    return <div style={styles.error}>{error}</div>;
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>My Vouchers</h1>
      <p style={styles.subtitle}>
        Private vouchers assigned to your account. You can apply eligible
        vouchers at checkout.
      </p>

      {vouchers.length === 0 ? (
        <div style={styles.state}>
          You do not have any assigned vouchers yet.
        </div>
      ) : (
        <div style={styles.grid}>
          {vouchers.map((item) => {
            const voucher = item.voucher;
            const discountText =
              voucher.discountType === "PERCENT"
                ? `${voucher.discountValue}%`
                : `${Number(voucher.discountValue || 0).toLocaleString("vi-VN")}d`;

            return (
              <div key={item._id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <strong style={styles.code}>{voucher.code}</strong>
                  <span
                    style={{
                      ...styles.badge,
                      backgroundColor: getStatusColor(item.status),
                    }}
                  >
                    {getStatusLabel(item.status)}
                  </span>
                </div>

                <div style={styles.value}>Discount: {discountText}</div>
                <div style={styles.line}>
                  Min order:{" "}
                  {Number(voucher.minOrderValue || 0).toLocaleString("vi-VN")}d
                </div>
                <div style={styles.line}>
                  Usage: {item.usageCount}/{item.maxUsage}
                </div>
                <div style={styles.line}>
                  Expiry:{" "}
                  {voucher.expiryDate
                    ? new Date(voucher.expiryDate).toLocaleDateString()
                    : "No expiry"}
                </div>
                <div style={styles.line}>
                  Conditions: {voucher.conditions || "No extra conditions"}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "2rem 1.25rem",
    minHeight: "70vh",
  },
  title: {
    margin: 0,
    fontSize: "2rem",
    color: "#0f172a",
  },
  subtitle: {
    marginTop: "0.5rem",
    color: "#64748b",
  },
  grid: {
    marginTop: "1.25rem",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "0.9rem",
  },
  card: {
    backgroundColor: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "0.9rem",
    boxShadow: "0 2px 8px rgba(15, 23, 42, 0.06)",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "0.6rem",
    gap: "0.5rem",
  },
  code: {
    fontSize: "1rem",
    color: "#1e293b",
  },
  badge: {
    color: "#fff",
    fontSize: "0.72rem",
    fontWeight: 700,
    borderRadius: "999px",
    padding: "0.2rem 0.55rem",
    whiteSpace: "nowrap",
  },
  value: {
    color: "#111827",
    fontWeight: 700,
    marginBottom: "0.35rem",
  },
  line: {
    color: "#475569",
    fontSize: "0.88rem",
    marginBottom: "0.25rem",
  },
  state: {
    marginTop: "1rem",
    color: "#64748b",
  },
  error: {
    maxWidth: "1100px",
    margin: "1rem auto",
    color: "#b91c1c",
    backgroundColor: "#fee2e2",
    border: "1px solid #fecaca",
    borderRadius: "8px",
    padding: "0.75rem 1rem",
  },
};

export default MyVouchersPage;
