/**
 * AvailableVouchers
 * Renders a list of vouchers the user is eligible to use for their current
 * cart subtotal. Clicking a card auto-applies that voucher code.
 *
 * Props:
 *  - vouchers  : Array  — list of eligible voucher objects from the API
 *  - onSelect  : (code: string) => void — called when user picks a voucher
 *  - loading   : boolean — show skeleton while fetching
 */
const AvailableVouchers = ({ vouchers = [], onSelect, loading = false }) => {
  if (loading) {
    return (
      <div style={styles.listWrapper}>
        {[1, 2].map((i) => (
          <div key={i} style={{ ...styles.card, ...styles.skeleton }} />
        ))}
      </div>
    );
  }

  if (!vouchers.length) {
    return (
      <div style={styles.empty}>
        No vouchers available for your current order.
      </div>
    );
  }

  return (
    <div style={styles.listWrapper}>
      {vouchers.map((v) => (
        <div key={v._id} style={styles.card}>
          {/* Left badge */}
          <div style={styles.badge}>
            <span style={styles.badgeValue}>
              {v.discountType === "PERCENT" || v.discountType === "PERCENTAGE"
                ? `${v.discountValue}%`
                : `${Number(v.discountValue).toLocaleString("vi-VN")}₫`}
            </span>
            <span style={styles.badgeLabel}>OFF</span>
          </div>

          {/* Details */}
          <div style={styles.details}>
            <span style={styles.code}>{v.code}</span>
            {v.minOrderValue > 0 && (
              <span style={styles.meta}>
                Min. order {Number(v.minOrderValue).toLocaleString("vi-VN")}₫
              </span>
            )}
            {v.discountType === "PERCENT" || v.discountType === "PERCENTAGE" ? (
              v.maxDiscountValue ? (
                <span style={styles.meta}>
                  Max discount {Number(v.maxDiscountValue).toLocaleString("vi-VN")}\u20ab
                </span>
              ) : null
            ) : null}
            {v.conditions && (
              <span style={styles.conditions}>{v.conditions}</span>
            )}
            <span style={styles.expiry}>
              {v.expiryDate
                ? `Expires ${new Date(v.expiryDate).toLocaleDateString("vi-VN")}`
                : "No expiry date"}
            </span>
          </div>

          {/* Select button */}
          <button
            type="button"
            style={styles.selectBtn}
            onClick={() => onSelect(v.code)}
          >
            Select
          </button>
        </div>
      ))}
    </div>
  );
};

const styles = {
  listWrapper: {
    display: "flex",
    flexDirection: "column",
    gap: "0.6rem",
    marginTop: "0.75rem",
    maxHeight: "280px",
    overflowY: "auto",
    paddingRight: "2px",
  },
  card: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    backgroundColor: "#fff",
    border: "1px solid #e0e7ff",
    borderRadius: "8px",
    padding: "0.7rem 0.9rem",
    cursor: "default",
    boxShadow: "0 1px 4px rgba(102,126,234,0.08)",
  },
  skeleton: {
    height: "68px",
    backgroundColor: "#f0f3ff",
    animation: "pulse 1.5s infinite",
  },
  badge: {
    minWidth: "60px",
    backgroundColor: "#667eea",
    borderRadius: "6px",
    padding: "0.4rem 0.5rem",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    color: "#fff",
    flexShrink: 0,
  },
  badgeValue: {
    fontSize: "1rem",
    fontWeight: "700",
    lineHeight: 1.1,
  },
  badgeLabel: {
    fontSize: "0.65rem",
    fontWeight: "600",
    letterSpacing: "0.05em",
  },
  details: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "0.2rem",
    overflow: "hidden",
  },
  code: {
    fontWeight: "700",
    color: "#2c3e50",
    fontSize: "0.95rem",
    letterSpacing: "0.03em",
  },
  meta: {
    fontSize: "0.78rem",
    color: "#667eea",
  },
  conditions: {
    fontSize: "0.75rem",
    color: "#7f8c8d",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  expiry: {
    fontSize: "0.72rem",
    color: "#95a5a6",
  },
  selectBtn: {
    flexShrink: 0,
    backgroundColor: "transparent",
    color: "#667eea",
    border: "1.5px solid #667eea",
    borderRadius: "6px",
    padding: "0.4rem 0.85rem",
    cursor: "pointer",
    fontSize: "0.85rem",
    fontWeight: "600",
    transition: "background-color 0.15s, color 0.15s",
  },
  empty: {
    textAlign: "center",
    color: "#95a5a6",
    fontSize: "0.88rem",
    padding: "0.75rem 0",
  },
};

export default AvailableVouchers;
