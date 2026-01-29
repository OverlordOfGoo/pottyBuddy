import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// SearchScreen is a placeholder for the search feature
export default function SearchScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Search Screen (Placeholder)</Text>
    </View>
  );
}

// Styles for the SearchScreen component
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
    text: { fontSize: 18 },
});