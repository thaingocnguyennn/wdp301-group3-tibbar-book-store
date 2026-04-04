import { useState, useEffect } from 'react';
import { userApi } from '../api/userApi';
import { coinApi } from '../api/coinApi';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const ProfilePage = () => {
  const { user: authUser } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [profileUser, setProfileUser] = useState(null);

  // Coin system states
  //khởi tạo trạng thái cho hệ thống coin, lịch sử giao dịch, trạng thái check-in và thông báo check-in
  const [coinStatus, setCoinStatus] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [checkInMessage, setCheckInMessage] = useState('');
  const [showTransactions, setShowTransactions] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchCoinStatus(); //hàm để lấy trạng thái coin của người dùng khi trang được tải
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await userApi.getProfile();
      const user = response.data.user;
      setProfileUser(user);
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || ''
      });
    } catch (err) {
      setError('Failed to load profile');
    }
  };

  // hàm để lấy trạng thái coin của người dùng
  const fetchCoinStatus = async () => {
    try {
      // gọi API để lấy trạng thái coin của người dùng
      const response = await coinApi.getCoinStatus();
      // cập nhật trạng thái coin vào state
      setCoinStatus(response.data);
    } catch (err) {
      console.error('Failed to load coin status:', err);
    }
  };

  // hàm để lấy lịch sử giao dịch coin của người dùng
  const fetchTransactionHistory = async () => {
    try {
      // gọi API để lấy lịch sử giao dịch coin của người dùng (ví dụ: trang 1, 10 giao dịch mỗi trang)
      const response = await coinApi.getTransactionHistory(1, 10);
      // cập nhật lịch sử giao dịch vào state
      setTransactions(response.data.transactions);
    } catch (err) {
      console.error('Failed to load transaction history:', err);
    }
  };

  // hàm để xử lý khi người dùng thực hiện check-in hàng ngày để nhận coin
  const handleCheckIn = async () => {
    setCheckInLoading(true);
    setCheckInMessage('');
    try {
      // gọi API để thực hiện check-in và nhận coin
      const response = await coinApi.checkIn();
      // cập nhật thông báo check-in thành công cùng với số coin thưởng nhận được
      setCheckInMessage(`🎉 ${response.message} You received ${response.data.reward} coins!`);
      // sau khi check-in thành công, cập nhật lại trạng thái coin và lịch sử giao dịch để hiển thị thông tin mới nhất
      await fetchCoinStatus();
      // tùy chọn: tự động hiển thị lịch sử giao dịch sau khi check-in thành công
      await fetchTransactionHistory();
      setTimeout(() => setCheckInMessage(''), 3000);
    } catch (err) {
      setCheckInMessage(err.response?.data?.message || 'Check-in failed');
    } finally {
      setCheckInLoading(false);
    }
  };

  // hàm để xử lý khi người dùng nhấn nút xem/ẩn lịch sử giao dịch coin
  const toggleTransactions = async () => {
    // nếu lịch sử giao dịch chưa được tải, gọi API để lấy dữ liệu trước khi hiển thị
    if (!showTransactions) {
      await fetchTransactionHistory();
    }
    setShowTransactions(!showTransactions);
  };

  // hàm để xử lý khi người dùng thay đổi thông tin trong form chỉnh sửa profile
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // hàm để xử lý khi người dùng submit form chỉnh sửa profile
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    try {
      // gọi API để cập nhật thông tin profile của người dùng với dữ liệu từ form
      await userApi.updateProfile(formData);
      await fetchProfile();
      setMessage('Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  // hàm để xử lý khi người dùng nhấn nút chỉnh sửa profile, đặt lại thông báo và lỗi, và chuyển sang chế độ chỉnh sửa
  const handleEditClick = () => {
    setMessage('');
    setError('');
    setIsEditing(true);
  };

  // hàm để xử lý khi người dùng nhấn nút hủy chỉnh sửa, đặt lại dữ liệu form về giá trị hiện tại của profile, đặt lại thông báo và lỗi, và thoát chế độ chỉnh sửa
  const handleCancel = () => {
    if (profileUser) {
      setFormData({
        firstName: profileUser.firstName || '',
        lastName: profileUser.lastName || '',
        phone: profileUser.phone || ''
      });
    }
    setMessage('');
    setError('');
    setIsEditing(false);
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({
      ...passwordData,
      [name]: value
    });
  };

  const handleChangePasswordClick = () => {
    setPasswordMessage('');
    setPasswordError('');
    setIsChangingPassword(true);
  };

  const handlePasswordCancel = () => {
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setPasswordMessage('');
    setPasswordError('');
    setIsChangingPassword(false);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordMessage('');
    setPasswordError('');

    // Validation
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError('All password fields are required');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New password and confirm password do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }

    setPasswordLoading(true);

    try {
      await userApi.changePassword(passwordData.currentPassword, passwordData.newPassword);
      setPasswordMessage('Password changed successfully');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setTimeout(() => {
        setIsChangingPassword(false);
        setPasswordMessage('');
      }, 2000);
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>{isChangingPassword ? 'Change Password' : 'My Profile'}</h2>

        {!isChangingPassword && (
          <div style={styles.infoSection}>
            <p><strong>Email:</strong> {authUser?.email}</p>
            <p><strong>Role:</strong> {authUser?.role}</p>
          </div>
        )}

        {/* Coin Reward Section */}
        {!isChangingPassword && coinStatus && (
          <div style={styles.coinSection}>
            <div style={styles.coinHeader}>
              <div>
                <h3 style={styles.coinTitle}>💰 My Coins</h3>
                <p style={styles.coinBalance}>{coinStatus.coinBalance.toLocaleString()} coins</p>
                <p style={styles.coinStreak}>Current Streak: {coinStatus.currentStreak} day(s)</p>
              </div>
              <button 
                onClick={handleCheckIn} 
                disabled={!coinStatus.canCheckInToday || checkInLoading}
                style={{
                  ...styles.checkInButton,
                  ...((!coinStatus.canCheckInToday || checkInLoading) && styles.checkInButtonDisabled)
                }}
              >
                {checkInLoading ? 'Checking in...' : coinStatus.canCheckInToday ? '✓ Check In' : '✓ Checked In'}
              </button>
            </div>
            {checkInMessage && (
              <div style={styles.checkInMessage}>{checkInMessage}</div>
            )}
            <button 
              onClick={toggleTransactions}
              style={styles.transactionToggle}
            >
              {showTransactions ? 'Hide Transaction History' : 'View Transaction History'}
            </button>
            {showTransactions && (
              <div style={styles.transactionList}>
                {transactions.length === 0 ? (
                  <p style={styles.noTransactions}>No transactions yet</p>
                ) : (
                  transactions.map((tx, index) => (
                    <div key={index} style={styles.transactionItem}>
                      <div>
                        <p style={styles.transactionDesc}>{tx.description}</p>
                        <p style={styles.transactionDate}>{new Date(tx.createdAt).toLocaleString()}</p>
                      </div>
                      <p style={{
                        ...styles.transactionAmount,
                        color: tx.amount > 0 ? '#27ae60' : '#e74c3c'
                      }}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Profile Messages */}
        {!isChangingPassword && message && <div style={styles.success}>{message}</div>}
        {!isChangingPassword && error && <div style={styles.error}>{error}</div>}

        {/* Password Messages */}
        {isChangingPassword && passwordMessage && <div style={styles.success}>{passwordMessage}</div>}
        {isChangingPassword && passwordError && <div style={styles.error}>{passwordError}</div>}

        {/* Show Change Password Form */}
        {isChangingPassword ? (
          <form onSubmit={handlePasswordSubmit} style={styles.form}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Current Password</label>
              <input
                type="password"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                style={styles.input}
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>New Password</label>
              <input
                type="password"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                style={styles.input}
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Confirm New Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                style={styles.input}
                required
              />
            </div>

            <div style={styles.buttonRow}>
              <button type="submit" disabled={passwordLoading} style={styles.button}>
                {passwordLoading ? 'Changing...' : 'Change Password'}
              </button>
              <button type="button" disabled={passwordLoading} style={styles.secondaryButton} onClick={handlePasswordCancel}>
                Cancel
              </button>
            </div>
          </form>
        ) : !isEditing ? (
          /* Show Profile Details */
          <div style={styles.detailsSection}>
            <div style={styles.detailGroup}>
              <div style={styles.detailItem}><strong>First Name:</strong> {profileUser?.firstName || '-'}</div>
              <div style={styles.detailItem}><strong>Last Name:</strong> {profileUser?.lastName || '-'}</div>
              <div style={styles.detailItem}><strong>Phone:</strong> {profileUser?.phone || '-'}</div>
            </div>
            <div style={styles.buttonRow}>
              <button type="button" style={styles.button} onClick={handleEditClick}>
                Edit Profile
              </button>
              <button type="button" style={styles.secondaryButton} onClick={handleChangePasswordClick}>
                Change Password
              </button>
              <button type="button" style={styles.addressButton} onClick={() => navigate('/address')}>
                Address
              </button>
            </div>
          </div>
        ) : (
          /* Show Edit Profile Form */
          <form onSubmit={handleSubmit} style={styles.form}>
            <h3 style={styles.sectionTitle}>Personal Information</h3>

            <div style={styles.row}>
              <div style={styles.formGroup}>
                <label style={styles.label}>First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                style={styles.input}
              />
            </div>

            <div style={styles.buttonRow}>
              <button type="submit" disabled={loading} style={styles.button}>
                {loading ? 'Updating...' : 'Update Profile'}
              </button>
              <button type="button" disabled={loading} style={styles.secondaryButton} onClick={handleCancel}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '2rem'
  },
  card: {
    backgroundColor: '#fff',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
  },
  title: {
    color: '#2c3e50',
    marginBottom: '1.5rem'
  },
  infoSection: {
    backgroundColor: '#f8f9fa',
    padding: '1rem',
    borderRadius: '4px',
    marginBottom: '1.5rem'
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
    gap: '1rem'
  },
  detailGroup: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.75rem'
  },
  detailItem: {
    fontSize: '0.95rem',
    color: '#2c3e50'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  sectionTitle: {
    fontSize: '1.2rem',
    color: '#34495e',
    marginTop: '1rem',
    marginBottom: '0.5rem'
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
  button: {
    backgroundColor: '#3498db',
    color: '#fff',
    padding: '0.75rem',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    fontWeight: '500',
    cursor: 'pointer',
    marginTop: '1rem'
  },
  buttonRow: {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  secondaryButton: {
    backgroundColor: '#ecf0f1',
    color: '#2c3e50',
    padding: '0.75rem',
    border: '1px solid #dcdfe3',
    borderRadius: '4px',
    fontSize: '1rem',
    fontWeight: '500',
    cursor: 'pointer',
    marginTop: '1rem'
  },
  addressButton: {
    backgroundColor: '#9b59b6',
    color: '#fff',
    padding: '0.75rem',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    fontWeight: '500',
    cursor: 'pointer',
    marginTop: '1rem'
  },
  coinSection: {
    backgroundColor: '#fff9e6',
    border: '2px solid #f39c12',
    padding: '1.5rem',
    borderRadius: '8px',
    marginBottom: '1.5rem'
  },
  coinHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem'
  },
  coinTitle: {
    fontSize: '1.3rem',
    color: '#f39c12',
    margin: '0 0 0.5rem 0'
  },
  coinBalance: {
    fontSize: '1.8rem',
    fontWeight: 'bold',
    color: '#e67e22',
    margin: '0.25rem 0'
  },
  coinStreak: {
    fontSize: '0.9rem',
    color: '#7f8c8d',
    margin: '0.25rem 0'
  },
  checkInButton: {
    backgroundColor: '#27ae60',
    color: '#fff',
    padding: '0.75rem 1.5rem',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.3s'
  },
  checkInButtonDisabled: {
    backgroundColor: '#95a5a6',
    cursor: 'not-allowed',
    opacity: 0.6
  },
  checkInMessage: {
    backgroundColor: '#d4edda',
    color: '#155724',
    padding: '0.75rem',
    borderRadius: '4px',
    marginTop: '1rem',
    fontWeight: '500'
  },
  transactionToggle: {
    backgroundColor: '#3498db',
    color: '#fff',
    padding: '0.5rem 1rem',
    border: 'none',
    borderRadius: '4px',
    fontSize: '0.9rem',
    fontWeight: '500',
    cursor: 'pointer',
    marginTop: '1rem'
  },
  transactionList: {
    marginTop: '1rem',
    maxHeight: '300px',
    overflowY: 'auto',
    border: '1px solid #ddd',
    borderRadius: '4px',
    padding: '0.5rem'
  },
  transactionItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem',
    borderBottom: '1px solid #ecf0f1',
    backgroundColor: '#fff'
  },
  transactionDesc: {
    fontSize: '0.95rem',
    color: '#2c3e50',
    margin: '0 0 0.25rem 0',
    fontWeight: '500'
  },
  transactionDate: {
    fontSize: '0.8rem',
    color: '#95a5a6',
    margin: 0
  },
  transactionAmount: {
    fontSize: '1.1rem',
    fontWeight: 'bold',
    margin: 0
  },
  noTransactions: {
    textAlign: 'center',
    color: '#7f8c8d',
    padding: '1rem'
  }
};

export default ProfilePage;