import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useCart } from "../../hooks/useCart";
import CartDrawer from "../cart/CartDrawer";

const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { cartItemCount } = useCart();
  const navigate = useNavigate();
  const [showCart, setShowCart] = useState(false);

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

              {/* Cart Icon */}
              <button
                onClick={() => setShowCart(true)}
                style={styles.cartButton}
              >
                🛒
                {cartItemCount > 0 && (
                  <span style={styles.cartBadge}>{cartItemCount}</span>
                )}
              </button>

              <button onClick={handleLogout} style={styles.button}>
                Logout
              </button>
              <span style={styles.user}>
                👤 {user?.firstName || user?.email}
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

      {/* Cart Drawer */}
      <CartDrawer isOpen={showCart} onClose={() => setShowCart(false)} />
    </nav>
  );
};

const styles = {
  nav: {
    backgroundColor: "#2c3e50",
    padding: "1rem 0",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
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
    fontSize: "1.5rem",
    fontWeight: "bold",
    color: "#fff",
    textDecoration: "none",
  },
  links: {
    display: "flex",
    gap: "1.5rem",
    alignItems: "center",
  },
  link: {
    color: "#ecf0f1",
    textDecoration: "none",
    transition: "color 0.2s",
  },
  button: {
    backgroundColor: "#3498db",
    color: "#fff",
    border: "none",
    padding: "0.5rem 1rem",
    borderRadius: "4px",
    cursor: "pointer",
    textDecoration: "none",
    fontSize: "1rem",
  },
  user: {
    color: "#ecf0f1",
    fontSize: "0.9rem",
  },
  cartButton: {
    position: "relative",
    backgroundColor: "transparent",
    color: "#fff",
    border: "none",
    fontSize: "1.5rem",
    cursor: "pointer",
    padding: "0.5rem",
  },
  cartBadge: {
    position: "absolute",
    top: "0",
    right: "0",
    backgroundColor: "#e74c3c",
    color: "#fff",
    borderRadius: "50%",
    width: "20px",
    height: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.75rem",
    fontWeight: "bold",
  },
};

export default Navbar;
