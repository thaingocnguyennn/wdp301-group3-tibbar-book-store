import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";

const EbookReaderPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const blobUrlRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const loadEbook = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem("accessToken");
        const apiBase =
          import.meta.env.VITE_API_URL || "http://localhost:5000/api";

        const response = await fetch(`${apiBase}/books/${id}/ebook`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          if (response.status === 403) {
            throw new Error(
              "Please complete payment to read this e-book.",
            );
          } else if (response.status === 404) {
            throw new Error("E-book file not found.");
          } else {
            throw new Error("Failed to load e-book. Please try again.");
          }
        }

        const blob = await response.blob();
        if (cancelled) return;

        const url = URL.createObjectURL(blob);
        blobUrlRef.current = url;
        setBlobUrl(url);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadEbook();

    return () => {
      cancelled = true;
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [id]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate(`/books/${id}`)}>
          ← Back to Book
        </button>
        <h2 style={styles.heading}>📖 E-Book Reader</h2>
      </div>

      {loading && (
        <div style={styles.centeredState}>
          <div style={styles.spinner} />
          <p style={styles.stateText}>Loading e-book...</p>
        </div>
      )}

      {!loading && error && (
        <div style={styles.centeredState}>
          <div style={styles.errorCard}>
            <div style={styles.lockIcon}>🔒</div>
            <p style={styles.errorMsg}>{error}</p>
            <div style={styles.errorActions}>
              <button style={styles.actionBtn} onClick={() => navigate(`/books/${id}`)}>
                ← Back to Book
              </button>
              <button style={styles.actionBtnSecondary} onClick={() => navigate("/orders")}>
                View My Orders
              </button>
            </div>
          </div>
        </div>
      )}

      {!loading && !error && blobUrl && (
        <iframe
          src={blobUrl}
          style={styles.pdfFrame}
          title="E-Book Reader"
        />
      )}
    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#1a1a2e",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "1.5rem",
    padding: "1rem 1.5rem",
    backgroundColor: "#16213e",
    borderBottom: "1px solid #0f3460",
    flexShrink: 0,
  },
  backBtn: {
    backgroundColor: "transparent",
    color: "#a78bfa",
    border: "1px solid #a78bfa",
    borderRadius: "6px",
    padding: "0.4rem 0.9rem",
    cursor: "pointer",
    fontSize: "0.9rem",
    fontWeight: "600",
    transition: "all 0.2s",
  },
  heading: {
    color: "#e2e8f0",
    margin: 0,
    fontSize: "1.2rem",
    fontWeight: "700",
  },
  centeredState: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "1rem",
    padding: "3rem",
  },
  spinner: {
    width: "50px",
    height: "50px",
    border: "4px solid #374151",
    borderTop: "4px solid #8b5cf6",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  stateText: {
    color: "#9ca3af",
    fontSize: "1rem",
    margin: 0,
  },
  errorCard: {
    backgroundColor: "#1e1e3f",
    border: "1px solid #4c1d95",
    borderRadius: "12px",
    padding: "2.5rem",
    textAlign: "center",
    maxWidth: "480px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "1.25rem",
  },
  lockIcon: {
    fontSize: "3.5rem",
  },
  errorMsg: {
    color: "#f87171",
    fontSize: "1rem",
    fontWeight: "500",
    margin: 0,
    lineHeight: "1.6",
  },
  errorActions: {
    display: "flex",
    gap: "0.75rem",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  actionBtn: {
    backgroundColor: "#7c3aed",
    color: "#fff",
    border: "none",
    borderRadius: "7px",
    padding: "0.6rem 1.2rem",
    cursor: "pointer",
    fontSize: "0.9rem",
    fontWeight: "600",
  },
  actionBtnSecondary: {
    backgroundColor: "transparent",
    color: "#a78bfa",
    border: "1px solid #a78bfa",
    borderRadius: "7px",
    padding: "0.6rem 1.2rem",
    cursor: "pointer",
    fontSize: "0.9rem",
    fontWeight: "600",
  },
  pdfFrame: {
    flex: 1,
    width: "100%",
    border: "none",
    minHeight: "calc(100vh - 68px)",
  },
};

export default EbookReaderPage;
