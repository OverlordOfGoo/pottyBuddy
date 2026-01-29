import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// MapScreen is a placeholder for the map feature
export default function MapScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Map Screen (Placeholder)</Text>
    </View>
  );
}

// Styles for the MapScreen component
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
    text: { fontSize: 18 },
}); 
