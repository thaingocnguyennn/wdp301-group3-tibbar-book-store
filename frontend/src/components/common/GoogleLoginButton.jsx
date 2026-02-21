import { GoogleLogin } from '@react-oauth/google';
import authApi from '../../api/authApi';

const GoogleLoginButton = ({ onSuccess, onError, loading }) => {
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      if (!credentialResponse.credential) {
        throw new Error('No credential received from Google');
      }

      // Send the ID token directly to backend - don't decode it on frontend
      const response = await authApi.googleLogin({
        token: credentialResponse.credential
      });

      // Call parent component's success callback with the response
      if (onSuccess) {
        onSuccess(response);
      }
    } catch (error) {
      console.error('Google login error:', error);
      if (onError) {
        onError(error.response?.data?.message || 'Google login failed');
      }
    }
  };

  const handleGoogleError = () => {
    if (onError) {
      onError('Google login was unsuccessful. Please try again.');
    }
  };

  return (
    <div style={styles.googleLoginContainer}>
      <GoogleLogin
        onSuccess={handleGoogleSuccess}
        onError={handleGoogleError}
        width={300}
        text="signin_with"
        theme="outline"
      />
    </div>
  );
};

const styles = {
  googleLoginContainer: {
    display: 'flex',
    justifyContent: 'center',
    margin: '1rem 0'
  }
};

export default GoogleLoginButton;
