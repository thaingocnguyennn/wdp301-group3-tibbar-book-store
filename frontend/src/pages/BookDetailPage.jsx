import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { bookApi } from "../api/bookApi";
import { useCart } from "../hooks/useCart";
import { useAuth } from "../hooks/useAuth";

const BookDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { add } = useCart();
  const { isAuthenticated } = useAuth();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchBook();
  }, [id]);

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
          {book.imageUrl ? (
            <img src={book.imageUrl} alt={book.title} style={styles.image} />
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
            <span style={styles.price}>${book.price.toFixed(2)}</span>
            <p style={styles.priceNote}>Free shipping on orders over $50</p>
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
};

export default BookDetailPage;
