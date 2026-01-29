import React from 'react';
import { Text, TextProps } from 'react-native';
// Custom Text component to apply consistent styling
import { theme } from '../theme/theme';

// Wrapper so all text defaults to your app styling (color + font scale).
type Props = TextProps & {
  variant?: 'h1' | 'h2' | 'body' | 'small';
  muted?: boolean;
};

// AppText component applies theme styles based on variant and muted props
export default function AppText({ variant = 'body', muted, style, ...props }: Props) {
  // Get base styles from theme based on variant
  const base = theme.typography[variant];
  return (
    <Text
      {...props}
      style={[
        base,
        { color: muted ? theme.colors.textMuted : theme.colors.text },
        style,
      ]}
    />
  );
}
