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
    padding: "1rem 0",
    boxShadow: "0 4px 15px rgba(102, 126, 234, 0.3)",
    position: "sticky",
    top: "0",
    zIndex: "1000",
  },
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "0 2rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logo: {
    fontSize: "1.6rem",
    fontWeight: "bold",
    color: "#fff",
    textDecoration: "none",
    transition: "all 0.3s ease",
  },
  links: {
    display: "flex",
    gap: "1.5rem",
    alignItems: "center",
  },
  link: {
    color: "#fff",
    textDecoration: "none",
    transition: "all 0.3s ease",
    fontWeight: "500",
    padding: "0.5rem 0",
    borderBottom: "2px solid transparent",
  },
  button: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    color: "#fff",
    border: "2px solid #fff",
    padding: "0.6rem 1.2rem",
    borderRadius: "8px",
    cursor: "pointer",
    textDecoration: "none",
    fontSize: "1rem",
    fontWeight: "600",
    transition: "all 0.3s ease",
    backdropFilter: "blur(10px)",
  },
  user: {
    color: "#fff",
    fontSize: "0.95rem",
    fontWeight: "500",
  },
};

export default Navbar;
