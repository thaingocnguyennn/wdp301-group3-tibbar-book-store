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
  const authorName = String(book.author || 'Unknown Author').replace(/^by\s+/i, '');

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
        <p style={styles.author}>by {authorName}</p>

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
    borderRadius: '14px',
    boxShadow: '0 6px 20px rgba(15, 23, 42, 0.08)',
    overflow: 'hidden',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'pointer',
    border: '1px solid #e7eef7',
    display: 'flex',
    flexDirection: 'column',
    height: '100%'
  },
  imageContainer: {
    width: '100%',
    aspectRatio: '3 / 4',
    minHeight: '240px',
    overflow: 'hidden',
    background: '#f1f5f9',
    position: 'relative',
    borderBottom: '1px solid #e7eef7',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
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
    fontSize: '4.2rem',
    color: '#bdc3c7',
    background: 'linear-gradient(145deg, #f7f9fc 0%, #ecf2f9 100%)'
  },
  content: {
    padding: '1rem 1rem 1.05rem',
    display: 'flex',
    flexDirection: 'column',
    flex: '1'
  },
  title: {
    fontSize: '1.06rem',
    fontWeight: '700',
    margin: '0 0 0.35rem 0',
    color: '#0f172a',
    lineHeight: 1.35,
    minHeight: '2.8rem',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden'
  },
  author: {
    color: '#64748b',
    fontSize: '0.88rem',
    margin: '0 0 0.65rem 0',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  category: {
    display: 'inline-block',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    padding: '0.35rem 0.85rem',
    borderRadius: '12px',
    fontSize: '0.75rem',
    marginBottom: '0.85rem',
    fontWeight: '600',
    maxWidth: '100%',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
    gap: '0.6rem'
  },
  price: {
    fontSize: '1.28rem',
    fontWeight: '700',
    color: '#4f46e5',
    whiteSpace: 'nowrap'
  },
  button: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    padding: '0.52rem 0.88rem',
    borderRadius: '8px',
    textDecoration: 'none',
    fontSize: '0.84rem',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
    whiteSpace: 'nowrap',
    flexShrink: 0
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
