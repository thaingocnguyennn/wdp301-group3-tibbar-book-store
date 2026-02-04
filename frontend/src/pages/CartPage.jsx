import { useMemo } from "react";
import { useCart } from "../hooks/useCart";
import { useNavigate } from "react-router-dom";

const CartPage = () => {
  const { cart, update, remove } = useCart();
  const navigate = useNavigate();

  const totals = useMemo(() => {
    const subtotal = (cart.items || []).reduce((sum, item) => {
      const price = item.book?.price || 0;
      return sum + price * item.quantity;
    }, 0);

    // Free shipping if subtotal > 200,000 VND
    const SHIPPING_FEE = 30000;
    const FREE_SHIPPING_THRESHOLD = 200000;
    const shippingFee = subtotal > FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
    const total = subtotal + shippingFee;

    return {
      subtotal,
      shippingFee,
      total,
      isFreeShipping: subtotal > FREE_SHIPPING_THRESHOLD,
    };
  }, [cart.items]);

  if (!cart.items || cart.items.length === 0) {
    return (
      <div style={styles.emptyContainer}>
        <h2 style={styles.emptyTitle}>🛒 Your cart is empty</h2>
        <p style={styles.emptyText}>Browse books and add them to your cart.</p>
        <button style={styles.primaryButton} onClick={() => navigate("/")}>
          Go Shopping
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>🛒 My Cart</h1>
        <button style={styles.secondaryButton} onClick={() => navigate("/")}>
          ← Continue Shopping
        </button>
      </div>

      <div style={styles.grid}>
        <div style={styles.items}>
          {cart.items.map((item) => (
            <div key={item.book?._id} style={styles.itemCard}>
              <div style={styles.itemInfo}>
                <div style={styles.thumbWrapper}>
                  {item.book?.imageUrl ? (
                    <img
                      src={item.book.imageUrl}
                      alt={item.book?.title}
                      style={styles.thumb}
                    />
                  ) : (
                    <div style={styles.thumbPlaceholder}>📘</div>
                  )}
                </div>
                <div style={styles.itemText}>
                  <h3 style={styles.itemTitle}>{item.book?.title}</h3>
                  <p style={styles.itemAuthor}>by {item.book?.author}</p>
                  <p style={styles.itemPrice}>
                    {item.book?.price?.toLocaleString('vi-VN')}₫
                  </p>
                </div>
              </div>

              <div style={styles.itemActions}>
                <div style={styles.qtyControls}>
                  <button
                    style={styles.qtyButton}
                    onClick={() => update(item.book._id, item.quantity - 1)}
                  >
                    −
                  </button>
                  <span style={styles.qtyValue}>{item.quantity}</span>
                  <button
                    style={styles.qtyButton}
                    onClick={() => update(item.book._id, item.quantity + 1)}
                  >
                    +
                  </button>
                </div>
                <button
                  style={styles.removeButton}
                  onClick={() => remove(item.book._id)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <div style={styles.summary}>
          <h2 style={styles.summaryTitle}>Order Summary</h2>
          <div style={styles.summaryRow}>
            <span>Subtotal</span>
            <strong>{totals.subtotal.toLocaleString('vi-VN')}₫</strong>
          </div>
          <div style={styles.summaryRow}>
            <span>Shipping</span>
            <strong>
              {totals.isFreeShipping ? (
                <span style={{color: '#27ae60'}}>Free ✓</span>
              ) : (
                `${totals.shippingFee.toLocaleString('vi-VN')}₫`
              )}
            </strong>
          </div>
          {!totals.isFreeShipping && totals.subtotal > 0 && (
            <div style={styles.freeShippingNotice}>
              💡 Add {(200000 - totals.subtotal).toLocaleString('vi-VN')}₫ more for free shipping
            </div>
          )}
          <div style={styles.summaryDivider}></div>
          <div style={styles.summaryRow}>
            <span style={{fontSize: '1.2rem', fontWeight: '700'}}>Total</span>
            <strong style={{fontSize: '1.2rem'}}>{totals.total.toLocaleString('vi-VN')}₫</strong>
          </div>
          <button 
            style={styles.checkoutButton} 
            onClick={() => navigate("/checkout")}
          >
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "2rem",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "2rem",
  },
  title: {
    fontSize: "2.2rem",
    color: "#2c3e50",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr",
    gap: "2rem",
  },
  items: {
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem",
  },
  itemCard: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    padding: "1.25rem",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "1rem",
  },
  itemInfo: {
    display: "flex",
    gap: "1rem",
    alignItems: "center",
  },
  thumbWrapper: {
    width: "80px",
    height: "110px",
    borderRadius: "8px",
    overflow: "hidden",
    backgroundColor: "#f1f2f6",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  thumb: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  thumbPlaceholder: {
    fontSize: "2rem",
    color: "#bdc3c7",
  },
  itemText: {
    display: "flex",
    flexDirection: "column",
    gap: "0.4rem",
  },
  itemTitle: {
    margin: 0,
    fontSize: "1.1rem",
    color: "#2c3e50",
  },
  itemAuthor: {
    margin: 0,
    color: "#7f8c8d",
  },
  itemPrice: {
    margin: 0,
    fontWeight: "600",
    color: "#34495e",
  },
  itemActions: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    alignItems: "flex-end",
  },
  qtyControls: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    backgroundColor: "#f5f6fa",
    padding: "0.4rem 0.8rem",
    borderRadius: "999px",
  },
  qtyButton: {
    backgroundColor: "#667eea",
    color: "#fff",
    border: "none",
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    cursor: "pointer",
  },
  qtyValue: {
    fontWeight: "600",
    minWidth: "20px",
    textAlign: "center",
  },
  removeButton: {
    border: "1px solid #e74c3c",
    color: "#e74c3c",
    backgroundColor: "transparent",
    padding: "0.4rem 0.9rem",
    borderRadius: "6px",
    cursor: "pointer",
  },
  summary: {
    backgroundColor: "#fff",
    padding: "1.5rem",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    height: "fit-content",
  },
  summaryTitle: {
    fontSize: "1.4rem",
    marginBottom: "1.5rem",
    color: "#2c3e50",
  },
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "0.75rem",
    color: "#2c3e50",
  },
  summaryDivider: {
    height: "1px",
    backgroundColor: "#ecf0f1",
    margin: "1rem 0",
  },
  freeShippingNotice: {
    fontSize: "0.85rem",
    color: "#667eea",
    backgroundColor: "#f0f3ff",
    padding: "0.75rem",
    borderRadius: "6px",
    marginTop: "0.5rem",
    marginBottom: "0.5rem",
    textAlign: "center",
  },
  checkoutButton: {
    marginTop: "1rem",
    width: "100%",
    backgroundColor: "#667eea",
    color: "#fff",
    padding: "0.9rem",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: "600",
  },
  primaryButton: {
    backgroundColor: "#667eea",
    color: "#fff",
    border: "none",
    padding: "0.9rem 1.8rem",
    borderRadius: "8px",
    cursor: "pointer",
  },
  secondaryButton: {
    backgroundColor: "#fff",
    color: "#667eea",
    border: "1px solid #667eea",
    padding: "0.7rem 1.4rem",
    borderRadius: "8px",
    cursor: "pointer",
  },
  emptyContainer: {
    maxWidth: "600px",
    margin: "4rem auto",
    textAlign: "center",
    backgroundColor: "#fff",
    padding: "3rem",
    borderRadius: "16px",
    boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
  },
  emptyTitle: {
    fontSize: "2rem",
    color: "#2c3e50",
  },
  emptyText: {
    color: "#7f8c8d",
    marginBottom: "2rem",
  },
};

export default CartPage;
