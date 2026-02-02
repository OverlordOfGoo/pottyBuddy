import React from 'react';
import { StyleSheet, View } from 'react-native';
import AppText from '../components/AppText';
import AppInput from '../components/AppInput';
import Card from '../components/Card';
import { theme } from '../theme/theme';

// SearchScreen displays a search interface
//  A screen for searching restrooms with recent searches listed
export default function SearchScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AppText variant="h1">Search</AppText>
        <AppText muted>Look up restrooms ahead of time</AppText>
      </View>

      <View style={styles.body}>
        <AppInput placeholder="Search city, address, or place…" />

        <Card>
          <AppText variant="h2">Recent Searches</AppText>
          <AppText muted style={styles.item}>• Orlando International Airport</AppText>
          <AppText muted style={styles.item}>• Downtown Tampa</AppText>
        </Card>
      </View>
    </View>
  );
}

// Styles for the SearchScreen component
//  Defines layout and styling for the search screen
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  header: { padding: theme.spacing.lg, paddingBottom: theme.spacing.md },
  body: { paddingHorizontal: theme.spacing.lg, gap: theme.spacing.md },
  item: { marginTop: theme.spacing.sm },
});
