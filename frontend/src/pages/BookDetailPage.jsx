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
  const { isAuthenticated, user } = useAuth();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviews, setReviews] = useState([]);
  const [reviewSummary, setReviewSummary] = useState({
    averageRating: 0,
    totalReviews: 0,
  });
  const [reviewPagination, setReviewPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
    limit: 10,
  });
  const [reviewLoading, setReviewLoading] = useState(true);
  const [reviewError, setReviewError] = useState("");
  const [myReview, setMyReview] = useState(null);
  const [selectedRatingFilter, setSelectedRatingFilter] = useState("");
  const [ratingInput, setRatingInput] = useState(5);
  const [commentInput, setCommentInput] = useState("");
  const [existingReviewImages, setExistingReviewImages] = useState([]);
  const [newReviewImages, setNewReviewImages] = useState([]);
  const [newReviewImagePreviews, setNewReviewImagePreviews] = useState([]);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewDeleting, setReviewDeleting] = useState(false);
  const [reactionSubmittingId, setReactionSubmittingId] = useState("");
  const [replyInputs, setReplyInputs] = useState({});
  const [replySubmittingId, setReplySubmittingId] = useState("");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewPageIndex, setPreviewPageIndex] = useState(0);
  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  const serverBaseUrl = apiBase.replace(/\/api\/?$/, "");
  const resolveImageUrl = (path) => {
    if (!path) return "";
    return path.startsWith("http")
      ? path
      : `${serverBaseUrl}/${String(path).replace(/^\/+/, "")}`;
  };
  const imageSrc = resolveImageUrl(book?.imageUrl);
  const previewPages = Array.isArray(book?.previewPages)
    ? book.previewPages.slice(0, 10)
    : [];
  const currentPreviewSrc = resolveImageUrl(previewPages[previewPageIndex]);

  useEffect(() => {
    fetchBook();
    fetchReviews(1, selectedRatingFilter);
  }, [id]);

  useEffect(() => {
    fetchReviews(1, selectedRatingFilter);
  }, [selectedRatingFilter]);

  useEffect(() => {
    if (isAuthenticated && id) {
      fetchMyReview();
    }
  }, [id, isAuthenticated]);

  const fetchBook = async () => {
    try {
      setLoading(true);
      const response = await bookApi.getBookById(id);
      setBook(response.data.book);
    } catch (err) {
      setError(err.response?.data?.message || "Book not found");
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async (page = 1, rating = "") => {
    try {
      setReviewLoading(true);
      setReviewError("");
      const response = await reviewApi.getBookReviews(id, page, 10, rating);
      setReviews(response.data.reviews || []);
      setReviewSummary(
        response.data.summary || { averageRating: 0, totalReviews: 0 },
      );
      setReviewPagination(
        response.data.pagination || {
          page: 1,
          totalPages: 1,
          total: 0,
          limit: 10,
        },
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
        setExistingReviewImages(
          Array.isArray(review.images) ? review.images : [],
        );
      } else {
        setRatingInput(5);
        setCommentInput("");
        setExistingReviewImages([]);
      }
    } catch (err) {
      setMyReview(null);
      setExistingReviewImages([]);
    }
  };

  const handleSelectNewReviewImages = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const remainingSlots =
      5 - existingReviewImages.length - newReviewImages.length;
    if (remainingSlots <= 0) {
      setReviewError("You can upload up to 5 review images");
      return;
    }

    const selectedFiles = files.slice(0, remainingSlots);
    const previews = selectedFiles.map((file) => URL.createObjectURL(file));

    setNewReviewImages((prev) => [...prev, ...selectedFiles]);
    setNewReviewImagePreviews((prev) => [...prev, ...previews]);
  };

  const removeNewImageAt = (index) => {
    setNewReviewImages((prev) =>
      prev.filter((_, itemIndex) => itemIndex !== index),
    );
    setNewReviewImagePreviews((prev) => {
      const target = prev[index];
      if (target) {
        URL.revokeObjectURL(target);
      }
      return prev.filter((_, itemIndex) => itemIndex !== index);
    });
  };

  const removeExistingImageAt = (index) => {
    setExistingReviewImages((prev) =>
      prev.filter((_, itemIndex) => itemIndex !== index),
    );
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

      const payload = new FormData();
      payload.append("rating", String(Number(ratingInput)));
      payload.append("comment", commentInput.trim());

      existingReviewImages.forEach((imagePath) => {
        payload.append("keepExistingImages", imagePath);
      });

      newReviewImages.forEach((file) => {
        payload.append("images", file);
      });

      if (myReview?._id) {
        await reviewApi.updateReview(myReview._id, payload, true);
      } else {
        await reviewApi.createReview(id, payload, true);
      }

      setNewReviewImages([]);
      setNewReviewImagePreviews((prev) => {
        prev.forEach((url) => URL.revokeObjectURL(url));
        return [];
      });

      await Promise.all([
        fetchReviews(1, selectedRatingFilter),
        fetchMyReview(),
      ]);
    } catch (err) {
      setReviewError(err.response?.data?.message || "Failed to submit review");
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleDeleteMyReview = async () => {
    if (!myReview?._id || reviewDeleting) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete your review?",
    );
    if (!confirmed) {
      return;
    }

    try {
      setReviewDeleting(true);
      setReviewError("");
      await reviewApi.deleteReview(myReview._id);
      setMyReview(null);
      setRatingInput(5);
      setCommentInput("");
      setExistingReviewImages([]);
      setNewReviewImages([]);
      setNewReviewImagePreviews((prev) => {
        prev.forEach((url) => URL.revokeObjectURL(url));
        return [];
      });
      await fetchReviews(1, selectedRatingFilter);
    } catch (err) {
      setReviewError(err.response?.data?.message || "Failed to delete review");
    } finally {
      setReviewDeleting(false);
    }
  };

  const handleReviewReaction = async (reviewId, type) => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: `/books/${id}` } });
      return;
    }

    try {
      setReactionSubmittingId(reviewId);
      await reviewApi.reactToReview(reviewId, type);
      await fetchReviews(reviewPagination.page, selectedRatingFilter);
    } catch (err) {
      setReviewError(
        err.response?.data?.message || "Failed to react to review",
      );
    } finally {
      setReactionSubmittingId("");
    }
  };

  const handleReplyInputChange = (reviewId, value) => {
    setReplyInputs((prev) => ({
      ...prev,
      [reviewId]: value,
    }));
  };

  const handleReplyToReview = async (reviewId) => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: `/books/${id}` } });
      return;
    }

    const comment = String(replyInputs[reviewId] || "").trim();
    if (!comment) {
      setReviewError("Please enter reply content");
      return;
    }

    try {
      setReplySubmittingId(reviewId);
      setReviewError("");
      await reviewApi.replyToReview(reviewId, comment);
      setReplyInputs((prev) => ({ ...prev, [reviewId]: "" }));
      await fetchReviews(reviewPagination.page, selectedRatingFilter);
    } catch (err) {
      setReviewError(err.response?.data?.message || "Failed to submit reply");
    } finally {
      setReplySubmittingId("");
    }
  };

  useEffect(() => {
    return () => {
      newReviewImagePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [newReviewImagePreviews]);

  const renderStars = (rating) => {
    const rounded = Math.round(Number(rating) || 0);
    return "★★★★★".slice(0, rounded) + "☆☆☆☆☆".slice(rounded);
  };

  const openPreviewReader = () => {
    if (previewPages.length === 0) return;
    setPreviewPageIndex(0);
    setIsPreviewOpen(true);
  };

  const closePreviewReader = () => {
    setIsPreviewOpen(false);
  };

  const goToNextPreviewPage = () => {
    setPreviewPageIndex((prev) => Math.min(prev + 1, previewPages.length - 1));
  };

  const goToPreviousPreviewPage = () => {
    setPreviewPageIndex((prev) => Math.max(prev - 1, 0));
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
          {imageSrc ? (
            <img src={imageSrc} alt={book.title} style={styles.image} />
          ) : (
            <div style={styles.placeholder}>📖</div>
          )}
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
            <span style={styles.price}>
              {book.price.toLocaleString("vi-VN")}₫
            </span>
            <p style={styles.priceNote}>
              Free shipping on orders over 200,000₫
            </p>
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
            <button
              type="button"
              onClick={openPreviewReader}
              disabled={previewPages.length === 0}
              style={{
                ...styles.previewButton,
                ...(previewPages.length === 0 && styles.disabled),
              }}
            >
              Preview Book
            </button>
          </div>

          <div style={styles.divider}></div>

          <div style={styles.reviewSection}>
            <h3 style={styles.sectionTitle}>⭐ Reviews & Ratings</h3>

            <div style={styles.reviewSummary}>
              <strong>
                {reviewSummary.averageRating?.toFixed(1) || "0.0"}/5
              </strong>
              <span style={styles.reviewSummaryText}>
                {renderStars(reviewSummary.averageRating)} •{" "}
                {reviewSummary.totalReviews || 0} review(s)
              </span>
            </div>

            <div style={styles.reviewFilterRow}>
              <label style={styles.infoLabel}>Filter by star</label>
              <select
                value={selectedRatingFilter}
                onChange={(event) =>
                  setSelectedRatingFilter(event.target.value)
                }
                style={styles.ratingSelect}
              >
                <option value="">All ratings</option>
                {[5, 4, 3, 2, 1].map((value) => (
                  <option key={value} value={value}>
                    {value} star{value > 1 ? "s" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.myReviewBox}>
              <h4 style={styles.myReviewTitle}>
                {myReview ? "Edit Your Review" : "Write a Review"}
              </h4>

              <div style={styles.ratingRow}>
                <label style={styles.infoLabel}>Rating</label>
                <select
                  value={ratingInput}
                  onChange={(event) =>
                    setRatingInput(Number(event.target.value))
                  }
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

              {existingReviewImages.length > 0 && (
                <div style={styles.reviewImagesRow}>
                  {existingReviewImages.map((imagePath, index) => (
                    <div
                      key={`${imagePath}-${index}`}
                      style={styles.reviewImageCard}
                    >
                      <img
                        src={resolveImageUrl(imagePath)}
                        alt="Review"
                        style={styles.reviewImageThumb}
                      />
                      <button
                        type="button"
                        style={styles.removeImageBtn}
                        onClick={() => removeExistingImageAt(index)}
                        disabled={reviewSubmitting}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {newReviewImagePreviews.length > 0 && (
                <div style={styles.reviewImagesRow}>
                  {newReviewImagePreviews.map((previewUrl, index) => (
                    <div
                      key={`${previewUrl}-${index}`}
                      style={styles.reviewImageCard}
                    >
                      <img
                        src={previewUrl}
                        alt="Preview"
                        style={styles.reviewImageThumb}
                      />
                      <button
                        type="button"
                        style={styles.removeImageBtn}
                        onClick={() => removeNewImageAt(index)}
                        disabled={reviewSubmitting}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <label style={styles.imageUploadLabel}>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: "none" }}
                  onChange={handleSelectNewReviewImages}
                  disabled={
                    reviewSubmitting ||
                    existingReviewImages.length + newReviewImages.length >= 5
                  }
                />
                Upload images (max 5)
              </label>

              <div style={styles.reviewActionRow}>
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

                {myReview && (
                  <button
                    type="button"
                    onClick={handleDeleteMyReview}
                    disabled={reviewDeleting || reviewSubmitting}
                    style={styles.deleteReviewBtn}
                  >
                    {reviewDeleting ? "Deleting..." : "Delete My Review"}
                  </button>
                )}
              </div>
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
                          {review.user?.firstName || "User"}{" "}
                          {review.user?.lastName || ""}
                        </strong>
                        <span style={styles.reviewStars}>
                          {renderStars(review.rating)}
                        </span>
                      </div>
                      <p style={styles.reviewComment}>
                        {review.comment || "(No comment)"}
                      </p>

                      {Array.isArray(review.images) &&
                        review.images.length > 0 && (
                          <div style={styles.reviewImageGallery}>
                            {review.images.map((imagePath, index) => (
                              <img
                                key={`${review._id}-image-${index}`}
                                src={resolveImageUrl(imagePath)}
                                alt="Review attachment"
                                style={styles.reviewImageInList}
                              />
                            ))}
                          </div>
                        )}

                      <div style={styles.reactionRow}>
                        <button
                          type="button"
                          style={styles.reactionBtn}
                          onClick={() =>
                            handleReviewReaction(review._id, "HELPFUL")
                          }
                          disabled={
                            reactionSubmittingId === review._id ||
                            review.user?._id === user?._id
                          }
                        >
                          Helpful ({review.reactionSummary?.helpful || 0})
                        </button>
                        <button
                          type="button"
                          style={styles.reactionBtn}
                          onClick={() =>
                            handleReviewReaction(review._id, "DISLIKE")
                          }
                          disabled={
                            reactionSubmittingId === review._id ||
                            review.user?._id === user?._id
                          }
                        >
                          Dislike ({review.reactionSummary?.dislike || 0})
                        </button>
                      </div>

                      {Array.isArray(review.replies) &&
                        review.replies.length > 0 && (
                          <div style={styles.replyList}>
                            {review.replies.map((reply) => (
                              <div
                                key={
                                  reply._id ||
                                  `${review._id}-${reply.createdAt}`
                                }
                                style={styles.replyItem}
                              >
                                <div style={styles.replyHeader}>
                                  <strong style={styles.replyAuthor}>
                                    {reply.user?.firstName || "User"}{" "}
                                    {reply.user?.lastName || ""}
                                  </strong>
                                  {(reply.role === "admin" ||
                                    reply.role === "manager") && (
                                    <span style={styles.adminReplyBadge}>
                                      Admin
                                    </span>
                                  )}
                                </div>
                                <p style={styles.replyComment}>
                                  {reply.comment}
                                </p>
                                <span style={styles.replyDate}>
                                  {new Date(reply.createdAt).toLocaleString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                      <div style={styles.replyComposer}>
                        <input
                          type="text"
                          value={replyInputs[review._id] || ""}
                          onChange={(event) =>
                            handleReplyInputChange(
                              review._id,
                              event.target.value,
                            )
                          }
                          placeholder="Write a reply to this review"
                          style={styles.replyInput}
                          disabled={replySubmittingId === review._id}
                        />
                        <button
                          type="button"
                          style={styles.replyButton}
                          onClick={() => handleReplyToReview(review._id)}
                          disabled={replySubmittingId === review._id}
                        >
                          {replySubmittingId === review._id
                            ? "Replying..."
                            : "Reply"}
                        </button>
                      </div>

                      <span style={styles.reviewDate}>
                        {new Date(review.createdAt).toLocaleDateString()}{" "}
                        {review.isEdited ? "• Edited" : ""}
                      </span>
                    </div>
                  ))}

                  {reviewPagination.totalPages > 1 && (
                    <div style={styles.reviewPagination}>
                      <button
                        type="button"
                        style={styles.reviewPageButton}
                        disabled={reviewPagination.page <= 1}
                        onClick={() =>
                          fetchReviews(
                            reviewPagination.page - 1,
                            selectedRatingFilter,
                          )
                        }
                      >
                        Previous
                      </button>
                      <span style={styles.reviewPageInfo}>
                        Page {reviewPagination.page} /{" "}
                        {reviewPagination.totalPages}
                      </span>
                      <button
                        type="button"
                        style={styles.reviewPageButton}
                        disabled={
                          reviewPagination.page >= reviewPagination.totalPages
                        }
                        onClick={() =>
                          fetchReviews(
                            reviewPagination.page + 1,
                            selectedRatingFilter,
                          )
                        }
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

      {isPreviewOpen && (
        <div style={styles.previewOverlay}>
          <div style={styles.previewModal}>
            <div style={styles.previewHeader}>
              <h3 style={styles.previewTitle}>Book Preview</h3>
              <button
                type="button"
                onClick={closePreviewReader}
                style={styles.previewCloseButton}
              >
                Close
              </button>
            </div>

            <div style={styles.previewImageWrapper}>
              {currentPreviewSrc ? (
                <img
                  src={currentPreviewSrc}
                  alt={`Preview page ${previewPageIndex + 1}`}
                  style={styles.previewImage}
                />
              ) : (
                <div style={styles.previewPlaceholder}>No preview image</div>
              )}
            </div>

            <div style={styles.previewControls}>
              <button
                type="button"
                onClick={goToPreviousPreviewPage}
                disabled={previewPageIndex === 0}
                style={styles.previewNavButton}
              >
                Previous Page
              </button>
              <span style={styles.previewPageCounter}>
                Page {previewPageIndex + 1} / {previewPages.length}
              </span>
              <button
                type="button"
                onClick={goToNextPreviewPage}
                disabled={previewPageIndex >= previewPages.length - 1}
                style={styles.previewNavButton}
              >
                Next Page
              </button>
            </div>
          </div>
        </div>
      )}
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
  },
  image: {
    width: "100%",
    height: "auto",
    borderRadius: "12px",
    boxShadow: "0 8px 24px rgba(102, 126, 234, 0.2)",
    transition: "transform 0.3s ease",
  },
  placeholder: {
    width: "100%",
    aspectRatio: "3/4",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
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
  reviewFilterRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.6rem",
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
  reviewImagesRow: {
    display: "flex",
    gap: "0.65rem",
    flexWrap: "wrap",
  },
  reviewImageCard: {
    border: "1px solid #e5e7eb",
    borderRadius: "6px",
    padding: "0.4rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.35rem",
    width: "96px",
  },
  reviewImageThumb: {
    width: "100%",
    height: "70px",
    objectFit: "cover",
    borderRadius: "4px",
  },
  removeImageBtn: {
    border: "none",
    backgroundColor: "#ef4444",
    color: "#fff",
    borderRadius: "4px",
    padding: "0.25rem 0.35rem",
    fontSize: "0.72rem",
    cursor: "pointer",
  },
  imageUploadLabel: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px dashed #94a3b8",
    color: "#334155",
    borderRadius: "6px",
    padding: "0.5rem 0.75rem",
    width: "fit-content",
    fontSize: "0.82rem",
    cursor: "pointer",
  },
  reviewActionRow: {
    display: "flex",
    gap: "0.6rem",
    flexWrap: "wrap",
  },
  reviewSubmitBtn: {
    backgroundColor: "#667eea",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    padding: "0.55rem 0.9rem",
    cursor: "pointer",
    fontWeight: "600",
  },
  deleteReviewBtn: {
    backgroundColor: "#dc2626",
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
  reviewImageGallery: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.5rem",
    marginBottom: "0.45rem",
  },
  reviewImageInList: {
    width: "92px",
    height: "72px",
    borderRadius: "6px",
    objectFit: "cover",
    border: "1px solid #e5e7eb",
  },
  reactionRow: {
    display: "flex",
    gap: "0.5rem",
    marginBottom: "0.45rem",
  },
  reactionBtn: {
    border: "1px solid #cbd5e1",
    backgroundColor: "#fff",
    color: "#334155",
    borderRadius: "999px",
    padding: "0.25rem 0.65rem",
    cursor: "pointer",
    fontSize: "0.78rem",
    fontWeight: 600,
  },
  replyList: {
    display: "flex",
    flexDirection: "column",
    gap: "0.45rem",
    marginBottom: "0.45rem",
  },
  replyItem: {
    marginLeft: "0.65rem",
    borderLeft: "3px solid #dbeafe",
    backgroundColor: "#f8fafc",
    padding: "0.45rem 0.6rem",
    borderRadius: "6px",
  },
  replyHeader: {
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
  },
  replyAuthor: {
    color: "#1e293b",
    fontSize: "0.82rem",
  },
  adminReplyBadge: {
    backgroundColor: "#1d4ed8",
    color: "#fff",
    fontSize: "0.66rem",
    fontWeight: 700,
    borderRadius: "999px",
    padding: "0.15rem 0.45rem",
  },
  replyComment: {
    margin: "0.25rem 0",
    color: "#334155",
    fontSize: "0.82rem",
    lineHeight: 1.45,
  },
  replyDate: {
    color: "#94a3b8",
    fontSize: "0.72rem",
  },
  replyComposer: {
    display: "flex",
    gap: "0.45rem",
    marginBottom: "0.45rem",
  },
  replyInput: {
    flex: 1,
    border: "1px solid #cbd5e1",
    borderRadius: "6px",
    padding: "0.42rem 0.55rem",
    fontSize: "0.82rem",
  },
  replyButton: {
    border: "none",
    backgroundColor: "#0ea5e9",
    color: "#fff",
    borderRadius: "6px",
    padding: "0.42rem 0.75rem",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "0.78rem",
    whiteSpace: "nowrap",
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
  previewButton: {
    flex: 0.6,
    backgroundColor: "#f39c12",
    color: "#fff",
    padding: "0.75rem 1.2rem",
    border: "none",
    borderRadius: "8px",
    fontSize: "0.9rem",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
  },
  previewOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "1rem",
  },
  previewModal: {
    width: "100%",
    maxWidth: "900px",
    backgroundColor: "#fff",
    borderRadius: "10px",
    padding: "1rem",
    boxShadow: "0 16px 40px rgba(0, 0, 0, 0.28)",
  },
  previewHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "0.8rem",
  },
  previewTitle: {
    margin: 0,
    color: "#2c3e50",
  },
  previewCloseButton: {
    border: "none",
    backgroundColor: "#e74c3c",
    color: "#fff",
    borderRadius: "6px",
    padding: "0.45rem 0.8rem",
    cursor: "pointer",
  },
  previewImageWrapper: {
    width: "100%",
    maxHeight: "70vh",
    overflow: "auto",
    border: "1px solid #e0e0e0",
    borderRadius: "8px",
    backgroundColor: "#f8f9fa",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0.75rem",
  },
  previewImage: {
    width: "100%",
    height: "auto",
    borderRadius: "6px",
  },
  previewPlaceholder: {
    color: "#7f8c8d",
    padding: "2rem",
  },
  previewControls: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "1rem",
    marginTop: "1rem",
  },
  previewNavButton: {
    border: "none",
    backgroundColor: "#34495e",
    color: "#fff",
    borderRadius: "6px",
    padding: "0.55rem 0.9rem",
    cursor: "pointer",
  },
  previewPageCounter: {
    color: "#2c3e50",
    fontWeight: 600,
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
};

export default BookDetailPage;
