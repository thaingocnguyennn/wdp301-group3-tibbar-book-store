import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useWishlist } from "../../hooks/useWishlist";
import { useCart } from "../../hooks/useCart";
import { orderApi } from "../../api/orderApi";

const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const { wishlist } = useWishlist();
  const { cart } = useCart();
  const [ebookCount, setEbookCount] = useState(0);
  const isShipper = user?.role?.toLowerCase() === "shipper";
  const showCustomerNavLinks = !isAdmin;
  const cartCount = Array.isArray(cart?.items) ? cart.items.length : 0;

  useEffect(() => {
    if (!isAuthenticated || !showCustomerNavLinks) {
      setEbookCount(0);
      return;
    }

    let cancelled = false;

    const fetchEbookCount = async () => {
      try {
        const response = await orderApi.getUserOrders(1, 100);
        const orders = response?.data?.orders || [];
        const uniqueEbookIds = new Set();

        orders.forEach((order) => {
          (order.items || []).forEach((item) => {
            const book = item?.book;
            if (book?._id && book?.isEbook) {
              uniqueEbookIds.add(book._id);
            }
          });
        });

        if (!cancelled) {
          setEbookCount(uniqueEbookIds.size);
        }
      } catch {
        if (!cancelled) {
          setEbookCount(0);
        }
      }
    };

    fetchEbookCount();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, showCustomerNavLinks]);

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
          <div style={styles.primaryLinks}>
            <Link to="/" style={styles.link}>
              Home
            </Link>
            {isAdmin && (
              <Link to="/admin/dashboard" style={styles.link}>
                Admin Dashboard
              </Link>
            )}
            {isAuthenticated && (
              <Link to="/profile" style={styles.link}>
                Profile
              </Link>
            )}
          </div>

          <div style={styles.secondaryLinks}>
            {showCustomerNavLinks && (
              <Link to="/newest" style={styles.link}>
                ✨ Newest
              </Link>
            )}

            {showCustomerNavLinks && (
              <Link to="/recently-viewed" style={styles.link}>
                🕒 Recently Viewed
              </Link>
            )}

            {isAuthenticated ? (
              <>
                {showCustomerNavLinks && (
                  <Link to="/orders" style={styles.link}>
                    My Orders
                  </Link>
                )}

                {showCustomerNavLinks && (
                  <Link to="/my-vouchers" style={styles.link}>
                    My Vouchers
                  </Link>
                )}

                {isShipper && (
                  <Link to="/assignment-history" style={styles.link}>
                    Assignment History
                  </Link>
                )}

                {showCustomerNavLinks && (
                  <Link to="/wishlist" style={styles.link}>
                    Wishlist {wishlist?.length > 0 && `(${wishlist.length})`}
                  </Link>
                )}

                {showCustomerNavLinks && (
                  <Link to="/ebooks" style={styles.link}>
                    E-Books {ebookCount > 0 && `(${ebookCount})`}
                  </Link>
                )}

                {showCustomerNavLinks && (
                  <Link to="/cart" style={styles.link}>
                    Cart {cartCount > 0 && `(${cartCount})`}
                  </Link>
                )}

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
    flexWrap: "wrap",
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
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    flex: 1,
    minWidth: "260px",
    gap: "1rem",
  },
  primaryLinks: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "1rem",
    flex: 1,
    flexWrap: "wrap",
  },
  secondaryLinks: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "1rem",
    flexWrap: "wrap",
  },
  link: {
    color: "#fff",
    textDecoration: "none",
    transition: "all 0.3s ease",
    fontWeight: "500",
    padding: "0.5rem 0",
    borderBottom: "2px solid transparent",
    whiteSpace: "nowrap",
    flexShrink: 0,
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
    fontSize: "0.95rem",
    fontWeight: "500",
    whiteSpace: "nowrap",
    flexShrink: 0,
  },
};

export default Navbar;
