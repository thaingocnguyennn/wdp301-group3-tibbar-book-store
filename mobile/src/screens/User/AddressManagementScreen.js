import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Text,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { UserService } from '../../services/userService';
import { LoadingSpinner } from '../../components/Common/LoadingSpinner';
import { ErrorMessage } from '../../components/Common/ErrorMessage';
import { TextInputField } from '../../components/Common/TextInputField';
import { Button } from '../../components/Common/Button';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  addressCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    marginHorizontal: 12,
    marginBottom: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.soft,
  },
  addressText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  addressHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#e3f2fd',
  },
  deleteButton: {
    backgroundColor: '#ffebee',
  },
  editButtonText: {
    color: '#1a5490',
    fontWeight: '600',
    fontSize: 12,
  },
  deleteButtonText: {
    color: '#e53935',
    fontWeight: '600',
    fontSize: 12,
  },
  addButton: {
    marginHorizontal: 12,
    marginVertical: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    marginTop: 40,
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 16,
  },
});

function AddressModal({ visible, address, onClose, onSave, isLoading }) {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    description: '',
    commune: '',
    district: '',
    province: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (address) {
      setFormData({
        fullName: address.fullName || '',
        phone: address.phone || address.phoneNumber || '',
        description: address.description || address.street || '',
        commune: address.commune || address.ward || '',
        district: address.district || '',
        province: address.province || address.city || '',
      });
    } else {
      setFormData({
        fullName: '',
        phone: '',
        description: '',
        commune: '',
        district: '',
        province: '',
      });
    }
    setErrors({});
  }, [address, visible]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    else if (!/^\d{9,15}$/.test(formData.phone.trim())) {
      newErrors.phone = 'Phone must contain only digits (9-15)';
    }
    if (!formData.description.trim()) newErrors.description = 'Address is required';
    if (!formData.commune.trim()) newErrors.commune = 'Commune is required';
    if (!formData.district.trim()) newErrors.district = 'District is required';
    if (!formData.province.trim()) newErrors.province = 'Province is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave(formData);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} onRequestClose={onClose} transparent animationType="slide">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}
      >
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {address ? 'Edit Address' : 'Add New Address'}
            </Text>

            <TextInputField
              label="Full Name"
              placeholder="Enter your full name"
              value={formData.fullName}
              onChangeText={(text) => setFormData({ ...formData, fullName: text })}
              icon="person"
              error={errors.fullName}
            />

            <TextInputField
              label="Phone Number"
              placeholder="Enter your phone number"
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              keyboardType="phone-pad"
              icon="phone"
              error={errors.phone}
            />

            <TextInputField
              label="Detailed Address"
              placeholder="Enter address details"
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              icon="location-on"
              error={errors.description}
            />

            <TextInputField
              label="Commune"
              placeholder="Enter commune"
              value={formData.commune}
              onChangeText={(text) => setFormData({ ...formData, commune: text })}
              error={errors.commune}
            />

            <TextInputField
              label="District"
              placeholder="Enter district"
              value={formData.district}
              onChangeText={(text) => setFormData({ ...formData, district: text })}
              error={errors.district}
            />

            <TextInputField
              label="Province"
              placeholder="Enter province"
              value={formData.province}
              onChangeText={(text) => setFormData({ ...formData, province: text })}
              error={errors.province}
            />

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 20 }}>
              <Button
                title="Cancel"
                onPress={onClose}
                secondary
                style={{ flex: 1 }}
              />
              <Button
                title="Save"
                onPress={handleSave}
                loading={isLoading}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function AddressManagementScreen() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      setError(null);
      const result = await UserService.getAddresses();
      setAddresses(result || []);
    } catch (err) {
      setError(err?.message || 'Failed to load addresses');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAddress = () => {
    setSelectedAddress(null);
    setModalVisible(true);
  };

  const handleEditAddress = (address) => {
    setSelectedAddress(address);
    setModalVisible(true);
  };

  const handleSaveAddress = async (formData) => {
    setIsSaving(true);
    try {
      if (selectedAddress) {
        await UserService.updateAddress(selectedAddress._id, formData);
        setAddresses(
          addresses.map((addr) =>
            addr._id === selectedAddress._id ? { ...addr, ...formData } : addr
          )
        );
      } else {
        const result = await UserService.addAddress(formData);
        setAddresses([...addresses, result]);
      }
      setModalVisible(false);
      Alert.alert('Success', selectedAddress ? 'Address updated' : 'Address added');
    } catch (err) {
      Alert.alert('Error', err?.message || 'Failed to save address');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAddress = (addressId) => {
    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this address?',
      [
        { text: 'Cancel' },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              await UserService.deleteAddress(addressId);
              setAddresses(addresses.filter((addr) => addr._id !== addressId));
              Alert.alert('Success', 'Address deleted');
            } catch (err) {
              Alert.alert('Error', err?.message || 'Failed to delete address');
            }
          },
        },
      ]
    );
  };

  if (loading) return <LoadingSpinner />;
  if (error && !addresses.length) return <ErrorMessage message={error} />;

  return (
    <View style={styles.container}>
      <FlatList
        data={addresses}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ paddingVertical: 12 }}
        ListEmptyComponent={<Text style={styles.emptyText}>No addresses yet</Text>}
        renderItem={({ item }) => (
          <View style={styles.addressCard}>
            <Text style={styles.addressHeader}>{item.fullName}</Text>
            <Text style={styles.addressText}>{item.phoneNumber || item.phone}</Text>
            <Text style={styles.addressText}>{item.description || item.street}</Text>
            <Text style={styles.addressText}>
              {item.commune || item.ward}, {item.district}, {item.province || item.city}
            </Text>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.editButton]}
                onPress={() => handleEditAddress(item)}
              >
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => handleDeleteAddress(item._id)}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <Button
        title="Add New Address"
        onPress={handleAddAddress}
        style={styles.addButton}
      />

      <AddressModal
        visible={modalVisible}
        address={selectedAddress}
        onClose={() => setModalVisible(false)}
        onSave={handleSaveAddress}
        isLoading={isSaving}
      />
    </View>
  );
}

