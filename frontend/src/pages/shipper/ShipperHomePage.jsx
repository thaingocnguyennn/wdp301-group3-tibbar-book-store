import { useState, useEffect } from 'react';
import { shipperApi } from '../../api/shipperApi';

const ShipperHomePage = () => {
  const [dashboard, setDashboard] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  useEffect(() => {
    fetchDashboard();
    fetchOrders();
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [filterStatus, currentPage]);

  const fetchDashboard = async () => {
    try {
      const response = await shipperApi.getDashboard();
      setDashboard(response.data);
    } catch (err) {
      console.error('Failed to load dashboard');
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await shipperApi.getOrders({
        page: currentPage,
        limit: 10,
        status: filterStatus || undefined
      });

      setOrders(response.data.orders || []);
    } catch (err) {
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleViewOrder = async (orderId) => {
    setLoading(true);
    try {
      const response = await shipperApi.getOrderDetails(orderId);
      setSelectedOrder(response.data);
      setProofFile(null); // 🔥 THÊM DÒNG NÀY
      setNewStatus("");
      setError('');
    } catch (err) {
      if (err.response?.status === 403) {
        setError('You do not have access to this order');
      } else {
        setError('Failed to load order details');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!newStatus) {
      setError('Please select a status');
      return;
    }

    setLoading(true);
    try {
      await shipperApi.updateOrderStatus(selectedOrder._id, newStatus);
      setMessage('Order status updated successfully');
      setSelectedOrder(null);
      await fetchOrders();
      await fetchDashboard();
      setTimeout(() => setMessage(''), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update order status');
    } finally {
      setLoading(false);
    }
  };
  const handleRespondAssignment = async (action) => {
    setLoading(true);
    try {
      await shipperApi.respondAssignment(selectedOrder._id, action);

      setMessage(`Assignment ${action} successfully`);
      setSelectedOrder(null);

      await fetchOrders();
      await fetchDashboard();

      setTimeout(() => setMessage(''), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to respond assignment');
    } finally {
      setLoading(false);
    }
  };
  // Mới thêm hàm này để xử lý upload bằng chứng giao hàng
  const handleUploadProof = async () => {
    console.log("UPLOAD CLICKED");

    if (!proofFile) {
      setError("Please select an image");
      return;
    }

    const formData = new FormData();
    formData.append("image", proofFile);

    setUploading(true);

    try {
      const response = await shipperApi.uploadDeliveryProof(
        selectedOrder._id,
        formData
      );

      setSelectedOrder(response.data); // 🔥 quan trọng
      setProofFile(null);
      setMessage("Proof uploaded successfully");
      setError("");

    } catch (err) {
      setError(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      'PENDING': '#f39c12',
      'PROCESSING': '#3498db',
      'SHIPPED': '#9b59b6',
      'DELIVERED': '#2ecc71',
      'CANCELLED': '#e74c3c'
    };
    return colors[status] || '#95a5a6';
  };
  const getAssignmentBadgeColor = (status) => {
    const colors = {
      'PENDING': '#f39c12',
      'ACCEPTED': '#2ecc71',
      'REJECTED': '#e74c3c'
    };
    return colors[status] || '#95a5a6';
  };

  return (
    <div style={styles.container}>
      {/* Dashboard Summary */}
      {dashboard && (
        <div style={styles.dashboardSection}>
          <h2 style={styles.title}>Dashboard</h2>
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statNumber}>{dashboard.statistics.totalOrders}</div>
              <div style={styles.statLabel}>Total Orders</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statNumber}>{dashboard.statistics.deliveredOrders}</div>
              <div style={styles.statLabel}>Delivered</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statNumber}>{dashboard.statistics.shippedOrders}</div>
              <div style={styles.statLabel}>Shipped</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statNumber}>{dashboard.statistics.cancelledOrders}</div>
              <div style={styles.statLabel}>Cancel</div>

            </div>
            <div style={styles.statCard}>
              <div style={styles.statNumber}>{dashboard.performance.accepted}</div>
              <div style={styles.statLabel}>Accepted</div>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statNumber}>{dashboard.performance.rejected}</div>
              <div style={styles.statLabel}>Rejected</div>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statNumber}>{dashboard.performance.successRate}%</div>
              <div style={styles.statLabel}>Success Rate</div>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statNumber}>{dashboard.performance.acceptanceRate}%</div>
              <div style={styles.statLabel}>Acceptance Rate</div>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      {message && <div style={styles.success}>{message}</div>}
      {error && <div style={styles.error}>{error}</div>}

      {/* Orders Section */}
      {selectedOrder ? (
        <div style={styles.detailsSection}>
          <div style={styles.detailsHeader}>
            <h3>Order #{selectedOrder.orderNumber}</h3>
            <button style={styles.backButton} onClick={() => setSelectedOrder(null)}>
              ← Back to Orders
            </button>
          </div>

          {/* Order Items */}
          <div style={styles.card}>
            <h4 style={styles.cardTitle}>Order Items</h4>
            {selectedOrder.items.map((item, index) => (
              <div key={index} style={styles.orderItem}>
                <div style={styles.itemInfo}>
                  <p><strong>{item.title}</strong></p>
                  <p>Author: {item.author}</p>
                  <p>Quantity: {item.quantity} × ₫{item.price.toLocaleString()}</p>
                </div>
                <p style={styles.itemSubtotal}>₫{item.subtotal.toLocaleString()}</p>
              </div>
            ))}
          </div>

          {/* Customer Info */}
          <div style={styles.card}>
            <h4 style={styles.cardTitle}>Customer Information</h4>
            <div style={styles.customerInfo}>
              <p><strong>Name:</strong> {selectedOrder.user.firstName} {selectedOrder.user.lastName}</p>
              <p><strong>Email:</strong> {selectedOrder.user.email}</p>
              <p><strong>Phone:</strong> {selectedOrder.user.phone}</p>
            </div>
          </div>

          {/* Delivery Address */}
          <div style={styles.card}>
            <h4 style={styles.cardTitle}>Delivery Address</h4>
            {selectedOrder.shippingAddress && selectedOrder.shippingAddress.fullName ? (
              <div style={styles.addressBox}>
                <p><strong>{selectedOrder.shippingAddress.fullName}</strong></p>
                <p>Phone: {selectedOrder.shippingAddress.phone}</p>
                <p>{selectedOrder.shippingAddress.description}</p>
                <p>{selectedOrder.shippingAddress.commune}, {selectedOrder.shippingAddress.district}</p>
                <p>{selectedOrder.shippingAddress.province}</p>
              </div>
            ) : (
              <p style={styles.noData}>No delivery address available</p>
            )}
          </div>

          {/* Order Summary */}
          <div style={styles.card}>
            <h4 style={styles.cardTitle}>Order Summary</h4>
            <div style={styles.summary}>
              <div style={styles.summaryRow}>
                <span>Subtotal:</span>
                <span>₫{selectedOrder.subtotal.toLocaleString()}</span>
              </div>
              {selectedOrder.discount > 0 && (
                <div style={styles.summaryRow}>
                  <span>Discount:</span>
                  <span>-₫{selectedOrder.discount.toLocaleString()}</span>
                </div>
              )}
              <div style={styles.summaryRow}>
                <span>Shipping Fee:</span>
                <span>₫{selectedOrder.shippingFee.toLocaleString()}</span>
              </div>
              <div style={{ ...styles.summaryRow, ...styles.totalRow }}>
                <span><strong>Total:</strong></span>
                <span><strong>₫{selectedOrder.total.toLocaleString()}</strong></span>
              </div>
            </div>
          </div>

          {/* Delivery Proof Upload */}
          {selectedOrder?.orderStatus === "SHIPPED" &&
            selectedOrder?.assignmentStatus === "ACCEPTED" && (
              <div style={styles.card}>
                <h4 style={styles.cardTitle}>Delivery Proof</h4>

                {selectedOrder.deliveryProof?.imageUrl ? (
                  <div>
                    <img
                      src={`http://localhost:5000${selectedOrder.deliveryProof.imageUrl}`}
                      alt="Proof"
                      style={{ width: "200px", borderRadius: "8px" }}
                    />
                    <p style={{ color: "#2ecc71", marginTop: "0.5rem" }}>
                      ✅ Proof uploaded
                    </p>
                  </div>
                ) : (
                  <>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setProofFile(e.target.files[0])}
                    />
                    <button
                      onClick={handleUploadProof}
                      disabled={uploading}
                      style={{
                        marginTop: "1rem",
                        backgroundColor: "#3498db",
                        color: "#fff",
                        padding: "0.5rem 1rem",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer"
                      }}
                    >
                      {uploading ? "Uploading..." : "Upload Proof"}
                    </button>
                  </>
                )}
              </div>
            )}
          {/* Status Update */}
          {selectedOrder?.orderStatus === "SHIPPED" &&
            selectedOrder?.assignmentStatus === "PENDING" && (
              <div style={styles.card}>
                <h4 style={styles.cardTitle}>Assignment Response</h4>

                <div style={{ display: "flex", gap: "1rem" }}>
                  <button
                    onClick={() => handleRespondAssignment("ACCEPT")}
                    disabled={loading}
                    style={{
                      backgroundColor: "#2ecc71",
                      color: "#fff",
                      padding: "0.75rem 1.5rem",
                      border: "none",
                      borderRadius: "4px",
                      fontWeight: "bold",
                      cursor: "pointer"
                    }}
                  >
                    ✅ Accept
                  </button>

                  <button
                    onClick={() => handleRespondAssignment("REJECT")}
                    disabled={loading}
                    style={{
                      backgroundColor: "#e74c3c",
                      color: "#fff",
                      padding: "0.75rem 1.5rem",
                      border: "none",
                      borderRadius: "4px",
                      fontWeight: "bold",
                      cursor: "pointer"
                    }}
                  >
                    ❌ Reject
                  </button>
                </div>
              </div>
            )}
          {/* Status Update */}
          <div style={styles.card}>
            <h4 style={styles.cardTitle}>Update Order Status</h4>
            <div style={styles.statusUpdateForm}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Current Status:</label>
                <span style={{ ...styles.statusBadge, backgroundColor: getStatusBadgeColor(selectedOrder.orderStatus) }}>
                  {selectedOrder.orderStatus}
                </span>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>New Status:</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  style={styles.select}
                >
                  <option value="">Select Status</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
              <button
                onClick={handleUpdateStatus}
                disabled={
                  loading ||
                  (newStatus === "DELIVERED" && !selectedOrder.deliveryProof?.imageUrl)
                }
                style={styles.updateButton}
              >
                {loading ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div style={styles.ordersSection}>
          <h2 style={styles.title}>Assigned Orders</h2>

          {/* Filter */}
          <div style={styles.filterBar}>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              style={styles.filterSelect}
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="PROCESSING">Processing</option>
              <option value="SHIPPED">Shipped</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Orders List */}
          {loading && orders.length === 0 ? (
            <div style={styles.loadingText}>Loading orders...</div>
          ) : orders.length === 0 ? (
            <div style={styles.emptyState}>
              <p>No orders assigned yet</p>
            </div>
          ) : (
            <div style={styles.ordersList}>
              {orders.map((order) => (
                <div key={order._id} style={styles.orderCard}>
                  <div style={styles.orderCardHeader}>
                    <div style={styles.orderInfo}>
                      <h4 style={styles.orderNumber}>Order #{order.orderNumber}</h4>
                      <p style={styles.orderDate}>
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    {/* === STATUS BADGES (ORDER + ASSIGNMENT) === */}
                    <div style={{
                      display: 'flex',
                      gap: '8px',
                      flexWrap: 'wrap'
                    }}>
                      <span
                        style={{
                          ...styles.statusBadge,
                          backgroundColor: getStatusBadgeColor(order.orderStatus)
                        }}
                      >
                        {order.orderStatus}
                      </span>

                      {/* Assignment Status (THÊM MỚI) */}
                      {order.assignmentStatus && (
                        <span
                          style={{
                            ...styles.statusBadge,
                            backgroundColor: getAssignmentBadgeColor(order.assignmentStatus)
                          }}
                        >
                          {order.assignmentStatus}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={styles.orderCardContent}>
                    <p><strong>Customer:</strong> {order.user.firstName} {order.user.lastName}</p>
                    <p><strong>Phone:</strong> {order.user.phone}</p>
                    {order.shipper && (
                      <p><strong>Shipper:</strong> {order.shipper.firstName} {order.shipper.lastName} ({order.shipper.phone || 'N/A'})</p>
                    )}
                    <p><strong>Total:</strong> ₫{order.total.toLocaleString()}</p>
                    <p><strong>Items:</strong> {order.items.length} item(s)</p>
                  </div>

                  <button
                    onClick={() => handleViewOrder(order._id)}
                    style={styles.viewButton}
                    disabled={loading}
                  >
                    View & Update
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '2rem',
    maxWidth: '1200px',
    margin: '0 auto'
  },
  dashboardSection: {
    marginBottom: '2rem'
  },
  title: {
    color: '#2c3e50',
    marginBottom: '1.5rem',
    fontSize: '1.8rem'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
    marginBottom: '2rem'
  },
  statCard: {
    backgroundColor: '#fff',
    padding: '1.5rem',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    textAlign: 'center'
  },
  statNumber: {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    color: '#3498db',
    marginBottom: '0.5rem'
  },
  statLabel: {
    fontSize: '0.95rem',
    color: '#7f8c8d'
  },
  success: {
    backgroundColor: '#d4edda',
    color: '#155724',
    padding: '0.75rem',
    borderRadius: '4px',
    marginBottom: '1rem'
  },
  error: {
    backgroundColor: '#ffe6e6',
    color: '#e74c3c',
    padding: '0.75rem',
    borderRadius: '4px',
    marginBottom: '1rem'
  },
  detailsSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem'
  },
  detailsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem'
  },
  backButton: {
    backgroundColor: '#ecf0f1',
    color: '#2c3e50',
    padding: '0.75rem 1.5rem',
    border: '1px solid #dcdfe3',
    borderRadius: '4px',
    fontSize: '0.95rem',
    cursor: 'pointer'
  },
  card: {
    backgroundColor: '#fff',
    padding: '1.5rem',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  cardTitle: {
    color: '#2c3e50',
    marginBottom: '1rem',
    borderBottom: '2px solid #3498db',
    paddingBottom: '0.5rem'
  },
  orderItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem',
    borderBottom: '1px solid #ecf0f1',
    marginBottom: '0.5rem'
  },
  itemInfo: {
    flex: 1,
    marginRight: '1rem'
  },
  itemSubtotal: {
    fontWeight: 'bold',
    color: '#2c3e50'
  },
  customerInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  addressBox: {
    padding: '1rem',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px',
    marginBottom: '0.75rem',
    border: '1px solid #ddd'
  },
  noData: {
    color: '#7f8c8d',
    fontStyle: 'italic'
  },
  summary: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0.5rem 0',
    borderBottom: '1px solid #ecf0f1'
  },
  totalRow: {
    fontSize: '1.1rem',
    borderTop: '2px solid #2c3e50',
    borderBottom: 'none',
    paddingTop: '1rem',
    marginTop: '0.5rem'
  },
  statusUpdateForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  label: {
    fontWeight: 'bold',
    color: '#2c3e50',
    fontSize: '0.95rem'
  },
  statusBadge: {
    display: 'inline-block',
    color: '#fff',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    fontSize: '0.85rem',
    fontWeight: 'bold',
    width: 'fit-content'
  },
  select: {
    padding: '0.75rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '1rem'
  },
  updateButton: {
    backgroundColor: '#2ecc71',
    color: '#fff',
    padding: '0.75rem 1.5rem',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  ordersSection: {
    display: 'flex',
    flexDirection: 'column'
  },
  filterBar: {
    marginBottom: '1.5rem'
  },
  filterSelect: {
    padding: '0.75rem 1rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '1rem'
  },
  loadingText: {
    textAlign: 'center',
    padding: '2rem',
    color: '#7f8c8d'
  },
  emptyState: {
    textAlign: 'center',
    padding: '3rem',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px'
  },
  ordersList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '1.5rem'
  },
  orderCard: {
    backgroundColor: '#fff',
    padding: '1.5rem',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column'
  },
  orderCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap', // 👈 THÊM DÒNG NÀY
    gap: '8px',       // 👈 thêm cho đẹp
    marginBottom: '1rem',
    paddingBottom: '1rem',
    borderBottom: '1px solid #ecf0f1'
  },
  orderInfo: {
    flex: 1
  },
  orderNumber: {
    color: '#2c3e50',
    margin: 0,
    fontSize: '1.1rem'
  },
  orderDate: {
    color: '#7f8c8d',
    margin: '0.25rem 0 0 0',
    fontSize: '0.9rem'
  },
  orderCardContent: {
    flex: 1,
    marginBottom: '1rem'
  },
  viewButton: {
    backgroundColor: '#3498db',
    color: '#fff',
    padding: '0.75rem 1rem',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold'
  }
};

export default ShipperHomePage;
