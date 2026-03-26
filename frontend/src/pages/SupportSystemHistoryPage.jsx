import { useEffect, useState } from "react";
import { supportSystemApi } from "../api/supportSystemApi";

const statusLabelsFallback = {
  in_progress: "Dang xu ly",
  resolved_success: "Da xu ly thanh cong",
};

const SupportSystemHistoryPage = () => {
  const [tickets, setTickets] = useState([]);
  const [statuses, setStatuses] = useState(statusLabelsFallback);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setLoading(true);
        const response = await supportSystemApi.getMyTicketHistory();
        setTickets(response?.data?.tickets || []);
        setStatuses(response?.data?.statuses || statusLabelsFallback);
      } catch (err) {
        setError(err?.response?.data?.message || "Khong tai duoc lich su support system");
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, []);

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Support System History</h1>
      <p style={styles.subtitle}>Lich su ticket he thong duoc luu tach rieng voi support chat.</p>

      {error && <div style={styles.error}>{error}</div>}

      {loading ? (
        <div style={styles.placeholder}>Dang tai du lieu...</div>
      ) : tickets.length === 0 ? (
        <div style={styles.placeholder}>Ban chua gui ticket nao.</div>
      ) : (
        <div style={styles.ticketList}>
          {tickets.map((ticket) => (
            <div key={ticket._id} style={styles.ticketCard}>
              <div style={styles.topRow}>
                <strong>{ticket.ticketCode}</strong>
                <span
                  style={{
                    ...styles.status,
                    ...(ticket.status === "resolved_success" ? styles.statusResolved : styles.statusInProgress),
                  }}
                >
                  {statuses[ticket.status] || statusLabelsFallback[ticket.status] || ticket.status}
                </span>
              </div>

              <div style={styles.meta}>Tao luc: {new Date(ticket.createdAt).toLocaleString()}</div>
              <div style={styles.meta}>Cap nhat: {new Date(ticket.updatedAt).toLocaleString()}</div>

              <div style={styles.sectionTitle}>Muc loi da chon</div>
              <ul style={styles.issueList}>
                {(ticket.selectedIssues || []).map((issue) => (
                  <li key={`${ticket._id}-${issue.issueKey}`}>{issue.label}</li>
                ))}
              </ul>

              <div style={styles.sectionTitle}>Mo ta</div>
              <div style={styles.description}>{ticket.description}</div>

              {(ticket.adminReplies || []).length > 0 && (
                <>
                  <div style={styles.sectionTitle}>Phan hoi tu admin</div>
                  <div style={styles.replyList}>
                    {ticket.adminReplies.map((reply, index) => (
                      <div key={`${ticket._id}-reply-${index}`} style={styles.replyItem}>
                        <div style={styles.replyAuthor}>
                          {(reply.admin?.firstName || "") + " " + (reply.admin?.lastName || "")} {reply.admin?.email ? `(${reply.admin.email})` : ""}
                        </div>
                        <div>{reply.content}</div>
                        <div style={styles.replyTime}>{new Date(reply.createdAt).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  page: {
    maxWidth: "1000px",
    margin: "0 auto",
    padding: "1.6rem",
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
    padding: "0.7rem",
    borderRadius: "8px",
    backgroundColor: "#fee2e2",
    color: "#991b1b",
    marginBottom: "0.8rem",
  },
  placeholder: {
    backgroundColor: "#fff",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
    padding: "1rem",
    color: "#475569",
  },
  ticketList: {
    display: "grid",
    gap: "0.95rem",
  },
  ticketCard: {
    backgroundColor: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "1rem",
  },
  topRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "0.7rem",
    flexWrap: "wrap",
  },
  status: {
    borderRadius: "999px",
    padding: "0.2rem 0.65rem",
    fontSize: "0.82rem",
    fontWeight: 700,
  },
  statusInProgress: {
    backgroundColor: "#fef3c7",
    color: "#92400e",
  },
  statusResolved: {
    backgroundColor: "#dcfce7",
    color: "#166534",
  },
  meta: {
    color: "#64748b",
    fontSize: "0.86rem",
    marginTop: "0.35rem",
  },
  sectionTitle: {
    marginTop: "0.8rem",
    fontWeight: 700,
    color: "#1e293b",
  },
  issueList: {
    margin: "0.4rem 0 0",
    paddingLeft: "1.1rem",
    color: "#334155",
  },
  description: {
    marginTop: "0.35rem",
    color: "#334155",
    whiteSpace: "pre-wrap",
  },
  replyList: {
    marginTop: "0.45rem",
    display: "grid",
    gap: "0.5rem",
  },
  replyItem: {
    border: "1px solid #dbeafe",
    borderRadius: "8px",
    padding: "0.6rem",
    backgroundColor: "#f8fbff",
  },
  replyAuthor: {
    fontWeight: 700,
    color: "#0f172a",
    marginBottom: "0.25rem",
  },
  replyTime: {
    color: "#64748b",
    fontSize: "0.82rem",
    marginTop: "0.25rem",
  },
};

export default SupportSystemHistoryPage;
