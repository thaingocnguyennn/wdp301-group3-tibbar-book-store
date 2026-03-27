import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useWishlist } from "../../hooks/useWishlist";
import { useCart } from "../../hooks/useCart";
import { bookApi } from "../../api/bookApi";
import { supportApi } from "../../api/supportApi";

const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const moreMenuRef = useRef(null);
  const { wishlist } = useWishlist();
  const { cart } = useCart();
  const [ebookCount, setEbookCount] = useState(0);
  const [adminUnreadMessages, setAdminUnreadMessages] = useState(0);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  const isShipper = user?.role?.toLowerCase() === "shipper";
  const showCustomerNavLinks = !isAdmin;
  const cartCount = Array.isArray(cart?.items) ? cart.items.length : 0;

  const primaryNavLinks = [{ to: "/", label: "Home" }];
  const overflowNavLinks = [];

  if (isAdmin) {
    primaryNavLinks.push({ to: "/admin/dashboard", label: "Admin Dashboard" });
    primaryNavLinks.push({
      to: "/admin/support",
      label:
        adminUnreadMessages > 0
          ? `Support Inbox (${adminUnreadMessages})`
          : "Support Inbox",
    });

    overflowNavLinks.push({
      to: "/admin/support-system",
      label: "Support System",
    });
    overflowNavLinks.push({
      to: "/admin/support-system/history",
      label: "Support Inbox History",
    });
  }

  if (showCustomerNavLinks) {
    primaryNavLinks.push({ to: "/newest", label: "Newest" });
    overflowNavLinks.push({
      to: "/recently-viewed",
      label: "Recently Viewed",
    });
  }

  if (isAuthenticated && showCustomerNavLinks) {
    primaryNavLinks.push({ to: "/orders", label: "My Orders" });
    primaryNavLinks.push({
      to: "/ebooks",
      label: ebookCount > 0 ? `E-Books (${ebookCount})` : "E-Books",
    });

    overflowNavLinks.push({ to: "/my-vouchers", label: "My Vouchers" });
    overflowNavLinks.push({ to: "/support", label: "Support" });
    overflowNavLinks.push({
      to: "/support-system/history",
      label: "Support History",
    });
    overflowNavLinks.push({
      to: "/wishlist",
      label:
        wishlist?.length > 0 ? `Wishlist (${wishlist.length})` : "Wishlist",
    });
  }

  if (isAuthenticated && isShipper) {
    overflowNavLinks.push({
      to: "/assignment-history",
      label: "Assignment History",
    });
  }

  useEffect(() => {
    if (!isAuthenticated || !showCustomerNavLinks) {
      setEbookCount(0);
      return;
    }

    let cancelled = false;

    const fetchEbookCount = async () => {
      try {
        const response = await bookApi.getMyEbooks();
        const ebooks = response?.data?.ebooks || [];
        if (!cancelled) {
          setEbookCount(ebooks.length);
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

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      setAdminUnreadMessages(0);
      return;
    }

    let cancelled = false;

    const fetchUnreadSummary = async () => {
      try {
        const response = await supportApi.getAdminUnreadSummary();
        if (!cancelled) {
          setAdminUnreadMessages(response?.data?.unreadMessages || 0);
        }
      } catch {
        if (!cancelled) {
          setAdminUnreadMessages(0);
        }
      }
    };

    fetchUnreadSummary();
    const intervalId = setInterval(fetchUnreadSummary, 5000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [isAuthenticated, isAdmin]);

  useEffect(() => {
    if (!moreMenuOpen) {
      return undefined;
    }

    const handleClickOutside = (event) => {
      if (!moreMenuRef.current?.contains(event.target)) {
        setMoreMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setMoreMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [moreMenuOpen]);

  const handleLogout = async () => {
    setMoreMenuOpen(false);
    await logout();
    navigate("/");
  };

  const closeMoreMenu = () => setMoreMenuOpen(false);

  return (
    <nav style={styles.nav}>
      <div style={styles.container}>
        <Link to="/" style={styles.logo}>
          Bookstore
        </Link>

        <div style={styles.links}>
          <div style={styles.primaryLinks}>
            {primaryNavLinks.map((item) => (
              <Link key={item.to} to={item.to} style={styles.link}>
                {item.label}
              </Link>
            ))}
          </div>

          <div style={styles.secondaryLinks}>
            {isAuthenticated ? (
              <>
                <Link to="/profile" style={styles.link}>
                  Profile
                </Link>

                {showCustomerNavLinks && (
                  <Link to="/cart" style={styles.link}>
                    {cartCount > 0 ? `Cart (${cartCount})` : "Cart"}
                  </Link>
                )}

                {overflowNavLinks.length > 0 && (
                  <div ref={moreMenuRef} style={styles.dropdown}>
                    <button
                      type="button"
                      style={styles.dropdownButton}
                      onClick={() => setMoreMenuOpen((prev) => !prev)}
                    >
                      More
                    </button>
                    {moreMenuOpen && (
                      <div style={styles.dropdownMenu}>
                        {overflowNavLinks.map((item) => (
                          <Link
                            key={item.to}
                            to={item.to}
                            style={styles.dropdownLink}
                            onClick={closeMoreMenu}
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <button onClick={handleLogout} style={styles.button}>
                  Logout
                </button>

                <span style={styles.user}>
                  {user?.role
                    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
                    : "User"}
                </span>
              </>
            ) : (
              <>
                {overflowNavLinks.length > 0 && (
                  <div ref={moreMenuRef} style={styles.dropdown}>
                    <button
                      type="button"
                      style={styles.dropdownButton}
                      onClick={() => setMoreMenuOpen((prev) => !prev)}
                    >
                      More
                    </button>
                    {moreMenuOpen && (
                      <div style={styles.dropdownMenu}>
                        {overflowNavLinks.map((item) => (
                          <Link
                            key={item.to}
                            to={item.to}
                            style={styles.dropdownLink}
                            onClick={closeMoreMenu}
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}

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
    justifyContent: "flex-start",
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
  dropdown: {
    position: "relative",
    flexShrink: 0,
  },
  dropdownButton: {
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    color: "#fff",
    border: "1px solid rgba(255, 255, 255, 0.28)",
    borderRadius: "999px",
    padding: "0.5rem 0.9rem",
    cursor: "pointer",
    fontSize: "0.9rem",
    fontWeight: "600",
    whiteSpace: "nowrap",
  },
  dropdownMenu: {
    position: "absolute",
    top: "calc(100% + 0.6rem)",
    right: 0,
    minWidth: "220px",
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
    backgroundColor: "rgba(15, 23, 42, 0.96)",
    border: "1px solid rgba(255, 255, 255, 0.18)",
    borderRadius: "14px",
    padding: "0.5rem",
    boxShadow: "0 18px 40px rgba(15, 23, 42, 0.32)",
    backdropFilter: "blur(14px)",
  },
  dropdownLink: {
    color: "#fff",
    textDecoration: "none",
    padding: "0.7rem 0.8rem",
    borderRadius: "10px",
    fontWeight: "500",
    whiteSpace: "nowrap",
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
