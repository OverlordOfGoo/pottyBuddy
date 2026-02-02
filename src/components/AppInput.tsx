import React from 'react';
import { StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import { theme } from '../theme/theme';

// AppInput component definition
// that wraps TextInput with custom styles
//  and placeholder text color
export default function AppInput(props: TextInputProps) {
  return (
    <View style={styles.wrap}>
      <TextInput
        {...props}
        placeholderTextColor={theme.colors.muted}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  input: { color: theme.colors.text, fontSize: 16 },
});
