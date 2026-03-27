import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  Text,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { BookService } from '../../services/bookService';
import { NewsService } from '../../services/newsService';
import { LoadingSpinner } from '../../components/Common/LoadingSpinner';
import { ErrorMessage } from '../../components/Common/ErrorMessage';
import { BookCard } from '../../components/Common/BookCard';
import { theme } from '../../constants/theme';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  hero: {
    margin: 14,
    marginBottom: 10,
    padding: 16,
    borderRadius: theme.radius.lg,
    backgroundColor: '#e0e7ff',
    borderWidth: 1,
    borderColor: '#c7d2fe',
  },
  heroTitle: {
    color: theme.colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
  },
  heroSub: {
    color: theme.colors.textSecondary,
    marginTop: 5,
    fontSize: 13,
  },
  section: {
    marginTop: 6,
    paddingHorizontal: 14,
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 10,
  },
  newsCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    marginBottom: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.soft,
  },
  newsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primaryDark,
  },
  newsDate: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  booksGridContainer: {
    paddingBottom: 20,
  },
});

export default function HomeScreen({ navigation }) {
  const [books, setBooks] = useState([]);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadData();
    }, []),
  );

  const loadData = async () => {
    try {
      setError(null);
      const [booksRes, newsRes] = await Promise.all([
        BookService.getAllBooks(),
        NewsService.getAllNews(),
      ]);

      setBooks(booksRes || []);
      setNews(newsRes || []);
    } catch (err) {
      setError(err?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  if (loading && !refreshing) return <LoadingSpinner />;
  if (error && !refreshing) return <ErrorMessage message={error} />;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Tibbar Bookstore</Text>
        <Text style={styles.heroSub}>Discover favorites and checkout fast.</Text>
      </View>

      {news.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Latest News</Text>
          {news.slice(0, 3).map((item) => (
            <TouchableOpacity
              key={item._id}
              style={styles.newsCard}
              onPress={() => navigation.navigate('NewsDetail', { newsId: item._id })}
            >
              <Text style={styles.newsTitle}>{item.title}</Text>
              <Text style={styles.newsDate}>
                {new Date(item.createdAt).toLocaleDateString()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {books.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Featured Books</Text>
          <FlatList
            data={books}
            keyExtractor={(item) => item._id}
            numColumns={2}
            scrollEnabled={false}
            contentContainerStyle={styles.booksGridContainer}
            renderItem={({ item }) => (
              <View style={{ width: '50%', paddingHorizontal: 4 }}>
                <BookCard
                  book={item}
                  onPress={() => navigation.navigate('BookDetail', { bookId: item._id })}
                />
              </View>
            )}
          />
        </View>
      )}
    </ScrollView>
  );
}

