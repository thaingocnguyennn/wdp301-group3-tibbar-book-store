import { useEffect, useState } from "react";
import { reviewApi } from "../../api/reviewApi";

const ReviewRepliesManagementPage = () => {
  const [reviews, setReviews] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
    limit: 20,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [rating, setRating] = useState("");
  const [replyStatus, setReplyStatus] = useState("all");
  const [replyInputs, setReplyInputs] = useState({});
  const [replyingReviewId, setReplyingReviewId] = useState("");

  const fetchAdminReviews = async (nextPage = 1) => {
    try {
      setLoading(true);
      setError("");
      const response = await reviewApi.getAdminReviews({
        page: nextPage,
        limit: 20,
        search,
        rating,
        replyStatus,
      });
      setReviews(response.data?.reviews || []);
      setPagination(
        response.data?.pagination || {
          page: 1,
          totalPages: 1,
          total: 0,
          limit: 20,
        },
      );
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminReviews(1);
  }, []);

  const handleReply = async (reviewId) => {
    const comment = String(replyInputs[reviewId] || "").trim();
    if (!comment) {
      setError("Please enter reply content");
      return;
    }

    try {
      setReplyingReviewId(reviewId);
      setError("");
      await reviewApi.replyToReview(reviewId, comment);
      setReplyInputs((prev) => ({ ...prev, [reviewId]: "" }));
      await fetchAdminReviews(pagination.page || 1);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit reply");
    } finally {
      setReplyingReviewId("");
    }
  };

  const handleApplyFilters = () => {
    fetchAdminReviews(1);
  };

  const resolveImageUrl = (path) => {
    if (!path) return "";
    const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    const serverBaseUrl = apiBase.replace(/\/api\/?$/, "");
    return path.startsWith("http")
      ? path
      : `${serverBaseUrl}/${String(path).replace(/^\/+/, "")}`;
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Reply Reviews Management</h1>

      <div style={styles.filterRow}>
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by review, book title, customer"
          style={styles.input}
        />

        <select
          value={rating}
          onChange={(event) => setRating(event.target.value)}
          style={styles.input}
        >
          <option value="">All stars</option>
          {[5, 4, 3, 2, 1].map((value) => (
            <option key={value} value={value}>
              {value} stars
            </option>
          ))}
        </select>

        <select
          value={replyStatus}
          onChange={(event) => setReplyStatus(event.target.value)}
          style={styles.input}
        >
          <option value="all">All status</option>
          <option value="pending">Pending reply</option>
          <option value="replied">Replied</option>
        </select>

        <button
          type="button"
          style={styles.applyBtn}
          onClick={handleApplyFilters}
        >
          Apply
        </button>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {loading ? (
        <p style={styles.hint}>Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <p style={styles.hint}>No reviews found.</p>
      ) : (
        <div style={styles.list}>
          {reviews.map((review) => (
            <div key={review._id} style={styles.card}>
              <div style={styles.cardHeader}>
                <div>
                  <strong style={styles.bookTitle}>
                    {review.book?.title || "Unknown book"}
                  </strong>
                  <div style={styles.meta}>
                    Customer: {review.user?.firstName || "User"}{" "}
                    {review.user?.lastName || ""} ({review.user?.email || "N/A"}
                    )
                  </div>
                </div>
                <span style={styles.ratingBadge}>{review.rating}/5</span>
              </div>

              <p style={styles.comment}>{review.comment || "(No comment)"}</p>

              {Array.isArray(review.images) && review.images.length > 0 && (
                <div style={styles.imageRow}>
                  {review.images.map((imagePath, index) => (
                    <img
                      key={`${review._id}-${index}`}
                      src={resolveImageUrl(imagePath)}
                      alt="review"
                      style={styles.image}
                    />
                  ))}
                </div>
              )}

              {Array.isArray(review.replies) && review.replies.length > 0 && (
                <div style={styles.replyList}>
                  {review.replies.map((reply) => (
                    <div
                      key={reply._id || `${review._id}-${reply.createdAt}`}
                      style={styles.replyItem}
                    >
                      <div style={styles.replyMeta}>
                        {reply.user?.firstName || "User"}{" "}
                        {reply.user?.lastName || ""}
                        {reply.role === "admin" || reply.role === "manager"
                          ? " (Admin)"
                          : ""}
                      </div>
                      <div style={styles.replyText}>{reply.comment}</div>
                    </div>
                  ))}
                </div>
              )}

              <div style={styles.replyComposer}>
                <input
                  type="text"
                  value={replyInputs[review._id] || ""}
                  onChange={(event) =>
                    setReplyInputs((prev) => ({
                      ...prev,
                      [review._id]: event.target.value,
                    }))
                  }
                  placeholder="Write admin reply to customer review"
                  style={styles.replyInput}
                />
                <button
                  type="button"
                  onClick={() => handleReply(review._id)}
                  style={styles.replyButton}
                  disabled={replyingReviewId === review._id}
                >
                  {replyingReviewId === review._id ? "Replying..." : "Reply"}
                </button>
              </div>
            </div>
          ))}

          {pagination.totalPages > 1 && (
            <div style={styles.pagination}>
              <button
                type="button"
                style={styles.pageBtn}
                disabled={pagination.page <= 1}
                onClick={() => fetchAdminReviews(pagination.page - 1)}
              >
                Previous
              </button>
              <span style={styles.pageInfo}>
                Page {pagination.page} / {pagination.totalPages}
              </span>
              <button
                type="button"
                style={styles.pageBtn}
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchAdminReviews(pagination.page + 1)}
              >
                Next
              </button>
            </div>
          )}
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
  title: {
    margin: "0 0 1rem",
    fontSize: "2rem",
    color: "#1f2937",
  },
  filterRow: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr 1fr auto",
    gap: "0.65rem",
    marginBottom: "1rem",
  },
  input: {
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    padding: "0.55rem 0.65rem",
    fontSize: "0.9rem",
  },
  applyBtn: {
    border: "none",
    borderRadius: "8px",
    backgroundColor: "#2563eb",
    color: "#fff",
    padding: "0.55rem 0.8rem",
    fontWeight: 600,
    cursor: "pointer",
  },
  error: {
    backgroundColor: "#fee2e2",
    border: "1px solid #fecaca",
    color: "#b91c1c",
    borderRadius: "8px",
    padding: "0.65rem",
    marginBottom: "0.85rem",
  },
  hint: {
    color: "#6b7280",
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "0.85rem",
  },
  card: {
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    backgroundColor: "#fff",
    padding: "0.85rem",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "0.6rem",
  },
  bookTitle: {
    color: "#0f172a",
    fontSize: "1rem",
  },
  meta: {
    marginTop: "0.15rem",
    color: "#6b7280",
    fontSize: "0.82rem",
  },
  ratingBadge: {
    backgroundColor: "#f59e0b",
    color: "#fff",
    borderRadius: "999px",
    padding: "0.2rem 0.55rem",
    fontWeight: 700,
    fontSize: "0.8rem",
    whiteSpace: "nowrap",
  },
  comment: {
    margin: "0.6rem 0",
    color: "#334155",
    lineHeight: 1.5,
  },
  imageRow: {
    display: "flex",
    gap: "0.5rem",
    flexWrap: "wrap",
    marginBottom: "0.55rem",
  },
  image: {
    width: "94px",
    height: "74px",
    objectFit: "cover",
    borderRadius: "6px",
    border: "1px solid #e5e7eb",
  },
  replyList: {
    display: "flex",
    flexDirection: "column",
    gap: "0.4rem",
    marginBottom: "0.55rem",
  },
  replyItem: {
    backgroundColor: "#f8fafc",
    borderLeft: "3px solid #3b82f6",
    borderRadius: "6px",
    padding: "0.4rem 0.55rem",
  },
  replyMeta: {
    fontSize: "0.78rem",
    color: "#1e40af",
    fontWeight: 700,
    marginBottom: "0.1rem",
  },
  replyText: {
    fontSize: "0.84rem",
    color: "#334155",
  },
  replyComposer: {
    display: "flex",
    gap: "0.5rem",
  },
  replyInput: {
    flex: 1,
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    padding: "0.5rem 0.6rem",
  },
  replyButton: {
    border: "none",
    borderRadius: "8px",
    backgroundColor: "#0ea5e9",
    color: "#fff",
    padding: "0.5rem 0.85rem",
    cursor: "pointer",
    fontWeight: 700,
  },
  pagination: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "0.7rem",
    marginTop: "0.5rem",
  },
  pageBtn: {
    border: "1px solid #d1d5db",
    backgroundColor: "#fff",
    borderRadius: "7px",
    padding: "0.4rem 0.75rem",
    cursor: "pointer",
    color: "#1f2937",
    fontWeight: 600,
  },
  pageInfo: {
    color: "#475569",
    fontWeight: 600,
    fontSize: "0.85rem",
  },
};

export default ReviewRepliesManagementPage;
