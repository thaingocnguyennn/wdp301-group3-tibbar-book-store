import { useEffect, useState } from "react";
import { adminOrderApi } from "../../api/orderApi";
import axios from "../../api/axios";

const ORDER_STATUSES = [
  "PENDING",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];
const PAYMENT_STATUSES = ["PENDING", "PAID", "FAILED", "REFUNDED"];

const getAllowedAdminStatusTransitions = (currentStatus, hasShipper) => {
  if (currentStatus === "PENDING") {
    return ["PROCESSING"];
  }

  if (currentStatus === "PROCESSING") {
    return hasShipper ? ["SHIPPED"] : [];
  }

  return [];
};

const getAllowedReturnRequestStatuses = (currentStatus) => {
  if (currentStatus === "APPROVED") {
    return ["COMPLETED", "REJECTED"];
  }

  return ["APPROVED", "REJECTED"];
};

const OrdersManagement = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusDraft, setStatusDraft] = useState("");
  const [filters, setFilters] = useState({
    status: "all",
    paymentStatus: "all",
    search: "",
    fromDate: "",
    toDate: "",
  });
  const [debouncedFilters, setDebouncedFilters] = useState(filters);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [shippers, setShippers] = useState([]);
  const [selectedShipper, setSelectedShipper] = useState("");
  const [returnStatusDraft, setReturnStatusDraft] = useState("APPROVED");
  const [returnAdminNote, setReturnAdminNote] = useState("");
  const [isUpdatingReturnRequest, setIsUpdatingReturnRequest] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 400);

    return () => clearTimeout(timer);
  }, [filters]);

  useEffect(() => {
    fetchOrders();
  }, [debouncedFilters, page]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await adminOrderApi.getAllOrders({
        page,
        limit,
        status: debouncedFilters.status,
        paymentStatus: debouncedFilters.paymentStatus,
        search: debouncedFilters.search,
        fromDate: debouncedFilters.fromDate,
        toDate: debouncedFilters.toDate,
      });
      setOrders(response.data.orders);
      setPagination(response.data.pagination);
      if (selectedOrder) {
        const updated = response.data.orders.find(
          (order) => order._id === selectedOrder._id,
        );
        if (updated) {
          setSelectedOrder(updated);
          setStatusDraft(updated.orderStatus);
          setSelectedShipper(updated.shipper?._id || "");
          setReturnStatusDraft(
            updated.returnRequest?.status === "APPROVED"
              ? "COMPLETED"
              : "APPROVED",
          );
          setReturnAdminNote(updated.returnRequest?.adminNote || "");
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setPage(1);
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleSelectOrder = (order) => {
    setSelectedOrder(order);
    setStatusDraft(order.orderStatus);
    setSelectedShipper(order.shipper?._id || "");
    setReturnStatusDraft(
      order.returnRequest?.status === "APPROVED" ? "COMPLETED" : "APPROVED",
    );
    setReturnAdminNote(order.returnRequest?.adminNote || "");
    setMessage("");
    setError("");
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;

    const allowedNextStatuses = getAllowedAdminStatusTransitions(
      selectedOrder.orderStatus,
      Boolean(selectedOrder.shipper || selectedShipper),
    );

    const nextStatus = allowedNextStatuses.includes(statusDraft)
      ? statusDraft
      : allowedNextStatuses[0];

    if (!nextStatus) {
      setError(
        "Invalid status transition. Admin can only move PENDING -> PROCESSING and PROCESSING -> SHIPPED.",
      );
      return;
    }

    try {
      setMessage("");
      setError("");
      const response = await adminOrderApi.updateOrderStatus(
        selectedOrder._id,
        nextStatus,
      );
      setSelectedOrder(response.data.order);
      setStatusDraft(response.data.order?.orderStatus || "");
      setMessage("Order status updated successfully");
      fetchOrders();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update order status");
    }
  };
  const handleAssignShipper = async () => {
    if (!selectedOrder || !selectedShipper) return;

    try {
      setMessage("");
      setError("");

      const response = await adminOrderApi.assignShipper(
        selectedOrder._id,
        selectedShipper,
      );

      setSelectedOrder(response.data.order);
      setSelectedShipper(response.data.order?.shipper?._id || selectedShipper);
      setMessage("Shipper assigned successfully");
      fetchOrders();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to assign shipper");
    }
  };

  const handleReviewReturnRequest = async () => {
    if (!selectedOrder?.returnRequest?.requestedAt) return;

    const currentStatus = selectedOrder.returnRequest.status || "PENDING";
    const allowedStatuses = getAllowedReturnRequestStatuses(currentStatus);
    const safeStatus = allowedStatuses.includes(returnStatusDraft)
      ? returnStatusDraft
      : allowedStatuses[0];

    try {
      setIsUpdatingReturnRequest(true);
      setMessage("");
      setError("");

      const response = await adminOrderApi.reviewReturnRefundRequest(
        selectedOrder._id,
        {
          status: safeStatus,
          adminNote: returnAdminNote,
        },
      );

      setSelectedOrder(response.data.order);
      setReturnAdminNote(response.data.order?.returnRequest?.adminNote || "");
      setMessage("Return/refund request updated successfully");
      fetchOrders();
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to update return/refund request",
      );
    } finally {
      setIsUpdatingReturnRequest(false);
    }
  };

  const formatCurrency = (value) => {
    return Number(value || 0).toLocaleString("vi-VN") + " ₫";
  };
  const fetchShippers = async () => {
    const res = await axios.get("/users/admin/shippers");
    setShippers(res.data.shippers || []);
  };
  useEffect(() => {
    if (selectedOrder) fetchShippers();
  }, [selectedOrder]);

  if (loading) {
    return (
      <div style={styles.container}>
        <p>Loading orders...</p>
      </div>
    );
  }

  const currentReturnStatus = selectedOrder?.returnRequest?.status || "PENDING";
  const allowedAdminStatusTransitions = getAllowedAdminStatusTransitions(
    selectedOrder?.orderStatus,
    Boolean(selectedOrder?.shipper || selectedShipper),
  );
  const resolvedStatusDraft = allowedAdminStatusTransitions.includes(statusDraft)
    ? statusDraft
    : (allowedAdminStatusTransitions[0] || "");
  const allowedReturnRequestStatuses =
    getAllowedReturnRequestStatuses(currentReturnStatus);
  const resolvedReturnStatusDraft = allowedReturnRequestStatuses.includes(
    returnStatusDraft,
  )
    ? returnStatusDraft
    : allowedReturnRequestStatuses[0];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Orders Management</h1>
      </div>

      {message && <div style={styles.success}>{message}</div>}
      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.filters}>
        <div style={styles.filterGroup}>
          <label style={styles.label}>Search</label>
          <input
            type="text"
            placeholder="Order number or user"
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            style={styles.searchInput}
          />
        </div>

        <div style={styles.filterGroup}>
          <label style={styles.label}>Order Status</label>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange("status", e.target.value)}
            style={styles.select}
          >
            <option value="all">All</option>
            {ORDER_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <div style={styles.filterGroup}>
          <label style={styles.label}>Payment Status</label>
          <select
            value={filters.paymentStatus}
            onChange={(e) =>
              handleFilterChange("paymentStatus", e.target.value)
            }
            style={styles.select}
          >
            <option value="all">All</option>
            {PAYMENT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <div style={styles.filterGroup}>
          <label style={styles.label}>From Date</label>
          <input
            type="date"
            value={filters.fromDate}
            onChange={(e) => handleFilterChange("fromDate", e.target.value)}
            style={styles.dateInput}
          />
        </div>

        <div style={styles.filterGroup}>
          <label style={styles.label}>To Date</label>
          <input
            type="date"
            value={filters.toDate}
            onChange={(e) => handleFilterChange("toDate", e.target.value)}
            style={styles.dateInput}
          />
        </div>
      </div>

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Order #</th>
              <th style={styles.th}>Customer</th>
              <th style={styles.th}>Total</th>
              <th style={styles.th}>Payment</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Created</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order._id} style={styles.tr}>
                <td style={styles.td}>{order.orderNumber}</td>
                <td style={styles.td}>{order.user?.email || "Unknown"}</td>
                <td style={styles.td}>{formatCurrency(order.total)}</td>
                <td style={styles.td}>{order.paymentStatus}</td>
                <td style={styles.td}>{order.orderStatus}</td>
                <td style={styles.td}>
                  {new Date(order.createdAt).toLocaleDateString()}
                </td>
                <td style={styles.td}>
                  <button
                    type="button"
                    style={styles.actionButton}
                    onClick={() => handleSelectOrder(order)}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={styles.pagination}>
        <button
          type="button"
          style={styles.pageButton}
          onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          disabled={page <= 1}
        >
          Previous
        </button>
        <span style={styles.pageInfo}>
          Page {page} of {pagination.totalPages || 1}
        </span>
        <button
          type="button"
          style={styles.pageButton}
          onClick={() =>
            setPage((prev) => Math.min(pagination.totalPages || 1, prev + 1))
          }
          disabled={page >= (pagination.totalPages || 1)}
        >
          Next
        </button>
      </div>

      {selectedOrder && (
        <div style={styles.detailCard}>
          <div style={styles.detailHeader}>
            <h3 style={styles.detailTitle}>Order Details</h3>
            <button
              type="button"
              style={styles.closeButton}
              onClick={() => setSelectedOrder(null)}
            >
              Close
            </button>
          </div>

          <div style={styles.detailGrid}>
            <div>
              <p>
                <strong>Order Number:</strong> {selectedOrder.orderNumber}
              </p>
              <p>
                <strong>Customer:</strong>{" "}
                {selectedOrder.user?.email || "Unknown"}
              </p>
              <p>
                <strong>Payment Method:</strong> {selectedOrder.paymentMethod}
              </p>
            </div>
            <div>
              <p>
                <strong>Subtotal:</strong>{" "}
                {formatCurrency(selectedOrder.subtotal)}
              </p>
              <p>
                <strong>Shipping Fee:</strong>{" "}
                {formatCurrency(selectedOrder.shippingFee)}
              </p>
              <p>
                <strong>Total:</strong> {formatCurrency(selectedOrder.total)}
              </p>
            </div>
          </div>

          <div style={styles.statusRow}>
            <label style={styles.label}>Update Status</label>
            <div style={styles.statusControls}>
              <select
                value={resolvedStatusDraft}
                onChange={(e) => setStatusDraft(e.target.value)}
                style={styles.select}
                disabled={allowedAdminStatusTransitions.length === 0}
              >
                {allowedAdminStatusTransitions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <button
                type="button"
                style={styles.actionButton}
                onClick={handleUpdateStatus}
                disabled={allowedAdminStatusTransitions.length === 0}
              >
                Update
              </button>
            </div>
            {selectedOrder.orderStatus === "PROCESSING" && !selectedOrder.shipper && (
              <small style={styles.helperText}>
                Assign a shipper before moving this order to SHIPPED.
              </small>
            )}
          </div>
          {/* Assign Shipper */}
          <div style={styles.statusRow}>
            <label style={styles.label}>Assign Shipper</label>

            <div style={styles.statusControls}>
              <select
                value={selectedShipper}
                onChange={(e) => setSelectedShipper(e.target.value)}
                style={styles.select}
              >
                <option value="">Select shipper</option>
                {shippers.map((shipper) => (
                  <option key={shipper._id} value={shipper._id}>
                    {shipper.email}
                  </option>
                ))}
              </select>

              <button
                type="button"
                style={styles.actionButton}
                disabled={!selectedShipper}
                onClick={handleAssignShipper}
              >
                Assign
              </button>
            </div>
          </div>

          {selectedOrder.returnRequest?.requestedAt && (
            <div style={styles.returnRequestCard}>
              <h4 style={styles.returnRequestTitle}>
                Customer Return / Refund Request
              </h4>
              <div style={styles.returnRequestGrid}>
                <p>
                  <strong>Type:</strong>{" "}
                  {selectedOrder.returnRequest.type || "-"}
                </p>
                <p>
                  <strong>Status:</strong>{" "}
                  {selectedOrder.returnRequest.status || "PENDING"}
                </p>
                <p>
                  <strong>Reason:</strong>{" "}
                  {selectedOrder.returnRequest.reason || "-"}
                </p>
                <p>
                  <strong>Requested At:</strong>{" "}
                  {new Date(
                    selectedOrder.returnRequest.requestedAt,
                  ).toLocaleString("vi-VN")}
                </p>
                <p style={styles.returnRequestDetails}>
                  <strong>Details:</strong>{" "}
                  {selectedOrder.returnRequest.details || "-"}
                </p>
              </div>

              {!["REJECTED", "COMPLETED"].includes(
                selectedOrder.returnRequest.status || "PENDING",
              ) ? (
                <div style={styles.statusControls}>
                  <select
                    value={resolvedReturnStatusDraft}
                    onChange={(e) => setReturnStatusDraft(e.target.value)}
                    style={styles.select}
                  >
                    {allowedReturnRequestStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={returnAdminNote}
                    onChange={(e) => setReturnAdminNote(e.target.value)}
                    placeholder="Admin note for customer"
                    style={styles.searchInput}
                  />
                  <button
                    type="button"
                    style={styles.actionButton}
                    onClick={handleReviewReturnRequest}
                    disabled={isUpdatingReturnRequest}
                  >
                    {isUpdatingReturnRequest ? "Saving..." : "Update Request"}
                  </button>
                </div>
              ) : (
                <p style={styles.returnRequestClosedText}>
                  This request is closed. Admin note:{" "}
                  {selectedOrder.returnRequest.adminNote || "-"}
                </p>
              )}
            </div>
          )}

          <h4 style={styles.itemsTitle}>Items</h4>
          <div style={styles.itemsTable}>
            <div style={styles.itemsHeader}>
              <span>Title</span>
              <span>Qty</span>
              <span>Price</span>
              <span>Subtotal</span>
            </div>
            {selectedOrder.items.map((item) => (
              <div key={item.book?._id || item.title} style={styles.itemRow}>
                <span>{item.title}</span>
                <span>{item.quantity}</span>
                <span>{formatCurrency(item.price)}</span>
                <span>{formatCurrency(item.subtotal)}</span>
              </div>
            ))}
          </div>
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
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "1.5rem",
  },
  title: {
    fontSize: "2rem",
    color: "#2c3e50",
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
  filters: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
    gap: "1rem",
    marginBottom: "1.5rem",
  },
  filterGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  label: {
    fontSize: "0.9rem",
    fontWeight: 600,
    color: "#34495e",
  },
  helperText: {
    color: "#7f8c8d",
    fontSize: "0.84rem",
  },
  searchInput: {
    padding: "0.75rem",
    border: "1px solid #ddd",
    borderRadius: "6px",
  },
  dateInput: {
    padding: "0.75rem",
    border: "1px solid #ddd",
    borderRadius: "6px",
  },
  select: {
    padding: "0.75rem",
    border: "1px solid #ddd",
    borderRadius: "6px",
    backgroundColor: "#fff",
  },
  tableContainer: {
    backgroundColor: "#fff",
    borderRadius: "10px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    textAlign: "left",
    padding: "1rem",
    backgroundColor: "#f7f9fc",
    fontSize: "0.85rem",
    color: "#7f8c8d",
  },
  tr: {
    borderBottom: "1px solid #eef1f6",
  },
  td: {
    padding: "0.9rem 1rem",
    fontSize: "0.9rem",
    color: "#2c3e50",
  },
  actionButton: {
    backgroundColor: "#3498db",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    padding: "0.4rem 0.8rem",
    cursor: "pointer",
  },
  pagination: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "1rem",
    marginTop: "1.5rem",
  },
  pageButton: {
    backgroundColor: "#ecf0f1",
    border: "none",
    borderRadius: "6px",
    padding: "0.5rem 1rem",
    cursor: "pointer",
  },
  pageInfo: {
    color: "#7f8c8d",
  },
  detailCard: {
    marginTop: "2rem",
    backgroundColor: "#fff",
    borderRadius: "10px",
    padding: "1.5rem",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  },
  detailHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1rem",
  },
  detailTitle: {
    fontSize: "1.4rem",
    color: "#2c3e50",
  },
  closeButton: {
    backgroundColor: "transparent",
    border: "none",
    color: "#7f8c8d",
    cursor: "pointer",
  },
  detailGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "1rem",
    marginBottom: "1.5rem",
  },
  statusRow: {
    display: "flex",
    flexDirection: "column",
    gap: "0.6rem",
    marginBottom: "1.5rem",
  },
  statusControls: {
    display: "flex",
    gap: "0.75rem",
    alignItems: "center",
    flexWrap: "wrap",
  },
  returnRequestCard: {
    border: "1px solid #dfe6ee",
    borderRadius: "8px",
    padding: "1rem",
    marginBottom: "1.5rem",
    backgroundColor: "#fafcff",
  },
  returnRequestTitle: {
    margin: "0 0 0.75rem",
    fontSize: "1rem",
    color: "#2c3e50",
  },
  returnRequestGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "0.5rem 1rem",
    marginBottom: "0.85rem",
    fontSize: "0.9rem",
    color: "#2c3e50",
  },
  returnRequestDetails: {
    gridColumn: "1 / -1",
  },
  returnRequestClosedText: {
    margin: 0,
    color: "#2f3640",
    fontSize: "0.88rem",
  },
  itemsTitle: {
    marginBottom: "0.75rem",
    color: "#2c3e50",
  },
  itemsTable: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  itemsHeader: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr 1fr 1fr",
    fontWeight: 600,
    color: "#7f8c8d",
  },
  itemRow: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr 1fr 1fr",
    padding: "0.4rem 0",
    borderBottom: "1px solid #eef1f6",
    color: "#2c3e50",
  },
};

export default OrdersManagement;
