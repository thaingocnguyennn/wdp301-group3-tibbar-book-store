import { useEffect, useState } from "react";
import { supportSystemApi } from "../../api/supportSystemApi";

const statusLabelsFallback = {
  in_progress: "Dang xu ly",
  resolved_success: "Da xu ly thanh cong",
};

const AdminSupportSystemHistoryPage = () => {
  const [tickets, setTickets] = useState([]);
  const [statuses, setStatuses] = useState(statusLabelsFallback);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setLoading(true);
        const response = await supportSystemApi.getAdminTicketHistory();
        setTickets(response?.data?.tickets || []);
        setStatuses(response?.data?.statuses || statusLabelsFallback);
      } catch (err) {
        setError(err?.response?.data?.message || "Khong tai duoc Support Inbox History");
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, []);

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Support Inbox History</h1>
      <p style={styles.subtitle}>Luu lich su da xu ly cua Support System.</p>

      {error && <div style={styles.error}>{error}</div>}

      {loading ? (
        <div style={styles.placeholder}>Dang tai lich su...</div>
      ) : tickets.length === 0 ? (
        <div style={styles.placeholder}>Chua co ticket da xu ly.</div>
      ) : (
        <div style={styles.ticketList}>
          {tickets.map((ticket) => (
            <div key={ticket._id} style={styles.ticketCard}>
              <div style={styles.topRow}>
                <strong>{ticket.ticketCode}</strong>
                <span style={styles.statusResolved}>
                  {statuses[ticket.status] || statusLabelsFallback[ticket.status] || ticket.status}
                </span>
              </div>

              <div style={styles.meta}>
                Khach hang: {(ticket.customer?.firstName || "") + " " + (ticket.customer?.lastName || "")} {ticket.customer?.email ? `(${ticket.customer.email})` : ""}
              </div>
              <div style={styles.meta}>Thoi gian cap nhat: {new Date(ticket.updatedAt).toLocaleString()}</div>
              {ticket.resolvedAt && <div style={styles.meta}>Thoi gian xu ly xong: {new Date(ticket.resolvedAt).toLocaleString()}</div>}

              <div style={styles.sectionTitle}>Noi dung yeu cau</div>
              <div style={styles.description}>{ticket.description}</div>

              <div style={styles.sectionTitle}>Lich su xu ly</div>
              <div style={styles.historyList}>
                {(ticket.history || []).map((entry, index) => (
                  <div key={`${ticket._id}-history-${index}`} style={styles.historyItem}>
                    <div style={styles.historyType}>{entry.type}</div>
                    {entry.content && <div>{entry.content}</div>}
                    {(entry.statusFrom || entry.statusTo) && (
                      <div style={styles.historyStatus}>
                        {entry.statusFrom || "-"} → {entry.statusTo || "-"}
                      </div>
                    )}
                    <div style={styles.historyTime}>{new Date(entry.createdAt).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  page: {
    maxWidth: "1080px",
    margin: "0 auto",
    padding: "1.5rem",
  },
  title: {
    margin: "0 0 0.35rem",
    color: "#0f172a",
  },
  subtitle: {
    marginTop: 0,
    color: "#475569",
  },
  error: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
    borderRadius: "8px",
    padding: "0.65rem",
    marginBottom: "0.8rem",
  },
  placeholder: {
    backgroundColor: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    padding: "1rem",
    color: "#475569",
  },
  ticketList: {
    display: "grid",
    gap: "0.85rem",
  },
  ticketCard: {
    backgroundColor: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "0.95rem",
  },
  topRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "0.5rem",
  },
  statusResolved: {
    backgroundColor: "#dcfce7",
    color: "#166534",
    borderRadius: "999px",
    padding: "0.2rem 0.65rem",
    fontSize: "0.8rem",
    fontWeight: 700,
  },
  meta: {
    color: "#64748b",
    marginTop: "0.3rem",
    fontSize: "0.85rem",
  },
  sectionTitle: {
    marginTop: "0.7rem",
    fontWeight: 700,
    color: "#1e293b",
  },
  description: {
    marginTop: "0.35rem",
    color: "#334155",
    whiteSpace: "pre-wrap",
  },
  historyList: {
    marginTop: "0.45rem",
    display: "grid",
    gap: "0.45rem",
  },
  historyItem: {
    border: "1px solid #dbeafe",
    borderRadius: "8px",
    padding: "0.5rem",
    backgroundColor: "#f8fbff",
    color: "#1e293b",
  },
  historyType: {
    fontWeight: 700,
    color: "#0f172a",
    marginBottom: "0.15rem",
  },
  historyStatus: {
    fontSize: "0.82rem",
    color: "#334155",
    marginTop: "0.15rem",
  },
  historyTime: {
    fontSize: "0.8rem",
    color: "#64748b",
    marginTop: "0.2rem",
  },
};

export default AdminSupportSystemHistoryPage;
