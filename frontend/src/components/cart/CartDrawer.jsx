import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../../hooks/useCart";

/**
 * CartDrawer Component
 * Hiển thị giỏ hàng dạng drawer từ bên phải màn hình
 */
const CartDrawer = ({ isOpen, onClose }) => {
  const { cart, loading, updateQuantity, removeItem } = useCart();
  const [updating, setUpdating] = useState(false);

  const handleQuantityChange = async (bookId, newQuantity) => {
    try {
      setUpdating(true);
      if (newQuantity <= 0) {
        await removeItem(bookId);
      } else {
        await updateQuantity(bookId, newQuantity);
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleRemoveItem = async (bookId) => {
    if (!confirm("Remove this item from cart?")) return;

    try {
      setUpdating(true);
      await removeItem(bookId);
    } catch (error) {
      alert(error.message);
    } finally {
      setUpdating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div style={styles.overlay} onClick={onClose} />

      {/* Drawer */}
      <div style={styles.drawer}>
        <div style={styles.header}>
          <h2 style={styles.title}>Shopping Cart</h2>
          <button style={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        <div style={styles.content}>
          {loading ? (
            <div style={styles.loading}>Loading...</div>
          ) : !cart || cart.items.length === 0 ? (
            <div style={styles.empty}>
              <p>Your cart is empty</p>
              <button style={styles.shopButton} onClick={onClose}>
                Continue Shopping
              </button>
            </div>
          ) : (
            <>
              {/* Cart Items */}
              <div style={styles.items}>
                {cart.items.map((item) => (
                  <div key={item.book._id} style={styles.item}>
                    <img
                      src={item.book.imageUrl || "/placeholder-book.jpg"}
                      alt={item.book.title}
                      style={styles.itemImage}
                    />
                    <div style={styles.itemInfo}>
                      <h4 style={styles.itemTitle}>{item.book.title}</h4>
                      <p style={styles.itemAuthor}>{item.book.author}</p>
                      <p style={styles.itemPrice}>
                        ${item.priceAtAdd.toFixed(2)}
                      </p>

                      <div style={styles.quantityControl}>
                        <button
                          style={styles.qtyButton}
                          onClick={() =>
                            handleQuantityChange(
                              item.book._id,
                              item.quantity - 1,
                            )
                          }
                          disabled={updating}
                        >
                          -
                        </button>
                        <span style={styles.quantity}>{item.quantity}</span>
                        <button
                          style={styles.qtyButton}
                          onClick={() =>
                            handleQuantityChange(
                              item.book._id,
                              item.quantity + 1,
                            )
                          }
                          disabled={updating}
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <button
                      style={styles.removeButton}
                      onClick={() => handleRemoveItem(item.book._id)}
                      disabled={updating}
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>

              {/* Cart Summary */}
              <div style={styles.summary}>
                <div style={styles.summaryRow}>
                  <span>Total Items:</span>
                  <span>{cart.totalItems}</span>
                </div>
                <div style={styles.summaryRow}>
                  <span style={styles.totalLabel}>Total Price:</span>
                  <span style={styles.totalPrice}>
                    ${cart.totalPrice.toFixed(2)}
                  </span>
                </div>
                <Link
                  to="/checkout"
                  style={styles.checkoutButton}
                  onClick={onClose}
                >
                  Proceed to Checkout
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    zIndex: 999,
  },
  drawer: {
    position: "fixed",
    top: 0,
    right: 0,
    width: "400px",
    height: "100vh",
    backgroundColor: "#fff",
    boxShadow: "-2px 0 8px rgba(0,0,0,0.2)",
    zIndex: 1000,
    display: "flex",
    flexDirection: "column",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1.5rem",
    borderBottom: "1px solid #ddd",
  },
  title: {
    margin: 0,
    fontSize: "1.5rem",
  },
  closeButton: {
    background: "none",
    border: "none",
    fontSize: "2rem",
    cursor: "pointer",
    color: "#666",
  },
  content: {
    flex: 1,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
  },
  loading: {
    textAlign: "center",
    padding: "2rem",
    color: "#666",
  },
  empty: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: "2rem",
    color: "#666",
  },
  shopButton: {
    marginTop: "1rem",
    padding: "0.75rem 2rem",
    backgroundColor: "#3498db",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "1rem",
  },
  items: {
    flex: 1,
    padding: "1rem",
  },
  item: {
    display: "flex",
    gap: "1rem",
    padding: "1rem",
    borderBottom: "1px solid #eee",
    position: "relative",
  },
  itemImage: {
    width: "80px",
    height: "100px",
    objectFit: "cover",
    borderRadius: "4px",
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    margin: "0 0 0.25rem 0",
    fontSize: "1rem",
    fontWeight: "bold",
  },
  itemAuthor: {
    margin: "0 0 0.5rem 0",
    fontSize: "0.875rem",
    color: "#666",
  },
  itemPrice: {
    margin: "0 0 0.5rem 0",
    fontSize: "1rem",
    fontWeight: "bold",
    color: "#3498db",
  },
  quantityControl: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  qtyButton: {
    width: "30px",
    height: "30px",
    border: "1px solid #ddd",
    backgroundColor: "#fff",
    cursor: "pointer",
    borderRadius: "4px",
    fontSize: "1rem",
  },
  quantity: {
    minWidth: "30px",
    textAlign: "center",
    fontWeight: "bold",
  },
  removeButton: {
    position: "absolute",
    top: "1rem",
    right: "1rem",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "1.25rem",
  },
  summary: {
    padding: "1.5rem",
    borderTop: "2px solid #ddd",
    backgroundColor: "#f9f9f9",
  },
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "0.75rem",
    fontSize: "1rem",
  },
  totalLabel: {
    fontWeight: "bold",
    fontSize: "1.25rem",
  },
  totalPrice: {
    fontWeight: "bold",
    fontSize: "1.25rem",
    color: "#3498db",
  },
  checkoutButton: {
    display: "block",
    width: "100%",
    padding: "1rem",
    marginTop: "1rem",
    backgroundColor: "#27ae60",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    textAlign: "center",
    textDecoration: "none",
    fontSize: "1rem",
    fontWeight: "bold",
    cursor: "pointer",
  },
};

export default CartDrawer;
