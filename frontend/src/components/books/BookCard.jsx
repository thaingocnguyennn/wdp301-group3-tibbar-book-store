import { Link } from 'react-router-dom';

const BookCard = ({ book }) => {
  return (
    <div style={styles.card}>
      <div style={styles.imageContainer}>
        {book.imageUrl ? (
          <img src={book.imageUrl} alt={book.title} style={styles.image} />
        ) : (
          <div style={styles.placeholder}>📖</div>
        )}
      </div>

      <div style={styles.content}>
        <h3 style={styles.title}>{book.title}</h3>
        <p style={styles.author}>by {book.author}</p>
        
        {book.category && (
          <span style={styles.category}>{book.category.name}</span>
        )}

        <div style={styles.footer}>
          <span style={styles.price}>${book.price.toFixed(2)}</span>
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
    transition: 'transform 0.2s',
    cursor: 'pointer'
  },
  imageContainer: {
    width: '100%',
    height: '250px',
    overflow: 'hidden',
    backgroundColor: '#f5f5f5'
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
  content: {
    padding: '1rem'
  },
  title: {
    fontSize: '1.1rem',
    fontWeight: '600',
    margin: '0 0 0.5rem 0',
    color: '#2c3e50',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  author: {
    color: '#7f8c8d',
    fontSize: '0.9rem',
    margin: '0 0 0.5rem 0'
  },
  category: {
    display: 'inline-block',
    backgroundColor: '#ecf0f1',
    color: '#34495e',
    padding: '0.25rem 0.75rem',
    borderRadius: '12px',
    fontSize: '0.8rem',
    marginBottom: '1rem'
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '1rem'
  },
  price: {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    color: '#27ae60'
  },
  button: {
    backgroundColor: '#3498db',
    color: '#fff',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    textDecoration: 'none',
    fontSize: '0.9rem'
  },
  outOfStock: {
    display: 'inline-block',
    backgroundColor: '#e74c3c',
    color: '#fff',
    padding: '0.25rem 0.75rem',
    borderRadius: '4px',
    fontSize: '0.8rem',
    marginTop: '0.5rem'
  }
};

export default BookCard;