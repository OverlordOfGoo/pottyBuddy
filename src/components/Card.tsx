import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { theme } from '../theme/theme';

// Card component definition
//  A reusable card component with consistent styling
export default function Card({ style, ...props }: ViewProps) {
  return <View {...props} style={[styles.card, style]} />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
  },
});
