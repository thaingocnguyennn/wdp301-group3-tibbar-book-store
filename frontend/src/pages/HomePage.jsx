import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { bookApi } from "../api/bookApi";
import { categoryApi } from "../api/categoryApi";
import { sliderApi } from "../api/sliderApi";
import { newsApi } from "../api/newsApi";
import { flashSaleApi } from "../api/flashSaleApi";
import BookCard from "../components/books/BookCard";
import Slider from "../components/common/Slider";
import { useAuth } from "../hooks/useAuth";

const HomePage = () => {
  const { isAuthenticated } = useAuth();
  const [books, setBooks] = useState([]);
  const [bestSellingBooks, setBestSellingBooks] = useState([]);
  const [personalizedBooks, setPersonalizedBooks] = useState([]);
  const [personalizedLoading, setPersonalizedLoading] = useState(true);
  const [recommendationMeta, setRecommendationMeta] = useState({
    strategy: null,
    signals: {
      hasRecentlyViewed: false,
      hasPurchaseHistory: false,
    },
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sliders, setSliders] = useState([]);
  const [homepageNews, setHomepageNews] = useState([]);
  const [flashSaleCampaign, setFlashSaleCampaign] = useState(null);
  const [flashSaleRemainingMs, setFlashSaleRemainingMs] = useState(0);
  const [flashSaleLoading, setFlashSaleLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: "",
    minPrice: "",
    maxPrice: "",
    author: "",
    page: 1,
  });
  const [pagination, setPagination] = useState(null);

  const serverBaseUrl = useMemo(() => {
    const api = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    return api.replace(/\/api\/?$/, "");
  }, []);

  useEffect(() => {
    fetchCategories();
    fetchSliders();
    fetchHomepageNews();
    fetchBestSellingBooks();
    fetchFlashSaleCampaign();
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchFlashSaleCampaign();
    }, 30000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!flashSaleCampaign?.endsAt) return undefined;

    const intervalId = setInterval(() => {
      setFlashSaleRemainingMs((prev) => {
        if (prev <= 1000) {
          clearInterval(intervalId);
          setFlashSaleCampaign(null);
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [flashSaleCampaign]);

  useEffect(() => {
    fetchPersonalizedBooks();
  }, [isAuthenticated]);

  useEffect(() => {
    fetchBooks();
  }, [filters]);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v !== ""),
      );
      const response = await bookApi.getPublicBooks(cleanFilters);
      setBooks(response.data.books);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error("Error fetching books:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await categoryApi.getCategories();
      setCategories(response.data.categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchBestSellingBooks = async () => {
    try {
      const response = await bookApi.getBestSellingBooks(8);
      setBestSellingBooks(response.data.books || []);
    } catch (error) {
      console.error("Error fetching best-selling books:", error);
    }
  };

  const fetchPersonalizedBooks = async () => {
    try {
      setPersonalizedLoading(true);
      const response = await bookApi.getPersonalizedBooks(8);
      const personalizedList = response?.data?.books || [];

      if (personalizedList.length > 0) {
        setPersonalizedBooks(personalizedList);
      } else {
        // UI safety net: keep section populated if personalized API returns empty.
        const newestResponse = await bookApi.getNewestBooks(8);
        setPersonalizedBooks(newestResponse?.data?.books || []);
      }

      setRecommendationMeta({
        strategy:
          response?.data?.strategy ||
          (personalizedList.length === 0 ? "fallback-newest-relaxed" : null),
        signals: response?.data?.signals || {
          hasRecentlyViewed: false,
          hasPurchaseHistory: false,
        },
      });
    } catch (error) {
      console.error("Error fetching personalized books:", error);
      setPersonalizedBooks([]);
    } finally {
      setPersonalizedLoading(false);
    }
  };

  const fetchSliders = async () => {
    try {
      const response = await sliderApi.getPublicSliders();
      const sliderData = response.data.sliders || [];
      const mapped = sliderData.map((item) => ({
        backgroundImage: item.imageUrl
          ? `${serverBaseUrl}${item.imageUrl}`
          : undefined,
        title: item.title || "",
        subtitle: item.subtitle || "",
        ctaText: item.ctaText || "",
        ctaLink: item.ctaLink || "",
      }));
      setSliders(mapped);
    } catch (error) {
      console.error("Error fetching sliders:", error);
    }
  };

  const fetchHomepageNews = async () => {
    try {
      const response = await newsApi.getHomepageNews();
      setHomepageNews(response.data.news || []);
    } catch (error) {
      console.error("Error fetching homepage news:", error);
    }
  };

  const fetchFlashSaleCampaign = async () => {
    try {
      setFlashSaleLoading(true);
      const response = await flashSaleApi.getActiveFlashSale();
      const campaign = response?.data?.campaign || null;

      setFlashSaleCampaign(campaign);

      if (campaign?.remainingMs) {
        setFlashSaleRemainingMs(Number(campaign.remainingMs));
      } else {
        setFlashSaleRemainingMs(0);
      }
    } catch (error) {
      console.error("Error fetching flash sale campaign:", error);
      setFlashSaleCampaign(null);
      setFlashSaleRemainingMs(0);
    } finally {
      setFlashSaleLoading(false);
    }
  };

  const formatCountdown = (remainingMs) => {
    const totalSeconds = Math.max(0, Math.floor(Number(remainingMs || 0) / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return [hours, minutes, seconds]
      .map((value) => String(value).padStart(2, "0"))
      .join(":");
  };

  const resolveBookImage = (imageUrl) => {
    if (!imageUrl) return "";
    if (imageUrl.startsWith("http")) return imageUrl;
    return `${serverBaseUrl}${imageUrl}`;
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
      page: 1,
    });
  };

  const handlePageChange = (newPage) => {
    setFilters({ ...filters, page: newPage });
    window.scrollTo(0, 0);
  };

  return (
    <div style={styles.container}>
      {/* Slider Section */}
      <section style={styles.sliderWrapper}>
        <Slider images={sliders} />
      </section>

      <section style={styles.joinUsSection}>
        <div style={styles.joinUsContent}>
          <div>
            <h2 style={styles.joinUsTitle}>Want to join our team?</h2>
            <p style={styles.joinUsSubtitle}>
              Submit your CV in PDF and our admin team will review your application.
            </p>
          </div>
          {isAuthenticated ? (
            <Link to="/join-us" style={styles.joinUsButton}>
              Join us
            </Link>
          ) : (
            <Link to="/login" style={styles.joinUsButton}>
              Join us
            </Link>
          )}
        </div>
      </section>

      {/* Homepage News */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>📰 Latest News</h2>
          <div style={styles.titleUnderline}></div>
        </div>

        {homepageNews.length === 0 ? (
          <div style={styles.empty}>
            <p>No news available yet</p>
          </div>
        ) : (
          <div style={styles.newsGrid}>
            {homepageNews.slice(0, 4).map((item) => (
              <article key={item._id} style={styles.newsCard}>
                <Link to={`/news/${item._id}`} style={styles.newsImageLink}>
                  {item.imageUrl ? (
                    <img
                      src={`${serverBaseUrl}${item.imageUrl}`}
                      alt={item.title}
                      style={styles.newsImage}
                    />
                  ) : (
                    <div style={styles.newsPlaceholder}>📰</div>
                  )}
                </Link>

                <div style={styles.newsBody}>
                  <Link to={`/news/${item._id}`} style={styles.newsTitleLink}>
                    {item.title}
                  </Link>
                  <div style={styles.newsDate}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Filters */}
      <section style={styles.filterSection}>
        <div style={styles.filterHeader}>
          <h3 style={styles.filterTitle}>🔍 Filter & Search Books</h3>
        </div>
        <div style={styles.filters}>
          <select
            name="category"
            value={filters.category}
            onChange={handleFilterChange}
            style={styles.select}
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>

          <input
            type="text"
            name="author"
            placeholder="🖊️ Search by author"
            value={filters.author}
            onChange={handleFilterChange}
            style={styles.input}
          />

          <input
            type="number"
            name="minPrice"
            placeholder="💰 Min Price"
            value={filters.minPrice}
            onChange={handleFilterChange}
            style={styles.input}
          />

          <input
            type="number"
            name="maxPrice"
            placeholder="💰 Max Price"
            value={filters.maxPrice}
            onChange={handleFilterChange}
            style={styles.input}
          />
        </div>
      </section>

      {/* Best Selling Books */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>✨ Recommended For You</h2>
          <div style={styles.titleUnderline}></div>
          {(recommendationMeta.strategy === "multi-signal-personalization" ||
            recommendationMeta.strategy === "direct-interaction-priority" ||
            recommendationMeta.strategy === "interaction-author-category" ||
            recommendationMeta.strategy === "cart-author-category") && (
            <p style={styles.sectionHint}>
              Personalized from your recent interactions (viewed, cart, wishlist, orders).
            </p>
          )}
        </div>

        {personalizedLoading ? (
          <div style={styles.loading}>
            <div style={styles.spinner}></div>
            <p>Building your personalized recommendations...</p>
          </div>
        ) : personalizedBooks.length === 0 ? (
          <div style={styles.empty}>
            <p>No personalized recommendations yet</p>
            <p style={styles.emptySmall}>
              Explore more books to unlock smarter suggestions.
            </p>
          </div>
        ) : (
          <>
            <div style={styles.grid}>
              {personalizedBooks.map((book) => (
                <BookCard key={book._id} book={book} />
              ))}
            </div>
            {(recommendationMeta.strategy === "fallback-newest" ||
              recommendationMeta.strategy === "fallback-newest-relaxed") && (
              <p style={styles.sectionHint}>
                Showing newest books while we learn your preferences.
              </p>
            )}
          </>
        )}
      </section>

      {/* Flash Sale (UC-118 + UC-119) */}
      <section style={styles.section}>
        <div style={styles.flashSaleHeader}>
          <div>
            <h2 style={styles.flashSaleTitle}>⚡ Flash Sale</h2>
            <p style={styles.flashSaleSubtitle}>Limited-time discounts for selected books</p>
          </div>
          {flashSaleCampaign && (
            <div style={styles.countdownBadge}>
              <span style={styles.countdownLabel}>Ends in</span>
              <strong style={styles.countdownValue}>
                {formatCountdown(flashSaleRemainingMs)}
              </strong>
            </div>
          )}
        </div>

        {flashSaleLoading ? (
          <div style={styles.empty}>
            <p>Loading flash sale campaign...</p>
          </div>
        ) : !flashSaleCampaign || !flashSaleCampaign.books?.length ? (
          <div style={styles.empty}>
            <p>No flash sale campaign right now</p>
            <p style={styles.emptySmall}>Come back soon for limited-time deals.</p>
          </div>
        ) : (
          <div style={styles.flashSaleGrid}>
            {flashSaleCampaign.books.map((book) => (
              <article key={book._id} style={styles.flashSaleCard}>
                <span style={styles.discountChip}>-{book.discountPercent}%</span>
                <Link to={`/books/${book._id}`} style={styles.flashSaleImageLink}>
                  {resolveBookImage(book.imageUrl) ? (
                    <img
                      src={resolveBookImage(book.imageUrl)}
                      alt={book.title}
                      style={styles.flashSaleImage}
                    />
                  ) : (
                    <div style={styles.flashSalePlaceholder}>📚</div>
                  )}
                </Link>

                <div style={styles.flashSaleContent}>
                  <Link to={`/books/${book._id}`} style={styles.flashSaleBookTitle}>
                    {book.title}
                  </Link>
                  <p style={styles.flashSaleAuthor}>by {book.author}</p>

                  <div style={styles.flashSalePriceRow}>
                    <span style={styles.flashSalePrice}>
                      {Number(book.flashSalePrice || 0).toLocaleString("vi-VN")}₫
                    </span>
                    <span style={styles.flashSaleOriginalPrice}>
                      {Number(book.originalPrice || 0).toLocaleString("vi-VN")}₫
                    </span>
                  </div>

                  <Link to={`/books/${book._id}`} style={styles.flashSaleButton}>
                    View Deal
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Best Selling Books */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>🔥 Best Selling Books</h2>
          <div style={styles.titleUnderline}></div>
        </div>

        {bestSellingBooks.length === 0 ? (
          <div style={styles.empty}>
            <p>No best-selling data yet</p>
          </div>
        ) : (
          <div style={styles.grid}>
            {bestSellingBooks.map((book) => (
              <BookCard key={book._id} book={book} />
            ))}
          </div>
        )}
      </section>

      {/* All Books */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>📖 All Books</h2>
          <div style={styles.titleUnderline}></div>
        </div>

        {loading ? (
          <div style={styles.loading}>
            <div style={styles.spinner}></div>
            <p>Loading amazing books...</p>
          </div>
        ) : books.length === 0 ? (
          <div style={styles.empty}>
            <p>😔 No books found</p>
            <p style={styles.emptySmall}>Try adjusting your filters</p>
          </div>
        ) : (
          <>
            <div style={styles.grid}>
              {books.map((book) => (
                <BookCard key={book._id} book={book} />
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div style={styles.pagination}>
                <button
                  onClick={() => handlePageChange(filters.page - 1)}
                  disabled={filters.page === 1}
                  style={{
                    ...styles.pageButton,
                    ...(filters.page === 1 && styles.disabled),
                  }}
                >
                  ← Previous
                </button>

                <span style={styles.pageInfo}>
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>

                <button
                  onClick={() => handlePageChange(filters.page + 1)}
                  disabled={filters.page === pagination.totalPages}
                  style={{
                    ...styles.pageButton,
                    ...(filters.page === pagination.totalPages &&
                      styles.disabled),
                  }}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};

const styles = {
  container: {
    background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
    minHeight: "100vh",
  },
  banner: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "#fff",
    padding: "4rem 2rem",
    marginBottom: "3rem",
    boxShadow: "0 10px 30px rgba(102, 126, 234, 0.3)",
    borderRadius: "0 0 20px 20px",
  },
  bannerContent: {
    maxWidth: "1200px",
    margin: "0 auto",
    textAlign: "center",
  },
  bannerTitle: {
    fontSize: "3rem",
    fontWeight: "700",
    marginBottom: "0.5rem",
    textShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
  bannerSubtitle: {
    fontSize: "1.3rem",
    fontWeight: "300",
    opacity: "0.95",
  },
  sliderWrapper: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "2rem 2rem 0 2rem",
  },
  section: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "0 2rem",
    marginBottom: "3rem",
  },
  joinUsSection: {
    maxWidth: "1200px",
    margin: "0 auto 2rem",
    padding: "0 2rem",
  },
  joinUsContent: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "1rem",
    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
    color: "#f8fafc",
    borderRadius: "16px",
    padding: "1.2rem 1.4rem",
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.28)",
  },
  joinUsTitle: {
    margin: "0 0 0.25rem",
    fontSize: "1.5rem",
    fontWeight: 800,
  },
  joinUsSubtitle: {
    margin: 0,
    color: "#cbd5e1",
  },
  joinUsButton: {
    textDecoration: "none",
    background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
    color: "#fff",
    padding: "0.7rem 1.1rem",
    borderRadius: "10px",
    fontWeight: 700,
    whiteSpace: "nowrap",
  },
  sectionHeader: {
    marginBottom: "2rem",
  },
  sectionTitle: {
    fontSize: "2rem",
    color: "#2c3e50",
    marginBottom: "0.75rem",
    fontWeight: "700",
  },
  titleUnderline: {
    width: "60px",
    height: "4px",
    background: "linear-gradient(90deg, #667eea 0%, #764ba2 100%)",
    borderRadius: "2px",
  },
  sectionHint: {
    marginTop: "0.75rem",
    color: "#5f6f8d",
    fontSize: "0.95rem",
  },
  filterSection: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "0 2rem",
    marginBottom: "2rem",
  },
  filterHeader: {
    marginBottom: "1.5rem",
  },
  filterTitle: {
    fontSize: "1.3rem",
    marginBottom: "0.5rem",
    color: "#2c3e50",
    fontWeight: "600",
  },
  filters: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "1rem",
    backgroundColor: "#fff",
    padding: "1.5rem",
    borderRadius: "12px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
  },
  select: {
    padding: "0.75rem",
    border: "2px solid #e0e0e0",
    borderRadius: "8px",
    fontSize: "1rem",
    backgroundColor: "#fff",
    cursor: "pointer",
    transition: "all 0.3s ease",
    color: "#2c3e50",
  },
  input: {
    padding: "0.75rem",
    border: "2px solid #e0e0e0",
    borderRadius: "8px",
    fontSize: "1rem",
    backgroundColor: "#fff",
    transition: "all 0.3s ease",
    color: "#2c3e50",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: "2rem",
  },
  flashSaleHeader: {
    marginBottom: "1rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "1rem",
    background: "linear-gradient(135deg, #ffedd5 0%, #fee2e2 100%)",
    border: "1px solid #fecaca",
    borderRadius: "14px",
    padding: "1rem 1.1rem",
  },
  flashSaleTitle: {
    fontSize: "1.8rem",
    color: "#991b1b",
    margin: "0 0 0.2rem",
    fontWeight: 800,
  },
  flashSaleSubtitle: {
    margin: 0,
    color: "#9f1239",
    fontSize: "0.95rem",
  },
  countdownBadge: {
    background: "#7f1d1d",
    color: "#fff",
    borderRadius: "10px",
    padding: "0.5rem 0.8rem",
    minWidth: "130px",
    textAlign: "center",
  },
  countdownLabel: {
    display: "block",
    fontSize: "0.75rem",
    textTransform: "uppercase",
    opacity: 0.85,
  },
  countdownValue: {
    display: "block",
    fontSize: "1.05rem",
    letterSpacing: "0.07em",
  },
  flashSaleGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
    gap: "1.1rem",
  },
  flashSaleCard: {
    position: "relative",
    background: "#fff",
    border: "1px solid #fecaca",
    borderRadius: "14px",
    boxShadow: "0 8px 18px rgba(153, 27, 27, 0.12)",
    overflow: "hidden",
  },
  discountChip: {
    position: "absolute",
    top: "10px",
    left: "10px",
    zIndex: 2,
    background: "linear-gradient(135deg, #ef4444 0%, #be123c 100%)",
    color: "#fff",
    fontWeight: 700,
    fontSize: "0.82rem",
    borderRadius: "999px",
    padding: "0.28rem 0.55rem",
  },
  flashSaleImageLink: {
    display: "block",
    width: "100%",
    aspectRatio: "3 / 4",
    background: "#f8fafc",
  },
  flashSaleImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  flashSalePlaceholder: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "3rem",
    color: "#94a3b8",
  },
  flashSaleContent: {
    padding: "0.8rem",
  },
  flashSaleBookTitle: {
    display: "inline-block",
    color: "#0f172a",
    fontWeight: 700,
    lineHeight: 1.35,
    textDecoration: "none",
    minHeight: "2.7rem",
  },
  flashSaleAuthor: {
    margin: "0.35rem 0 0.65rem",
    fontSize: "0.88rem",
    color: "#64748b",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  flashSalePriceRow: {
    display: "flex",
    alignItems: "baseline",
    gap: "0.6rem",
    marginBottom: "0.75rem",
  },
  flashSalePrice: {
    color: "#b91c1c",
    fontSize: "1.2rem",
    fontWeight: 800,
  },
  flashSaleOriginalPrice: {
    color: "#94a3b8",
    textDecoration: "line-through",
    fontSize: "0.9rem",
  },
  flashSaleButton: {
    display: "inline-block",
    textDecoration: "none",
    background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
    color: "#fff",
    padding: "0.5rem 0.75rem",
    borderRadius: "8px",
    fontSize: "0.84rem",
    fontWeight: 700,
  },
  newsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "1.25rem",
  },
  newsCard: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    overflow: "hidden",
    boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
  },
  newsImageLink: {
    display: "block",
    height: "180px",
  },
  newsImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  newsPlaceholder: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "2rem",
    backgroundColor: "#f1f2f6",
    color: "#bdc3c7",
  },
  newsBody: {
    padding: "0.9rem",
  },
  newsTitleLink: {
    color: "#2c3e50",
    fontWeight: 700,
    textDecoration: "none",
    lineHeight: 1.4,
    display: "inline-block",
    marginBottom: "0.5rem",
  },
  newsDate: {
    color: "#7f8c8d",
    fontSize: "0.9rem",
  },
  loading: {
    textAlign: "center",
    padding: "3rem 2rem",
    fontSize: "1.2rem",
    color: "#667eea",
  },
  spinner: {
    width: "50px",
    height: "50px",
    border: "4px solid #e0e0e0",
    borderTop: "4px solid #667eea",
    borderRadius: "50%",
    margin: "0 auto 1rem",
    animation: "spin 1s linear infinite",
  },
  empty: {
    textAlign: "center",
    padding: "3rem 2rem",
    backgroundColor: "#fff",
    borderRadius: "12px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
  },
  emptySmall: {
    color: "#95a5a6",
    fontSize: "0.95rem",
    marginTop: "0.5rem",
  },
  pagination: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "1.5rem",
    marginTop: "2rem",
  },
  pageButton: {
    padding: "0.75rem 1.5rem",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)",
  },
  disabled: {
    backgroundColor: "#bdc3c7",
    background: "#bdc3c7",
    cursor: "not-allowed",
    boxShadow: "none",
    opacity: "0.6",
  },
  pageInfo: {
    color: "#2c3e50",
    fontWeight: "600",
    fontSize: "1rem",
  },
};

export default HomePage;
