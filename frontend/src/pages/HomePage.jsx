import { useState, useEffect } from 'react';
import { bookApi } from '../api/bookApi';
import { categoryApi } from '../api/categoryApi';
import BookCard from '../components/books/BookCard';

const HomePage = () => {
  const [books, setBooks] = useState([]);
  const [newestBooks, setNewestBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: '',
    minPrice: '',
    maxPrice: '',
    author: '',
    page: 1
  });
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    fetchNewestBooks();
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [filters]);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v !== '')
      );
      const response = await bookApi.getPublicBooks(cleanFilters);
      setBooks(response.data.books);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching books:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNewestBooks = async () => {
    try {
      const response = await bookApi.getNewestBooks(6);
      setNewestBooks(response.data.books);
    } catch (error) {
      console.error('Error fetching newest books:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await categoryApi.getCategories();
      setCategories(response.data.categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
      page: 1
    });
  };

  const handlePageChange = (newPage) => {
    setFilters({ ...filters, page: newPage });
    window.scrollTo(0, 0);
  };

  return (
    <div style={styles.container}>
      {/* Newest Books Section */}
      {newestBooks.length > 0 && (
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>✨ Newest Arrivals</h2>
          <div style={styles.grid}>
            {newestBooks.map((book) => (
              <BookCard key={book._id} book={book} />
            ))}
          </div>
        </section>
      )}

      {/* Filters */}
      <section style={styles.filterSection}>
        <h3 style={styles.filterTitle}>Filter Books</h3>
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
            placeholder="Search by author"
            value={filters.author}
            onChange={handleFilterChange}
            style={styles.input}
          />

          <input
            type="number"
            name="minPrice"
            placeholder="Min Price"
            value={filters.minPrice}
            onChange={handleFilterChange}
            style={styles.input}
          />

          <input
            type="number"
            name="maxPrice"
            placeholder="Max Price"
            value={filters.maxPrice}
            onChange={handleFilterChange}
            style={styles.input}
          />
        </div>
      </section>

      {/* All Books */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>All Books</h2>
        
        {loading ? (
          <div style={styles.loading}>Loading...</div>
        ) : books.length === 0 ? (
          <div style={styles.empty}>No books found</div>
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
                  style={{...styles.pageButton, ...(filters.page === 1 && styles.disabled)}}
                >
                  Previous
                </button>
                
                <span style={styles.pageInfo}>
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                
                <button
                  onClick={() => handlePageChange(filters.page + 1)}
                  disabled={filters.page === pagination.totalPages}
                  style={{...styles.pageButton, ...(filters.page === pagination.totalPages && styles.disabled)}}
                >
                  Next
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
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '2rem'
  },
  section: {
    marginBottom: '3rem'
  },
  sectionTitle: {
    fontSize: '2rem',
    color: '#2c3e50',
    marginBottom: '1.5rem'
  },
  filterSection: {
    backgroundColor: '#fff',
    padding: '1.5rem',
    borderRadius: '8px',
    marginBottom: '2rem',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  filterTitle: {
    fontSize: '1.2rem',
    marginBottom: '1rem',
    color: '#2c3e50'
  },
  filters: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem'
  },
  select: {
    padding: '0.75rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '1rem'
  },
  input: {
    padding: '0.75rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '1rem'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '1.5rem'
  },
  loading: {
    textAlign: 'center',
    padding: '2rem',
    fontSize: '1.2rem',
    color: '#7f8c8d'
  },
  empty: {
    textAlign: 'center',
    padding: '2rem',
    fontSize: '1.2rem',
    color: '#7f8c8d'
  },
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '1rem',
    marginTop: '2rem'
  },
  pageButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#3498db',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  disabled: {
    backgroundColor: '#bdc3c7',
    cursor: 'not-allowed'
  },
  pageInfo: {
    color: '#34495e',
    fontWeight: '500'
  }
};

export default HomePage;