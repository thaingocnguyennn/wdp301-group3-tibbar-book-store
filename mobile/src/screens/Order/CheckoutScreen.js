import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { UserService } from '../../services/userService';
import { OrderService } from '../../services/orderService';
import { CartService } from '../../services/cartService';
import { LoadingSpinner } from '../../components/Common/LoadingSpinner';
import { ErrorMessage } from '../../components/Common/ErrorMessage';
import { Button } from '../../components/Common/Button';
import { TextInputField } from '../../components/Common/TextInputField';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { formatCurrencyVND } from '../../utils/ui';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    marginBottom: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.soft,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 12,
  },
  addressItem: {
    backgroundColor: theme.colors.surfaceSoft,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 6,
    padding: 12,
    marginBottom: 8,
  },
  addressText: {
    fontSize: 14,
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  selectButton: {
    marginTop: 8,
  },
  voucherContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  voucherInput: {
    flex: 1,
  },
  applyButton: {
    width: 100,
  },
  summaryContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.soft,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 8,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primaryDark,
  },
  selectButtonStyle: {
    backgroundColor: theme.colors.surfaceSoft,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  selectButtonTextStyle: {
    color: theme.colors.primary,
  },
});

export default function CheckoutScreen({ route, navigation }) {
  const { subtotal = 0 } = route.params || {};
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherDiscount, setVoucherDiscount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingOrder, setProcessingOrder] = useState(false);

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      setError(null);
      const result = await UserService.getAddresses();
      setAddresses(result || []);
      if (result?.length > 0) {
        setSelectedAddress(result[0]._id);
      }
    } catch (err) {
      setError(err?.message || 'Failed to load addresses');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) return;

    try {
      const result = await OrderService.validateVoucher(voucherCode);
      setVoucherDiscount(result?.totals?.discount || result?.discountAmount || 0);
      Alert.alert('Success', 'Voucher applied');
    } catch (err) {
      Alert.alert('Error', err?.message || 'Invalid voucher code');
      setVoucherDiscount(0);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      Alert.alert('Error', 'Please select a delivery address');
      return;
    }

    setProcessingOrder(true);
    try {
      const orderData = {
        shippingAddressId: selectedAddress,
        paymentMethod: 'COD',
        voucherCode: voucherCode || undefined,
      };

      await OrderService.createOrder(orderData);
      await CartService.clearCart();
      
      Alert.alert('Success', 'Order placed successfully');
      navigation.navigate('OrderHistory');
    } catch (err) {
      Alert.alert('Error', err?.message || 'Failed to place order');
    } finally {
      setProcessingOrder(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error && !addresses.length) return <ErrorMessage message={error} />;

  const shippingFee = subtotal > 200000 ? 0 : 30000;
  const finalTotal = subtotal + shippingFee - voucherDiscount;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Delivery Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          {addresses.map((address) => (
            <TouchableOpacity
              key={address._id}
              style={styles.addressItem}
              onPress={() => setSelectedAddress(address._id)}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 8,
                }}
              >
                <Icon
                  name={selectedAddress === address._id ? 'radio-button-checked' : 'radio-button-unchecked'}
                  size={20}
                  color={theme.colors.primary}
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.addressText}>
                  {address.fullName} ({address.phoneNumber || address.phone})
                </Text>
              </View>
              <Text style={styles.addressText}>
                {address.description || address.street}, {address.commune || address.ward}, {address.district}, {address.province || address.city}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Voucher */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Apply Voucher (Optional)</Text>
          <View style={styles.voucherContainer}>
            <TextInputField
              placeholder="Enter voucher code"
              value={voucherCode}
              onChangeText={setVoucherCode}
              style={styles.voucherInput}
            />
            <Button
              title="Apply"
              onPress={handleApplyVoucher}
              style={styles.applyButton}
            />
          </View>
          {voucherDiscount > 0 && (
            <Text style={{ color: theme.colors.success, fontSize: 14 }}>
              Discount: -{formatCurrencyVND(voucherDiscount)}
            </Text>
          )}
        </View>

        {/* Order Summary */}
        <View style={styles.summaryContainer}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal:</Text>
            <Text style={styles.summaryValue}>{formatCurrencyVND(subtotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Shipping:</Text>
            <Text style={styles.summaryValue}>
              {shippingFee === 0 ? 'Free' : formatCurrencyVND(shippingFee)}
            </Text>
          </View>
          {voucherDiscount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Discount:</Text>
              <Text style={{ ...styles.summaryValue, color: theme.colors.success }}>
                -{formatCurrencyVND(voucherDiscount)}
              </Text>
            </View>
          )}
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalValue}>{formatCurrencyVND(finalTotal)}</Text>
          </View>
        </View>
      </ScrollView>

      <Button
        title="Place Order"
        onPress={handlePlaceOrder}
        loading={processingOrder}
        style={{ margin: 16 }}
      />
    </KeyboardAvoidingView>
  );
}

