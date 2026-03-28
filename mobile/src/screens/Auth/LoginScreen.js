import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Text,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { TextInputField } from '../../components/Common/TextInputField';
import { Button } from '../../components/Common/Button';
import { theme } from '../../constants/theme';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.card,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    marginBottom: 20,
    fontSize: 13,
  },
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 18,
  },
  linkText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  linkButton: {
    fontSize: 13,
    color: theme.colors.primary,
    fontWeight: '700',
    marginLeft: 4,
  },
});

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!email) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await login(email, password);
    } catch (error) {
      Alert.alert('Login Error', error?.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Login to continue shopping on Tibbar</Text>

          <TextInputField
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            icon="email"
            error={errors.email}
          />

          <TextInputField
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            icon="lock"
            error={errors.password}
          />

          <Button
            title="Login"
            onPress={handleLogin}
            loading={loading}
            style={{ marginTop: 12 }}
          />

          <View style={styles.linkContainer}>
            <Text style={styles.linkText}>Don't have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.linkButton}>Register</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
