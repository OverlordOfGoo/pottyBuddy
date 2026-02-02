import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import AppText from '../components/AppText';
import AppButton from '../components/AppButton';
import Card from '../components/Card';
import { theme } from '../theme/theme';
import { useRestrooms } from '../context/RestroomContext';
import { RootStackParamList } from '../navigation/RootNavigator';

// RestroomDetailScreen displays details about a specific restroom
//  A screen showing ratings, amenities, and action buttons for a restroom
export default function RestroomDetailScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'RestroomDetail'>>();
  const { restroomId } = route.params;
  const { state } = useRestrooms();

  const restroom = state.restrooms.find(r => r.id === restroomId);

  if (!restroom) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <AppText variant="h1">Restroom</AppText>
          <AppText muted>Restroom not found</AppText>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AppText variant="h1">Restroom</AppText>
        <AppText muted>{restroom.name}</AppText>
      </View>

      <View style={styles.body}>
        <Card>
          <AppText variant="h2">Ratings</AppText>
          <AppText muted style={{ marginTop: theme.spacing.sm }}>
            ⭐ {restroom.rating} • Cleanliness {restroom.cleanliness} • Safety {restroom.safety}
          </AppText>
        </Card>

        <Card>
          <AppText variant="h2">Amenities</AppText>
          <AppText muted style={styles.item}>• {restroom.isAccessible ? 'Wheelchair Accessible' : 'Not Wheelchair Accessible'}</AppText>
          <AppText muted style={styles.item}>• {restroom.hasChangingTable ? 'Changing Table' : 'No Changing Table'}</AppText>
          <AppText muted style={styles.item}>• {restroom.isOpen ? 'Open Now' : 'Closed'}</AppText>
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
