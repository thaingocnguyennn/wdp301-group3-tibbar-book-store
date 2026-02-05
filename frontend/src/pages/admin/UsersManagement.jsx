import { useState, useEffect } from 'react';
import { adminUserApi } from '../../api/userApi';
import { useAuth } from '../../hooks/useAuth';

const UsersManagement = () => {
  const { user: currentUser, updateUserRole } = useAuth();
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

  const roles = ['customer', 'admin', 'manager'];

  // Debounce search inputs
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 500);

    return () => clearTimeout(timer);
  }, [filters]);

  useEffect(() => {
    fetchUsers();
  }, [debouncedFilters]);

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
      alert('Please select a role');
      return;
    }

    try {
      await adminUserApi.updateUserRole(userId, newRole);
      alert('User role updated successfully');
      
      // If updating current user's role, update AuthContext
      if (currentUser && userId === currentUser._id) {
        updateUserRole(newRole);
      }
      
      setEditingUser(null);
      setNewRole('');
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update role');
    }
  };

  const handleToggleStatus = async (userId) => {
    // Prevent locking own account
    if (currentUser && userId === currentUser._id) {
      alert('You cannot lock your own account');
      return;
    }

    try {
      await adminUserApi.toggleUserStatus(userId);
      alert('User status updated successfully');
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
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

  if (loading) return <div style={styles.container}><p>Loading users...</p></div>;

  return (
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
                          ✗
                        </button>
                      </div>
                    </div>
                  ) : (
                    <span style={styles.roleDisplay}>
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
  roleDisplay: {
    fontWeight: '500',
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
};

export default UsersManagement;
