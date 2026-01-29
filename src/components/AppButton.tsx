import React from 'react';
// A reusable button component with primary and ghost variants
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
// Importing a custom text component for consistent typography
import AppText from './AppText';
// Importing theme for consistent styling
import { theme } from '../theme/theme';

// Props for the AppButton component
type Props = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost';
  disabled?: boolean;
  style?: ViewStyle;
};

// AppButton component definition
export default function AppButton({
  title,
  onPress,
  variant = 'primary',
  disabled,
  style,
}: Props) {
  return (
    // Pressable button with styles based on variant and state
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        // Apply styles based on variant and state
        variant === 'primary' ? styles.primary : styles.ghost,
        pressed && !disabled && variant === 'primary' ? styles.primaryPressed : null,
        disabled ? styles.disabled : null,
        style,
      ]}
    >
      // Button text with variant-based styling
      <AppText
        variant="button"
        style={{ color: variant === 'ghost' ? theme.colors.text : '#0B0F14' }}
      >
        {title}
      </AppText>
    </Pressable>
  );
}

// Styles for the AppButton component
const styles = StyleSheet.create({
  base: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Variant styles
  primary: { backgroundColor: theme.colors.primary },
  // Pressed state style for primary variant
  primaryPressed: { backgroundColor: theme.colors.primaryPressed },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  // Disabled state style
  disabled: { opacity: 0.5 },
});
