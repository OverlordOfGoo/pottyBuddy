import React from 'react';
import { StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import { theme } from '../theme/theme';

// Props for the AppInput component
type Props = TextInputProps & {
  leftIcon?: React.ReactNode;
};

// AppInput component definition
export default function AppInput({ leftIcon, style, ...props }: Props) {
  return (
    // Input wrapper with optional left icon
    <View style={styles.wrap}>
      {leftIcon ? <View style={styles.icon}>{leftIcon}</View> : null}
      <TextInput
        placeholderTextColor={theme.colors.textMuted}
        style={[styles.input, style]}
        {...props}
      />
    </View>
  );
}
// Styles for the AppInput component
const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  // Style for the left icon container
  icon: { marginRight: theme.spacing.sm },
  input: { flex: 1, color: theme.colors.text, fontSize: 16 },
});
