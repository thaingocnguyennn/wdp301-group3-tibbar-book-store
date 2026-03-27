import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  Text,
  Alert,
  FlatList,
} from 'react-native';
import { BookService } from '../../services/bookService';
import { CartService } from '../../services/cartService';
import { ReviewService } from '../../services/newsService';
import { LoadingSpinner } from '../../components/Common/LoadingSpinner';
import { ErrorMessage } from '../../components/Common/ErrorMessage';
import { Button } from '../../components/Common/Button';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { formatCurrencyVND, resolveImageUrl } from '../../utils/ui';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  image: {
    width: '100%',
    height: 320,
    backgroundColor: '#e2e8f0',
  },
  content: {
    padding: 16,
    backgroundColor: theme.colors.surface,
    marginTop: -14,
    borderTopLeftRadius: theme.radius.lg,
    borderTopRightRadius: theme.radius.lg,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  author: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 12,
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  price: {
    fontSize: 26,
    fontWeight: 'bold',
    color: theme.colors.primaryDark,
    marginRight: 16,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    marginLeft: 8,
    color: theme.colors.textSecondary,
  },
  description: {
    fontSize: 14,
    color: theme.colors.textPrimary,
    lineHeight: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
    padding: 16,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  reviewCard: {
    backgroundColor: theme.colors.surfaceSoft,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 12,
    borderRadius: theme.radius.md,
    marginBottom: 8,
  },
  reviewAuthor: {
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  reviewRating: {
    color: '#ff9800',
    marginVertical: 4,
  },
  reviewText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
});

export default function BookDetailScreen({ route, navigation }) {
  const { bookId } = route.params;
  const [book, setBook] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    loadBook();
  }, [bookId]);

  const loadBook = async () => {
    try {
      setError(null);
      const [bookRes, reviewsRes] = await Promise.all([
        BookService.getBookById(bookId),
        ReviewService.getReviewsByBook(bookId),
      ]);

      const loadedBook = bookRes;
      setBook(loadedBook);
      setReviews(reviewsRes || []);
    } catch (err) {
      setError(err?.message || 'Failed to load book');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    try {
      await CartService.addToCart(bookId, quantity);
      Alert.alert('Success', 'Book added to cart');
    } catch (err) {
      Alert.alert('Error', err?.message || 'Failed to add to cart');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error || !book) return <ErrorMessage message={error || 'Book not found'} />;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Image
          source={{
            uri:
              resolveImageUrl(book.imageUrl || book.thumbnail) ||
              'https://via.placeholder.com/300',
          }}
          style={styles.image}
        />

        <View style={styles.content}>
          <Text style={styles.title}>{book.title}</Text>
          <Text style={styles.author}>by {book.author}</Text>

          <View style={styles.priceSection}>
            <Text style={styles.price}>{formatCurrencyVND(book.price)}</Text>
            <View style={styles.ratingContainer}>
              <Icon name="star" size={16} color="#ff9800" />
              <Text style={styles.rating}>{book.rating || 4.5} (reviews)</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{book.description}</Text>

          {reviews.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Reviews</Text>
              <FlatList
                data={reviews}
                keyExtractor={(item) => item._id}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <View style={styles.reviewCard}>
                    <Text style={styles.reviewAuthor}>
                      {item.userId?.fullName || [item.userId?.firstName, item.userId?.lastName].filter(Boolean).join(' ') || 'Customer'}
                    </Text>
                    <Text style={styles.reviewRating}>{`${item.rating || 5}/5`}</Text>
                    <Text style={styles.reviewText}>{item.comment}</Text>
                  </View>
                )}
              />
            </>
          )}
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <Button
          title="Add to Cart"
          onPress={handleAddToCart}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}

