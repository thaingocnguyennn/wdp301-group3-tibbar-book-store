import { Link } from 'react-router-dom';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../hooks/useAuth';

const BookCard = ({ book }) => {
  const { isAuthenticated } = useAuth();
  const { wishlist = [], add } = useWishlist(); // ❌ KHÔNG remove

  if (!book) return null;

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
        {book.imageUrl ? (
          <img src={book.imageUrl} alt={book.title} style={styles.image} />
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
            ${typeof book.price === 'number' ? book.price.toFixed(2) : '0.00'}
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
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    overflow: 'hidden',
    cursor: 'pointer'
  },
  imageContainer: {
    width: '100%',
    height: '250px',
    backgroundColor: '#f5f5f5',
    position: 'relative'
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  placeholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '5rem',
    color: '#bdc3c7'
  },
  content: { padding: '1rem' },
  title: {
    fontSize: '1.1rem',
    fontWeight: '600',
    marginBottom: '0.5rem'
  },
  author: {
    color: '#7f8c8d',
    fontSize: '0.9rem'
  },
  category: {
    backgroundColor: '#ecf0f1',
    padding: '0.25rem 0.75rem',
    borderRadius: '12px',
    fontSize: '0.8rem'
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '1rem'
  },
  price: {
    fontSize: '1.2rem',
    fontWeight: 'bold',
    color: '#27ae60'
  },
  button: {
    backgroundColor: '#3498db',
    color: '#fff',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    textDecoration: 'none'
  },
  outOfStock: {
    backgroundColor: '#e74c3c',
    color: '#fff',
    padding: '0.25rem 0.75rem',
    borderRadius: '4px',
    fontSize: '0.8rem',
    marginTop: '0.5rem'
  }
};

export default BookCard;
