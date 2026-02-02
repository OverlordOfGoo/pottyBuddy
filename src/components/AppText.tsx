import React from 'react';
import { Text, TextProps } from 'react-native';
import { theme } from '../theme/theme';

type Variant = 'h1' | 'h2' | 'body' | 'small' | 'button';

type Props = TextProps & {
  variant?: Variant;
  muted?: boolean;
};

export default function AppText({
  variant = 'body',
  muted,
  style,
  ...props
}: Props) {
  // ✅ Safe fallback: if variant is ever missing, we use body
  const variantStyle = theme.type[variant] ?? theme.type.body;

  return (
    <Text
      {...props}
      style={[
        variantStyle,
        { color: muted ? theme.colors.muted : theme.colors.text },
        style,
      ]}
    />
  );
}
