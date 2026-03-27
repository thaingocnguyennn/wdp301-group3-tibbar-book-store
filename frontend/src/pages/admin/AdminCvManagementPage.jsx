import { useEffect, useMemo, useState } from "react";
import { cvApi } from "../../api/cvApi";

const STATUS_OPTIONS = ["PENDING", "ACCEPTED", "REJECTED"];
const STATUS_LABELS = {
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
};

const AdminCvManagementPage = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [keyword, setKeyword] = useState("");
  const [savingId, setSavingId] = useState("");
  const [reviewDrafts, setReviewDrafts] = useState({});

  const serverBaseUrl = useMemo(() => {
    const api = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    return api.replace(/\/api\/?$/, "");
  }, []);

  const resolveFileUrl = (path) => {
    if (!path) return "";
    return path.startsWith("http") ? path : `${serverBaseUrl}${path}`;
  };

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== "all") params.status = statusFilter;
      if (keyword.trim()) params.keyword = keyword.trim();

      const response = await cvApi.getAdminCvApplications(params);
      const list = response?.data?.applications || [];
      setApplications(list);
      setReviewDrafts((prev) => {
        const next = { ...prev };
        list.forEach((item) => {
          if (!next[item._id]) {
            next[item._id] = {
              status: item.status === "PENDING" ? "ACCEPTED" : item.status,
              adminNote: item.adminNote || "",
            };
          }
        });
        return next;
      });
      setError("");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load CV applications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [statusFilter]);

  const handleSearch = async (e) => {
    e.preventDefault();
    fetchApplications();
  };

  const setDraft = (id, key, value) => {
    setReviewDrafts((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || {}),
        [key]: value,
      },
    }));
  };

  const handleUpdateStatus = async (item) => {
    const draft = reviewDrafts[item._id] || {};
    const status = String(draft.status || "").toUpperCase();

    if (!["ACCEPTED", "REJECTED"].includes(status)) {
      setError("Please choose Accepted or Rejected");
      return;
    }

    try {
      setSavingId(item._id);
      setError("");
      setMessage("");

      const response = await cvApi.updateAdminCvStatus(item._id, {
        status,
        adminNote: draft.adminNote || "",
      });

      const updated = response?.data?.application;
      setApplications((prev) => prev.map((cv) => (cv._id === item._id ? updated : cv)));
      setMessage("CV status updated successfully");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update CV status");
    } finally {
      setSavingId("");
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>CV Management</h1>

      {message && <div style={styles.success}>{message}</div>}
      {error && <div style={styles.error}>{error}</div>}

      <form onSubmit={handleSearch} style={styles.filterRow}>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={styles.select}
        >
          <option value="all">All status</option>
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status]}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Search by name, email or file"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          style={styles.input}
        />

        <button type="submit" style={styles.searchButton}>Search</button>
      </form>

      {loading ? (
        <div style={styles.info}>Loading...</div>
      ) : applications.length === 0 ? (
        <div style={styles.info}>No CV applications found.</div>
      ) : (
        <div style={styles.list}>
          {applications.map((item) => {
            const draft = reviewDrafts[item._id] || { status: "ACCEPTED", adminNote: "" };
            const customerName = item.fullName || item.customer?.email || "Unknown";

            return (
              <div key={item._id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <h3 style={styles.cardTitle}>{customerName}</h3>
                  <span style={styles.statusChip}>{STATUS_LABELS[item.status] || item.status}</span>
                </div>

                <p style={styles.meta}><strong>Email:</strong> {item.email}</p>
                <p style={styles.meta}><strong>Uploaded:</strong> {new Date(item.createdAt).toLocaleString()}</p>
                <p style={styles.meta}><strong>Admin Note:</strong> {item.adminNote || "-"}</p>
                <p style={styles.meta}>
                  <strong>PDF:</strong>{" "}
                  <a href={resolveFileUrl(item.cvFileUrl)} target="_blank" rel="noreferrer" style={styles.link}>
                    {item.originalFileName || "View CV"}
                  </a>
                </p>

                {item.status === "PENDING" ? (
                  <div style={styles.reviewBox}>
                    <select
                      value={draft.status}
                      onChange={(e) => setDraft(item._id, "status", e.target.value)}
                      style={styles.select}
                    >
                      <option value="ACCEPTED">Accept</option>
                      <option value="REJECTED">Reject</option>
                    </select>
                    <textarea
                      rows={3}
                      placeholder="Small description for candidate"
                      value={draft.adminNote}
                      onChange={(e) => setDraft(item._id, "adminNote", e.target.value)}
                      style={styles.textarea}
                    />
                    <button
                      onClick={() => handleUpdateStatus(item)}
                      disabled={savingId === item._id}
                      style={styles.updateButton}
                    >
                      {savingId === item._id ? "Saving..." : "Update status"}
                    </button>
                  </div>
                ) : (
                  <p style={styles.reviewed}>Reviewed at: {item.reviewedAt ? new Date(item.reviewedAt).toLocaleString() : "-"}</p>
                )}
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
    padding: "2rem",
  },
  title: {
    marginTop: 0,
    color: "#1f2937",
  },
  success: {
    background: "#ecfdf3",
    color: "#166534",
    border: "1px solid #86efac",
    padding: "0.7rem",
    borderRadius: "8px",
    marginBottom: "0.8rem",
  },
  error: {
    background: "#fef2f2",
    color: "#991b1b",
    border: "1px solid #fecaca",
    padding: "0.7rem",
    borderRadius: "8px",
    marginBottom: "0.8rem",
  },
  filterRow: {
    display: "grid",
    gridTemplateColumns: "180px 1fr 120px",
    gap: "0.7rem",
    marginBottom: "1rem",
  },
  select: {
    padding: "0.62rem",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
  },
  input: {
    padding: "0.62rem",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
  },
  searchButton: {
    border: "none",
    borderRadius: "8px",
    background: "#2563eb",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 700,
  },
  info: {
    color: "#6b7280",
  },
  list: {
    display: "grid",
    gap: "1rem",
  },
  card: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "1rem",
    boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "1rem",
    marginBottom: "0.4rem",
  },
  cardTitle: {
    margin: 0,
    color: "#111827",
  },
  statusChip: {
    fontSize: "0.85rem",
    borderRadius: "999px",
    padding: "0.28rem 0.65rem",
    border: "1px solid #d1d5db",
    color: "#374151",
  },
  meta: {
    margin: "0.3rem 0",
    color: "#374151",
  },
  link: {
    color: "#1d4ed8",
    textDecoration: "none",
    fontWeight: 700,
  },
  reviewBox: {
    marginTop: "0.8rem",
    display: "grid",
    gap: "0.6rem",
  },
  textarea: {
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    padding: "0.62rem",
    fontFamily: "inherit",
  },
  updateButton: {
    width: "fit-content",
    border: "none",
    borderRadius: "8px",
    padding: "0.62rem 0.95rem",
    background: "#16a34a",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
  },
  reviewed: {
    marginTop: "0.7rem",
    color: "#6b7280",
    fontSize: "0.92rem",
  },
};

export default AdminCvManagementPage;
