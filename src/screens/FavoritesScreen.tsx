import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// FavoritesScreen is a placeholder for the favorites feature
export default function FavoritesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Favorites Screen (Placeholder)</Text>
    </View>
  );
}

// Styles for the FavoritesScreen component
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
    text: { fontSize: 18 },
});