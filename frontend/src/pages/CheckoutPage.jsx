import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../hooks/useCart";
import { useAuth } from "../hooks/useAuth";
import { orderApi } from "../api/orderApi";
import { voucherApi } from "../api/voucherApi";
import { addressApi } from "../api/addressApi";
import { coinApi } from "../api/coinApi";
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
  const [orderNumber, setOrderNumber] = useState(null);
  const [voucherCode, setVoucherCode] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [voucherTotals, setVoucherTotals] = useState(null);
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [voucherMessage, setVoucherMessage] = useState("");
  const [availableVouchers, setAvailableVouchers] = useState([]);
  const [availableVouchersLoading, setAvailableVouchersLoading] =
    useState(false);
  const [showAvailableVouchers, setShowAvailableVouchers] = useState(false);

  // Address state
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [addressesLoading, setAddressesLoading] = useState(true);

  // Coin state
  const [useCoin, setUseCoin] = useState(false);
  const [coinStatus, setCoinStatus] = useState(null);
  const [coinDiscount, setCoinDiscount] = useState(0);
  const [acceptedReturnPolicy, setAcceptedReturnPolicy] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: "/checkout" } });
    }
  }, [isAuthenticated, navigate]);

  // Redirect to cart if cart is empty
  useEffect(() => {
    if (
      !loading &&
      isAuthenticated &&
      (!cart.items || cart.items.length === 0)
    ) {
      navigate("/cart");
    }
  }, [cart.items, loading, isAuthenticated, navigate]);

  // Fetch addresses
  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchAddresses = async () => {
      setAddressesLoading(true);
      try {
        const response = await addressApi.getAddresses();
        const list = response.data || [];
        setAddresses(list);
        // Auto-select default address
        const defaultAddr = list.find((a) => a.isDefault) || list[0];
        if (defaultAddr) setSelectedAddressId(defaultAddr._id);
      } catch (err) {
        console.error("Failed to fetch addresses:", err);
      } finally {
        setAddressesLoading(false);
      }
    };
    fetchAddresses();
  }, [isAuthenticated]);

  // Fetch payment methods
  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        const response = await orderApi.getPaymentMethods();
        setPaymentMethods(response.data.methods || []);

        // Auto-select COD if available
        const codMethod = response.data.methods?.find(
          (m) => m.method === "COD" && m.available,
        );
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

  // Fetch coin status
  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchCoinStatus = async () => {
      try {
        const response = await coinApi.getCoinStatus();
        setCoinStatus(response.data);
      } catch (err) {
        console.error("Failed to fetch coin status:", err);
      }
    };
    fetchCoinStatus();
  }, [isAuthenticated]);

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
    let currentTotals = baseTotals;

    if (voucherTotals) {
      currentTotals = {
        ...baseTotals,
        subtotal: Number(voucherTotals.subtotal || baseTotals.subtotal),
        discount: Number(voucherTotals.discount || 0),
        shippingFee: Number(
          voucherTotals.shippingFee || baseTotals.shippingFee,
        ),
        total: Number(voucherTotals.total || baseTotals.total),
        isFreeShipping:
          Number(voucherTotals.shippingFee || baseTotals.shippingFee) === 0,
      };
    }

    // Apply coin discount
    if (useCoin && coinDiscount > 0) {
      currentTotals = {
        ...currentTotals,
        coinDiscount,
        total: Math.max(0, currentTotals.total - coinDiscount),
      };
    }

    return currentTotals;
  }, [baseTotals, voucherTotals, useCoin, coinDiscount]);

  // Calculate coin discount when useCoin changes
  useEffect(() => {
    if (useCoin && coinStatus) {
      const orderTotal = voucherTotals?.total || baseTotals.total;
      const maxCoinsUsable = Math.min(coinStatus.coinBalance, orderTotal);
      setCoinDiscount(maxCoinsUsable);
    } else {
      setCoinDiscount(0);
    }
  }, [useCoin, coinStatus, baseTotals.total, voucherTotals]);

  // Validate cart
  const cartIsValid = useMemo(() => {
    if (!cart.items || cart.items.length === 0) return false;
    return cart.items.every(
      (item) => item.book && item.quantity > 0 && item.book.price > 0,
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
      setVoucherMessage(
        `Voucher ${voucher?.code || normalizedVoucher.toUpperCase()} applied.`,
      );
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
    return () => {
      cancelled = true;
    };
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
    if (!acceptedReturnPolicy) {
      setError("Please confirm return and refund policy before placing order");
      return;
    }

    if (!selectedPaymentMethod) {
      setError("Please select a payment method");
      return;
    }

    if (!selectedAddressId) {
      setError("Please select a shipping address");
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
        shippingAddressId: selectedAddressId,
        voucherCode: appliedVoucher?.code || null,
        useCoin: useCoin,
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
      } else if (order.paymentMethod === "VNPAY") {
        // VNPay: Redirect to VNPay payment gateway
        const paymentUrl = response.data.payment?.paymentUrl;
        if (paymentUrl) {
          window.location.href = paymentUrl;
          return; // Don't setIsSubmitting(false) — page is navigating away
        } else {
          setError("Failed to get VNPay payment URL. Please try again.");
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
          "Failed to create order. Please try again.",
      );
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner} />
          <p style={styles.loadingText}>Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (!cart.items || cart.items.length === 0) {
    return (
      <div style={styles.emptyContainer}>
        <div style={styles.emptyIcon}>🛒</div>
        <h2 style={styles.emptyTitle}>Your cart is empty</h2>
        <p style={styles.emptyText}>
          Add items to your cart before checking out.
        </p>
        <button style={styles.primaryButton} onClick={() => navigate("/")}>
          Start Shopping
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Checkout</h1>
          <p style={styles.subtitle}>
            {cart.items.length} item{cart.items.length > 1 ? "s" : ""} in your
            order
          </p>
        </div>
        <button style={styles.backButton} onClick={() => navigate("/cart")}>
          ← Back to Cart
        </button>
      </div>

      {error && (
        <div style={styles.errorBanner}>
          <span style={styles.errorIcon}>⚠</span>
          <span>{error}</span>
        </div>
      )}

      <div style={styles.grid}>
        {/* Left Column - Checkout Details */}
        <div style={styles.leftColumn}>
          {/* Shipping Address */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>
                <span style={styles.sectionIcon}>📍</span>
                Shipping Address
              </h2>
              <button
                type="button"
                style={styles.manageBtn}
                onClick={() => navigate("/address")}
              >
                Manage →
              </button>
            </div>

            {addressesLoading ? (
              <div style={styles.addressLoading}>
                <div style={styles.spinnerSmall} />
                <span>Loading addresses...</span>
              </div>
            ) : addresses.length === 0 ? (
              <div style={styles.noAddressBox}>
                <p style={styles.noAddressText}>You have no saved addresses.</p>
                <button
                  type="button"
                  style={styles.addAddressBtn}
                  onClick={() => navigate("/address")}
                >
                  + Add Address
                </button>
              </div>
            ) : (
              <div style={styles.addressList}>
                {addresses.map((addr) => (
                  <div
                    key={addr._id}
                    style={{
                      ...styles.addressCard,
                      ...(selectedAddressId === addr._id
                        ? styles.addressCardSelected
                        : {}),
                    }}
                    onClick={() => setSelectedAddressId(addr._id)}
                  >
                    <div
                      style={{
                        ...styles.addressRadio,
                        ...(selectedAddressId === addr._id
                          ? styles.addressRadioSelected
                          : {}),
                      }}
                    >
                      {selectedAddressId === addr._id && (
                        <div style={styles.addressRadioInner} />
                      )}
                    </div>
                    <div style={styles.addressInfo}>
                      <div style={styles.addressNameRow}>
                        <strong style={styles.addressFullName}>
                          {addr.fullName}
                        </strong>
                        <span style={styles.addressPhone}>{addr.phone}</span>
                        {addr.isDefault && (
                          <span style={styles.defaultBadge}>Default</span>
                        )}
                      </div>
                      <p style={styles.addressDetail}>
                        {addr.description}, {addr.commune}, {addr.district},{" "}
                        {addr.province}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Voucher */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>
              <span style={styles.sectionIcon}>🎟️</span>
              Voucher / Discount Code
            </h2>
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
                  ✓{" "}
                  {voucherMessage ||
                    `Voucher ${appliedVoucher.code} applied successfully`}
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
            <h2 style={styles.sectionTitle}>
              <span style={styles.sectionIcon}>💳</span>
              Payment Method
            </h2>
            <div style={styles.paymentMethods}>
              {paymentMethods.map((method) => {
                const isSelected = selectedPaymentMethod === method.method;
                return (
                  <div
                    key={method.method}
                    style={{
                      ...styles.paymentOption,
                      ...(isSelected ? styles.paymentOptionSelected : {}),
                      ...(method.available ? {} : styles.paymentOptionDisabled),
                    }}
                    onClick={() =>
                      method.available &&
                      setSelectedPaymentMethod(method.method)
                    }
                  >
                    <div
                      style={{
                        ...styles.paymentRadio,
                        ...(isSelected ? styles.paymentRadioSelected : {}),
                      }}
                    >
                      {isSelected && (
                        <div style={styles.paymentRadioInner}></div>
                      )}
                    </div>
                    <div style={styles.paymentIcon}>
                      {method.method === "VNPAY" ? "🏦" : "💵"}
                    </div>
                    <div style={styles.paymentInfo}>
                      <div style={styles.paymentName}>
                        {method.name}
                        {!method.available && (
                          <span style={styles.comingSoonBadge}>
                            Coming Soon
                          </span>
                        )}
                      </div>
                      <div style={styles.paymentDescription}>
                        {method.description}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>
              <span style={styles.sectionIcon}>📝</span>
              Order Notes
              <span style={styles.optionalLabel}>(Optional)</span>
            </h2>
            <textarea
              style={styles.textarea}
              placeholder="Add any special instructions for your order..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
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
                    <span style={styles.orderItemQty}>× {item.quantity}</span>
                  </div>
                  <span style={styles.orderItemPrice}>
                    {((item.book?.price || 0) * item.quantity).toLocaleString(
                      "vi-VN",
                    )}
                    ₫
                  </span>
                </div>
              ))}
            </div>

            <div style={styles.summaryDivider}></div>

            {/* Price Breakdown */}
            <div style={styles.summaryRow}>
              <span style={styles.summaryLabel}>Subtotal</span>
              <span style={styles.summaryValue}>
                {totals.subtotal.toLocaleString("vi-VN")}₫
              </span>
            </div>
            <div style={styles.summaryRow}>
              <span style={styles.summaryLabel}>Discount</span>
              <span style={{ ...styles.summaryValue, color: "#ef4444" }}>
                -{totals.discount.toLocaleString("vi-VN")}₫
              </span>
            </div>

            {/* Coin Usage Section */}
            {coinStatus && coinStatus.coinBalance > 0 && (
              <div style={styles.coinSection}>
                <label style={styles.coinLabel}>
                  <input
                    type="checkbox"
                    checked={useCoin}
                    onChange={(e) => setUseCoin(e.target.checked)}
                    style={styles.coinCheckbox}
                  />
                  <span>
                    Use Coins (Balance:{" "}
                    {coinStatus.coinBalance.toLocaleString("vi-VN")} coins)
                  </span>
                </label>
                {useCoin && coinDiscount > 0 && (
                  <div style={styles.summaryRow}>
                    <span style={styles.summaryLabel}>Coin Discount</span>
                    <span style={{ ...styles.summaryValue, color: "#f39c12" }}>
                      -{coinDiscount.toLocaleString("vi-VN")}₫
                    </span>
                  </div>
                )}
              </div>
            )}

            <div style={styles.summaryRow}>
              <span style={styles.summaryLabel}>Shipping Fee</span>
              <span style={styles.summaryValue}>
                {totals.isFreeShipping ? (
                  <span style={{ color: "#16a34a", fontWeight: 600 }}>
                    Free ✓
                  </span>
                ) : (
                  `${totals.shippingFee.toLocaleString("vi-VN")}₫`
                )}
              </span>
            </div>
            {!totals.isFreeShipping && totals.subtotal > 0 && (
              <div style={styles.freeShippingNotice}>
                Add {(200000 - totals.subtotal).toLocaleString("vi-VN")}₫ more
                for free shipping
              </div>
            )}

            <div style={styles.summaryDivider}></div>

            <div style={styles.summaryTotalRow}>
              <span style={styles.summaryTotalLabel}>Total</span>
              <span style={styles.summaryTotalValue}>
                {totals.total.toLocaleString("vi-VN")}₫
              </span>
            </div>

            <div style={styles.policyBox}>
              <h3 style={styles.policyTitle}>Return & Refund Policy</h3>
              <ul style={styles.policyList}>
                <li style={styles.policyItem}>
                  Request must be submitted within 7 days after receiving the
                  order.
                </li>
                <li style={styles.policyItem}>
                  Only damaged, defective, wrong item, or missing item cases are
                  eligible.
                </li>
                <li style={styles.policyItem}>
                  Books must remain unused and include original
                  invoice/packaging for return approval.
                </li>
                <li style={styles.policyItem}>
                  For approved refunds, money is returned to the original
                  payment method within 3-7 business days.
                </li>
              </ul>
              <label style={styles.policyCheckboxLabel}>
                <input
                  type="checkbox"
                  checked={acceptedReturnPolicy}
                  onChange={(event) => {
                    setAcceptedReturnPolicy(event.target.checked);
                    if (event.target.checked) {
                      setError("");
                    }
                  }}
                  style={styles.policyCheckbox}
                  disabled={isSubmitting}
                />
                <span>
                  I have read and agree to the return and refund policy.
                </span>
              </label>
            </div>

            {/* Place Order Button */}
            <button
              style={{
                ...styles.placeOrderButton,
                ...(isSubmitting ||
                !selectedPaymentMethod ||
                !cartIsValid ||
                !selectedAddressId ||
                !acceptedReturnPolicy
                  ? styles.placeOrderButtonDisabled
                  : {}),
              }}
              onClick={handlePlaceOrder}
              disabled={
                isSubmitting ||
                !selectedPaymentMethod ||
                !cartIsValid ||
                !selectedAddressId ||
                addresses.length === 0 ||
                !acceptedReturnPolicy
              }
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
  /* ─── Layout ─── */
  container: {
    maxWidth: "1140px",
    margin: "0 auto",
    padding: "2rem 1.5rem",
    minHeight: "80vh",
  },

  /* ─── Header ─── */
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "1.75rem",
  },
  title: {
    fontSize: "1.75rem",
    fontWeight: 800,
    color: "#1a1a2e",
    margin: 0,
    letterSpacing: "-0.02em",
  },
  subtitle: {
    margin: "0.3rem 0 0",
    fontSize: "0.88rem",
    color: "#94a3b8",
    fontWeight: 400,
  },
  backButton: {
    backgroundColor: "#fff",
    color: "#667eea",
    border: "1.5px solid #e0e7ff",
    padding: "0.55rem 1.15rem",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "0.88rem",
    fontWeight: 600,
    transition: "all 0.2s",
  },

  /* ─── Error ─── */
  errorBanner: {
    display: "flex",
    alignItems: "center",
    gap: "0.6rem",
    backgroundColor: "#fef2f2",
    color: "#dc2626",
    padding: "0.85rem 1.15rem",
    borderRadius: "10px",
    marginBottom: "1.25rem",
    border: "1px solid #fecaca",
    fontSize: "0.9rem",
    fontWeight: 500,
  },
  errorIcon: {
    fontSize: "1.1rem",
    flexShrink: 0,
  },

  /* ─── Grid ─── */
  grid: {
    display: "grid",
    gridTemplateColumns: "1.65fr 1fr",
    gap: "1.5rem",
    alignItems: "start",
  },
  leftColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "1.15rem",
  },
  rightColumn: {
    height: "fit-content",
    position: "sticky",
    top: "2rem",
  },

  /* ─── Section Card ─── */
  section: {
    backgroundColor: "#fff",
    padding: "1.5rem",
    borderRadius: "14px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)",
    border: "1px solid #f1f5f9",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1rem",
  },
  sectionTitle: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    fontSize: "1rem",
    fontWeight: 700,
    color: "#1e293b",
    marginBottom: "1rem",
    marginTop: 0,
  },
  sectionIcon: {
    fontSize: "1.1rem",
  },
  optionalLabel: {
    fontSize: "0.78rem",
    color: "#94a3b8",
    fontWeight: 400,
    marginLeft: "0.35rem",
  },
  manageBtn: {
    backgroundColor: "transparent",
    color: "#667eea",
    border: "1.5px solid #e0e7ff",
    padding: "0.35rem 0.85rem",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "0.78rem",
    fontWeight: 600,
    transition: "all 0.2s",
  },

  /* ─── Address ─── */
  addressLoading: {
    display: "flex",
    alignItems: "center",
    gap: "0.6rem",
    color: "#94a3b8",
    fontSize: "0.9rem",
    padding: "1rem 0",
  },
  spinnerSmall: {
    width: "18px",
    height: "18px",
    border: "2.5px solid #e2e8f0",
    borderTopColor: "#667eea",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  noAddressBox: {
    backgroundColor: "#f8fafc",
    padding: "1.5rem",
    borderRadius: "10px",
    border: "2px dashed #e2e8f0",
    textAlign: "center",
  },
  noAddressText: {
    color: "#64748b",
    marginBottom: "0.85rem",
    fontSize: "0.9rem",
  },
  addAddressBtn: {
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "#fff",
    border: "none",
    padding: "0.5rem 1.15rem",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "0.85rem",
    fontWeight: 600,
  },
  addressList: {
    display: "flex",
    flexDirection: "column",
    gap: "0.6rem",
  },
  addressCard: {
    display: "flex",
    alignItems: "flex-start",
    gap: "0.85rem",
    padding: "0.9rem 1rem",
    border: "1.5px solid #e2e8f0",
    borderRadius: "10px",
    cursor: "pointer",
    transition: "all 0.2s cubic-bezier(.4,0,.2,1)",
    backgroundColor: "#fff",
  },
  addressCardSelected: {
    borderColor: "#667eea",
    backgroundColor: "#f8f9ff",
    boxShadow: "0 0 0 3px rgba(102,126,234,0.1)",
  },
  addressRadio: {
    width: "18px",
    height: "18px",
    borderRadius: "50%",
    border: "2px solid #cbd5e1",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: "2px",
    transition: "all 0.2s",
  },
  addressRadioSelected: {
    borderColor: "#667eea",
  },
  addressRadioInner: {
    width: "9px",
    height: "9px",
    borderRadius: "50%",
    backgroundColor: "#667eea",
  },
  addressInfo: {
    flex: 1,
    minWidth: 0,
  },
  addressNameRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    marginBottom: "0.3rem",
    flexWrap: "wrap",
  },
  addressFullName: {
    color: "#1e293b",
    fontSize: "0.9rem",
  },
  addressPhone: {
    color: "#94a3b8",
    fontSize: "0.82rem",
  },
  defaultBadge: {
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "#fff",
    fontSize: "0.65rem",
    padding: "0.12rem 0.5rem",
    borderRadius: "4px",
    fontWeight: 600,
    letterSpacing: "0.03em",
  },
  addressDetail: {
    color: "#64748b",
    fontSize: "0.82rem",
    margin: 0,
    lineHeight: "1.45",
  },

  /* ─── Voucher ─── */
  voucherBox: {
    backgroundColor: "#f8fafc",
    padding: "1rem",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
  },
  voucherRow: {
    display: "flex",
    gap: "0.6rem",
    alignItems: "center",
  },
  voucherInput: {
    flex: 1,
    padding: "0.65rem 0.85rem",
    borderRadius: "8px",
    border: "1.5px solid #e2e8f0",
    fontSize: "0.9rem",
    backgroundColor: "#fff",
    transition: "border-color 0.2s",
  },
  voucherButton: {
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "0.65rem 1.15rem",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "0.88rem",
    whiteSpace: "nowrap",
  },
  voucherRemoveButton: {
    backgroundColor: "#fff",
    color: "#ef4444",
    border: "1.5px solid #fca5a5",
    borderRadius: "8px",
    padding: "0.65rem 1.15rem",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "0.88rem",
    whiteSpace: "nowrap",
  },
  voucherAppliedText: {
    margin: "0.6rem 0 0",
    color: "#16a34a",
    fontSize: "0.85rem",
    fontWeight: 500,
  },
  voucherHintText: {
    margin: "0.6rem 0 0",
    color: "#94a3b8",
    fontSize: "0.8rem",
  },
  toggleVouchersBtn: {
    marginTop: "0.6rem",
    background: "none",
    border: "none",
    color: "#667eea",
    fontSize: "0.82rem",
    cursor: "pointer",
    padding: 0,
    fontWeight: 600,
    textDecoration: "underline",
    textUnderlineOffset: "3px",
  },

  /* ─── Payment Methods ─── */
  paymentMethods: {
    display: "flex",
    flexDirection: "column",
    gap: "0.6rem",
  },
  paymentOption: {
    display: "flex",
    alignItems: "center",
    gap: "0.85rem",
    padding: "1rem 1.15rem",
    borderRadius: "10px",
    border: "1.5px solid #e2e8f0",
    cursor: "pointer",
    transition: "all 0.2s cubic-bezier(.4,0,.2,1)",
    backgroundColor: "#fff",
  },
  paymentOptionSelected: {
    borderColor: "#667eea",
    backgroundColor: "#f8f9ff",
    boxShadow: "0 0 0 3px rgba(102,126,234,0.1)",
  },
  paymentOptionDisabled: {
    opacity: 0.45,
    cursor: "not-allowed",
  },
  paymentRadio: {
    width: "18px",
    height: "18px",
    borderRadius: "50%",
    border: "2px solid #cbd5e1",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    transition: "all 0.2s",
  },
  paymentRadioSelected: {
    borderColor: "#667eea",
  },
  paymentRadioInner: {
    width: "9px",
    height: "9px",
    borderRadius: "50%",
    backgroundColor: "#667eea",
  },
  paymentIcon: {
    fontSize: "1.4rem",
    width: "38px",
    height: "38px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8fafc",
    borderRadius: "8px",
    flexShrink: 0,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentName: {
    fontWeight: 600,
    color: "#1e293b",
    marginBottom: "0.2rem",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    fontSize: "0.92rem",
  },
  comingSoonBadge: {
    fontSize: "0.65rem",
    backgroundColor: "#fef3c7",
    color: "#92400e",
    padding: "0.15rem 0.45rem",
    borderRadius: "4px",
    fontWeight: 600,
    border: "1px solid #fcd34d",
  },
  paymentDescription: {
    fontSize: "0.8rem",
    color: "#94a3b8",
    lineHeight: 1.4,
  },

  /* ─── Textarea ─── */
  textarea: {
    width: "100%",
    padding: "0.75rem 0.9rem",
    borderRadius: "10px",
    border: "1.5px solid #e2e8f0",
    fontSize: "0.9rem",
    fontFamily: "inherit",
    resize: "vertical",
    boxSizing: "border-box",
    backgroundColor: "#fff",
    transition: "border-color 0.2s",
  },

  /* ─── Order Summary (Right) ─── */
  summary: {
    backgroundColor: "#fff",
    padding: "1.5rem",
    borderRadius: "14px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)",
    border: "1px solid #f1f5f9",
  },
  summaryTitle: {
    fontSize: "1.1rem",
    fontWeight: 700,
    marginBottom: "1rem",
    marginTop: 0,
    color: "#1e293b",
  },
  orderItems: {
    display: "flex",
    flexDirection: "column",
    gap: "0.65rem",
    marginBottom: "0.75rem",
  },
  orderItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  orderItemInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "0.15rem",
    flex: 1,
    minWidth: 0,
  },
  orderItemTitle: {
    fontSize: "0.85rem",
    color: "#1e293b",
    fontWeight: 500,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  orderItemQty: {
    fontSize: "0.75rem",
    color: "#94a3b8",
  },
  orderItemPrice: {
    fontWeight: 600,
    color: "#1e293b",
    fontSize: "0.88rem",
    flexShrink: 0,
    marginLeft: "0.75rem",
  },
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "0.6rem",
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: "0.88rem",
    color: "#64748b",
  },
  summaryValue: {
    fontSize: "0.92rem",
    color: "#1e293b",
    fontWeight: 500,
  },
  summaryDivider: {
    height: "1px",
    backgroundColor: "#e2e8f0",
    margin: "0.85rem 0",
  },
  freeShippingNotice: {
    fontSize: "0.78rem",
    color: "#667eea",
    backgroundColor: "#f0f3ff",
    padding: "0.6rem 0.85rem",
    borderRadius: "8px",
    marginTop: "0.35rem",
    textAlign: "center",
    border: "1px solid #e0e7ff",
    fontWeight: 500,
  },
  summaryTotalRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1.25rem",
  },
  summaryTotalLabel: {
    fontSize: "1.05rem",
    fontWeight: 700,
    color: "#1e293b",
  },
  summaryTotalValue: {
    fontSize: "1.3rem",
    fontWeight: 800,
    color: "#1e293b",
    letterSpacing: "-0.01em",
  },
  policyBox: {
    backgroundColor: "#fff7ed",
    border: "1px solid #fdba74",
    borderRadius: "10px",
    padding: "0.85rem",
    marginBottom: "0.95rem",
  },
  policyTitle: {
    margin: "0 0 0.45rem",
    fontSize: "0.88rem",
    fontWeight: 700,
    color: "#9a3412",
  },
  policyList: {
    margin: 0,
    paddingLeft: "1rem",
  },
  policyItem: {
    fontSize: "0.75rem",
    color: "#7c2d12",
    marginBottom: "0.25rem",
    lineHeight: 1.45,
  },
  policyCheckboxLabel: {
    marginTop: "0.5rem",
    display: "flex",
    gap: "0.45rem",
    alignItems: "flex-start",
    fontSize: "0.78rem",
    color: "#7c2d12",
    fontWeight: 600,
    cursor: "pointer",
  },
  policyCheckbox: {
    marginTop: "2px",
    width: "15px",
    height: "15px",
    cursor: "pointer",
    flexShrink: 0,
  },
  placeOrderButton: {
    width: "100%",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "#fff",
    padding: "0.9rem",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "0.95rem",
    fontWeight: 700,
    letterSpacing: "0.01em",
    transition: "all 0.25s",
  },
  placeOrderButtonDisabled: {
    background: "#cbd5e1",
    cursor: "not-allowed",
    boxShadow: "none",
  },
  secureNote: {
    textAlign: "center",
    fontSize: "0.75rem",
    color: "#94a3b8",
    marginTop: "0.85rem",
    marginBottom: 0,
  },

  /* ─── Coin Section ─── */
  coinSection: {
    backgroundColor: "#fff9e6",
    border: "1.5px solid #f39c12",
    borderRadius: "8px",
    padding: "0.75rem",
    marginBottom: "0.75rem",
  },
  coinLabel: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    fontSize: "0.88rem",
    color: "#1e293b",
    fontWeight: 500,
    cursor: "pointer",
  },
  coinCheckbox: {
    width: "16px",
    height: "16px",
    cursor: "pointer",
  },

  /* ─── Empty / Loading ─── */
  emptyContainer: {
    maxWidth: "480px",
    margin: "4rem auto",
    textAlign: "center",
    backgroundColor: "#fff",
    padding: "3rem 2rem",
    borderRadius: "18px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.06)",
    border: "1px solid #f1f5f9",
  },
  emptyIcon: {
    fontSize: "3.5rem",
    marginBottom: "1rem",
  },
  emptyTitle: {
    fontSize: "1.35rem",
    color: "#1e293b",
    fontWeight: 700,
    margin: "0 0 0.5rem",
  },
  emptyText: {
    color: "#94a3b8",
    marginBottom: "2rem",
    fontSize: "0.92rem",
    lineHeight: 1.5,
  },
  primaryButton: {
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "#fff",
    border: "none",
    padding: "0.75rem 2rem",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "0.95rem",
    fontWeight: 600,
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "5rem 0",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "4px solid #e2e8f0",
    borderTopColor: "#667eea",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
    marginBottom: "1rem",
  },
  loadingText: {
    color: "#94a3b8",
    fontSize: "0.95rem",
  },
};

export default CheckoutPage;
