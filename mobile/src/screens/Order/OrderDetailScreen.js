import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  Alert,
  Image,
} from 'react-native';
import { OrderService } from '../../services/orderService';
import { LoadingSpinner } from '../../components/Common/LoadingSpinner';
import { ErrorMessage } from '../../components/Common/ErrorMessage';
import { Button } from '../../components/Common/Button';
import { theme } from '../../constants/theme';
import { formatCurrencyVND, resolveImageUrl } from '../../utils/ui';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  section: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: 12,
    marginVertical: 8,
    borderRadius: theme.radius.md,
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
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginRight: 8,
    backgroundColor: '#d4edda',
  },
  statusText: {
    color: '#155724',
    fontWeight: '600',
    fontSize: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  value: {
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  itemCard: {
    flexDirection: 'row',
    marginBottom: 12,
    padding: 12,
    backgroundColor: theme.colors.surfaceSoft,
    borderRadius: theme.radius.sm,
    gap: 12,
  },
  itemImage: {
    width: 60,
    height: 80,
    borderRadius: 4,
  },
  itemDetails: {
    flex: 1,
    justifyContent: 'space-between',
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  itemPrice: {
    fontSize: 12,
    color: theme.colors.primaryDark,
    fontWeight: '600',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  addressText: {
    fontSize: 14,
    color: theme.colors.textPrimary,
    lineHeight: 20,
    marginBottom: 4,
  },
});

export default function OrderDetailScreen({ route, navigation }) {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    try {
      setError(null);
      const result = await OrderService.getOrderById(orderId);
      setOrder(result);
    } catch (err) {
      setError(err?.message || 'Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order?',
      [
        {
          text: 'No',
          onPress: () => {},
        },
        {
          text: 'Yes, Cancel',
          onPress: async () => {
            setCancelling(true);
            try {
              await OrderService.cancelOrder(orderId);
              Alert.alert('Success', 'Order cancelled');
              navigation.goBack();
            } catch (err) {
              Alert.alert('Error', err?.message || 'Failed to cancel order');
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  if (loading) return <LoadingSpinner />;
  if (error || !order) return <ErrorMessage message={error || 'Order not found'} />;

  const isCancellable = order.status?.toLowerCase() === 'pending';

  return (
    <ScrollView style={styles.container}>
      {/* Status Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Status</Text>
        <View style={styles.statusRow}>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{order.status}</Text>
          </View>
          <Text style={{ color: '#666' }}>
            {new Date(order.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>

      {/* Order Items */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Items</Text>
        {(order.items || []).map((item, index) => {
          const stableKey = item._id || item.bookId?._id || `order-item-${index}`;

          return (
            <View key={stableKey} style={styles.itemCard}>
              <Image
                source={{
                  uri:
                    resolveImageUrl(item.bookId?.imageUrl || item.bookId?.thumbnail) ||
                    'https://via.placeholder.com/60',
                }}
                style={styles.itemImage}
              />
              <View style={styles.itemDetails}>
                <View>
                  <Text style={styles.itemTitle}>{item.bookId?.title}</Text>
                  <Text style={styles.itemPrice}>
                    {formatCurrencyVND(item.bookId?.price || 0)} x {item.quantity}
                  </Text>
                </View>
              </View>
              <Text style={[styles.itemPrice, { color: theme.colors.primaryDark }]}> 
                {formatCurrencyVND((item.bookId?.price || 0) * item.quantity)}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Delivery Address */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Delivery Address</Text>
        <Text style={styles.addressText}>
          {order.addressId?.fullName} ({order.addressId?.phoneNumber || order.addressId?.phone})
        </Text>
        <Text style={styles.addressText}>
          {order.addressId?.description || order.addressId?.street}
        </Text>
        <Text style={styles.addressText}>
          {order.addressId?.commune || order.addressId?.ward}, {order.addressId?.district}, {order.addressId?.province || order.addressId?.city}
        </Text>
      </View>

      {/* Order Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Summary</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.label}>Subtotal:</Text>
          <Text style={styles.value}>{formatCurrencyVND(order.subtotal || 0)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.label}>Shipping:</Text>
          <Text style={styles.value}>{formatCurrencyVND(order.shippingFee || 0)}</Text>
        </View>
        {order.discount > 0 && (
          <View style={styles.summaryRow}>
            <Text style={styles.label}>Discount:</Text>
            <Text style={{ ...styles.value, color: theme.colors.success }}>
              -{formatCurrencyVND(order.discount)}
            </Text>
          </View>
        )}
        <View style={styles.summaryRow}>
          <Text style={{ ...styles.label, fontWeight: 'bold' }}>Total:</Text>
          <Text style={{ ...styles.value, color: theme.colors.primaryDark, fontSize: 16 }}>
            {formatCurrencyVND(order.totalAmount || 0)}
          </Text>
        </View>
      </View>

      {isCancellable && (
        <Button
          title="Cancel Order"
          onPress={handleCancelOrder}
          loading={cancelling}
          secondary
          style={{ margin: 12 }}
        />
      )}
    </ScrollView>
  );
}

