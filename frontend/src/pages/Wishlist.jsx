import { useWishlist } from '../context/WishlistContext';
import BookCard from '../components/books/BookCard';

const Wishlist = () => {
  const { wishlist, remove } = useWishlist();

  if (!Array.isArray(wishlist) || wishlist.length === 0) {
    return (
      <div style={{ padding: '2rem' }}>
        <h2>❤️ My Wishlist</h2>
        <p>No books in wishlist</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h2>❤️ My Wishlist</h2>

      <div style={grid}>
        {wishlist.map((item) => (
          <div key={item._id} style={{ position: 'relative' }}>
            <BookCard book={item} />

            {/* ❌ REMOVE BUTTON */}
            <button
              onClick={() => remove(item._id)}
              style={removeBtn}
            >
              ❌ Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const grid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
  gap: '1.5rem'
};

const removeBtn = {
  marginTop: '0.5rem',
  width: '100%',
  padding: '0.5rem',
  backgroundColor: '#e74c3c',
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '0.9rem'
};

export default Wishlist;
