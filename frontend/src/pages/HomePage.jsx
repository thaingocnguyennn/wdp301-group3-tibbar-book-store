import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { bookApi } from "../api/bookApi";
import { categoryApi } from "../api/categoryApi";
import { sliderApi } from "../api/sliderApi";
import { newsApi } from "../api/newsApi";
import BookCard from "../components/books/BookCard";
import Slider from "../components/common/Slider";

const HomePage = () => {
  const [books, setBooks] = useState([]);
  const [bestSellingBooks, setBestSellingBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sliders, setSliders] = useState([]);
  const [homepageNews, setHomepageNews] = useState([]);
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
  }, []);

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
                    <img src={`${serverBaseUrl}${item.imageUrl}`} alt={item.title} style={styles.newsImage} />
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
