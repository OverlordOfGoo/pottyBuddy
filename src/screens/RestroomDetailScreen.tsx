import React from 'react';
import { StyleSheet, View } from 'react-native';
import AppText from '../components/AppText';
import AppButton from '../components/AppButton';
import Card from '../components/Card';
import { theme } from '../theme/theme';

// RestroomDetailScreen displays details about a specific restroom
//  A screen showing ratings, amenities, and action buttons for a restroom
export default function RestroomDetailScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AppText variant="h1">Restroom</AppText>
        <AppText muted>Downtown Public Restroom</AppText>
      </View>

      <View style={styles.body}>
        <Card>
          <AppText variant="h2">Ratings</AppText>
          <AppText muted style={{ marginTop: theme.spacing.sm }}>
            ⭐ 4.6 • Cleanliness 4.8 • Safety 4.4
          </AppText>
        </Card>

        <Card>
          <AppText variant="h2">Amenities</AppText>
          <AppText muted style={styles.item}>• Wheelchair Accessible</AppText>
          <AppText muted style={styles.item}>• Changing Table</AppText>
          <AppText muted style={styles.item}>• Open Now</AppText>
        </Card>

        <View style={styles.row}>
          <AppButton title="Get Directions" onPress={() => {}} style={{ flex: 1 }} />
          <AppButton title="Add Review" variant="ghost" onPress={() => {}} style={{ flex: 1 }} />
        </View>
      </View>
    </View>
  );
}

// Styles for the RestroomDetailScreen component
//  Defines layout and styling for the restroom detail screen
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  header: { padding: theme.spacing.lg, paddingBottom: theme.spacing.md },
  body: { paddingHorizontal: theme.spacing.lg, gap: theme.spacing.md },
  item: { marginTop: theme.spacing.sm },
  row: { flexDirection: 'row', gap: theme.spacing.sm },
});
