import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: theme.colors.background,
  },
  text: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});

export const ErrorMessage = ({ message = 'Something went wrong' }) => (
  <View style={styles.container}>
    <Text style={styles.text}>{message}</Text>
  </View>
);
