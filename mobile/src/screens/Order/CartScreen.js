import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { CartService } from '../../services/cartService';
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
  scrollContent: {
    padding: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  cartItem: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    marginBottom: 12,
    padding: 12,
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.soft,
  },
  image: {
    width: 80,
    height: 100,
    borderRadius: theme.radius.sm,
    backgroundColor: '#e2e8f0',
  },
  itemDetails: {
    flex: 1,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  price: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.primaryDark,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantityButton: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: theme.colors.surfaceSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantity: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryContainer: {
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
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
    color: theme.colors.textPrimary,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primaryDark,
  },
  freeShippingText: {
    color: theme.colors.success,
    fontWeight: '700',
  },
});

export default function CartScreen({ navigation }) {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadCart();
    }, []),
  );

  const loadCart = async () => {
    try {
      setError(null);
      const result = await CartService.getCart();
      setCart(result?.items || []);
    } catch (err) {
      setError(err?.message || 'Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (cartId, newQuantity) => {
    if (newQuantity < 1) {
      handleRemoveItem(cartId);
      return;
    }

    try {
      await CartService.updateCartItem(cartId, newQuantity);
      setCart(
        cart.map((item) =>
          item._id === cartId ? { ...item, quantity: newQuantity } : item,
        ),
      );
    } catch {
      Alert.alert('Error', 'Failed to update quantity');
    }
  };

  const handleRemoveItem = async (cartId) => {
    try {
      await CartService.removeFromCart(cartId);
      setCart(cart.filter((item) => item._id !== cartId));
    } catch {
      Alert.alert('Error', 'Failed to remove item');
    }
  };

  const subtotal = cart.reduce(
    (sum, item) => sum + (item.bookId?.price || 0) * item.quantity,
    0,
  );
  const shippingFee = subtotal > 200000 ? 0 : 30000;
  const total = subtotal + shippingFee;

  if (loading) return <LoadingSpinner />;
  if (error && !cart.length) return <ErrorMessage message={error} />;

  if (cart.length === 0) {
    return (
      <View style={[styles.container, styles.emptyContainer]}>
        <Text style={styles.emptyText}>Your cart is empty</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {cart.map((item) => (
          <View key={item._id} style={styles.cartItem}>
            <Image
              source={{
                uri:
                  resolveImageUrl(item.bookId?.imageUrl || item.bookId?.thumbnail) ||
                  'https://via.placeholder.com/80',
              }}
              style={styles.image}
            />
            <View style={styles.itemDetails}>
              <Text style={styles.title}>{item.bookId?.title}</Text>
              <Text style={styles.price}>{formatCurrencyVND(item.bookId?.price || 0)}</Text>
              <View style={styles.quantityContainer}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => handleUpdateQuantity(item._id, item.quantity - 1)}
                >
                  <Icon name="remove" size={16} color={theme.colors.primaryDark} />
                </TouchableOpacity>
                <Text style={styles.quantity}>{item.quantity}</Text>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => handleUpdateQuantity(item._id, item.quantity + 1)}
                >
                  <Icon name="add" size={16} color={theme.colors.primaryDark} />
                </TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => handleRemoveItem(item._id)}
            >
              <Icon name="close" size={16} color={theme.colors.danger} />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <View style={styles.summaryContainer}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal:</Text>
          <Text style={styles.summaryValue}>{formatCurrencyVND(subtotal)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Shipping:</Text>
          <Text style={styles.summaryValue}>
            {shippingFee === 0 ? (
              <Text style={styles.freeShippingText}>Free</Text>
            ) : (
              formatCurrencyVND(shippingFee)
            )}
          </Text>
        </View>
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalValue}>{formatCurrencyVND(total)}</Text>
        </View>
        <Button
          title="Proceed to Checkout"
          onPress={() => navigation.navigate('Checkout', { total, subtotal })}
          style={{ marginTop: 12 }}
        />
      </View>
    </View>
  );
}

