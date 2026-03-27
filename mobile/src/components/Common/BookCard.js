import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { formatCurrencyVND, resolveImageUrl } from '../../utils/ui';

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    marginBottom: 12,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#e7eef7',
    ...theme.shadow.card,
  },
  image: {
    width: '100%',
    height: 190,
    borderTopLeftRadius: theme.radius.md,
    borderTopRightRadius: theme.radius.md,
    backgroundColor: '#f1f5f9',
  },
  content: {
    padding: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 4,
    maxHeight: 40,
  },
  author: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 15,
    fontWeight: 'bold',
    color: theme.colors.primaryDark,
  },
  wishlistButton: {
    padding: 6,
    borderRadius: 999,
    backgroundColor: '#f8fafc',
  },
});

export const BookCard = ({
  book,
  onPress,
}) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Image
        source={{
          uri:
            resolveImageUrl(book.imageUrl || book.thumbnail) ||
            'https://via.placeholder.com/150',
        }}
        style={styles.image}
      />
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {book.title}
        </Text>
        <Text style={styles.author}>{book.author}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatCurrencyVND(book.price)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

