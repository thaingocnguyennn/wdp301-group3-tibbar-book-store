import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { bookApi } from "../api/bookApi";
import { reviewApi } from "../api/reviewApi";
import { useCart } from "../hooks/useCart";
import { useAuth } from "../hooks/useAuth";

const BookDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { add } = useCart();
  const { isAuthenticated } = useAuth();
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const serverBaseUrl = apiBase.replace(/\/api\/?$/, '');
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ebookAccess, setEbookAccess] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewSummary, setReviewSummary] = useState({ averageRating: 0, totalReviews: 0 });
  const [reviewPagination, setReviewPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 10 });
  const [reviewLoading, setReviewLoading] = useState(true);
  const [reviewError, setReviewError] = useState("");
  const [myReview, setMyReview] = useState(null);
  const [ratingInput, setRatingInput] = useState(5);
  const [commentInput, setCommentInput] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [ebookActionMessage, setEbookActionMessage] = useState("");

  useEffect(() => {
    fetchBook();
    fetchReviews(1);
  }, [id]);

  useEffect(() => {
    if (isAuthenticated && id) {
      fetchMyReview();
    }
  }, [id, isAuthenticated]);

  const fetchBook = async () => {
    try {
      setLoading(true);
      const response = await bookApi.getBookById(id);
      const fetchedBook = response.data.book;
      setBook(fetchedBook);
      // After fetching book, check ebook access if applicable
      if (fetchedBook?.isEbook && isAuthenticated) {
        fetchEbookAccess(id);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Book not found");
    } finally {
      setLoading(false);
    }
  };

  const fetchEbookAccess = async (bookId) => {
    try {
      const response = await bookApi.checkEbookAccess(bookId);
      setEbookAccess(response.data);
      return response.data;
    } catch {
      const fallbackAccess = { hasAccess: false, paymentStatus: null };
      setEbookAccess(fallbackAccess);
      return fallbackAccess;
    }
  };

  const handleReadEbook = async () => {
    if (!isAuthenticated) {
      setEbookActionMessage("⚠️ Please login to read this e-book.");
      return;
    }

    const access = ebookAccess ?? (await fetchEbookAccess(id));

    if (access?.hasAccess) {
      setEbookActionMessage("");
      navigate(`/books/${id}/read`);
      return;
    }

    setEbookActionMessage("⚠️ Please complete payment to read this e-book.");
  };

  const fetchReviews = async (page = 1) => {
    try {
      setReviewLoading(true);
      setReviewError("");
      const response = await reviewApi.getBookReviews(id, page, 10);
      setReviews(response.data.reviews || []);
      setReviewSummary(response.data.summary || { averageRating: 0, totalReviews: 0 });
      setReviewPagination(
        response.data.pagination || { page: 1, totalPages: 1, total: 0, limit: 10 },
      );
    } catch (err) {
      setReviewError(err.response?.data?.message || "Failed to load reviews");
    } finally {
      setReviewLoading(false);
    }
  };

  const fetchMyReview = async () => {
    try {
      const response = await reviewApi.getMyReviewForBook(id);
      const review = response.data.review;
      setMyReview(review || null);

      if (review) {
        setRatingInput(review.rating);
        setCommentInput(review.comment || "");
      } else {
        setRatingInput(5);
        setCommentInput("");
      }
    } catch (err) {
      setMyReview(null);
    }
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      alert("Please login to add items to cart");
      navigate("/login");
      return;
    }

    try {
      await add(book._id, 1);
      alert("Added to cart");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add to cart");
    }
  };

  const handleSubmitReview = async () => {
    if (!isAuthenticated) {
      alert("Please login to write a review");
      navigate("/login", { state: { from: `/books/${id}` } });
      return;
    }

    try {
      setReviewSubmitting(true);
      setReviewError("");

      const payload = {
        rating: Number(ratingInput),
        comment: commentInput.trim(),
      };

      if (myReview?._id) {
        await reviewApi.updateReview(myReview._id, payload);
      } else {
        await reviewApi.createReview(id, payload);
      }

      await Promise.all([fetchReviews(1), fetchMyReview()]);
    } catch (err) {
      setReviewError(
        err.response?.data?.message || "Failed to submit review",
      );
    } finally {
      setReviewSubmitting(false);
    }
  };

  const renderStars = (rating) => {
    const rounded = Math.round(Number(rating) || 0);
    return "★★★★★".slice(0, rounded) + "☆☆☆☆☆".slice(rounded);
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p>Loading book details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.errorContent}>
          <h2 style={styles.errorTitle}>😔 {error}</h2>
          <button onClick={() => navigate("/")} style={styles.backButton}>
            ← Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.imageSection}>
          {(() => {
            const imageSrc = book.imageUrl
              ? book.imageUrl.startsWith('http')
                ? book.imageUrl
                : `${serverBaseUrl}${book.imageUrl}`
              : '';
            return imageSrc ? (
              <img src={imageSrc} alt={book.title} style={styles.image} />
            ) : (
              <div style={styles.placeholder}>📖</div>
            );
          })()}
          <div style={styles.stockBadge}>
            {book.stock > 0 ? (
              <span style={styles.inStockBadge}>✓ In Stock</span>
            ) : (
              <span style={styles.outOfStockBadge}>✗ Out of Stock</span>
            )}
          </div>
        </div>

        <div style={styles.detailsSection}>
          <div style={styles.headerInfo}>
            <h1 style={styles.title}>{book.title}</h1>
            <p style={styles.author}>
              by <strong>{book.author}</strong>
            </p>
          </div>

          {book.category && (
            <div style={styles.categoryBadge}>📚 {book.category.name}</div>
          )}

          <div style={styles.priceSection}>
            <span style={styles.price}>{book.price.toLocaleString('vi-VN')}₫</span>
            <p style={styles.priceNote}>Free shipping on orders over 200,000₫</p>
          </div>

          <div style={styles.divider}></div>

          {book.description && (
            <div style={styles.descriptionSection}>
              <h3 style={styles.sectionTitle}>📖 Description</h3>
              <p style={styles.description}>{book.description}</p>
            </div>
          )}

          <div style={styles.divider}></div>

          <div style={styles.infoGrid}>
            {book.isbn && (
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>ISBN</span>
                <span style={styles.infoValue}>{book.isbn}</span>
              </div>
            )}
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Stock</span>
              <span style={styles.infoValue}>
                {book.stock > 0 ? `${book.stock} available` : "Out of stock"}
              </span>
            </div>
          </div>

          <div style={styles.divider}></div>

          <div style={styles.actions}>
            <button
              disabled={book.stock === 0}
              onClick={handleAddToCart}
              style={{
                ...styles.addToCart,
                ...(book.stock === 0 && styles.disabled),
              }}
            >
              {book.stock > 0 ? "🛒 Add to Cart" : "✗ Out of Stock"}
            </button>
            <button
              onClick={() => navigate("/")}
              style={styles.continueShopping}
            >
              ← Continue Shopping
            </button>
          </div>

          {book.isEbook && (
            <div style={styles.ebookSection}>
              <div style={styles.ebookSectionHeader}>
                <span style={styles.ebookBadge}>📱 E-Book Available</span>
              </div>
              {ebookAccess === null && isAuthenticated && (
                <p style={styles.ebookChecking}>Checking access...</p>
              )}
              <button onClick={handleReadEbook} style={styles.readNowBtn}>
                📖 Read Now
              </button>
              {ebookActionMessage && (
                <div style={styles.paymentLockNotice}>{ebookActionMessage}</div>
              )}
            </div>
          )}

          <div style={styles.divider}></div>

          <div style={styles.reviewSection}>
            <h3 style={styles.sectionTitle}>⭐ Reviews & Ratings</h3>

            <div style={styles.reviewSummary}>
              <strong>{reviewSummary.averageRating?.toFixed(1) || "0.0"}/5</strong>
              <span style={styles.reviewSummaryText}>
                {renderStars(reviewSummary.averageRating)} • {reviewSummary.totalReviews || 0} review(s)
              </span>
            </div>

            <div style={styles.myReviewBox}>
              <h4 style={styles.myReviewTitle}>{myReview ? "Edit Your Review" : "Write a Review"}</h4>

              <div style={styles.ratingRow}>
                <label style={styles.infoLabel}>Rating</label>
                <select
                  value={ratingInput}
                  onChange={(event) => setRatingInput(Number(event.target.value))}
                  style={styles.ratingSelect}
                >
                  {[5, 4, 3, 2, 1].map((value) => (
                    <option key={value} value={value}>
                      {value} star{value > 1 ? "s" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <textarea
                value={commentInput}
                onChange={(event) => setCommentInput(event.target.value)}
                placeholder="Share your experience about this book"
                rows={4}
                style={styles.reviewTextarea}
              />

              <button
                type="button"
                onClick={handleSubmitReview}
                disabled={reviewSubmitting}
                style={styles.reviewSubmitBtn}
              >
                {reviewSubmitting
                  ? "Saving..."
                  : myReview
                    ? "Update My Review"
                    : "Submit Review"}
              </button>
            </div>

            {reviewError && <div style={styles.reviewError}>{reviewError}</div>}

            <div style={styles.reviewList}>
              {reviewLoading ? (
                <p style={styles.reviewHint}>Loading reviews...</p>
              ) : reviews.length === 0 ? (
                <p style={styles.reviewHint}>No reviews yet.</p>
              ) : (
                <>
                  {reviews.map((review) => (
                    <div key={review._id} style={styles.reviewItem}>
                      <div style={styles.reviewHeader}>
                        <strong>
                          {review.user?.firstName || "User"} {review.user?.lastName || ""}
                        </strong>
                        <span style={styles.reviewStars}>{renderStars(review.rating)}</span>
                      </div>
                      <p style={styles.reviewComment}>{review.comment || "(No comment)"}</p>
                      <span style={styles.reviewDate}>
                        {new Date(review.createdAt).toLocaleDateString()} {review.isEdited ? "• Edited" : ""}
                      </span>
                    </div>
                  ))}

                  {reviewPagination.totalPages > 1 && (
                    <div style={styles.reviewPagination}>
                      <button
                        type="button"
                        style={styles.reviewPageButton}
                        disabled={reviewPagination.page <= 1}
                        onClick={() => fetchReviews(reviewPagination.page - 1)}
                      >
                        Previous
                      </button>
                      <span style={styles.reviewPageInfo}>
                        Page {reviewPagination.page} / {reviewPagination.totalPages}
                      </span>
                      <button
                        type="button"
                        style={styles.reviewPageButton}
                        disabled={reviewPagination.page >= reviewPagination.totalPages}
                        onClick={() => fetchReviews(reviewPagination.page + 1)}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
    minHeight: "100vh",
    padding: "2rem",
  },
  breadcrumb: {
    maxWidth: "1200px",
    margin: "0 auto 2rem",
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    fontSize: "0.95rem",
  },
  breadcrumbLink: {
    backgroundColor: "transparent",
    color: "#667eea",
    border: "none",
    cursor: "pointer",
    fontWeight: "500",
    transition: "all 0.3s ease",
    padding: 0,
    textDecoration: "underline",
  },
  breadcrumbSeparator: {
    color: "#bdc3c7",
  },
  breadcrumbCurrent: {
    color: "#2c3e50",
    fontWeight: "600",
  },
  content: {
    maxWidth: "1000px",
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "300px 1fr",
    gap: "2rem",
    backgroundColor: "#fff",
    padding: "1.5rem",
    borderRadius: "12px",
    boxShadow: "0 4px 15px rgba(102, 126, 234, 0.1)",
  },
  imageSection: {
    position: "relative",
    width: "100%",
    height: "360px",
    background: "#f1f5f9",
    borderRadius: "12px",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    borderRadius: "12px",
    transition: "transform 0.3s ease",
  },
  placeholder: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
    borderRadius: "12px",
    fontSize: "6rem",
    color: "#bdc3c7",
  },
  stockBadge: {
    position: "absolute",
    top: "1rem",
    right: "1rem",
  },
  inStockBadge: {
    backgroundColor: "#27ae60",
    color: "#fff",
    padding: "0.5rem 1rem",
    borderRadius: "8px",
    fontSize: "0.9rem",
    fontWeight: "600",
    boxShadow: "0 4px 12px rgba(39, 174, 96, 0.3)",
  },
  outOfStockBadge: {
    backgroundColor: "#e74c3c",
    color: "#fff",
    padding: "0.5rem 1rem",
    borderRadius: "8px",
    fontSize: "0.9rem",
    fontWeight: "600",
    boxShadow: "0 4px 12px rgba(231, 76, 60, 0.3)",
  },
  detailsSection: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  headerInfo: {
    paddingBottom: "0.5rem",
  },
  title: {
    fontSize: "1.8rem",
    fontWeight: "700",
    color: "#2c3e50",
    marginBottom: "0.5rem",
    lineHeight: "1.3",
  },
  author: {
    fontSize: "0.95rem",
    color: "#7f8c8d",
    margin: 0,
  },
  categoryBadge: {
    display: "inline-block",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "#fff",
    padding: "0.6rem 1.2rem",
    borderRadius: "8px",
    fontSize: "0.95rem",
    fontWeight: "600",
    width: "fit-content",
  },
  priceSection: {
    paddingTop: "0.5rem",
  },
  price: {
    fontSize: "2rem",
    fontWeight: "700",
    color: "#667eea",
    margin: 0,
  },
  priceNote: {
    fontSize: "0.9rem",
    color: "#27ae60",
    margin: "0.5rem 0 0 0",
    fontWeight: "500",
  },
  divider: {
    height: "1px",
    backgroundColor: "#e0e0e0",
  },
  descriptionSection: {
    paddingTop: "0.5rem",
  },
  sectionTitle: {
    fontSize: "1rem",
    fontWeight: "700",
    color: "#2c3e50",
    marginBottom: "0.75rem",
    margin: 0,
  },
  description: {
    fontSize: "0.9rem",
    lineHeight: "1.6",
    color: "#34495e",
    margin: 0,
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "1rem",
    padding: "1rem",
    backgroundColor: "#f8f9fa",
    borderRadius: "8px",
    border: "1px solid #e0e0e0",
  },
  infoItem: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  infoLabel: {
    fontSize: "0.75rem",
    fontWeight: "600",
    color: "#7f8c8d",
    textTransform: "uppercase",
    letterSpacing: "0.3px",
  },
  infoValue: {
    fontSize: "0.9rem",
    fontWeight: "500",
    color: "#2c3e50",
  },
  actions: {
    display: "flex",
    gap: "1rem",
    paddingTop: "0.5rem",
  },
  reviewSection: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  reviewSummary: {
    display: "flex",
    alignItems: "center",
    gap: "0.6rem",
    color: "#2c3e50",
  },
  reviewSummaryText: {
    color: "#7f8c8d",
    fontSize: "0.9rem",
  },
  myReviewBox: {
    border: "1px solid #e0e0e0",
    borderRadius: "8px",
    padding: "0.9rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.7rem",
  },
  myReviewTitle: {
    margin: 0,
    color: "#2c3e50",
    fontSize: "1rem",
  },
  ratingRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.6rem",
  },
  ratingSelect: {
    padding: "0.45rem",
    border: "1px solid #ddd",
    borderRadius: "6px",
  },
  reviewTextarea: {
    width: "100%",
    boxSizing: "border-box",
    padding: "0.7rem",
    border: "1px solid #ddd",
    borderRadius: "6px",
    fontFamily: "inherit",
  },
  reviewSubmitBtn: {
    alignSelf: "flex-start",
    backgroundColor: "#667eea",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    padding: "0.55rem 0.9rem",
    cursor: "pointer",
    fontWeight: "600",
  },
  reviewError: {
    backgroundColor: "#ffe6e6",
    color: "#e74c3c",
    padding: "0.6rem",
    borderRadius: "6px",
    fontSize: "0.9rem",
  },
  reviewList: {
    display: "flex",
    flexDirection: "column",
    gap: "0.7rem",
  },
  reviewItem: {
    border: "1px solid #eaeaea",
    borderRadius: "8px",
    padding: "0.8rem",
  },
  reviewHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "0.35rem",
    color: "#2c3e50",
  },
  reviewStars: {
    color: "#f39c12",
    fontSize: "0.9rem",
  },
  reviewComment: {
    margin: "0 0 0.45rem 0",
    color: "#34495e",
    fontSize: "0.9rem",
    lineHeight: "1.5",
  },
  reviewDate: {
    color: "#95a5a6",
    fontSize: "0.8rem",
  },
  reviewHint: {
    color: "#7f8c8d",
    fontSize: "0.9rem",
    margin: 0,
  },
  reviewPagination: {
    marginTop: "0.5rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.75rem",
  },
  reviewPageButton: {
    border: "1px solid #ddd",
    backgroundColor: "#fff",
    borderRadius: "6px",
    padding: "0.4rem 0.7rem",
    cursor: "pointer",
    color: "#2c3e50",
    fontWeight: 600,
  },
  reviewPageInfo: {
    color: "#34495e",
    fontSize: "0.85rem",
    fontWeight: 600,
  },
  addToCart: {
    flex: 1,
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "#fff",
    padding: "0.75rem 1.5rem",
    border: "none",
    borderRadius: "8px",
    fontSize: "0.95rem",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
    boxShadow: "0 2px 8px rgba(102, 126, 234, 0.25)",
  },
  continueShopping: {
    flex: 0.5,
    backgroundColor: "#ecf0f1",
    color: "#2c3e50",
    padding: "0.75rem 1.5rem",
    border: "2px solid #bdc3c7",
    borderRadius: "8px",
    fontSize: "0.9rem",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
  },
  disabled: {
    backgroundColor: "#bdc3c7",
    background: "#bdc3c7",
    cursor: "not-allowed",
    boxShadow: "none",
    opacity: "0.6",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
    gap: "1rem",
  },
  spinner: {
    width: "60px",
    height: "60px",
    border: "4px solid #e0e0e0",
    borderTop: "4px solid #667eea",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  errorContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
    padding: "2rem",
  },
  errorContent: {
    backgroundColor: "#fff",
    padding: "3rem",
    borderRadius: "12px",
    textAlign: "center",
    boxShadow: "0 10px 40px rgba(102, 126, 234, 0.15)",
    maxWidth: "500px",
  },
  errorTitle: {
    fontSize: "1.5rem",
    color: "#e74c3c",
    marginBottom: "1.5rem",
  },
  backButton: {
    backgroundColor: "#667eea",
    color: "#fff",
    padding: "0.75rem 1.5rem",
    border: "none",
    borderRadius: "8px",
    fontSize: "1rem",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)",
  },
  ebookSection: {
    border: "2px solid #27ae60",
    borderRadius: "10px",
    padding: "1rem 1.25rem",
    backgroundColor: "#f0fff4",
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  ebookSectionHeader: {
    display: "flex",
    alignItems: "center",
  },
  ebookBadge: {
    backgroundColor: "#27ae60",
    color: "#fff",
    padding: "0.35rem 0.9rem",
    borderRadius: "20px",
    fontSize: "0.85rem",
    fontWeight: "700",
    letterSpacing: "0.3px",
    boxShadow: "0 4px 12px rgba(39, 174, 96, 0.3)",
  },
  ebookChecking: {
    color: "#1f8f4f",
    fontSize: "0.9rem",
    margin: 0,
    fontStyle: "italic",
  },
  readNowBtn: {
    backgroundColor: "#16213e",
    color: "#fff",
    border: "1px solid #0f3460",
    borderRadius: "4px",
    padding: "0.55rem 1rem",
    fontSize: "0.92rem",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(15, 52, 96, 0.25)",
    transition: "all 0.2s ease",
    alignSelf: "flex-start",
    letterSpacing: "0.2px",
  },
  paymentLockNotice: {
    backgroundColor: "#fff7ed",
    border: "1px solid #fed7aa",
    borderRadius: "8px",
    padding: "0.75rem 1rem",
    color: "#c2410c",
    fontSize: "0.9rem",
    fontWeight: "500",
  },
};

export default BookDetailPage;
