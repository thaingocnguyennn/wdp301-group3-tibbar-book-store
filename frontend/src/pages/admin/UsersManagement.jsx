import { useState, useEffect, useRef } from 'react';
import { adminUserApi } from '../../api/userApi';
import { useAuth } from '../../hooks/useAuth';

const UsersManagement = () => {
  const { user: currentUser, updateUserRole } = useAuth();
  const noticeTimerRef = useRef(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    role: 'all',
    status: 'all',
    search: ''
  });
  const [debouncedFilters, setDebouncedFilters] = useState(filters);
  const [editingUser, setEditingUser] = useState(null);
  const [newRole, setNewRole] = useState('');
  const [notice, setNotice] = useState(null);

  const roles = ['customer', 'shipper', 'admin', 'manager'];

  const roleBadgeColor = {
    customer: { backgroundColor: '#d1ecf1', color: '#0c5460' },
    shipper: { backgroundColor: '#d4edda', color: '#155724' },
    admin: { backgroundColor: '#f8d7da', color: '#721c24' },
    manager: { backgroundColor: '#fff3cd', color: '#856404' },
    guest: { backgroundColor: '#e2e3e5', color: '#383d41' },
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 500);

    return () => clearTimeout(timer);
  }, [filters]);

  useEffect(() => {
    fetchUsers();
  }, [debouncedFilters]);

  useEffect(() => () => {
    if (noticeTimerRef.current) {
      window.clearTimeout(noticeTimerRef.current);
    }
  }, []);

  const dismissNotice = () => {
    if (noticeTimerRef.current) {
      window.clearTimeout(noticeTimerRef.current);
      noticeTimerRef.current = null;
    }
    setNotice(null);
  };

  const showNotice = ({ tone = 'info', title, message, autoCloseMs = 0 }) => {
    if (noticeTimerRef.current) {
      window.clearTimeout(noticeTimerRef.current);
      noticeTimerRef.current = null;
    }

    setNotice({ tone, title, message });

    if (autoCloseMs > 0) {
      noticeTimerRef.current = window.setTimeout(() => {
        setNotice(null);
        noticeTimerRef.current = null;
      }, autoCloseMs);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await adminUserApi.getAllUsers(debouncedFilters);
      setUsers(response.data.users);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleUpdate = async (userId) => {
    if (!newRole) {
      showNotice({
        tone: 'warning',
        title: 'Role Required',
        message: 'Please select a role before saving the change.'
      });
      return;
    }

    try {
      await adminUserApi.updateUserRole(userId, newRole);
      showNotice({
        tone: 'success',
        title: 'Role Updated',
        message: 'The user role has been updated successfully.',
        autoCloseMs: 2400
      });

      if (currentUser && userId === currentUser._id) {
        updateUserRole(newRole);
      }

      setEditingUser(null);
      setNewRole('');
      fetchUsers();
    } catch (err) {
      showNotice({
        tone: 'error',
        title: 'Unable to Update Role',
        message: err.response?.data?.message || 'Failed to update role'
      });
    }
  };

  const handleToggleStatus = async (userId) => {
    if (currentUser && userId === currentUser._id) {
      showNotice({
        tone: 'warning',
        title: 'Action Not Allowed',
        message: 'You cannot lock your own account.'
      });
      return;
    }

    try {
      await adminUserApi.toggleUserStatus(userId);
      showNotice({
        tone: 'success',
        title: 'Status Updated',
        message: 'The user status has been updated successfully.',
        autoCloseMs: 2400
      });
      fetchUsers();
    } catch (err) {
      showNotice({
        tone: 'error',
        title: 'Unable to Update Status',
        message: err.response?.data?.message || 'Failed to update status'
      });
    }
  };

  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value
    }));
  };

  const startEditRole = (user) => {
    setEditingUser(user._id);
    setNewRole(user.role);
  };

  const cancelEditRole = () => {
    setEditingUser(null);
    setNewRole('');
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <p>Loading users...</p>
      </div>
    );
  }

  return (
    <>
      {notice && (
        <div style={styles.noticeOverlay} onClick={dismissNotice}>
          <div
            style={{
              ...styles.noticeCard,
              ...(notice.tone === 'success'
                ? styles.noticeCardSuccess
                : notice.tone === 'error'
                  ? styles.noticeCardError
                  : styles.noticeCardWarning),
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div
              style={{
                ...styles.noticeIcon,
                ...(notice.tone === 'success'
                  ? styles.noticeIconSuccess
                  : notice.tone === 'error'
                    ? styles.noticeIconError
                    : styles.noticeIconWarning),
              }}
            >
              {notice.tone === 'success'
                ? '✓'
                : notice.tone === 'error'
                  ? '!'
                  : 'i'}
            </div>
            <h3 style={styles.noticeTitle}>{notice.title}</h3>
            <p style={styles.noticeMessage}>{notice.message}</p>
            <button
              type="button"
              style={{
                ...styles.noticePrimaryButton,
                ...(notice.tone === 'error' ? styles.noticePrimaryButtonError : {}),
              }}
              onClick={dismissNotice}
            >
              OK
            </button>
          </div>
        </div>
      )}

      <div style={styles.container}>
        <h1 style={styles.title}>Users Management</h1>

        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.filters}>
          <div style={styles.filterGroup}>
            <label style={styles.label}>Search by Email, Name:</label>
            <input
              type="text"
              style={styles.searchInput}
              placeholder="Search by email or name..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>

          <div style={styles.filterGroup}>
            <label style={styles.label}>Filter by Role:</label>
            <select
              style={styles.select}
              value={filters.role}
              onChange={(e) => handleFilterChange('role', e.target.value)}
            >
              <option value="all">All Roles</option>
              <option value="customer">Customer</option>
              <option value="shipper">Shipper</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
            </select>
          </div>

          <div style={styles.filterGroup}>
            <label style={styles.label}>Filter by Status:</label>
            <select
              style={styles.select}
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="locked">Locked</option>
            </select>
          </div>
        </div>

        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Role</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Coin Balance</th>
                <th style={styles.th}>Total Coins Used</th>
                <th style={styles.th}>Created At</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id} style={styles.tr}>
                  <td style={styles.td}>{user.email}</td>
                  <td style={styles.td}>
                    {user.firstName || user.lastName
                      ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                      : 'N/A'}
                  </td>
                  <td style={styles.td}>
                    {editingUser === user._id ? (
                      <div style={styles.roleEditContainer}>
                        <select
                          style={styles.roleSelect}
                          value={newRole}
                          onChange={(e) => setNewRole(e.target.value)}
                        >
                          {roles.map((role) => (
                            <option key={role} value={role}>
                              {role.charAt(0).toUpperCase() + role.slice(1)}
                            </option>
                          ))}
                        </select>
                        <div style={styles.roleEditButtons}>
                          <button
                            style={{ ...styles.btn, ...styles.btnSave }}
                            onClick={() => handleRoleUpdate(user._id)}
                          >
                            ✓
                          </button>
                          <button
                            style={{ ...styles.btn, ...styles.btnCancel }}
                            onClick={cancelEditRole}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ) : (
                      <span
                        style={{
                          ...styles.roleBadge,
                          ...(roleBadgeColor[user.role] || roleBadgeColor.guest),
                        }}
                      >
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    )}
                  </td>
                  <td style={styles.td}>
                    <span
                      style={{
                        ...styles.statusBadge,
                        ...(user.isActive ? styles.statusActive : styles.statusLocked),
                      }}
                    >
                      {user.isActive ? 'Active' : 'Locked'}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.coinBalanceBadge}>
                      {Number(user.coinBalance || 0).toLocaleString('vi-VN')}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.coinUsedBadge}>
                      {Number(user.totalCoinsUsed || 0).toLocaleString('vi-VN')}
                    </span>
                  </td>
                  <td style={styles.td}>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td style={styles.td}>
                    <div style={styles.actionButtons}>
                      {editingUser !== user._id && (
                        <button
                          style={{ ...styles.btn, ...styles.btnEdit }}
                          onClick={() => startEditRole(user)}
                        >
                          Change Role
                        </button>
                      )}
                      <button
                        style={{
                          ...styles.btn,
                          ...(user.isActive ? styles.btnLock : styles.btnUnlock),
                          ...(currentUser && user._id === currentUser._id ? styles.btnDisabled : {})
                        }}
                        onClick={() => handleToggleStatus(user._id)}
                        disabled={currentUser && user._id === currentUser._id}
                        title={currentUser && user._id === currentUser._id ? 'Cannot lock your own account' : ''}
                      >
                        {user.isActive ? 'Lock' : 'Unlock'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {users.length === 0 && (
            <div style={styles.emptyState}>
              <p>No users found with the selected filters.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

const styles = {
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '2rem',
  },
  title: {
    fontSize: '2rem',
    color: '#2c3e50',
    marginBottom: '2rem',
  },
  error: {
    backgroundColor: '#fee',
    color: '#c33',
    padding: '1rem',
    borderRadius: '4px',
    marginBottom: '1rem',
  },
  filters: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '2rem',
    flexWrap: 'wrap',
  },
  filterGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  label: {
    fontWeight: '600',
    color: '#2c3e50',
  },
  select: {
    padding: '0.5rem 1rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '1rem',
    cursor: 'pointer',
  },
  searchInput: {
    padding: '0.5rem 1rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '1rem',
    minWidth: '200px',
  },
  tableContainer: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    overflow: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    backgroundColor: '#34495e',
    color: '#fff',
    padding: '1rem',
    textAlign: 'left',
    fontWeight: '600',
  },
  tr: {
    borderBottom: '1px solid #ecf0f1',
  },
  td: {
    padding: '1rem',
    color: '#2c3e50',
  },
  roleEditContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  roleSelect: {
    padding: '0.25rem 0.5rem',
    border: '1px solid #3498db',
    borderRadius: '4px',
    fontSize: '0.9rem',
  },
  roleEditButtons: {
    display: 'flex',
    gap: '0.25rem',
  },
  roleBadge: {
    display: 'inline-block',
    padding: '0.25rem 0.75rem',
    borderRadius: '12px',
    fontSize: '0.85rem',
    fontWeight: '600',
  },
  statusBadge: {
    padding: '0.25rem 0.75rem',
    borderRadius: '12px',
    fontSize: '0.85rem',
    fontWeight: '600',
  },
  statusActive: {
    backgroundColor: '#d4edda',
    color: '#155724',
  },
  statusLocked: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
  },
  coinBalanceBadge: {
    display: 'inline-block',
    padding: '0.25rem 0.75rem',
    borderRadius: '12px',
    fontSize: '0.85rem',
    fontWeight: '600',
    backgroundColor: '#fff8e1',
    color: '#b45309',
  },
  coinUsedBadge: {
    display: 'inline-block',
    padding: '0.25rem 0.75rem',
    borderRadius: '12px',
    fontSize: '0.85rem',
    fontWeight: '600',
    backgroundColor: '#fef3c7',
    color: '#92400e',
  },
  actionButtons: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },
  btn: {
    padding: '0.5rem 1rem',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '500',
    transition: 'all 0.2s',
  },
  btnEdit: {
    backgroundColor: '#3498db',
    color: '#fff',
  },
  btnLock: {
    backgroundColor: '#e74c3c',
    color: '#fff',
  },
  btnUnlock: {
    backgroundColor: '#27ae60',
    color: '#fff',
  },
  btnSave: {
    backgroundColor: '#27ae60',
    color: '#fff',
    padding: '0.25rem 0.5rem',
    fontSize: '0.8rem',
  },
  btnCancel: {
    backgroundColor: '#95a5a6',
    color: '#fff',
    padding: '0.25rem 0.5rem',
    fontSize: '0.8rem',
  },
  btnDisabled: {
    backgroundColor: '#bdc3c7',
    cursor: 'not-allowed',
    opacity: 0.6,
  },
  emptyState: {
    padding: '3rem',
    textAlign: 'center',
    color: '#7f8c8d',
  },
  noticeOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.32)',
    backdropFilter: 'blur(6px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1200,
    padding: '1rem',
  },
  noticeCard: {
    width: '100%',
    maxWidth: '420px',
    backgroundColor: '#ffffff',
    borderRadius: '18px',
    padding: '1.5rem',
    boxShadow: '0 24px 60px rgba(15, 23, 42, 0.18)',
    border: '1px solid rgba(148, 163, 184, 0.18)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '0.85rem',
  },
  noticeCardSuccess: {
    background: 'linear-gradient(180deg, rgba(248, 250, 255, 1) 0%, rgba(255, 255, 255, 1) 100%)',
  },
  noticeCardError: {
    background: 'linear-gradient(180deg, rgba(255, 247, 247, 1) 0%, rgba(255, 255, 255, 1) 100%)',
  },
  noticeCardWarning: {
    background: 'linear-gradient(180deg, rgba(255, 251, 235, 1) 0%, rgba(255, 255, 255, 1) 100%)',
  },
  noticeIcon: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.4rem',
    fontWeight: '700',
  },
  noticeIconSuccess: {
    background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
    color: '#fff',
    boxShadow: '0 10px 24px rgba(34, 197, 94, 0.28)',
  },
  noticeIconError: {
    background: 'linear-gradient(135deg, #f87171 0%, #dc2626 100%)',
    color: '#fff',
    boxShadow: '0 10px 24px rgba(239, 68, 68, 0.28)',
  },
  noticeIconWarning: {
    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    color: '#fff',
    boxShadow: '0 10px 24px rgba(245, 158, 11, 0.28)',
  },
  noticeTitle: {
    margin: 0,
    fontSize: '1.15rem',
    fontWeight: '700',
    color: '#1e293b',
  },
  noticeMessage: {
    margin: 0,
    fontSize: '0.95rem',
    lineHeight: '1.6',
    color: '#475569',
  },
  noticePrimaryButton: {
    border: 'none',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    borderRadius: '999px',
    padding: '0.7rem 1.4rem',
    fontSize: '0.9rem',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 10px 22px rgba(102, 126, 234, 0.24)',
  },
  noticePrimaryButtonError: {
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    boxShadow: '0 10px 22px rgba(239, 68, 68, 0.2)',
  },
};

export default UsersManagement;
