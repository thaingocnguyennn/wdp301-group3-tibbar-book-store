import { useState, useEffect } from 'react';
import { addressApi } from '../api/addressApi';
import { useNavigate } from 'react-router-dom';

const AddressPage = () => {
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    province: '',
    district: '',
    commune: '',
    description: '',
    isDefault: false
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const response = await addressApi.getAddresses();
      setAddresses(response.data || []);
    } catch (err) {
      setError('Failed to load addresses');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      phone: '',
      province: '',
      district: '',
      commune: '',
      description: '',
      isDefault: false
    });
    setEditingAddress(null);
    setIsFormOpen(false);
    setMessage('');
    setError('');
  };

  const handleAddClick = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const handleEditClick = (address) => {
    setEditingAddress(address);
    setFormData({
      fullName: address.fullName,
      phone: address.phone,
      province: address.province,
      district: address.district,
      commune: address.commune,
      description: address.description,
      isDefault: address.isDefault
    });
    setIsFormOpen(true);
    setMessage('');
    setError('');
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    try {
      if (editingAddress) {
        await addressApi.updateAddress(editingAddress._id, formData);
        setMessage('Address updated successfully');
      } else {
        await addressApi.addAddress(formData);
        setMessage('Address added successfully');
      }
      await fetchAddresses();
      setTimeout(() => {
        resetForm();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save address');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (addressId) => {
    if (!window.confirm('Are you sure you want to delete this address?')) {
      return;
    }

    setLoading(true);
    try {
      await addressApi.deleteAddress(addressId);
      setMessage('Address deleted successfully');
      await fetchAddresses();
      setTimeout(() => setMessage(''), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete address');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (addressId) => {
    setLoading(true);
    try {
      await addressApi.setDefaultAddress(addressId);
      setMessage('Default address set successfully');
      await fetchAddresses();
      setTimeout(() => setMessage(''), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to set default address');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>My Addresses</h2>
        <div style={styles.headerActions}>
          <button style={styles.backButton} onClick={() => navigate('/profile')}>
            ← Back to Profile
          </button>
          {!isFormOpen && (
            <button style={styles.addButton} onClick={handleAddClick}>
              + Add New Address
            </button>
          )}
        </div>
      </div>

      {message && <div style={styles.success}>{message}</div>}
      {error && <div style={styles.error}>{error}</div>}

      {isFormOpen ? (
        <div style={styles.formCard}>
          <h3 style={styles.formTitle}>
            {editingAddress ? 'Edit Address' : 'Add New Address'}
          </h3>
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.row}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Full Name *</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Phone *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  style={styles.input}
                  required
                />
              </div>
            </div>

            <div style={styles.row}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Province/City *</label>
                <input
                  type="text"
                  name="province"
                  value={formData.province}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="e.g., Hồ Chí Minh, Hà Nội"
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>District *</label>
                <input
                  type="text"
                  name="district"
                  value={formData.district}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="e.g., Quận 1, Quận Bình Thạnh"
                  required
                />
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Commune/Ward *</label>
              <input
                type="text"
                name="commune"
                value={formData.commune}
                onChange={handleChange}
                style={styles.input}
                placeholder="e.g., Phường Bến Nghé, Phường 1"
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Detailed Address *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                style={styles.textarea}
                placeholder="e.g., Số 12, hẻm 45, gần chợ..."
                rows="3"
                required
              />
            </div>

            <div style={styles.checkboxGroup}>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="isDefault"
                  checked={formData.isDefault}
                  onChange={handleChange}
                  style={styles.checkbox}
                />
                <span>Set as default address</span>
              </label>
            </div>

            <div style={styles.buttonRow}>
              <button type="submit" disabled={loading} style={styles.saveButton}>
                {loading ? 'Saving...' : editingAddress ? 'Update Address' : 'Add Address'}
              </button>
              <button
                type="button"
                disabled={loading}
                style={styles.cancelButton}
                onClick={resetForm}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div style={styles.addressList}>
          {loading && addresses.length === 0 ? (
            <div style={styles.loadingText}>Loading addresses...</div>
          ) : addresses.length === 0 ? (
            <div style={styles.emptyState}>
              <p>You haven't added any addresses yet.</p>
              <button style={styles.addButton} onClick={handleAddClick}>
                Add Your First Address
              </button>
            </div>
          ) : (
            addresses.map((address) => (
              <div
                key={address._id}
                style={{
                  ...styles.addressCard,
                  ...(address.isDefault ? styles.defaultCard : {})
                }}
              >
                {address.isDefault && (
                  <div style={styles.defaultBadge}>Default</div>
                )}
                <div style={styles.addressContent}>
                  <div style={styles.addressHeader}>
                    <h4 style={styles.addressName}>{address.fullName}</h4>
                    <span style={styles.addressPhone}>{address.phone}</span>
                  </div>
                  <div style={styles.addressDetails}>
                    <p>{address.description}</p>
                    <p>{address.commune}, {address.district}</p>
                    <p>{address.province}</p>
                  </div>
                </div>
                <div style={styles.addressActions}>
                  <button
                    style={styles.editButton}
                    onClick={() => handleEditClick(address)}
                    disabled={loading}
                  >
                    Edit
                  </button>
                  {!address.isDefault && (
                    <button
                      style={styles.defaultButton}
                      onClick={() => handleSetDefault(address._id)}
                      disabled={loading}
                    >
                      Set as Default
                    </button>
                  )}
                  <button
                    style={styles.deleteButton}
                    onClick={() => handleDelete(address._id)}
                    disabled={loading}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '2rem'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
    flexWrap: 'wrap',
    gap: '1rem'
  },
  title: {
    color: '#2c3e50',
    margin: 0
  },
  headerActions: {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'center'
  },
  backButton: {
    backgroundColor: '#ecf0f1',
    color: '#2c3e50',
    padding: '0.75rem 1.5rem',
    border: '1px solid #dcdfe3',
    borderRadius: '4px',
    fontSize: '1rem',
    fontWeight: '500',
    cursor: 'pointer'
  },
  addButton: {
    backgroundColor: '#3498db',
    color: '#fff',
    padding: '0.75rem 1.5rem',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    fontWeight: '500',
    cursor: 'pointer'
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
  formCard: {
    backgroundColor: '#fff',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
  },
  formTitle: {
    color: '#2c3e50',
    marginBottom: '1.5rem'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  label: {
    fontSize: '0.9rem',
    fontWeight: '500',
    color: '#34495e'
  },
  input: {
    padding: '0.75rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '1rem'
  },
  textarea: {
    padding: '0.75rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '1rem',
    resize: 'vertical',
    fontFamily: 'inherit'
  },
  checkboxGroup: {
    marginTop: '0.5rem'
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.95rem',
    color: '#34495e',
    cursor: 'pointer'
  },
  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer'
  },
  buttonRow: {
    display: 'flex',
    gap: '0.75rem',
    marginTop: '1rem'
  },
  saveButton: {
    backgroundColor: '#3498db',
    color: '#fff',
    padding: '0.75rem 1.5rem',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    fontWeight: '500',
    cursor: 'pointer'
  },
  cancelButton: {
    backgroundColor: '#ecf0f1',
    color: '#2c3e50',
    padding: '0.75rem 1.5rem',
    border: '1px solid #dcdfe3',
    borderRadius: '4px',
    fontSize: '1rem',
    fontWeight: '500',
    cursor: 'pointer'
  },
  addressList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  loadingText: {
    textAlign: 'center',
    padding: '2rem',
    color: '#7f8c8d',
    fontSize: '1.1rem'
  },
  emptyState: {
    textAlign: 'center',
    padding: '3rem',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px'
  },
  addressCard: {
    backgroundColor: '#fff',
    padding: '1.5rem',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
    border: '2px solid transparent',
    position: 'relative'
  },
  defaultCard: {
    borderColor: '#3498db',
    backgroundColor: '#f0f8ff'
  },
  defaultBadge: {
    position: 'absolute',
    top: '1rem',
    right: '1rem',
    backgroundColor: '#3498db',
    color: '#fff',
    padding: '0.25rem 0.75rem',
    borderRadius: '12px',
    fontSize: '0.8rem',
    fontWeight: '600'
  },
  addressContent: {
    marginBottom: '1rem'
  },
  addressHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.75rem',
    flexWrap: 'wrap',
    gap: '0.5rem'
  },
  addressName: {
    margin: 0,
    color: '#2c3e50',
    fontSize: '1.1rem'
  },
  addressPhone: {
    color: '#7f8c8d',
    fontSize: '0.95rem'
  },
  addressDetails: {
    color: '#34495e',
    fontSize: '0.95rem',
    lineHeight: '1.6'
  },
  addressActions: {
    display: 'flex',
    gap: '0.75rem',
    flexWrap: 'wrap'
  },
  editButton: {
    backgroundColor: '#3498db',
    color: '#fff',
    padding: '0.5rem 1rem',
    border: 'none',
    borderRadius: '4px',
    fontSize: '0.9rem',
    cursor: 'pointer'
  },
  defaultButton: {
    backgroundColor: '#2ecc71',
    color: '#fff',
    padding: '0.5rem 1rem',
    border: 'none',
    borderRadius: '4px',
    fontSize: '0.9rem',
    cursor: 'pointer'
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
    color: '#fff',
    padding: '0.5rem 1rem',
    border: 'none',
    borderRadius: '4px',
    fontSize: '0.9rem',
    cursor: 'pointer'
  }
};

export default AddressPage;
