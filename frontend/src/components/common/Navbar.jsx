import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useWishlist } from "../../hooks/useWishlist";
import { useCart } from "../../hooks/useCart";

const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const { wishlist } = useWishlist();
  const { cart } = useCart();
  const isShipper = user?.role?.toLowerCase() === "shipper";
  const cartCount = Array.isArray(cart?.items) ? cart.items.length : 0;

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <nav style={styles.nav}>
      <div style={styles.container}>
        <Link to="/" style={styles.logo}>
          📚 Bookstore
        </Link>

        <div style={styles.links}>
          <Link to="/" style={styles.link}>
            Home
          </Link>
          <Link to="/newest" style={styles.link}>
            ✨ Newest
          </Link>
          <Link to="/recently-viewed" style={styles.link}>
            🕒 Recently Viewed
          </Link>
          {isAdmin && (
            <Link to="/admin/dashboard" style={styles.link}>
              Admin Dashboard
            </Link>
          )}
          {isAuthenticated ? (
            <>
              <Link to="/profile" style={styles.link}>
                Profile
              </Link>

              <Link to="/orders" style={styles.link}>
                My Orders
              </Link>

              {isShipper && (
                <Link to="/assignment-history" style={styles.link}>
                  Assignment History
                </Link>
              )}

              <Link to="/wishlist" style={styles.link}>
                Wishlist {wishlist?.length > 0 && `(${wishlist.length})`}
              </Link>

              <Link to="/ebooks" style={styles.link}>
                E-Books
              </Link>

              <Link to="/cart" style={styles.link}>
                Cart {cartCount > 0 && `(${cartCount})`}
              </Link>

              <button onClick={handleLogout} style={styles.button}>
                Logout
              </button>

              <span style={styles.user}>
                👤{" "}
                {user?.role
                  ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
                  : "User"}
              </span>
            </>
          ) : (
            <>
              <Link to="/login" style={styles.link}>
                Login
              </Link>
              <Link to="/register" style={styles.button}>
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

const styles = {
  nav: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    padding: "0.75rem 0",
    boxShadow: "0 4px 15px rgba(102, 126, 234, 0.3)",
    position: "sticky",
    top: "0",
    zIndex: "1000",
  },
  container: {
    maxWidth: "1320px",
    margin: "0 auto",
    padding: "0 1.25rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "1rem",
  },
  logo: {
    fontSize: "1.9rem",
    fontWeight: "bold",
    color: "#fff",
    textDecoration: "none",
    transition: "all 0.3s ease",
    whiteSpace: "nowrap",
    flexShrink: 0,
  },
  links: {
    display: "flex",
    gap: "0.35rem",
    alignItems: "center",
    justifyContent: "flex-end",
    flex: 1,
    overflowX: "auto",
    scrollbarWidth: "none",
  },
  link: {
    color: "#fff",
    textDecoration: "none",
    transition: "all 0.3s ease",
    fontWeight: "600",
    fontSize: "0.92rem",
    padding: "0.45rem 0.75rem",
    borderRadius: "8px",
    borderBottom: "none",
    whiteSpace: "nowrap",
    lineHeight: 1.1,
  },
  button: {
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    color: "#fff",
    border: "1px solid rgba(255, 255, 255, 0.75)",
    padding: "0.5rem 0.9rem",
    borderRadius: "8px",
    cursor: "pointer",
    textDecoration: "none",
    fontSize: "0.9rem",
    fontWeight: "600",
    transition: "all 0.3s ease",
    backdropFilter: "blur(10px)",
    whiteSpace: "nowrap",
    flexShrink: 0,
  },
  user: {
    color: "#fff",
    fontSize: "0.86rem",
    fontWeight: "600",
    whiteSpace: "nowrap",
    opacity: 0.95,
  },
};

export default Navbar;
