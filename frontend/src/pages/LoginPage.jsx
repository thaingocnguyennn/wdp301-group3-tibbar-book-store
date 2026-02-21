import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import authApi from '../api/authApi';
import GoogleLoginButton from '../components/common/GoogleLoginButton';

const LoginPage = () => {
  // Login form states
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot password flow states
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState(1); // 1: email, 2: otp, 3: new password
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordOTP, setForgotPasswordOTP] = useState('');
  const [forgotPasswordNewPassword, setForgotPasswordNewPassword] = useState('');
  const [forgotPasswordConfirmPassword, setForgotPasswordConfirmPassword] = useState('');
  const [forgotPasswordError, setForgotPasswordError] = useState('');
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState('');
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [otpResendTimer, setOtpResendTimer] = useState(0);

  const { login, handleAuthResponse } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get the page user was trying to access, or default to home
  const from = location.state?.from || '/';

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(formData);
      // Redirect to the page user was trying to access, or home
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLoginSuccess = async (response) => {
    setError('');
    setLoading(true);

    try {
      handleAuthResponse(response);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Google login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLoginError = (errorMessage) => {
    setError(errorMessage || 'Google login failed');
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setForgotPasswordError('');
    setForgotPasswordSuccess('');
    setForgotPasswordLoading(true);

    try {
      await authApi.forgotPassword({ email: forgotPasswordEmail });
      setForgotPasswordSuccess('OTP has been sent to your email');
      setForgotPasswordStep(2);
      // Set resend timer to 60 seconds
      setOtpResendTimer(60);
      const timer = setInterval(() => {
        setOtpResendTimer(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setForgotPasswordError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setForgotPasswordError('');
    setForgotPasswordSuccess('');
    setForgotPasswordLoading(true);

    try {
      await authApi.verifyOTP({ 
        email: forgotPasswordEmail, 
        otp: forgotPasswordOTP 
      });
      setForgotPasswordSuccess('OTP verified successfully');
      setForgotPasswordOTP('');
      setForgotPasswordStep(3);
    } catch (err) {
      setForgotPasswordError(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setForgotPasswordError('');
    setForgotPasswordSuccess('');

    // Validate passwords match
    if (forgotPasswordNewPassword !== forgotPasswordConfirmPassword) {
      setForgotPasswordError('Passwords do not match');
      return;
    }

    // Validate password length
    if (forgotPasswordNewPassword.length < 6) {
      setForgotPasswordError('Password must be at least 6 characters');
      return;
    }

    setForgotPasswordLoading(true);

    try {
      await authApi.resetPassword({ 
        email: forgotPasswordEmail, 
        password: forgotPasswordNewPassword 
      });
      setForgotPasswordSuccess('Password has been reset successfully! Redirecting to login...');
      setTimeout(() => {
        setShowForgotPassword(false);
        setForgotPasswordStep(1);
        setForgotPasswordEmail('');
        setForgotPasswordNewPassword('');
        setForgotPasswordConfirmPassword('');
        setForgotPasswordSuccess('');
      }, 2000);
    } catch (err) {
      setForgotPasswordError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setForgotPasswordError('');
    setForgotPasswordLoading(true);

    try {
      await authApi.forgotPassword({ email: forgotPasswordEmail });
      setForgotPasswordSuccess('OTP has been resent to your email');
      setOtpResendTimer(60);
      const timer = setInterval(() => {
        setOtpResendTimer(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setForgotPasswordError(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {!showForgotPassword ? (
        <div style={styles.card}>
          <h2 style={styles.title}>Login to Bookstore</h2>

          {error && <div style={styles.error}>{error}</div>}

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                style={styles.input}
                placeholder="Enter your email"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                style={styles.input}
                placeholder="Enter your password"
              />
            </div>

            <button type="submit" disabled={loading} style={styles.button}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div style={styles.divider}>
            <div style={styles.dividerLine}></div>
            <span>OR</span>
            <div style={styles.dividerLine}></div>
          </div>

          <GoogleLoginButton
            onSuccess={handleGoogleLoginSuccess}
            onError={handleGoogleLoginError}
            loading={loading}
          />

          <p style={styles.footer}>
            Don't have an account? <Link to="/register" style={styles.link}>Register here</Link>
          </p>

          <p style={styles.footer}>
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              style={styles.forgotPasswordBtn}
            >
              Forgot password?
            </button>
          </p>
        </div>
      ) : (
        <div style={styles.card}>
          {forgotPasswordStep === 1 && (
            <>
              <h2 style={styles.title}>Reset Password</h2>

              {forgotPasswordError && <div style={styles.error}>{forgotPasswordError}</div>}
              {forgotPasswordSuccess && <div style={styles.success}>{forgotPasswordSuccess}</div>}

              <form onSubmit={handleForgotPasswordSubmit} style={styles.form}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Email Address</label>
                  <input
                    type="email"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    required
                    style={styles.input}
                    placeholder="Enter your email"
                  />
                </div>

                <button
                  type="submit"
                  disabled={forgotPasswordLoading}
                  style={styles.button}
                >
                  {forgotPasswordLoading ? 'Sending...' : 'Send OTP'}
                </button>
              </form>

              <p style={styles.footer}>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setForgotPasswordEmail('');
                    setForgotPasswordError('');
                    setForgotPasswordSuccess('');
                  }}
                  style={styles.backBtn}
                >
                  Back to Login
                </button>
              </p>
            </>
          )}

          {forgotPasswordStep === 2 && (
            <>
              <h2 style={styles.title}>Verify OTP</h2>

              {forgotPasswordError && <div style={styles.error}>{forgotPasswordError}</div>}
              {forgotPasswordSuccess && <div style={styles.success}>{forgotPasswordSuccess}</div>}

              <p style={styles.stepText}>
                We've sent a 6-digit OTP to {forgotPasswordEmail}
              </p>

              <form onSubmit={handleVerifyOTP} style={styles.form}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Enter OTP</label>
                  <input
                    type="text"
                    value={forgotPasswordOTP}
                    onChange={(e) => setForgotPasswordOTP(e.target.value.slice(0, 6))}
                    maxLength="6"
                    required
                    style={styles.inputOTP}
                    placeholder="000000"
                  />
                </div>

                <button
                  type="submit"
                  disabled={forgotPasswordLoading || forgotPasswordOTP.length !== 6}
                  style={styles.button}
                >
                  {forgotPasswordLoading ? 'Verifying...' : 'Verify OTP'}
                </button>
              </form>

              <p style={styles.footer}>
                {otpResendTimer > 0 ? (
                  <span>Resend OTP in {otpResendTimer}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={forgotPasswordLoading}
                    style={styles.backBtn}
                  >
                    Resend OTP
                  </button>
                )}
              </p>

              <p style={styles.footer}>
                <button
                  type="button"
                  onClick={() => {
                    setForgotPasswordStep(1);
                    setForgotPasswordOTP('');
                    setForgotPasswordError('');
                    setOtpResendTimer(0);
                  }}
                  style={styles.backBtn}
                >
                  Back
                </button>
              </p>
            </>
          )}

          {forgotPasswordStep === 3 && (
            <>
              <h2 style={styles.title}>Create New Password</h2>

              {forgotPasswordError && <div style={styles.error}>{forgotPasswordError}</div>}
              {forgotPasswordSuccess && <div style={styles.success}>{forgotPasswordSuccess}</div>}

              <form onSubmit={handleResetPassword} style={styles.form}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>New Password</label>
                  <input
                    type="password"
                    value={forgotPasswordNewPassword}
                    onChange={(e) => setForgotPasswordNewPassword(e.target.value)}
                    required
                    style={styles.input}
                    placeholder="Enter your new password"
                    disabled={forgotPasswordLoading}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Confirm Password</label>
                  <input
                    type="password"
                    value={forgotPasswordConfirmPassword}
                    onChange={(e) => setForgotPasswordConfirmPassword(e.target.value)}
                    required
                    style={styles.input}
                    placeholder="Confirm your new password"
                    disabled={forgotPasswordLoading}
                  />
                </div>

                <button type="submit" disabled={forgotPasswordLoading} style={styles.button}>
                  {forgotPasswordLoading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>

              <p style={styles.footer}>
                <button
                  type="button"
                  onClick={() => {
                    setForgotPasswordStep(2);
                    setForgotPasswordNewPassword('');
                    setForgotPasswordConfirmPassword('');
                    setForgotPasswordError('');
                  }}
                  style={styles.backBtn}
                >
                  Back
                </button>
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    minHeight: 'calc(100vh - 64px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ecf0f1',
    padding: '2rem'
  },
  card: {
    backgroundColor: '#fff',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '400px'
  },
  title: {
    textAlign: 'center',
    color: '#2c3e50',
    marginBottom: '2rem'
  },
  error: {
    backgroundColor: '#ffe6e6',
    color: '#e74c3c',
    padding: '0.75rem',
    borderRadius: '4px',
    marginBottom: '1rem',
    fontSize: '0.9rem'
  },
  success: {
    backgroundColor: '#e6ffe6',
    color: '#27ae60',
    padding: '0.75rem',
    borderRadius: '4px',
    marginBottom: '1rem',
    fontSize: '0.9rem'
  },
  form: {
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
  footer: {
    textAlign: 'center',
    marginTop: '1.5rem',
    color: '#7f8c8d',
    fontSize: '0.9rem'
  },
  link: {
    color: '#3498db',
    textDecoration: 'none',
    fontWeight: '500'
  },
  forgotPasswordBtn: {
    background: 'none',
    border: 'none',
    color: '#3498db',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '500',
    textDecoration: 'none',
    padding: 0
  },
  backBtn: {
    background: 'none',
    border: 'none',
    color: '#3498db',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '500',
    textDecoration: 'none',
    padding: 0
  },
  stepText: {
    textAlign: 'center',
    color: '#7f8c8d',
    fontSize: '0.9rem',
    marginBottom: '1.5rem'
  },
  inputOTP: {
    padding: '0.75rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '1.5rem',
    letterSpacing: '8px',
    textAlign: 'center',
    fontWeight: 'bold'
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    margin: '1.5rem 0',
    fontSize: '0.9rem',
    color: '#7f8c8d'
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    backgroundColor: '#ddd'
  }
};

export default LoginPage;