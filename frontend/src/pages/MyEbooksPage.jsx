import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { orderApi } from "../api/orderApi";

const MyEbooksPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchEbookOrders();
  }, []);

  const fetchEbookOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await orderApi.getUserOrders(1, 100);
      setOrders(response.data.orders || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load your e-books");
    } finally {
      setLoading(false);
    }
  };

  const ebooks = useMemo(() => {
    const uniqueByBookId = new Map();

    orders.forEach((order) => {
      (order.items || []).forEach((item) => {
        const book = item.book;
        if (!book?._id || !book?.isEbook) return;

        const isPaid = order.paymentStatus === "PAID";

        if (!uniqueByBookId.has(book._id)) {
          uniqueByBookId.set(book._id, {
            _id: book._id,
            title: book.title || item.title || "Untitled E-Book",
            author: book.author || item.author || "Unknown Author",
            imageUrl: book.imageUrl || "",
            price: Number(book.price || item.price || 0),
            latestOrderAt: order.createdAt,
            latestPaidAt: isPaid ? order.createdAt : null,
            hasPaidOrder: isPaid,
          });
          return;
        }

        const existing = uniqueByBookId.get(book._id);

        uniqueByBookId.set(book._id, {
          ...existing,
          latestOrderAt:
            new Date(order.createdAt) > new Date(existing.latestOrderAt)
              ? order.createdAt
              : existing.latestOrderAt,
          latestPaidAt:
            isPaid &&
            (!existing.latestPaidAt ||
              new Date(order.createdAt) > new Date(existing.latestPaidAt))
              ? order.createdAt
              : existing.latestPaidAt,
          hasPaidOrder: existing.hasPaidOrder || isPaid,
        });
      });
    });

    return Array.from(uniqueByBookId.values()).sort(
      (a, b) => new Date(b.latestOrderAt) - new Date(a.latestOrderAt),
    );
  }, [orders]);

  const paidCount = ebooks.filter((book) => book.hasPaidOrder).length;
  const pendingCount = ebooks.length - paidCount;

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingWrap}>
          <div style={styles.spinner} />
          <p style={styles.loadingText}>Loading your e-books...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>📚 My E-Books</h1>
        <p style={styles.subtitle}>
          {ebooks.length > 0
            ? `${paidCount} Ready to read • ${pendingCount} pending payment`
            : "Your e-books will appear here"}
        </p>
      </div>

      {error && (
        <div style={styles.errorBanner}>
          <span>⚠ {error}</span>
        </div>
      )}

      {ebooks.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>📖</div>
          <h2 style={styles.emptyTitle}>No e-books yet</h2>
          <p style={styles.emptyText}>
            Buy an e-book to access your reader library here.
          </p>
          <button style={styles.shopBtn} onClick={() => navigate("/")}>
            Explore Books
          </button>
        </div>
      ) : (
        <div style={styles.grid}>
          {ebooks.map((book) => {
            const imageSrc = book.imageUrl
              ? book.imageUrl.startsWith("http")
                ? book.imageUrl
                : `${import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, "") || "http://localhost:5000"}${book.imageUrl}`
              : "";

            return (
              <div key={book._id} style={styles.card}>
                <div style={styles.coverWrap}>
                  {imageSrc ? (
                    <img src={imageSrc} alt={book.title} style={styles.coverImage} />
                  ) : (
                    <div style={styles.coverPlaceholder}>📘</div>
                  )}
                </div>

                <div style={styles.cardContent}>
                  <h3 style={styles.bookTitle}>{book.title}</h3>
                  <p style={styles.bookAuthor}>by {book.author}</p>
                  {book.hasPaidOrder ? (
                    <span style={styles.paidBadge}>● Paid</span>
                  ) : null}
                  <p style={styles.bookMeta}>
                    {book.hasPaidOrder ? "Purchased" : "Ordered"}: {new Date(book.hasPaidOrder ? book.latestPaidAt : book.latestOrderAt).toLocaleDateString("vi-VN")}
                  </p>
                  <button
                    style={{
                      ...styles.readBtn,
                      ...(!book.hasPaidOrder ? styles.readBtnDisabled : {}),
                    }}
                    onClick={() =>
                      book.hasPaidOrder
                        ? navigate(`/books/${book._id}/read`)
                        : navigate("/orders")
                    }
                  >
                    {book.hasPaidOrder ? "📖 Read Now" : "⏳ Pending Payment"}
                  </button>
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
    padding: "2rem 1.5rem",
    minHeight: "80vh",
  },
  header: {
    marginBottom: "1.5rem",
  },
  title: {
    margin: 0,
    color: "#16213e",
    fontSize: "1.8rem",
    fontWeight: 800,
  },
  subtitle: {
    margin: "0.45rem 0 0",
    color: "#64748b",
    fontSize: "0.95rem",
  },
  loadingWrap: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "55vh",
    gap: "0.9rem",
  },
  spinner: {
    width: "42px",
    height: "42px",
    border: "4px solid #dbeafe",
    borderTopColor: "#1d4ed8",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  loadingText: {
    color: "#64748b",
    margin: 0,
  },
  errorBanner: {
    border: "1px solid #fecaca",
    backgroundColor: "#fef2f2",
    color: "#b91c1c",
    padding: "0.75rem 1rem",
    borderRadius: "8px",
    marginBottom: "1rem",
    fontWeight: 500,
  },
  emptyState: {
    backgroundColor: "#fff",
    borderRadius: "14px",
    border: "1px solid #e2e8f0",
    padding: "2.4rem 1.5rem",
    textAlign: "center",
    boxShadow: "0 6px 20px rgba(15, 23, 42, 0.04)",
  },
  emptyIcon: {
    fontSize: "2.3rem",
    marginBottom: "0.5rem",
  },
  emptyTitle: {
    margin: "0.35rem 0",
    color: "#1e293b",
    fontSize: "1.3rem",
  },
  emptyText: {
    margin: "0.25rem 0 1.1rem",
    color: "#64748b",
  },
  shopBtn: {
    border: "none",
    backgroundColor: "#1d4ed8",
    color: "#fff",
    borderRadius: "8px",
    padding: "0.65rem 1.1rem",
    fontWeight: 700,
    cursor: "pointer",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: "1.1rem",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: "14px",
    border: "1px solid #e7eef7",
    overflow: "hidden",
    boxShadow: "0 6px 20px rgba(15, 23, 42, 0.08)",
    display: "flex",
    flexDirection: "column",
    height: "100%",
  },
  coverWrap: {
    width: "100%",
    aspectRatio: "3 / 4",
    minHeight: "240px",
    overflow: "hidden",
    background: "#f1f5f9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderBottom: "1px solid #e7eef7",
  },
  coverImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    objectPosition: "center",
    transition: "transform 0.3s ease",
  },
  coverPlaceholder: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "4.2rem",
    color: "#bdc3c7",
    background: "linear-gradient(145deg, #f7f9fc 0%, #ecf2f9 100%)",
  },
  cardContent: {
    padding: "0.95rem 1rem 1rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.45rem",
    flex: 1,
  },
  bookTitle: {
    margin: 0,
    fontSize: "1.04rem",
    fontWeight: 700,
    lineHeight: 1.35,
    color: "#0f172a",
    minHeight: "2.8rem",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },
  bookAuthor: {
    margin: 0,
    fontSize: "0.88rem",
    color: "#64748b",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  bookMeta: {
    margin: 0,
    fontSize: "0.82rem",
    color: "#475569",
  },
  paidBadge: {
    display: "inline-flex",
    alignSelf: "flex-start",
    backgroundColor: "#dcfce7",
    color: "#15803d",
    border: "1px solid #86efac",
    borderRadius: "999px",
    padding: "0.2rem 0.55rem",
    fontSize: "0.75rem",
    fontWeight: 700,
  },
  readBtn: {
    marginTop: "0.35rem",
    border: "1px solid #0f3460",
    backgroundColor: "#16213e",
    color: "#fff",
    borderRadius: "6px",
    padding: "0.55rem 0.8rem",
    fontWeight: 700,
    cursor: "pointer",
  },
  readBtnDisabled: {
    backgroundColor: "#9ca3af",
    borderColor: "#9ca3af",
    cursor: "pointer",
  },
};

export default MyEbooksPage;