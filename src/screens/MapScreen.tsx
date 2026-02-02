import React from 'react';
import { StyleSheet, View } from 'react-native';
import AppText from '../components/AppText';
import AppButton from '../components/AppButton';
import Card from '../components/Card';
import { theme } from '../theme/theme';

// MapScreen displays a map and restroom details
//  A placeholder map screen with header, map area, and restroom info card
export default function MapScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AppText variant="h1">Potty Buddy</AppText>
        <AppText muted>Find clean restrooms nearby</AppText>
      </View>

      <View style={styles.mapPlaceholder}>
        <AppText muted>Map Placeholder</AppText>
      </View>

      <View style={styles.bottom}>
        <Card>
          <AppText variant="h2">Downtown Public Restroom</AppText>
          <AppText muted style={{ marginTop: theme.spacing.xs }}>
            ⭐ 4.6 • Clean • Accessible • 0.3 mi
          </AppText>

          <View style={styles.row}>
            <AppButton title="View Details" onPress={() => {}} style={{ flex: 1 }} />
            <AppButton title="Filter" variant="ghost" onPress={() => {}} style={{ flex: 1 }} />
          </View>
        </Card>
      </View>
    </View>
  );
}

// Styles for the MapScreen component
//  Defines layout and styling for the map screen
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  header: { padding: theme.spacing.lg, paddingBottom: theme.spacing.md },
  mapPlaceholder: {
    flex: 1,
    marginHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.surface2,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottom: { padding: theme.spacing.lg },
  row: { flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.md },
});
