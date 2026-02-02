import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ActivityIndicator, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import AppText from '../components/AppText';
import AppButton from '../components/AppButton';
import Card from '../components/Card';
import { theme } from '../theme/theme';
import { useRestrooms } from '../context/RestroomContext';
import { Restroom } from '../types';
import { RootStackParamList } from '../navigation/RootNavigator';

// MapScreen displays a map and restroom details
//  Displays an interactive map with restroom markers and a list of restrooms
export default function MapScreen() {
  const { state } = useRestrooms();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Permission to access location was denied');
        return;
      }

      try {
        let locationResult = await Location.getCurrentPositionAsync({});
        setLocation(locationResult);
      } catch (error) {
        setLocationError('Unable to get current location');
      }
    })();
  }, []);

  const renderRestroom = ({ item }: { item: Restroom }) => (
    <Card key={item.id} style={{ marginBottom: theme.spacing.md }}>
      <AppText variant="h2">{item.name}</AppText>
      <AppText muted style={{ marginTop: theme.spacing.xs }}>
        ⭐ {item.rating} • {item.cleanliness >= 4.5 ? 'Clean' : 'Average'} • {item.isAccessible ? 'Accessible' : 'Not Accessible'} • {item.distance} mi
      </AppText>

      <View style={styles.row}>
        <AppButton
          title="View Details"
          onPress={() => navigation.navigate('RestroomDetail', { restroomId: item.id })}
          style={{ flex: 1 }}
        />
        <AppButton title="Filter" variant="ghost" onPress={() => {}} style={{ flex: 1 }} />
      </View>
    </Card>
  );

  if (state.loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <AppText variant="h1">Potty Buddy</AppText>
          <AppText muted>Find clean restrooms nearby</AppText>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <AppText muted style={{ marginTop: theme.spacing.md }}>Loading restrooms...</AppText>
        </View>
      </View>
    );
  }

  if (state.error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <AppText variant="h1">Potty Buddy</AppText>
          <AppText muted>Find clean restrooms nearby</AppText>
        </View>
        <View style={styles.errorContainer}>
          <AppText variant="h2" style={{ color: 'red' }}>Error</AppText>
          <AppText muted>{state.error}</AppText>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AppText variant="h1">Potty Buddy</AppText>
        <AppText muted>Find clean restrooms nearby</AppText>
      </View>

      <View style={styles.mapContainer}>
        {location ? (
          <MapView
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
            showsUserLocation={true}
            showsMyLocationButton={true}
          >
            {state.restrooms.map((restroom) => (
              <Marker
                key={restroom.id}
                coordinate={{
                  latitude: restroom.latitude,
                  longitude: restroom.longitude,
                }}
                title={restroom.name}
                description={`⭐ ${restroom.rating} • ${restroom.cleanliness >= 4.5 ? 'Clean' : 'Average'}`}
                onCalloutPress={() => navigation.navigate('RestroomDetail', { restroomId: restroom.id })}
              />
            ))}
          </MapView>
        ) : (
          <View style={styles.mapPlaceholder}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <AppText muted style={{ marginTop: theme.spacing.md }}>
              {locationError || 'Getting your location...'}
            </AppText>
          </View>
        )}
      </View>

      <View style={styles.bottom}>
        <FlatList
          data={state.restrooms}
          renderItem={renderRestroom}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  );
}

// Styles for the MapScreen component
//  Defines layout and styling for the map screen
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  header: { padding: theme.spacing.lg, paddingBottom: theme.spacing.md },
  mapContainer: { flex: 1, marginHorizontal: theme.spacing.lg },
  map: { flex: 1, borderRadius: theme.radius.lg },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: theme.colors.surface2,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottom: { padding: theme.spacing.lg },
  row: { flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.md },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
});
