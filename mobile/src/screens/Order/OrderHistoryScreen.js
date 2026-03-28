import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Text,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { OrderService } from '../../services/orderService';
import { LoadingSpinner } from '../../components/Common/LoadingSpinner';
import { ErrorMessage } from '../../components/Common/ErrorMessage';
import { theme } from '../../constants/theme';
import { formatCurrencyVND } from '../../utils/ui';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  orderCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    marginHorizontal: 12,
    marginBottom: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.soft,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  status: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 12,
    fontWeight: '600',
  },
  statusPending: {
    backgroundColor: '#fff3cd',
    color: '#856404',
  },
  statusDelivered: {
    backgroundColor: '#d4edda',
    color: '#155724',
  },
  statusCancelled: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
  },
  orderDate: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primaryDark,
  },
  viewButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: theme.colors.surfaceSoft,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
  },
  viewButtonText: {
    color: theme.colors.primary,
    fontWeight: '600',
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
});

function getStatusStyle(status) {
  switch (status?.toLowerCase()) {
    case 'delivered':
      return styles.statusDelivered;
    case 'cancelled':
      return styles.statusCancelled;
    default:
      return styles.statusPending;
  }
}

export default function OrderHistoryScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadOrders();
    }, []),
  );

  const loadOrders = async () => {
    try {
      setError(null);
      const result = await OrderService.getOrders();
      setOrders(result || []);
    } catch (err) {
      setError(err?.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  if (loading && !refreshing) return <LoadingSpinner />;
  if (error && !refreshing) return <ErrorMessage message={error} />;

  if (orders.length === 0) {
    return (
      <View style={[styles.container, styles.emptyContainer]}>
        <Text style={styles.emptyText}>No orders yet</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={orders}
      keyExtractor={(item) => item._id}
      contentContainerStyle={{ paddingVertical: 12 }}
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      renderItem={({ item }) => (
        <View style={styles.orderCard}>
          <View style={styles.orderHeader}>
            <Text style={styles.orderId}>Order #{item._id.slice(-8).toUpperCase()}</Text>
            <Text style={[styles.status, getStatusStyle(item.status)]}>
              {item.status}
            </Text>
          </View>
          <Text style={styles.orderDate}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
          <Text style={styles.totalAmount}>
            {formatCurrencyVND(item.totalAmount || 0)}
          </Text>
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => navigation.navigate('OrderDetail', { orderId: item._id })}
          >
            <Text style={styles.viewButtonText}>View Details</Text>
          </TouchableOpacity>
        </View>
      )}
    />
  );
}

