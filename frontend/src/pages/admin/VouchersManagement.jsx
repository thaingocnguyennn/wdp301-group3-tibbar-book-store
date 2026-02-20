import { useEffect, useState } from "react";
import { voucherApi } from "../../api/voucherApi";

const initialFormData = {
  code: "",
  discountType: "PERCENT",
  discountValue: "",
  minOrderValue: "0",
  maxDiscountValue: "",
  expiryDate: "",
  conditions: "",
  isActive: true,
};

const VouchersManagement = () => {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState(null);
  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    fetchVouchers();
  }, []);

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      const response = await voucherApi.getAllVouchers();
      setVouchers(response.data.vouchers || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load vouchers");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingVoucher(null);
    setShowForm(false);
  };

  const openEditForm = (voucher) => {
    setEditingVoucher(voucher);
    setFormData({
      code: voucher.code || "",
      discountType: voucher.discountType || "PERCENT",
      discountValue: String(voucher.discountValue ?? ""),
      minOrderValue: String(voucher.minOrderValue ?? 0),
      maxDiscountValue:
        voucher.maxDiscountValue === null ||
        voucher.maxDiscountValue === undefined
          ? ""
          : String(voucher.maxDiscountValue),
      expiryDate: voucher.expiryDate
        ? new Date(voucher.expiryDate).toISOString().slice(0, 10)
        : "",
      conditions: voucher.conditions || "",
      isActive: !!voucher.isActive,
    });
    setShowForm(true);
  };

  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const buildPayload = () => ({
    code: formData.code.trim().toUpperCase(),
    discountType: formData.discountType,
    discountValue: Number(formData.discountValue),
    minOrderValue: Number(formData.minOrderValue || 0),
    maxDiscountValue:
      formData.maxDiscountValue === ""
        ? null
        : Number(formData.maxDiscountValue),
    expiryDate: formData.expiryDate,
    conditions: formData.conditions.trim(),
    isActive: formData.isActive,
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      const payload = buildPayload();

      if (editingVoucher) {
        await voucherApi.updateVoucher(editingVoucher._id, payload);
        setMessage("Voucher updated successfully");
      } else {
        await voucherApi.createVoucher(payload);
        setMessage("Voucher created successfully");
      }

      resetForm();
      await fetchVouchers();
    } catch (err) {
      setError(err.response?.data?.message || "Operation failed");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Vouchers Management</h1>
        <button
          type="button"
          style={styles.addButton}
          onClick={() => {
            if (showForm) {
              resetForm();
            } else {
              setShowForm(true);
            }
          }}
        >
          {showForm ? "Cancel" : "+ Create Voucher"}
        </button>
      </div>

      {message && <div style={styles.success}>{message}</div>}
      {error && <div style={styles.error}>{error}</div>}

      {showForm && (
        <form style={styles.form} onSubmit={handleSubmit}>
          <h3>{editingVoucher ? "Update Voucher" : "Create Voucher"}</h3>

          <div style={styles.formGrid}>
            <input
              type="text"
              name="code"
              placeholder="Voucher code"
              value={formData.code}
              onChange={handleInputChange}
              disabled={!!editingVoucher}
              required
              style={styles.input}
            />

            <select
              name="discountType"
              value={formData.discountType}
              onChange={handleInputChange}
              style={styles.input}
            >
              <option value="PERCENT">Percent (%)</option>
              <option value="FIXED">Fixed (VND)</option>
            </select>

            <input
              type="number"
              name="discountValue"
              placeholder={
                formData.discountType === "PERCENT"
                  ? "Discount % (e.g. 10 or 20)"
                  : "Discount amount VND (e.g. 100000)"
              }
              value={formData.discountValue}
              onChange={handleInputChange}
              required
              min="1"
              style={styles.input}
            />

            <input
              type="number"
              name="minOrderValue"
              placeholder="Minimum order value"
              value={formData.minOrderValue}
              onChange={handleInputChange}
              min="0"
              style={styles.input}
            />

            <input
              type="number"
              name="maxDiscountValue"
              placeholder="Max discount value (optional)"
              value={formData.maxDiscountValue}
              onChange={handleInputChange}
              min="0"
              style={styles.input}
            />

            <input
              type="date"
              name="expiryDate"
              value={formData.expiryDate}
              onChange={handleInputChange}
              required
              style={styles.input}
            />
          </div>

          <textarea
            name="conditions"
            placeholder="Voucher conditions"
            value={formData.conditions}
            onChange={handleInputChange}
            style={styles.textarea}
            rows={3}
          />

          <p style={styles.helperText}>
            {formData.discountType === "PERCENT"
              ? "Percent voucher: enter 10 means 10%, 20 means 20% (applied on total order value)."
              : "Fixed voucher: enter exact VND amount, e.g. 100000 for 100.000₫."}
          </p>

          <label style={styles.checkboxRow}>
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleInputChange}
            />
            Active voucher
          </label>

          <div style={styles.formActions}>
            <button type="submit" style={styles.submitButton}>
              {editingVoucher ? "Update" : "Create"}
            </button>
            <button
              type="button"
              style={styles.cancelButton}
              onClick={resetForm}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div style={styles.loading}>Loading vouchers...</div>
      ) : vouchers.length === 0 ? (
        <div style={styles.empty}>No vouchers found.</div>
      ) : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Code</th>
                <th style={styles.th}>Discount</th>
                <th style={styles.th}>Expiry</th>
                <th style={styles.th}>Conditions</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {vouchers.map((voucher) => (
                <tr key={voucher._id}>
                  <td style={styles.td}>{voucher.code}</td>
                  <td style={styles.td}>
                    {voucher.discountType === "PERCENT"
                      ? `${voucher.discountValue}%`
                      : `${Number(voucher.discountValue).toLocaleString("vi-VN")}₫`}
                  </td>
                  <td style={styles.td}>
                    {new Date(voucher.expiryDate).toLocaleDateString()}
                  </td>
                  <td style={styles.td}>{voucher.conditions || "-"}</td>
                  <td style={styles.td}>
                    <span
                      style={{
                        ...styles.statusBadge,
                        backgroundColor: voucher.isActive
                          ? "#27ae60"
                          : "#7f8c8d",
                      }}
                    >
                      {voucher.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <button
                      type="button"
                      style={styles.editButton}
                      onClick={() => openEditForm(voucher)}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
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
    marginBottom: "1.5rem",
  },
  title: {
    fontSize: "2rem",
    color: "#2c3e50",
  },
  addButton: {
    backgroundColor: "#27ae60",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    padding: "0.7rem 1.2rem",
    cursor: "pointer",
  },
  success: {
    backgroundColor: "#d4edda",
    color: "#155724",
    padding: "0.75rem",
    borderRadius: "6px",
    marginBottom: "1rem",
  },
  error: {
    backgroundColor: "#ffe6e6",
    color: "#e74c3c",
    padding: "0.75rem",
    borderRadius: "6px",
    marginBottom: "1rem",
  },
  form: {
    backgroundColor: "#fff",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    borderRadius: "8px",
    padding: "1rem",
    marginBottom: "1.5rem",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "0.75rem",
    marginBottom: "0.75rem",
  },
  input: {
    width: "100%",
    border: "1px solid #ddd",
    borderRadius: "6px",
    padding: "0.65rem",
  },
  textarea: {
    width: "100%",
    border: "1px solid #ddd",
    borderRadius: "6px",
    padding: "0.65rem",
    marginBottom: "0.75rem",
  },
  helperText: {
    margin: "-0.25rem 0 0.75rem",
    color: "#6c757d",
    fontSize: "0.85rem",
  },
  checkboxRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    marginBottom: "0.75rem",
    color: "#2c3e50",
  },
  formActions: {
    display: "flex",
    gap: "0.75rem",
  },
  submitButton: {
    backgroundColor: "#3498db",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    padding: "0.6rem 1rem",
    cursor: "pointer",
  },
  cancelButton: {
    backgroundColor: "#95a5a6",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    padding: "0.6rem 1rem",
    cursor: "pointer",
  },
  tableWrap: {
    backgroundColor: "#fff",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    overflow: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    textAlign: "left",
    backgroundColor: "#f7f9fc",
    padding: "0.8rem",
    color: "#34495e",
    fontSize: "0.9rem",
  },
  td: {
    padding: "0.8rem",
    borderTop: "1px solid #ecf0f1",
    color: "#2c3e50",
    verticalAlign: "top",
  },
  statusBadge: {
    color: "#fff",
    borderRadius: "999px",
    padding: "0.2rem 0.6rem",
    fontSize: "0.8rem",
    fontWeight: 600,
  },
  editButton: {
    backgroundColor: "#3498db",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    padding: "0.4rem 0.75rem",
    cursor: "pointer",
  },
  loading: {
    color: "#7f8c8d",
  },
  empty: {
    color: "#7f8c8d",
  },
};

export default VouchersManagement;
