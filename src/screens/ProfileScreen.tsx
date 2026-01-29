import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// ProfileScreen is a placeholder for the profile feature
export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Profile Screen (Placeholder)</Text>
    </View>
  );
}

// Styles for the ProfileScreen component
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
    text: { fontSize: 18 },
});