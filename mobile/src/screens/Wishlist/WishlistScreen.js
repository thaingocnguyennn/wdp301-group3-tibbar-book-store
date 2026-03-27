import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Text,
  RefreshControl,
} from 'react-native';
import { WishlistService } from '../../services/wishlistService';
import { LoadingSpinner } from '../../components/Common/LoadingSpinner';
import { ErrorMessage } from '../../components/Common/ErrorMessage';
import { BookCard } from '../../components/Common/BookCard';
import { theme } from '../../constants/theme';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  listContent: {
    paddingTop: 10,
    paddingBottom: 20,
    paddingHorizontal: 10,
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

export default function WishlistScreen({ navigation }) {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadWishlist();
  }, []);

  const loadWishlist = async () => {
    try {
      setError(null);
      const result = await WishlistService.getWishlist();
      setWishlistItems(result || []);
    } catch (err) {
      setError(err?.message || 'Failed to load wishlist');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWishlist();
    setRefreshing(false);
  };

  const handleRemoveFromWishlist = async (bookId) => {
    try {
      await WishlistService.removeFromWishlist(bookId);
      setWishlistItems(
        wishlistItems.filter((item) => {
          const itemBookId = item.bookId?._id || item.bookId || item._id;
          return itemBookId !== bookId;
        }),
      );
    } catch (err) {
      console.error('Error removing from wishlist:', err);
    }
  };

  if (loading && !refreshing) return <LoadingSpinner />;
  if (error && !refreshing) return <ErrorMessage message={error} />;

  if (wishlistItems.length === 0) {
    return (
      <View style={[styles.container, styles.emptyContainer]}>
        <Text style={styles.emptyText}>Your wishlist is empty</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={wishlistItems}
      keyExtractor={(item) => item._id || item.bookId?._id}
      numColumns={2}
      style={styles.container}
      contentContainerStyle={styles.listContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      renderItem={({ item }) => (
        <View style={{ width: '50%', paddingHorizontal: 4 }}>
          <BookCard
            book={item.bookId || item}
            onPress={() => navigation.navigate('BookDetail', { bookId: item.bookId?._id || item._id })}
            onWishlistPress={() => handleRemoveFromWishlist(item.bookId?._id || item._id)}
            isWishlisted={true}
          />
        </View>
      )}
    />
  );
}
