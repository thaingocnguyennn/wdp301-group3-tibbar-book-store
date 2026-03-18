import { useEffect, useState } from "react";
import { voucherApi } from "../../api/voucherApi";
import { adminUserApi } from "../../api/userApi";

const SEGMENT_OPTIONS = [
  { value: "NEW_CUSTOMER", label: "New customers (no orders yet)" },
  { value: "VIP_CUSTOMER", label: "VIP customers (spent above threshold)" },
  { value: "INACTIVE_CUSTOMER", label: "Customers inactive for N days" },
  { value: "BIRTHDAY_THIS_MONTH", label: "Customers with birthday this month" },
  { value: "PURCHASED_OVER_X", label: "Customers purchased over X orders" },
];

const initialFormData = {
  code: "",
  discountType: "PERCENT",
  discountValue: "",
  minOrderValue: "0",
  maxDiscountValue: "",
  expiryDate: "",
  conditions: "",
  isActive: true,
  audienceType: "PUBLIC",
  maxUsagePerUser: "1",
};

const initialAssignState = {
  voucherId: null,
  selectedUserIds: [],
  selectedSegments: [],
  vipMinSpent: "3000000",
  inactiveDays: "90",
  minOrderCount: "5",
};

const VouchersManagement = () => {
  const [vouchers, setVouchers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showAssignPanel, setShowAssignPanel] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState(null);
  const [formData, setFormData] = useState(initialFormData);
  const [assignState, setAssignState] = useState(initialAssignState);

  useEffect(() => {
    fetchVouchers();
    fetchCustomers();
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

  const fetchCustomers = async () => {
    try {
      const response = await adminUserApi.getAllUsers({
        role: "customer",
        status: "active",
      });
      setCustomers(response.data?.users || []);
    } catch (err) {
      console.error("Failed to fetch customers for assignment:", err);
    }
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingVoucher(null);
    setShowForm(false);
  };

  const resetAssignState = () => {
    setAssignState(initialAssignState);
    setShowAssignPanel(false);
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
      audienceType: voucher.audienceType || "PUBLIC",
      maxUsagePerUser: String(voucher.maxUsagePerUser || 1),
    });
    setShowForm(true);
  };

  const openAssignPanel = (voucher) => {
    setAssignState({
      ...initialAssignState,
      voucherId: voucher._id,
    });
    setShowAssignPanel(true);
    setMessage("");
    setError("");
  };

  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleAssignInputChange = (event) => {
    const { name, value } = event.target;
    setAssignState((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const toggleAssignUser = (userId) => {
    setAssignState((prev) => {
      const exists = prev.selectedUserIds.includes(userId);
      return {
        ...prev,
        selectedUserIds: exists
          ? prev.selectedUserIds.filter((id) => id !== userId)
          : [...prev.selectedUserIds, userId],
      };
    });
  };

  const toggleSegment = (segment) => {
    setAssignState((prev) => {
      const exists = prev.selectedSegments.includes(segment);
      return {
        ...prev,
        selectedSegments: exists
          ? prev.selectedSegments.filter((item) => item !== segment)
          : [...prev.selectedSegments, segment],
      };
    });
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
    audienceType: formData.audienceType,
    maxUsagePerUser: Number(formData.maxUsagePerUser || 1),
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

  const handleAssignVoucher = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      if (!assignState.voucherId) {
        setError("Please select a voucher to assign");
        return;
      }

      if (
        assignState.selectedUserIds.length === 0 &&
        assignState.selectedSegments.length === 0
      ) {
        setError("Choose at least one user or one user segment");
        return;
      }

      const response = await voucherApi.assignVoucherToUsers(
        assignState.voucherId,
        {
          userIds: assignState.selectedUserIds,
          segments: assignState.selectedSegments,
          segmentRules: {
            vipMinSpent: Number(assignState.vipMinSpent || 3000000),
            inactiveDays: Number(assignState.inactiveDays || 90),
            minOrderCount: Number(assignState.minOrderCount || 5),
          },
        },
      );

      const data = response.data || {};
      setMessage(
        `Assigned successfully. New assignments: ${data.assignedCount || 0}, already assigned: ${data.alreadyAssignedCount || 0}`,
      );
      resetAssignState();
      await fetchVouchers();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to assign voucher");
    }
  };

  const currentAssignVoucher = vouchers.find(
    (voucher) => voucher._id === assignState.voucherId,
  );

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
              setShowAssignPanel(false);
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

            <select
              name="audienceType"
              value={formData.audienceType}
              onChange={handleInputChange}
              style={styles.input}
            >
              <option value="PUBLIC">Public voucher</option>
              <option value="ASSIGNED">Assigned voucher</option>
            </select>

            <input
              type="number"
              name="maxUsagePerUser"
              min="1"
              value={formData.maxUsagePerUser}
              onChange={handleInputChange}
              placeholder="Max usage per user"
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
              ? "Percent voucher: enter 10 means 10%, 20 means 20%."
              : "Fixed voucher: enter exact VND amount, e.g. 100000 for 100.000 d."}
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

      {showAssignPanel && (
        <form style={styles.form} onSubmit={handleAssignVoucher}>
          <h3>
            Assign Voucher: {currentAssignVoucher?.code || "(not selected)"}
          </h3>

          <p style={styles.helperText}>
            Select one or more users manually, or choose user segments for auto
            assignment.
          </p>

          <div style={styles.assignLayout}>
            <div>
              <h4 style={styles.blockTitle}>Manual users</h4>
              <div style={styles.usersList}>
                {customers.map((customer) => {
                  const fullName = [customer.firstName, customer.lastName]
                    .filter(Boolean)
                    .join(" ");
                  const isSelected = assignState.selectedUserIds.includes(
                    customer._id,
                  );

                  return (
                    <label key={customer._id} style={styles.userRow}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleAssignUser(customer._id)}
                      />
                      <span>
                        {fullName || customer.email} ({customer.email})
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <h4 style={styles.blockTitle}>Target segments</h4>
              <div style={styles.segmentList}>
                {SEGMENT_OPTIONS.map((segment) => (
                  <label key={segment.value} style={styles.userRow}>
                    <input
                      type="checkbox"
                      checked={assignState.selectedSegments.includes(
                        segment.value,
                      )}
                      onChange={() => toggleSegment(segment.value)}
                    />
                    <span>{segment.label}</span>
                  </label>
                ))}
              </div>

              <div style={styles.segmentRules}>
                <input
                  type="number"
                  name="vipMinSpent"
                  min="0"
                  value={assignState.vipMinSpent}
                  onChange={handleAssignInputChange}
                  style={styles.input}
                  placeholder="VIP minimum spent"
                />
                <input
                  type="number"
                  name="inactiveDays"
                  min="1"
                  value={assignState.inactiveDays}
                  onChange={handleAssignInputChange}
                  style={styles.input}
                  placeholder="Inactive days"
                />
                <input
                  type="number"
                  name="minOrderCount"
                  min="1"
                  value={assignState.minOrderCount}
                  onChange={handleAssignInputChange}
                  style={styles.input}
                  placeholder="Min order count"
                />
              </div>
            </div>
          </div>

          <div style={styles.formActions}>
            <button type="submit" style={styles.submitButton}>
              Assign Voucher
            </button>
            <button
              type="button"
              style={styles.cancelButton}
              onClick={resetAssignState}
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
                <th style={styles.th}>Audience</th>
                <th style={styles.th}>Max/User</th>
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
                      : `${Number(voucher.discountValue).toLocaleString("vi-VN")}d`}
                  </td>
                  <td style={styles.td}>{voucher.audienceType || "PUBLIC"}</td>
                  <td style={styles.td}>{voucher.maxUsagePerUser || 1}</td>
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
                    <div style={styles.actionGroup}>
                      <button
                        type="button"
                        style={styles.editButton}
                        onClick={() => {
                          openEditForm(voucher);
                          setShowAssignPanel(false);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        style={styles.assignButton}
                        onClick={() => {
                          openAssignPanel(voucher);
                          setShowForm(false);
                        }}
                      >
                        Assign
                      </button>
                    </div>
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
    boxSizing: "border-box",
  },
  textarea: {
    width: "100%",
    border: "1px solid #ddd",
    borderRadius: "6px",
    padding: "0.65rem",
    marginBottom: "0.75rem",
    boxSizing: "border-box",
  },
  helperText: {
    margin: "0 0 0.75rem",
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
    marginTop: "0.75rem",
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
  actionGroup: {
    display: "flex",
    gap: "0.4rem",
    flexWrap: "wrap",
  },
  editButton: {
    backgroundColor: "#3498db",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    padding: "0.4rem 0.75rem",
    cursor: "pointer",
  },
  assignButton: {
    backgroundColor: "#8e44ad",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    padding: "0.4rem 0.75rem",
    cursor: "pointer",
  },
  assignLayout: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "1rem",
  },
  blockTitle: {
    marginTop: 0,
    marginBottom: "0.6rem",
    color: "#2c3e50",
    fontSize: "1rem",
  },
  usersList: {
    maxHeight: "220px",
    overflowY: "auto",
    border: "1px solid #e5e7eb",
    borderRadius: "6px",
    padding: "0.6rem",
  },
  segmentList: {
    border: "1px solid #e5e7eb",
    borderRadius: "6px",
    padding: "0.6rem",
    marginBottom: "0.75rem",
  },
  userRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: "0.5rem",
    marginBottom: "0.45rem",
    fontSize: "0.88rem",
    color: "#2c3e50",
  },
  segmentRules: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "0.6rem",
  },
  loading: {
    color: "#7f8c8d",
  },
  empty: {
    color: "#7f8c8d",
  },
};

export default VouchersManagement;
