import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthService } from '../services/authService';
import { Storage } from '../utils/storage';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSignout, setIsSignout] = useState(false);

  useEffect(() => {
    bootstrapAsync();
  }, []);

  const bootstrapAsync = async () => {
    try {
      const token = await Storage.getAuthToken();
      const userData = await Storage.getUserData();
      
      if (token && userData) {
        setUser(userData);
      }
    } catch (error) {
      console.error('Bootstrap error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const authContext = {
    user,
    isLoading,
    isSignout,
    
    register: async (registerInput, emailArg, passwordArg, phoneNumberArg) => {
      try {
        let firstName = '';
        let lastName = '';
        let email = '';
        let password = '';
        let phone = '';

        if (registerInput && typeof registerInput === 'object') {
          firstName = (registerInput.firstName || '').trim();
          lastName = (registerInput.lastName || '').trim();
          email = (registerInput.email || '').trim();
          password = registerInput.password || '';
          phone = (registerInput.phone || registerInput.phoneNumber || '').trim();
        } else {
          const fullName = (registerInput || '').trim();
          const nameParts = fullName.split(/\s+/).filter(Boolean);
          firstName = nameParts[0] || '';
          lastName = nameParts.slice(1).join(' ');
          email = (emailArg || '').trim();
          password = passwordArg || '';
          phone = (phoneNumberArg || '').trim();
        }

        const response = await AuthService.register({
          firstName,
          lastName,
          email,
          password,
          phone,
        });
        setUser(response.user);
        setIsSignout(false);
        return response;
      } catch (error) {
        throw error;
      }
    },

    login: async (email, password) => {
      try {
        const response = await AuthService.login(email, password);
        setUser(response.user);
        setIsSignout(false);
        return response;
      } catch (error) {
        throw error;
      }
    },

    logout: async () => {
      try {
        await AuthService.logout();
        setUser(null);
        setIsSignout(true);
      } catch (error) {
        console.error('Logout error:', error);
        setUser(null);
        setIsSignout(true);
      }
    },

    updateUser: (userData) => {
      setUser(userData);
      Storage.setUserData(userData);
    },
  };

  return (
    <AuthContext.Provider value={authContext}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
