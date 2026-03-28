import { useEffect, useMemo, useState } from "react";
import { supportSystemApi } from "../../api/supportSystemApi";

const statusLabelsFallback = {
  in_progress: "Dang xu ly",
  resolved_success: "Da xu ly thanh cong",
};

const AdminSupportSystemPage = () => {
  const [tickets, setTickets] = useState([]);
  const [statuses, setStatuses] = useState(statusLabelsFallback);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [replyDraftByTicket, setReplyDraftByTicket] = useState({});
  const [savingTicketId, setSavingTicketId] = useState("");

  const activeTickets = useMemo(
    () => tickets.filter((ticket) => ticket.status !== "resolved_success"),
    [tickets],
  );

  const loadTickets = async () => {
    try {
      setLoading(true);
      const response = await supportSystemApi.getAdminTickets();
      setTickets(response?.data?.tickets || []);
      setStatuses(response?.data?.statuses || statusLabelsFallback);
      setError("");
    } catch (err) {
      setError(err?.response?.data?.message || "Khong tai duoc support system inbox");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const updateTicketInList = (updatedTicket) => {
    setTickets((prev) => prev.map((item) => (item._id === updatedTicket._id ? updatedTicket : item)));
  };

  const handleReply = async (ticketId) => {
    const content = (replyDraftByTicket[ticketId] || "").trim();
    if (!content) return;

    try {
      setSavingTicketId(ticketId);
      const response = await supportSystemApi.addAdminReply(ticketId, content);
      updateTicketInList(response?.data?.ticket);
      setReplyDraftByTicket((prev) => ({ ...prev, [ticketId]: "" }));
    } catch (err) {
      setError(err?.response?.data?.message || "Khong gui duoc phan hoi");
    } finally {
      setSavingTicketId("");
    }
  };

  const handleMarkResolved = async (ticketId) => {
    try {
      setSavingTicketId(ticketId);
      const response = await supportSystemApi.updateAdminTicketStatus(ticketId, "resolved_success", "Da xu ly xong");
      updateTicketInList(response?.data?.ticket);
    } catch (err) {
      setError(err?.response?.data?.message || "Khong cap nhat duoc trang thai");
    } finally {
      setSavingTicketId("");
    }
  };

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Support System</h1>
      <p style={styles.subtitle}>Xu ly ticket he thong cua khach hang, tach rieng voi Support Inbox chat.</p>

      {error && <div style={styles.error}>{error}</div>}

      {loading ? (
        <div style={styles.placeholder}>Dang tai danh sach ticket...</div>
      ) : activeTickets.length === 0 ? (
        <div style={styles.placeholder}>Khong co ticket dang xu ly.</div>
      ) : (
        <div style={styles.ticketGrid}>
          {activeTickets.map((ticket) => (
            <div key={ticket._id} style={styles.ticketCard}>
              <div style={styles.topRow}>
                <strong>{ticket.ticketCode}</strong>
                <span style={styles.statusInProgress}>{statuses[ticket.status] || "Dang xu ly"}</span>
              </div>

              <div style={styles.meta}>
                Khach hang: {(ticket.customer?.firstName || "") + " " + (ticket.customer?.lastName || "")} {ticket.customer?.email ? `(${ticket.customer.email})` : ""}
              </div>
              <div style={styles.meta}>Tao luc: {new Date(ticket.createdAt).toLocaleString()}</div>

              <div style={styles.sectionTitle}>Loi da chon</div>
              <ul style={styles.issueList}>
                {(ticket.selectedIssues || []).map((issue) => (
                  <li key={`${ticket._id}-${issue.issueKey}`}>{issue.label}</li>
                ))}
              </ul>

              <div style={styles.sectionTitle}>Mo ta</div>
              <div style={styles.description}>{ticket.description}</div>

              {(ticket.adminReplies || []).length > 0 && (
                <>
                  <div style={styles.sectionTitle}>Phan hoi da gui</div>
                  <div style={styles.replyList}>
                    {ticket.adminReplies.map((reply, index) => (
                      <div key={`${ticket._id}-${index}`} style={styles.replyItem}>
                        <div>{reply.content}</div>
                        <div style={styles.replyTime}>{new Date(reply.createdAt).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <textarea
                rows={3}
                placeholder="Nhap noi dung phan hoi cho ticket..."
                value={replyDraftByTicket[ticket._id] || ""}
                onChange={(e) =>
                  setReplyDraftByTicket((prev) => ({
                    ...prev,
                    [ticket._id]: e.target.value,
                  }))
                }
                style={styles.textarea}
              />

              <div style={styles.actions}>
                <button
                  type="button"
                  style={styles.replyButton}
                  disabled={savingTicketId === ticket._id}
                  onClick={() => handleReply(ticket._id)}
                >
                  Gui phan hoi
                </button>
                <button
                  type="button"
                  style={styles.resolveButton}
                  disabled={savingTicketId === ticket._id}
                  onClick={() => handleMarkResolved(ticket._id)}
                >
                  Danh dau da xu ly
                </button>
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
    maxWidth: "1180px",
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
    marginBottom: "0.85rem",
  },
  placeholder: {
    backgroundColor: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    padding: "1rem",
    color: "#475569",
  },
  ticketGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "0.9rem",
  },
  ticketCard: {
    backgroundColor: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "0.95rem",
    display: "grid",
    gap: "0.6rem",
  },
  topRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "0.5rem",
    flexWrap: "wrap",
  },
  statusInProgress: {
    backgroundColor: "#fef3c7",
    color: "#92400e",
    borderRadius: "999px",
    padding: "0.2rem 0.65rem",
    fontSize: "0.8rem",
    fontWeight: 700,
  },
  meta: {
    color: "#64748b",
    fontSize: "0.84rem",
  },
  sectionTitle: {
    marginTop: "0.2rem",
    fontWeight: 700,
    color: "#1e293b",
  },
  issueList: {
    margin: 0,
    paddingLeft: "1rem",
    color: "#334155",
  },
  description: {
    color: "#334155",
    whiteSpace: "pre-wrap",
  },
  replyList: {
    display: "grid",
    gap: "0.45rem",
  },
  replyItem: {
    border: "1px solid #dbeafe",
    backgroundColor: "#f8fbff",
    borderRadius: "8px",
    padding: "0.5rem",
    color: "#1e293b",
  },
  replyTime: {
    fontSize: "0.8rem",
    color: "#64748b",
    marginTop: "0.25rem",
  },
  textarea: {
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    padding: "0.65rem",
    fontFamily: "inherit",
    resize: "vertical",
  },
  actions: {
    display: "flex",
    gap: "0.5rem",
    flexWrap: "wrap",
  },
  replyButton: {
    border: "none",
    borderRadius: "8px",
    backgroundColor: "#0369a1",
    color: "#fff",
    padding: "0.55rem 0.9rem",
    fontWeight: 700,
    cursor: "pointer",
  },
  resolveButton: {
    border: "none",
    borderRadius: "8px",
    backgroundColor: "#16a34a",
    color: "#fff",
    padding: "0.55rem 0.9rem",
    fontWeight: 700,
    cursor: "pointer",
  },
};

export default AdminSupportSystemPage;
