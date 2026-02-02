import React from 'react';
// A reusable button component with primary and ghost variants
import { Pressable, StyleSheet, StyleProp, ViewStyle } from 'react-native';
// Importing a custom text component for consistent typography
import AppText from './AppText';
// Importing theme for consistent styling
import { theme } from '../theme/theme';

// Props for the AppButton component
type Props = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost';
  style?: StyleProp<ViewStyle>;
};

// AppButton component definition
export default function AppButton({ 
    title, onPress, 
    variant = 'primary', 
    style }: 
    Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' ? styles.primary : styles.ghost,
        pressed ? styles.pressed : null,
        style,
      ]}
    >
      <AppText variant="button" style={{ 
        color: variant === 'primary' ? '#0B0F14' : 
        theme.colors.primary }}>
        {title}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: theme.colors.primary },
  ghost: { borderWidth: 1, borderColor: theme.colors.border, backgroundColor: 'transparent' },
  pressed: { opacity: 0.85 },
});
