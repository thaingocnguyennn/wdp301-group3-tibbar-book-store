import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminOrderApi } from "../../api/orderApi";

const RecentRequestHistoryPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadRecentRequests = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await adminOrderApi.getRecentCustomerRequests(50);
        setRequests(response?.data?.requests || []);
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            "Failed to load recent customer requests",
        );
      } finally {
        setLoading(false);
      }
    };

    loadRecentRequests();
  }, []);

  const formatDateTime = (value) => {
    if (!value) return "-";
    return new Date(value).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const statusColor = (status) => {
    const normalized = String(status || "PENDING").toUpperCase();
    if (normalized === "COMPLETED") return "#15803d";
    if (normalized === "APPROVED") return "#1d4ed8";
    if (normalized === "REJECTED") return "#dc2626";
    return "#b45309";
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Recent Request History</h1>
        <Link to="/admin/dashboard" style={styles.backLink}>
          ← Back to Dashboard
        </Link>
      </div>

      {loading ? (
        <p style={styles.hint}>Loading recent requests...</p>
      ) : error ? (
        <p style={styles.error}>{error}</p>
      ) : requests.length === 0 ? (
        <p style={styles.hint}>No customer requests yet.</p>
      ) : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Order</th>
                <th style={styles.th}>Customer</th>
                <th style={styles.th}>Type</th>
                <th style={styles.th}>Reason</th>
                <th style={styles.th}>Details</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Requested At</th>
                <th style={styles.th}>Reviewed At</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((item) => (
                <tr key={`${item.orderId}-${item.request.requestedAt}`}>
                  <td style={styles.td}>{item.orderNumber}</td>
                  <td style={styles.td}>
                    <div>{item.customer.fullName || "-"}</div>
                    <div style={styles.customerEmail}>
                      {item.customer.email}
                    </div>
                  </td>
                  <td style={styles.td}>{item.request.type || "-"}</td>
                  <td style={styles.td}>{item.request.reason || "-"}</td>
                  <td style={styles.td}>{item.request.details || "-"}</td>
                  <td
                    style={{
                      ...styles.td,
                      color: statusColor(item.request.status),
                      fontWeight: 700,
                    }}
                  >
                    {item.request.status || "PENDING"}
                  </td>
                  <td style={styles.td}>
                    {formatDateTime(item.request.requestedAt)}
                  </td>
                  <td style={styles.td}>
                    {formatDateTime(item.request.reviewedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "2rem",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "1rem",
    marginBottom: "1rem",
    flexWrap: "wrap",
  },
  title: {
    margin: 0,
    color: "#1f2937",
    fontSize: "2rem",
  },
  backLink: {
    color: "#4f46e5",
    textDecoration: "none",
    fontWeight: 600,
  },
  hint: {
    color: "#6b7280",
  },
  error: {
    color: "#dc2626",
  },
  tableWrap: {
    backgroundColor: "#fff",
    borderRadius: "10px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "1100px",
  },
  th: {
    textAlign: "left",
    fontSize: "0.8rem",
    color: "#6b7280",
    backgroundColor: "#f8fafc",
    padding: "0.75rem",
    borderBottom: "1px solid #e5e7eb",
  },
  td: {
    padding: "0.75rem",
    borderBottom: "1px solid #f1f5f9",
    fontSize: "0.88rem",
    color: "#374151",
    verticalAlign: "top",
    lineHeight: 1.4,
  },
  customerEmail: {
    fontSize: "0.78rem",
    color: "#6b7280",
    marginTop: "0.2rem",
  },
};

export default RecentRequestHistoryPage;
