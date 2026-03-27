import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { LoadingSpinner } from '../../components/Common/LoadingSpinner';
import { ErrorMessage } from '../../components/Common/ErrorMessage';
import { Button } from '../../components/Common/Button';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: 16,
  },
  profileCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.soft,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.primaryDark,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  menuItem: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.soft,
  },
  menuIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuText: {
    fontSize: 14,
    color: theme.colors.textPrimary,
    fontWeight: '500',
    flex: 1,
  },
  logoutButton: {
    backgroundColor: '#f8d7da',
    borderWidth: 1,
    borderColor: '#f5c6cb',
  },
  logoutText: {
    color: '#721c24',
  },
});

export default function UserProfileScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (user) {
      setProfile(user);
      setLoading(false);
    }
  }, [user]);

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Logout',
          onPress: async () => {
            setLoggingOut(true);
            try {
              await logout();
            } catch (err) {
              Alert.alert('Error', 'Failed to logout');
            } finally {
              setLoggingOut(false);
            }
          },
        },
      ]
    );
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  const displayName = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ').trim();
  const initials = (displayName || profile?.email || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  const handleViewOrderHistory = () => {
    navigation.getParent()?.navigate('OrderTab', {
      screen: 'OrderHistory',
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.profileName}>{displayName || 'User'}</Text>
        <Text style={styles.profileEmail}>{profile?.email}</Text>
      </View>

      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => navigation.navigate('EditProfile')}
      >
        <Icon name="edit" size={20} color={theme.colors.primary} style={styles.menuIcon} />
        <Text style={styles.menuText}>Edit Profile</Text>
        <Icon name="chevron-right" size={20} color={theme.colors.textSecondary} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => navigation.navigate('ChangePassword')}
      >
        <Icon name="lock" size={20} color={theme.colors.primary} style={styles.menuIcon} />
        <Text style={styles.menuText}>Change Password</Text>
        <Icon name="chevron-right" size={20} color={theme.colors.textSecondary} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => navigation.navigate('AddressManagement')}
      >
        <Icon name="location-on" size={20} color={theme.colors.primary} style={styles.menuIcon} />
        <Text style={styles.menuText}>Manage Addresses</Text>
        <Icon name="chevron-right" size={20} color={theme.colors.textSecondary} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.menuItem}
        onPress={handleViewOrderHistory}
      >
        <Icon name="receipt-long" size={20} color={theme.colors.primary} style={styles.menuIcon} />
        <Text style={styles.menuText}>View Order History</Text>
        <Icon name="chevron-right" size={20} color={theme.colors.textSecondary} />
      </TouchableOpacity>

      <Button
        title="Logout"
        onPress={handleLogout}
        loading={loggingOut}
        secondary
        style={{ marginTop: 20, ...styles.logoutButton }}
      />
    </ScrollView>
  );
}

