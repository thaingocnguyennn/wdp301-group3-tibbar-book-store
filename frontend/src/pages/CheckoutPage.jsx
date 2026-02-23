import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../hooks/useCart";
import { useAuth } from "../hooks/useAuth";
import { orderApi } from "../api/orderApi";
import { voucherApi } from "../api/voucherApi";
import VietQRPayment from "../components/payment/VietQRPayment";
import AvailableVouchers from "../components/payment/AvailableVouchers";

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cart, fetchCart } = useCart();
  const { isAuthenticated } = useAuth();

  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [showVietQRPayment, setShowVietQRPayment] = useState(false);
  const [vietQRPaymentInfo, setVietQRPaymentInfo] = useState(null);
  const [orderNumber, setOrderNumber] = useState(null);
  const [voucherCode, setVoucherCode] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [voucherTotals, setVoucherTotals] = useState(null);
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [voucherMessage, setVoucherMessage] = useState("");
  const [availableVouchers, setAvailableVouchers] = useState([]);
  const [availableVouchersLoading, setAvailableVouchersLoading] = useState(false);
  const [showAvailableVouchers, setShowAvailableVouchers] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: "/checkout" } });
    }
  }, [isAuthenticated, navigate]);

  // Redirect to cart if cart is empty
  useEffect(() => {
    // Don't redirect if showing VietQR payment screen
    if (!loading && isAuthenticated && !showVietQRPayment && (!cart.items || cart.items.length === 0)) {
      navigate("/cart");
    }
  }, [cart.items, loading, isAuthenticated, showVietQRPayment, navigate]);

  // Fetch payment methods
  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        const response = await orderApi.getPaymentMethods();
        setPaymentMethods(response.data.methods || []);
        
        // Auto-select COD if available
        const codMethod = response.data.methods?.find(m => m.method === "COD" && m.available);
        if (codMethod) {
          setSelectedPaymentMethod("COD");
        }
      } catch (err) {
        console.error("Failed to fetch payment methods:", err);
        setError("Failed to load payment methods");
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentMethods();
  }, []);

  // Calculate totals
  const baseTotals = useMemo(() => {
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
      subtotal: Math.round(subtotal * 100) / 100,
      discount: 0,
      shippingFee: Math.round(shippingFee * 100) / 100,
      total: Math.round(total * 100) / 100,
      isFreeShipping: subtotal > FREE_SHIPPING_THRESHOLD,
    };
  }, [cart.items]);

  const totals = useMemo(() => {
    if (!voucherTotals) {
      return baseTotals;
    }

    return {
      ...baseTotals,
      subtotal: Number(voucherTotals.subtotal || baseTotals.subtotal),
      discount: Number(voucherTotals.discount || 0),
      shippingFee: Number(voucherTotals.shippingFee || baseTotals.shippingFee),
      total: Number(voucherTotals.total || baseTotals.total),
      isFreeShipping: Number(voucherTotals.shippingFee || baseTotals.shippingFee) === 0,
    };
  }, [baseTotals, voucherTotals]);

  // Validate cart
  const cartIsValid = useMemo(() => {
    if (!cart.items || cart.items.length === 0) return false;
    return cart.items.every(
      (item) => item.book && item.quantity > 0 && item.book.price > 0
    );
  }, [cart.items]);

  const clearVoucherState = (keepCode = false) => {
    setAppliedVoucher(null);
    setVoucherTotals(null);
    setVoucherMessage("");

    if (!keepCode) {
      setVoucherCode("");
    }
  };

  const applyVoucherByCode = async (code, { silent = false } = {}) => {
    const normalizedVoucher = String(code || "").trim();

    if (!normalizedVoucher) {
      if (!silent) {
        setError("Please enter voucher code");
      }
      clearVoucherState(true);
      return;
    }

    try {
      setVoucherLoading(true);
      if (!silent) {
        setError("");
      }

      const response = await orderApi.validateVoucher(normalizedVoucher);
      const voucher = response.data.voucher;

      setAppliedVoucher(voucher);
      setVoucherTotals(response.data.totals);
      setVoucherCode(voucher?.code || normalizedVoucher.toUpperCase());
      setVoucherMessage(`Voucher ${voucher?.code || normalizedVoucher.toUpperCase()} applied.`);
    } catch (err) {
      setAppliedVoucher(null);
      setVoucherTotals(null);
      setVoucherMessage("");

      if (!silent) {
        setError(err.response?.data?.message || "Invalid voucher code");
      }
    } finally {
      setVoucherLoading(false);
    }
  };

  useEffect(() => {
    if (!cart.items || cart.items.length === 0) {
      clearVoucherState(false);
      return;
    }

    if (voucherCode.trim()) {
      applyVoucherByCode(voucherCode, { silent: true });
    }
  }, [cart.items]);

  // Fetch eligible vouchers whenever the cart subtotal changes
  useEffect(() => {
    if (!isAuthenticated || baseTotals.subtotal <= 0) {
      setAvailableVouchers([]);
      return;
    }

    let cancelled = false;
    const fetchAvailable = async () => {
      setAvailableVouchersLoading(true);
      try {
        const res = await voucherApi.getAvailableVouchers(baseTotals.subtotal);
        if (!cancelled) setAvailableVouchers(res.data?.vouchers || []);
      } catch {
        if (!cancelled) setAvailableVouchers([]);
      } finally {
        if (!cancelled) setAvailableVouchersLoading(false);
      }
    };

    fetchAvailable();
    return () => { cancelled = true; };
  }, [baseTotals.subtotal, isAuthenticated]);

  const handleApplyVoucher = async () => {
    await applyVoucherByCode(voucherCode);
  };

  const handleRemoveVoucher = () => {
    clearVoucherState(false);
    setError("");
  };

  const handleSelectAvailableVoucher = async (code) => {
    setShowAvailableVouchers(false);
    setVoucherCode(code);
    await applyVoucherByCode(code);
  };

  const handlePlaceOrder = async () => {
    if (!selectedPaymentMethod) {
      setError("Please select a payment method");
      return;
    }

    if (!cartIsValid || !cart.items || cart.items.length === 0) {
      setError("Your cart is empty or invalid. Please add items to your cart.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const orderData = {
        paymentMethod: selectedPaymentMethod,
        shippingAddressId: "MOCK_ADDRESS_ID", // Placeholder
        voucherCode: appliedVoucher?.code || null,
        notes: notes.trim(),
      };

      // Step 1: Create order (server calculates total)
      const response = await orderApi.createOrder(orderData);
      const { order } = response.data;

      // Handle payment flow
      if (order.paymentMethod === "COD") {
        // Clear cart from context
        await fetchCart();
        // COD: Navigate to order success page
        navigate(`/order-success/${order.orderNumber}`, {
          state: { order },
        });
      } else if (order.paymentMethod === "VIETQR") {
        // Step 2: Generate VietQR payment (secure - amount from server)
        try {
          const vietqrResponse = await orderApi.generateVietQRPayment(order._id);
          const paymentInfo = vietqrResponse.data;
          
          // Show VietQR payment screen
          setVietQRPaymentInfo(paymentInfo);
          setOrderNumber(order.orderNumber);
          setShowVietQRPayment(true);
          setIsSubmitting(false);
        } catch (vietqrError) {
          console.error("Failed to generate VietQR payment:", vietqrError);
          setError(
            vietqrError.response?.data?.message ||
              "Failed to generate payment QR code. Please try again."
          );
          setIsSubmitting(false);
        }
      } else {
        // Clear cart from context
        await fetchCart();
        // Fallback
        navigate(`/order-success/${order.orderNumber}`, {
          state: { order },
        });
      }
    } catch (err) {
      console.error("Failed to create order:", err);
      setError(
        err.response?.data?.message ||
          "Failed to create order. Please try again."
      );
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading checkout...</div>
      </div>
    );
  }

  // Show VietQR payment screen
  if (showVietQRPayment && vietQRPaymentInfo) {
    return (
      <VietQRPayment
        paymentInfo={vietQRPaymentInfo}
        orderNumber={orderNumber}
        onBack={async () => {
          // Clear cart when going back
          await fetchCart();
          setShowVietQRPayment(false);
          setVietQRPaymentInfo(null);
          navigate("/");
        }}
      />
    );
  }

  if (!cart.items || cart.items.length === 0) {
    return (
      <div style={styles.emptyContainer}>
        <h2 style={styles.emptyTitle}>🛒 Your cart is empty</h2>
        <p style={styles.emptyText}>
          Add items to your cart before checking out.
        </p>
        <button style={styles.primaryButton} onClick={() => navigate("/")}>
          Go Shopping
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>🛍️ Checkout</h1>
        <button
          style={styles.secondaryButton}
          onClick={() => navigate("/cart")}
        >
          ← Back to Cart
        </button>
      </div>

      {error && <div style={styles.errorBanner}>{error}</div>}

      <div style={styles.grid}>
        {/* Left Column - Checkout Details */}
        <div style={styles.leftColumn}>
          {/* Shipping Address Placeholder */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>📍 Shipping Address</h2>
            <div style={styles.placeholder}>
              <p style={styles.placeholderText}>
                🚧 <strong>Coming soon</strong> - Handled by another developer
              </p>
              <p style={styles.placeholderSubtext}>
                Using default address for now
              </p>
            </div>
          </div>

          {/* Voucher Placeholder */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>🎟️ Voucher / Discount Code</h2>
            <div style={styles.voucherBox}>
              <div style={styles.voucherRow}>
                <input
                  type="text"
                  value={voucherCode}
                  onChange={(event) => {
                    setVoucherCode(event.target.value);
                    setVoucherMessage("");
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handleApplyVoucher();
                    }
                  }}
                  placeholder="Enter voucher code"
                  style={styles.voucherInput}
                  disabled={voucherLoading || !!appliedVoucher}
                />
                {!appliedVoucher ? (
                  <button
                    type="button"
                    style={styles.voucherButton}
                    onClick={handleApplyVoucher}
                    disabled={voucherLoading}
                  >
                    {voucherLoading ? "Applying..." : "Apply"}
                  </button>
                ) : (
                  <button
                    type="button"
                    style={styles.voucherRemoveButton}
                    onClick={handleRemoveVoucher}
                  >
                    Remove
                  </button>
                )}
              </div>

              {appliedVoucher ? (
                <p style={styles.voucherAppliedText}>
                  ✅ {voucherMessage || `Voucher ${appliedVoucher.code} applied successfully`}
                </p>
              ) : (
                <p style={styles.voucherHintText}>
                  Enter voucher code then click Apply
                </p>
              )}

              {/* Toggle available vouchers list */}
              {!appliedVoucher && (
                <button
                  type="button"
                  style={styles.toggleVouchersBtn}
                  onClick={() => setShowAvailableVouchers((prev) => !prev)}
                >
                  {showAvailableVouchers
                    ? "▲ Hide available vouchers"
                    : `▼ View available vouchers${availableVouchers.length ? ` (${availableVouchers.length})` : ""}`}
                </button>
              )}

              {!appliedVoucher && showAvailableVouchers && (
                <AvailableVouchers
                  vouchers={availableVouchers}
                  loading={availableVouchersLoading}
                  onSelect={handleSelectAvailableVoucher}
                />
              )}
            </div>
          </div>

          {/* Payment Method */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>💳 Payment Method</h2>
            <div style={styles.paymentMethods}>
              {paymentMethods.map((method) => (
                <div
                  key={method.method}
                  style={{
                    ...styles.paymentOption,
                    ...(selectedPaymentMethod === method.method
                      ? styles.paymentOptionSelected
                      : {}),
                    ...(method.available ? {} : styles.paymentOptionDisabled),
                  }}
                  onClick={() =>
                    method.available && setSelectedPaymentMethod(method.method)
                  }
                >
                  <div style={styles.paymentRadio}>
                    {selectedPaymentMethod === method.method && (
                      <div style={styles.paymentRadioInner}></div>
                    )}
                  </div>
                  <div style={styles.paymentInfo}>
                    <div style={styles.paymentName}>
                      {method.name}
                      {!method.available && (
                        <span style={styles.comingSoonBadge}>Coming Soon</span>
                      )}
                    </div>
                    <div style={styles.paymentDescription}>
                      {method.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>📝 Order Notes (Optional)</h2>
            <textarea
              style={styles.textarea}
              placeholder="Add any special instructions for your order..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Right Column - Order Summary */}
        <div style={styles.rightColumn}>
          <div style={styles.summary}>
            <h2 style={styles.summaryTitle}>Order Summary</h2>

            {/* Order Items */}
            <div style={styles.orderItems}>
              {cart.items.map((item) => (
                <div key={item.book?._id} style={styles.orderItem}>
                  <div style={styles.orderItemInfo}>
                    <span style={styles.orderItemTitle}>
                      {item.book?.title}
                    </span>
                    <span style={styles.orderItemQty}>x {item.quantity}</span>
                  </div>
                  <span style={styles.orderItemPrice}>
                    {((item.book?.price || 0) * item.quantity).toLocaleString('vi-VN')}₫
                  </span>
                </div>
              ))}
            </div>

            <div style={styles.summaryDivider}></div>

            {/* Price Breakdown */}
            <div style={styles.summaryRow}>
              <span>Subtotal</span>
              <strong>{totals.subtotal.toLocaleString('vi-VN')}₫</strong>
            </div>
            <div style={styles.summaryRow}>
              <span>Discount</span>
              <strong>-{totals.discount.toLocaleString('vi-VN')}₫</strong>
            </div>
            <div style={styles.summaryRow}>
              <span>Shipping Fee</span>
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

            <div style={styles.summaryTotal}>
              <span>Total</span>
              <strong>{totals.total.toLocaleString('vi-VN')}₫</strong>
            </div>

            {/* Place Order Button */}
            <button
              style={{
                ...styles.placeOrderButton,
                ...(isSubmitting || !selectedPaymentMethod || !cartIsValid
                  ? styles.placeOrderButtonDisabled
                  : {}),
              }}
              onClick={handlePlaceOrder}
              disabled={isSubmitting || !selectedPaymentMethod || !cartIsValid}
            >
              {isSubmitting ? "Processing..." : "Place Order"}
            </button>

            <p style={styles.secureNote}>
              🔒 Your payment information is secure
            </p>
          </div>
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
    minHeight: "80vh",
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
    margin: 0,
  },
  secondaryButton: {
    backgroundColor: "#fff",
    color: "#667eea",
    border: "1px solid #667eea",
    padding: "0.7rem 1.4rem",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "0.95rem",
  },
  errorBanner: {
    backgroundColor: "#fee",
    color: "#c33",
    padding: "1rem",
    borderRadius: "8px",
    marginBottom: "1.5rem",
    border: "1px solid #fcc",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1.8fr 1fr",
    gap: "2rem",
  },
  leftColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
  },
  rightColumn: {
    height: "fit-content",
    position: "sticky",
    top: "2rem",
  },
  section: {
    backgroundColor: "#fff",
    padding: "1.5rem",
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  },
  sectionTitle: {
    fontSize: "1.2rem",
    color: "#2c3e50",
    marginBottom: "1rem",
    marginTop: 0,
  },
  placeholder: {
    backgroundColor: "#f8f9fa",
    padding: "1.25rem",
    borderRadius: "8px",
    border: "2px dashed #ddd",
    textAlign: "center",
  },
  placeholderText: {
    color: "#495057",
    margin: "0 0 0.5rem 0",
    fontSize: "0.95rem",
  },
  placeholderSubtext: {
    color: "#868e96",
    margin: 0,
    fontSize: "0.85rem",
  },
  voucherBox: {
    backgroundColor: "#f8f9fa",
    padding: "1rem",
    borderRadius: "8px",
    border: "1px solid #e9ecef",
  },
  voucherRow: {
    display: "flex",
    gap: "0.75rem",
    alignItems: "center",
  },
  voucherInput: {
    flex: 1,
    padding: "0.7rem",
    borderRadius: "6px",
    border: "1px solid #ddd",
    fontSize: "0.95rem",
  },
  voucherButton: {
    backgroundColor: "#667eea",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    padding: "0.7rem 1rem",
    cursor: "pointer",
    fontWeight: "600",
  },
  voucherRemoveButton: {
    backgroundColor: "#e74c3c",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    padding: "0.7rem 1rem",
    cursor: "pointer",
    fontWeight: "600",
  },
  voucherAppliedText: {
    margin: "0.65rem 0 0",
    color: "#27ae60",
    fontSize: "0.9rem",
  },
  voucherHintText: {
    margin: "0.65rem 0 0",
    color: "#6c757d",
    fontSize: "0.85rem",
  },
  toggleVouchersBtn: {
    marginTop: "0.6rem",
    background: "none",
    border: "none",
    color: "#667eea",
    fontSize: "0.85rem",
    cursor: "pointer",
    padding: 0,
    fontWeight: "600",
    textDecoration: "underline",
    textUnderlineOffset: "2px",
  },
  paymentMethods: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  paymentOption: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    padding: "1rem",
    borderRadius: "8px",
    border: "2px solid #e9ecef",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  paymentOptionSelected: {
    borderColor: "#667eea",
    backgroundColor: "#f0f3ff",
  },
  paymentOptionDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
  paymentRadio: {
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    border: "2px solid #667eea",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  paymentRadioInner: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    backgroundColor: "#667eea",
  },
  paymentInfo: {
    flex: 1,
  },
  paymentName: {
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: "0.25rem",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  comingSoonBadge: {
    fontSize: "0.7rem",
    backgroundColor: "#ffc107",
    color: "#000",
    padding: "0.2rem 0.5rem",
    borderRadius: "4px",
    fontWeight: "600",
  },
  paymentDescription: {
    fontSize: "0.85rem",
    color: "#6c757d",
  },
  textarea: {
    width: "100%",
    padding: "0.75rem",
    borderRadius: "6px",
    border: "1px solid #ddd",
    fontSize: "0.95rem",
    fontFamily: "inherit",
    resize: "vertical",
    boxSizing: "border-box",
  },
  summary: {
    backgroundColor: "#fff",
    padding: "1.5rem",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  },
  summaryTitle: {
    fontSize: "1.4rem",
    marginBottom: "1rem",
    marginTop: 0,
    color: "#2c3e50",
  },
  orderItems: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    marginBottom: "1rem",
  },
  orderItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  orderItemInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
    flex: 1,
  },
  orderItemTitle: {
    fontSize: "0.9rem",
    color: "#2c3e50",
  },
  orderItemQty: {
    fontSize: "0.8rem",
    color: "#6c757d",
  },
  orderItemPrice: {
    fontWeight: "600",
    color: "#2c3e50",
    fontSize: "0.9rem",
  },
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "0.75rem",
    color: "#2c3e50",
    fontSize: "0.95rem",
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
    textAlign: "center",
  },
  summaryTotal: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "1.2rem",
    fontWeight: "700",
    color: "#2c3e50",
    marginBottom: "1.5rem",
  },
  placeOrderButton: {
    width: "100%",
    backgroundColor: "#667eea",
    color: "#fff",
    padding: "1rem",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: "600",
    transition: "background-color 0.2s",
  },
  placeOrderButtonDisabled: {
    backgroundColor: "#95a5a6",
    cursor: "not-allowed",
  },
  secureNote: {
    textAlign: "center",
    fontSize: "0.8rem",
    color: "#6c757d",
    marginTop: "1rem",
    marginBottom: 0,
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
    margin: "0 0 1rem 0",
  },
  emptyText: {
    color: "#7f8c8d",
    marginBottom: "2rem",
  },
  primaryButton: {
    backgroundColor: "#667eea",
    color: "#fff",
    border: "none",
    padding: "0.9rem 1.8rem",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "1rem",
  },
  loading: {
    textAlign: "center",
    padding: "4rem",
    fontSize: "1.2rem",
    color: "#7f8c8d",
  },
};

export default CheckoutPage;
