import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { theme } from '../theme/theme';

// Card component definition
export default function Card({ style, ...props }: ViewProps) {
  return <View {...props} style={[styles.card, style]} />;
}

// Styles for the Card component
const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
  },
});
