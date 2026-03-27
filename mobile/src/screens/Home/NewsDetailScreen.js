import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  View,
  StyleSheet,
  Text,
  Image,
} from 'react-native';
import { NewsService } from '../../services/newsService';
import { LoadingSpinner } from '../../components/Common/LoadingSpinner';
import { ErrorMessage } from '../../components/Common/ErrorMessage';
import { theme } from '../../constants/theme';
import { resolveImageUrl } from '../../utils/ui';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: 16,
  },
  image: {
    width: '100%',
    height: 220,
    borderRadius: theme.radius.md,
    marginBottom: 12,
    backgroundColor: '#e2e8f0',
  },
  date: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginBottom: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 12,
  },
  contentText: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    lineHeight: 22,
  },
});

export default function NewsDetailScreen({ route }) {
  const { newsId } = route.params;
  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadNews = async () => {
      try {
        setError(null);
        const result = await NewsService.getNewsById(newsId);
        setNews(result);
      } catch (err) {
        setError(err?.message || 'Failed to load news detail');
      } finally {
        setLoading(false);
      }
    };

    loadNews();
  }, [newsId]);

  if (loading) return <LoadingSpinner />;
  if (error || !news) return <ErrorMessage message={error || 'News not found'} />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Image
        source={{
          uri: resolveImageUrl(news.imageUrl || news.thumbnail) || 'https://via.placeholder.com/400',
        }}
        style={styles.image}
      />
      <Text style={styles.date}>{new Date(news.createdAt).toLocaleDateString()}</Text>
      <Text style={styles.title}>{news.title}</Text>
      <Text style={styles.contentText}>{news.content}</Text>
    </ScrollView>
  );
}
