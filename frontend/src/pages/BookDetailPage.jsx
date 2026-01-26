import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bookApi } from '../api/bookApi';

const BookDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBook();
  }, [id]);

  const fetchBook = async () => {
    try {
      setLoading(true);
      const response = await bookApi.getBookById(id);
      setBook(response.data.book);
    } catch (err) {
      setError(err.response?.data?.message || 'Book not found');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading...</div>;
  }

  if (error) {
    return (
      <div style={styles.error}>
        <h2>{error}</h2>
        <button onClick={() => navigate('/')} style={styles.button}>
          Back to Home
        </button>
      </div>
    );
  }

  if (!book) return null;

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.imageSection}>
          {book.imageUrl ? (
            <img src={book.imageUrl} alt={book.title} style={styles.image} />
          ) : (
            <div style={styles.placeholder}>📖</div>
          )}
        </div>

        <div style={styles.detailsSection}>
          <h1 style={styles.title}>{book.title}</h1>
          <p style={styles.author}>by {book.author}</p>

          {book.category && (
            <div style={styles.categoryBadge}>
              {book.category.name}
            </div>
          )}

          <div style={styles.price}>
            ${book.price.toFixed(2)}
          </div>

          {book.description && (
            <div style={styles.descriptionSection}>
              <h3 style={styles.sectionTitle}>Description</h3>
              <p style={styles.description}>{book.description}</p>
            </div>
          )}

          <div style={styles.infoGrid}>
            {book.isbn && (
              <div style={styles.infoItem}>
                <strong>ISBN:</strong> {book.isbn}
              </div>
            )}
            {book.publishedDate && (
              <div style={styles.infoItem}>
                <strong>Published:</strong> {new Date(book.publishedDate).toLocaleDateString()}
              </div>
            )}
            <div style={styles.infoItem}>
              <strong>Stock:</strong> {book.stock > 0 ? `${book.stock} available` : 'Out of stock'}
            </div>
          </div>

          <div style={styles.actions}>
            <button
              disabled={book.stock === 0}
              style={{
                ...styles.addToCart,
                ...(book.stock === 0 && styles.disabled)
              }}
            >
              {book.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
            </button>
            <button onClick={() => navigate('/')} style={styles.backButton}>
              Back to Store
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '2rem'
  },
  content: {
    display: 'grid',
    gridTemplateColumns: '400px 1fr',
    gap: '3rem',
    backgroundColor: '#fff',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  imageSection: {
    width: '100%'
  },
  image: {
    width: '100%',
    height: 'auto',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
  },
  placeholder: {
    width: '100%',
    aspectRatio: '3/4',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
    fontSize: '8rem',
    color: '#bdc3c7'
  },
  detailsSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  title: {
    fontSize: '2rem',
    color: '#2c3e50',
    marginBottom: '0.5rem'
  },
  author: {
    fontSize: '1.2rem',
    color: '#7f8c8d',
    marginBottom: '1rem'
  },
  categoryBadge: {
    display: 'inline-block',
    backgroundColor: '#3498db',
    color: '#fff',
    padding: '0.5rem 1rem',
    borderRadius: '20px',
    fontSize: '0.9rem',
    width: 'fit-content'
  },
  price: {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    color: '#27ae60',
    margin: '1rem 0'
  },
  descriptionSection: {
    marginTop: '1rem'
  },
  sectionTitle: {
    fontSize: '1.3rem',
    color: '#2c3e50',
    marginBottom: '0.5rem'
  },
  description: {
    lineHeight: '1.6',
    color: '#34495e'
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
    marginTop: '1rem',
    padding: '1rem',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px'
  },
  infoItem: {
    fontSize: '0.95rem',
    color: '#34495e'
  },
  actions: {
    display: 'flex',
    gap: '1rem',
    marginTop: '2rem'
  },
  addToCart: {
    flex: 1,
    backgroundColor: '#27ae60',
    color: '#fff',
    padding: '1rem 2rem',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1.1rem',
    fontWeight: '500',
    cursor: 'pointer'
  },
  backButton: {
    backgroundColor: '#95a5a6',
    color: '#fff',
    padding: '1rem 2rem',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1.1rem',
    cursor: 'pointer'
  },
  disabled: {
    backgroundColor: '#bdc3c7',
    cursor: 'not-allowed'
  },
  loading: {
    textAlign: 'center',
    padding: '4rem',
    fontSize: '1.5rem',
    color: '#7f8c8d'
  },
  error: {
    textAlign: 'center',
    padding: '4rem'
  },
  button: {
    backgroundColor: '#3498db',
    color: '#fff',
    padding: '0.75rem 1.5rem',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    cursor: 'pointer',
    marginTop: '1rem'
  }
};

export default BookDetailPage;