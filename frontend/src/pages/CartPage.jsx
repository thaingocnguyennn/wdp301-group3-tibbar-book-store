import { useMemo, useState, useEffect } from "react";
import { useCart } from "../hooks/useCart";
import { useNavigate } from "react-router-dom";
import { flashSaleApi } from "../api/flashSaleApi";

const CartPage = () => {
  const { cart, update, remove } = useCart();
  const navigate = useNavigate();
  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  const serverBaseUrl = apiBase.replace(/\/api\/?$/, "");
  const containsEbook = useMemo(
    () => (cart.items || []).some((item) => item.book?.isEbook),
    [cart.items],
  );
  const containsPhysical = useMemo(
    () => (cart.items || []).some((item) => item.book && !item.book?.isEbook),
    [cart.items],
  );
  const isDigitalCart = containsEbook && !containsPhysical;
  const isMixedCart = containsEbook && containsPhysical;

  const [flashSaleMap, setFlashSaleMap] = useState({}); // Lưu bản đồ flash sale: { bookId -> discountInfo }

  // Lấy thông tin flash sale từ backend
  // Dùng để tính giá sách trong giỏ hàng (áp dụng giảm giá flash sale nếu có)
  useEffect(() => {
    const fetchFlashSale = async () => {
      try {
        const response = await flashSaleApi.getActiveFlashSale();
        const campaign = response.data?.campaign;
        if (campaign?.books) {
          // Tạo bản đồ: bookId -> { discountPercent, flashSalePrice }
          // Dùng để tìm kiếm nhanh thông tin giảm giá
          const map = {};
          campaign.books.forEach((book) => {
            map[book._id] = {
              discountPercent: book.discountPercent,
              flashSalePrice: book.flashSalePrice,
            };
          });
          setFlashSaleMap(map);
        }
      } catch (error) {
        // Flash sale có thể không tồn tại, đó là bình thường
        console.log("No active flash sale");
      }
    };
    fetchFlashSale();
  }, []);

  const totals = useMemo(() => {
    // Tính toán subtotal từ các sản phẩm trong giỏ
    // Nếu sách đang trong flash sale, dùng giá flash sale, ngược lại dùng giá gốc
    const subtotal = (cart.items || []).reduce((sum, item) => {
      const bookId = item.book?._id;
      const originalPrice = item.book?.price || 0;
      const isOnFlashSale = flashSaleMap[bookId];
      
      // Sử dụng giá flash sale nếu có, nếu không dùng giá gốc
      const price = isOnFlashSale ? flashSaleMap[bookId].flashSalePrice : originalPrice;
      return sum + price * item.quantity;
    }, 0);

    // Tính phí vận chuyển
    // Miễn phí vận chuyển nếu: là ebook hoặc subtotal > 200,000 VND
    const SHIPPING_FEE = 30000;
    const FREE_SHIPPING_THRESHOLD = 200000;
    const shippingFee = isDigitalCart
      ? 0
      : subtotal > FREE_SHIPPING_THRESHOLD
        ? 0
        : SHIPPING_FEE;
    const total = subtotal + shippingFee;

    return {
      subtotal,
      shippingFee,
      total,
      isFreeShipping: isDigitalCart || subtotal > FREE_SHIPPING_THRESHOLD,
    };
  }, [cart.items, flashSaleMap, isDigitalCart]);

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
          {isMixedCart && (
            <div style={styles.mixedCartNotice}>
              E-books and physical books must be checked out separately. Please remove one type before continuing.
            </div>
          )}
          {cart.items.map((item) => (
            <div key={item.book?._id} style={styles.itemCard}>
              <div style={styles.itemInfo}>
                <div style={styles.thumbWrapper}>
                  {(() => {
                    const imageSrc = item.book?.imageUrl
                      ? item.book.imageUrl.startsWith("http")
                        ? item.book.imageUrl
                        : `${serverBaseUrl}${item.book.imageUrl}`
                      : "";

                    return imageSrc ? (
                    <img
                      src={imageSrc}
                      alt={item.book?.title}
                      style={styles.thumb}
                    />
                  ) : (
                    <div style={styles.thumbPlaceholder}>📘</div>
                    );
                  })()}
                </div>
                <div style={styles.itemText}>
                  <h3 style={styles.itemTitle}>{item.book?.title}</h3>
                  <p style={styles.itemAuthor}>by {item.book?.author}</p>
                  {item.book?.isEbook && (
                    <p style={styles.itemType}>Digital access</p>
                  )}
                  <div style={styles.priceContainer}>
                    {flashSaleMap[item.book?._id] ? (
                      <>
                        <span style={styles.originalPrice}>
                          {item.book?.price?.toLocaleString('vi-VN')}₫
                        </span>
                        <span style={styles.flashSalePrice}>
                          {flashSaleMap[item.book?._id].flashSalePrice?.toLocaleString('vi-VN')}₫
                        </span>
                        <span style={styles.discountBadge}>
                          -{flashSaleMap[item.book?._id].discountPercent}%
                        </span>
                      </>
                    ) : (
                      <p style={styles.itemPrice}>
                        {item.book?.price?.toLocaleString('vi-VN')}₫
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div style={styles.itemActions}>
                {item.book?.isEbook ? (
                  <div style={styles.ebookQtyBadge}>Instant access</div>
                ) : (
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
                )}
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
              {isDigitalCart ? (
                <span style={{color: '#27ae60'}}>Instant delivery</span>
              ) : totals.isFreeShipping ? (
                <span style={{color: '#27ae60'}}>Free ✓</span>
              ) : (
                `${totals.shippingFee.toLocaleString('vi-VN')}₫`
              )}
            </strong>
          </div>
          {!isDigitalCart && !totals.isFreeShipping && totals.subtotal > 0 && (
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
            style={{
              ...styles.checkoutButton,
              ...(isMixedCart ? styles.checkoutButtonDisabled : {}),
            }} 
            onClick={() => navigate("/checkout")}
            disabled={isMixedCart}
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
    background: "#f1f5f9",
    border: "1px solid #e1e8f2",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  thumb: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    objectPosition: "center",
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
  itemType: {
    margin: 0,
    color: "#2563eb",
    fontSize: "0.9rem",
    fontWeight: "600",
  },
  itemPrice: {
    margin: 0,
    fontWeight: "600",
    color: "#34495e",
  },
  priceContainer: {
    display: "flex",
    alignItems: "center",
    gap: "0.7rem",
    flexWrap: "wrap",
  },
  originalPrice: {
    fontSize: "0.95rem",
    color: "#95a5a6",
    textDecoration: "line-through",
  },
  flashSalePrice: {
    fontSize: "1.05rem",
    fontWeight: "700",
    color: "#e74c3c",
  },
  discountBadge: {
    backgroundColor: "#e74c3c",
    color: "#fff",
    padding: "0.2rem 0.5rem",
    borderRadius: "4px",
    fontSize: "0.8rem",
    fontWeight: "600",
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
  ebookQtyBadge: {
    backgroundColor: "#ecfdf5",
    color: "#047857",
    border: "1px solid #a7f3d0",
    padding: "0.45rem 0.75rem",
    borderRadius: "999px",
    fontSize: "0.85rem",
    fontWeight: "600",
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
  checkoutButtonDisabled: {
    backgroundColor: "#cbd5e1",
    cursor: "not-allowed",
  },
  mixedCartNotice: {
    backgroundColor: "#fff7ed",
    border: "1px solid #fdba74",
    color: "#9a3412",
    padding: "0.9rem 1rem",
    borderRadius: "12px",
    lineHeight: 1.5,
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
