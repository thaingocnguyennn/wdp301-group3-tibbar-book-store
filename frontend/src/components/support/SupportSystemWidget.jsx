import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { supportSystemApi } from "../../api/supportSystemApi";

const MAX_SELECTION = 3;

const SupportSystemWidget = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [open, setOpen] = useState(false);
  const [issueCatalog, setIssueCatalog] = useState([]);
  const [selectedIssueKeys, setSelectedIssueKeys] = useState([]);
  const [description, setDescription] = useState("");
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isCustomer = user?.role === "customer";
  const shouldShowWidget = !isAuthenticated || isCustomer;

  useEffect(() => {
    if (!open || issueCatalog.length > 0) return;

    const loadCatalog = async () => {
      try {
        setLoadingCatalog(true);
        const response = await supportSystemApi.getIssueCatalog();
        setIssueCatalog(response?.data?.issueCatalog || []);
      } catch (err) {
        setError(err?.response?.data?.message || "Khong tai duoc danh sach loi");
      } finally {
        setLoadingCatalog(false);
      }
    };

    loadCatalog();
  }, [open, issueCatalog.length]);

  const canSubmit = useMemo(() => {
    return selectedIssueKeys.length > 0 && selectedIssueKeys.length <= MAX_SELECTION && description.trim().length > 0;
  }, [selectedIssueKeys, description]);

  const handleToggleIssue = (issueKey) => {
    setError("");
    setSuccess("");

    setSelectedIssueKeys((prev) => {
      if (prev.includes(issueKey)) {
        return prev.filter((item) => item !== issueKey);
      }

      if (prev.length >= MAX_SELECTION) {
        setError(`Ban chi duoc chon toi da ${MAX_SELECTION} muc loi`);
        return prev;
      }

      return [...prev, issueKey];
    });
  };

  const handleOpen = () => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: "/support-system/history" } });
      return;
    }

    if (!isCustomer) {
      setError("Tinh nang nay danh cho tai khoan khach hang");
      return;
    }

    setOpen(true);
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit || sending) return;

    try {
      setSending(true);
      setError("");
      setSuccess("");

      await supportSystemApi.createTicket({
        selectedIssueKeys,
        description: description.trim(),
      });

      setSuccess("Gui ticket thanh cong.");
      setSelectedIssueKeys([]);
      setDescription("");
    } catch (err) {
      setError(err?.response?.data?.message || "Gui ticket that bai");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {shouldShowWidget && (
        <button type="button" style={styles.fab} onClick={handleOpen} title="Support System">
          🛠️ Support
        </button>
      )}

      {open && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div style={styles.header}>
              <div>
                <h3 style={styles.title}>Support System Ticket</h3>
                <p style={styles.subtitle}>Chon toi da 3 loi va mo ta chi tiet tinh trang</p>
              </div>
              <button type="button" style={styles.closeButton} onClick={() => setOpen(false)}>✕</button>
            </div>

            {error && <div style={styles.error}>{error}</div>}
            {success && <div style={styles.success}>{success}</div>}

            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.counter}>Da chon: {selectedIssueKeys.length}/{MAX_SELECTION}</div>

              <div style={styles.issueList}>
                {loadingCatalog ? (
                  <div style={styles.loading}>Dang tai danh sach loi...</div>
                ) : (
                  issueCatalog.map((group) => (
                    <div key={group.groupKey} style={styles.groupCard}>
                      <h4 style={styles.groupTitle}>{group.groupLabel}</h4>
                      {(group.issues || []).map((issue) => (
                        <label key={issue.issueKey} style={styles.checkboxLabel}>
                          <input
                            type="checkbox"
                            checked={selectedIssueKeys.includes(issue.issueKey)}
                            onChange={() => handleToggleIssue(issue.issueKey)}
                          />
                          <span>{issue.label}</span>
                        </label>
                      ))}
                    </div>
                  ))
                )}
              </div>

              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mo ta chi tiet loi ban gap..."
                rows={5}
                style={styles.textarea}
                maxLength={2000}
              />

              <div style={styles.actions}>
                <button type="button" style={styles.secondaryButton} onClick={() => navigate("/support-system/history")}>
                  Xem lich su ticket
                </button>
                <button type="submit" style={styles.primaryButton} disabled={!canSubmit || sending}>
                  {sending ? "Dang gui..." : "Gui yeu cau ho tro"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

const styles = {
  fab: {
    position: "fixed",
    right: "170px",
    bottom: "20px",
    zIndex: 1199,
    border: "none",
    borderRadius: "999px",
    padding: "0.9rem 1.1rem",
    background: "linear-gradient(135deg, #0891b2 0%, #0ea5e9 100%)",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 10px 25px rgba(8, 145, 178, 0.35)",
  },
  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    zIndex: 1300,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "1rem",
  },
  modal: {
    width: "780px",
    maxWidth: "100%",
    maxHeight: "92vh",
    overflow: "auto",
    backgroundColor: "#fff",
    borderRadius: "14px",
    boxShadow: "0 20px 45px rgba(2, 6, 23, 0.28)",
    border: "1px solid #e2e8f0",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: "0.8rem",
    padding: "1rem 1rem 0.4rem",
    borderBottom: "1px solid #e2e8f0",
  },
  title: {
    margin: 0,
    color: "#0f172a",
  },
  subtitle: {
    margin: "0.3rem 0 0",
    color: "#475569",
  },
  closeButton: {
    border: "none",
    backgroundColor: "transparent",
    cursor: "pointer",
    fontSize: "1.2rem",
    color: "#475569",
  },
  form: {
    padding: "1rem",
    display: "grid",
    gap: "0.85rem",
  },
  issueList: {
    display: "grid",
    gap: "0.75rem",
  },
  groupCard: {
    border: "1px solid #dbeafe",
    borderRadius: "10px",
    backgroundColor: "#f8fbff",
    padding: "0.75rem",
  },
  groupTitle: {
    margin: "0 0 0.6rem",
    color: "#1e293b",
    fontSize: "1rem",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "flex-start",
    gap: "0.55rem",
    marginBottom: "0.5rem",
    color: "#334155",
  },
  counter: {
    color: "#0369a1",
    fontWeight: 600,
  },
  textarea: {
    border: "1px solid #cbd5e1",
    borderRadius: "10px",
    padding: "0.75rem",
    fontFamily: "inherit",
    fontSize: "0.95rem",
    resize: "vertical",
  },
  actions: {
    display: "flex",
    justifyContent: "space-between",
    gap: "0.7rem",
    flexWrap: "wrap",
  },
  primaryButton: {
    border: "none",
    borderRadius: "10px",
    backgroundColor: "#0284c7",
    color: "#fff",
    padding: "0.65rem 1rem",
    fontWeight: 700,
    cursor: "pointer",
  },
  secondaryButton: {
    border: "1px solid #cbd5e1",
    borderRadius: "10px",
    backgroundColor: "#fff",
    color: "#334155",
    padding: "0.65rem 1rem",
    fontWeight: 600,
    cursor: "pointer",
  },
  error: {
    margin: "0.75rem 1rem 0",
    backgroundColor: "#fee2e2",
    color: "#b91c1c",
    borderRadius: "8px",
    padding: "0.65rem",
  },
  success: {
    margin: "0.75rem 1rem 0",
    backgroundColor: "#dcfce7",
    color: "#166534",
    borderRadius: "8px",
    padding: "0.65rem",
  },
  loading: {
    color: "#475569",
  },
};

export default SupportSystemWidget;
