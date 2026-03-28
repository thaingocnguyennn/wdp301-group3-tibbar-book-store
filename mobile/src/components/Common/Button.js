import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { theme } from '../../constants/theme';

const styles = StyleSheet.create({
  button: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    ...theme.shadow.soft,
  },
  buttonSecondary: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  text: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  textSecondary: {
    color: theme.colors.primary,
  },
  disabled: {
    backgroundColor: '#cbd5e1',
    opacity: 0.6,
    shadowOpacity: 0,
    elevation: 0,
  },
});

export const Button = ({
  onPress,
  title,
  loading,
  disabled,
  secondary,
  style,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        secondary && styles.buttonSecondary,
        (disabled || loading) && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={secondary ? theme.colors.primary : '#fff'} />
      ) : (
        <Text style={[styles.text, secondary && styles.textSecondary]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};
