import { Link } from 'react-router-dom';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../hooks/useAuth';

const BookCard = ({ book }) => {
  const { isAuthenticated } = useAuth();
  const { wishlist = [], add } = useWishlist(); // ❌ KHÔNG remove

  if (!book) return null;

  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const serverBaseUrl = apiBase.replace(/\/api\/?$/, '');
  const imageSrc = book.imageUrl
    ? book.imageUrl.startsWith('http')
      ? book.imageUrl
      : `${serverBaseUrl}${book.imageUrl}`
    : '';

  const isWishlisted = Array.isArray(wishlist)
  ? wishlist.some(b => b._id === book._id)
  : false;



  const handleAddWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      alert('Please login to use wishlist');
      return;
    }

    if (isWishlisted) return;

    await add(book._id);
  };


  return (
    <div style={styles.card}>
      <div style={styles.imageContainer}>
        {imageSrc ? (
          <img src={imageSrc} alt={book.title} style={styles.image} />
        ) : (
          <div style={styles.placeholder}>📖</div>
        )}

        {/* ❤️ ADD WISHLIST ICON */}
        <button
          type="button"
          onClick={handleAddWishlist}
          disabled={isWishlisted}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: '#fff',
            border: 'none',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            cursor: isWishlisted ? 'default' : 'pointer',
            fontSize: '1.2rem',
            boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: isWishlisted ? 0.6 : 1
          }}
        >
          {isWishlisted ? '❤️' : '🤍'}
        </button>
      </div>

      <div style={styles.content}>
        <h3 style={styles.title}>{book.title}</h3>
        <p style={styles.author}>by {book.author}</p>

        {book.category?.name && (
          <span style={styles.category}>{book.category.name}</span>
        )}

        <div style={styles.footer}>
          <span style={styles.price}>
            {typeof book.price === 'number' ? book.price.toLocaleString('vi-VN') : '0'}₫
          </span>
          <Link to={`/books/${book._id}`} style={styles.button}>
            View Details
          </Link>
        </div>

        {book.stock === 0 && (
          <span style={styles.outOfStock}>Out of Stock</span>
        )}
      </div>
    </div>
  );
};

const styles = {
  card: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
    overflow: 'hidden',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'pointer',
    border: '1px solid #f0f0f0',
    display: 'flex',
    flexDirection: 'column',
    height: '100%'
  },
  imageContainer: {
    width: '100%',
    height: '280px',
    overflow: 'hidden',
    backgroundColor: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
    position: 'relative'
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.3s ease'
  },
  placeholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '5rem',
    color: '#bdc3c7',
    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
  },
  content: {
    padding: '1.25rem',
    display: 'flex',
    flexDirection: 'column',
    flex: '1'
  },
  title: {
    fontSize: '1.1rem',
    fontWeight: '600',
    marginBottom: '0.5rem'
  },
  author: {
    color: '#7f8c8d',
    fontSize: '0.9rem',
    margin: '0 0 0.75rem 0'
  },
  category: {
    display: 'inline-block',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    padding: '0.35rem 0.85rem',
    borderRadius: '12px',
    fontSize: '0.75rem',
    marginBottom: '1rem',
    fontWeight: '600'
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto'
  },
  price: {
    fontSize: '1.35rem',
    fontWeight: '700',
    color: '#667eea'
  },
  button: {
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    padding: '0.6rem 1.2rem',
    borderRadius: '8px',
    textDecoration: 'none',
    fontSize: '0.9rem',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
  },
  outOfStock: {
    backgroundColor: '#e74c3c',
    color: '#fff',
    padding: '0.35rem 0.85rem',
    borderRadius: '8px',
    fontSize: '0.8rem',
    marginTop: '0.5rem',
    fontWeight: '600'
  }
};

export default BookCard;
