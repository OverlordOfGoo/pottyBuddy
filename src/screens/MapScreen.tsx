import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from 'react-native';
import MapView, { MapPressEvent, Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppButton from '../components/AppButton';
import AppText from '../components/AppText';
import Card from '../components/Card';
import { useRestrooms } from '../context/RestroomContext';
import { theme } from '../theme/theme';
import { PlaceCandidate, ReviewDraft } from '../types';

const DEFAULT_REGION: Region = {
  latitude: 40.7128,
  longitude: -74.006,
  latitudeDelta: 0.06,
  longitudeDelta: 0.05,
};

const EMPTY_DRAFT: ReviewDraft = {
  rating: 4,
  cleanliness: 4,
  safety: 4,
  isAccessible: false,
  stallType: 'single',
  hasChangingTable: false,
  isPublic: true,
  isOpenNow: true,
  isOpen24Hours: false,
  notes: '',
  photoUris: [],
};

function distanceMiles(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const radius = 3958.8;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return radius * c;
}

function makeManualPlace(latitude: number, longitude: number): PlaceCandidate {
  return {
    placeId: `manual_${latitude.toFixed(6)}_${longitude.toFixed(6)}`,
    name: 'Custom location',
    address: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
    latitude,
    longitude,
  };
}

function StarRow({ rating }: { rating: number }) {
  const stars = [1, 2, 3, 4];
  return (
    <View style={styles.starRow}>
      {stars.map((num) => (
        <AppText key={num} style={{ color: num <= rating ? '#F3A329' : '#D8C9A6', fontSize: 24 }}>
          {'\u2605'}
        </AppText>
      ))}
    </View>
  );
}

export default function MapScreen() {
  const { state, fetchReviews, submitReview, ensureRestroomForPlace, submitReport } = useRestrooms();
  const insets = useSafeAreaInsets();
  const googleKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

  const mapRef = useRef<MapView | null>(null);
  const ignoreNextMapTap = useRef(false);

  const [region, setRegion] = useState(DEFAULT_REGION);
  const [ready, setReady] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [placesLoading, setPlacesLoading] = useState(false);
  const [placesError, setPlacesError] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [places, setPlaces] = useState<PlaceCandidate[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<PlaceCandidate | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [savingReview, setSavingReview] = useState(false);
  const [draft, setDraft] = useState<ReviewDraft>(EMPTY_DRAFT);
  const [mapOnly, setMapOnly] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [minOverall, setMinOverall] = useState(0);
  const [minCleanliness, setMinCleanliness] = useState(0);
  const [filterAccessible, setFilterAccessible] = useState(false);
  const [filterChangingTable, setFilterChangingTable] = useState(false);
  const [filterPublic, setFilterPublic] = useState(false);
  const [filterOpenNow, setFilterOpenNow] = useState(false);
  const [radiusMiles, setRadiusMiles] = useState(0);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reporting, setReporting] = useState(false);

  const mapPlaces: PlaceCandidate[] = [...places];
  for (const restroom of state.restrooms) {
    const exists = mapPlaces.find((p) => p.placeId === restroom.placeId);
    if (!exists) {
      mapPlaces.push({
        placeId: restroom.placeId,
        name: restroom.name,
        address: restroom.address,
        latitude: restroom.latitude,
        longitude: restroom.longitude,
      });
    }
  }

  const hasActiveFilters =
    minOverall > 0 ||
    minCleanliness > 0 ||
    filterAccessible ||
    filterChangingTable ||
    filterPublic ||
    filterOpenNow ||
    radiusMiles > 0;

  const placeMeta = mapPlaces.map((place) => {
    const restroom = state.restrooms.find((r) => r.placeId === place.placeId);
    const distance =
      userLocation && place
        ? distanceMiles(userLocation.lat, userLocation.lng, place.latitude, place.longitude)
        : null;
    return { place, restroom, distance };
  });

  const filteredPlaces = placeMeta.filter((item) => {
    if (!hasActiveFilters) return true;
    if (!item.restroom) return false;
    if (minOverall > 0 && (item.restroom.averageRating || 0) < minOverall) return false;
    if (minCleanliness > 0 && (item.restroom.averageCleanliness || 0) < minCleanliness) return false;
    if (filterAccessible && !item.restroom.latestReview?.isAccessible) return false;
    if (filterChangingTable && !item.restroom.latestReview?.hasChangingTable) return false;
    if (filterPublic && !item.restroom.latestReview?.isPublic) return false;
    if (filterOpenNow && !item.restroom.latestReview?.isOpenNow) return false;
    if (radiusMiles > 0 && item.distance !== null && item.distance > radiusMiles) return false;
    return true;
  });

  const visiblePlaces = filteredPlaces.map((item) => item.place);

  const selectedRestroom = selectedPlace
    ? state.restrooms.find((r) => r.placeId === selectedPlace.placeId) || null
    : null;
  const latestReview = reviews.length > 0 ? reviews[0] : null;
  const topPicks = visiblePlaces.slice(0, 8);
  const topSpacing = insets.top + theme.spacing.sm;
  const bottomSpacing = insets.bottom + theme.spacing.sm;

  async function loadNearby(target: Region) {
    if (!googleKey) {
      setPlacesError('Set EXPO_PUBLIC_GOOGLE_MAPS_API_KEY in .env');
      return;
    }

    setPlacesLoading(true);
    setPlacesError(null);

    try {
      const url =
        'https://maps.googleapis.com/maps/api/place/nearbysearch/json' +
        `?location=${target.latitude},${target.longitude}` +
        '&radius=2500' +
        '&keyword=restroom' +
        `&key=${googleKey}`;

      const response = await fetch(url);
      const json = await response.json();

      if (json.status && json.status !== 'OK' && json.status !== 'ZERO_RESULTS') {
        setPlacesError(`Places error: ${json.status}`);
        setPlacesLoading(false);
        return;
      }

      const list: PlaceCandidate[] = [];
      for (const item of json.results || []) {
        if (!item.place_id || !item.name || !item.geometry?.location) continue;
        list.push({
          placeId: item.place_id,
          name: item.name,
          address: item.vicinity || item.formatted_address || '',
          latitude: Number(item.geometry.location.lat),
          longitude: Number(item.geometry.location.lng),
        });
      }
      setPlaces(list);
    } catch {
      setPlacesError('Could not load nearby places');
    }

    setPlacesLoading(false);
  }

  async function searchPlaces() {
    if (!googleKey) {
      setPlacesError('Set EXPO_PUBLIC_GOOGLE_MAPS_API_KEY in .env');
      return;
    }

    const query = searchText.trim();
    if (!query) {
      await loadNearby(region);
      return;
    }

    setPlacesLoading(true);
    setPlacesError(null);

    try {
      const url =
        'https://maps.googleapis.com/maps/api/place/textsearch/json' +
        `?query=${encodeURIComponent(query)}` +
        `&location=${region.latitude},${region.longitude}` +
        '&radius=10000' +
        `&key=${googleKey}`;

      const response = await fetch(url);
      const json = await response.json();

      if (json.status && json.status !== 'OK' && json.status !== 'ZERO_RESULTS') {
        setPlacesError(`Places error: ${json.status}`);
        setPlacesLoading(false);
        return;
      }

      const list: PlaceCandidate[] = [];
      for (const item of json.results || []) {
        if (!item.place_id || !item.name || !item.geometry?.location) continue;
        list.push({
          placeId: item.place_id,
          name: item.name,
          address: item.vicinity || item.formatted_address || '',
          latitude: Number(item.geometry.location.lat),
          longitude: Number(item.geometry.location.lng),
        });
      }

      setPlaces(list);

      if (list.length > 0) {
        const first = list[0];
        setSelectedPlace(first);
        const nextRegion = {
          latitude: first.latitude,
          longitude: first.longitude,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        };
        setRegion(nextRegion);
        mapRef.current?.animateToRegion(nextRegion, 450);
      }
    } catch {
      setPlacesError('Search failed');
    }

    setPlacesLoading(false);
  }

  async function pickPlaceFromTap(latitude: number, longitude: number) {
    if (!googleKey) {
      setSelectedPlace(makeManualPlace(latitude, longitude));
      return;
    }

    try {
      const url =
        'https://maps.googleapis.com/maps/api/place/nearbysearch/json' +
        `?location=${latitude},${longitude}` +
        '&radius=80' +
        '&keyword=restroom' +
        `&key=${googleKey}`;

      const response = await fetch(url);
      const json = await response.json();
      const first = json.results?.[0];

      if (first && first.place_id && first.name && first.geometry?.location) {
        setSelectedPlace({
          placeId: first.place_id,
          name: first.name,
          address: first.vicinity || first.formatted_address || '',
          latitude: Number(first.geometry.location.lat),
          longitude: Number(first.geometry.location.lng),
        });
      } else {
        setSelectedPlace(makeManualPlace(latitude, longitude));
      }
    } catch {
      setSelectedPlace(makeManualPlace(latitude, longitude));
    }
  }

  async function loadCurrentLocation() {
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        setLocationError('Location denied. Using default area.');
        setReady(true);
        await loadNearby(DEFAULT_REGION);
        return;
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const nextRegion = {
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
        latitudeDelta: 0.06,
        longitudeDelta: 0.05,
      };

      setRegion(nextRegion);
      setUserLocation({ lat: current.coords.latitude, lng: current.coords.longitude });
      setReady(true);
      mapRef.current?.animateToRegion(nextRegion, 450);
      await loadNearby(nextRegion);
    } catch {
      setLocationError('Could not read location. Using default area.');
      setReady(true);
      await loadNearby(DEFAULT_REGION);
    }
  }

  async function goToMyLocation() {
    try {
      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const nextRegion = {
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
        latitudeDelta: 0.03,
        longitudeDelta: 0.03,
      };
      setRegion(nextRegion);
      setUserLocation({ lat: current.coords.latitude, lng: current.coords.longitude });
      mapRef.current?.animateToRegion(nextRegion, 450);
      await loadNearby(nextRegion);
    } catch {
      setLocationError('Could not center to your location.');
    }
  }

  async function openPhotoPicker() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 5,
    });

    if (!result.canceled) {
      setDraft((old) => ({
        ...old,
        photoUris: result.assets.map((a) => a.uri),
      }));
    }
  }

  async function saveReview() {
    if (!selectedPlace) return;

    setSavingReview(true);
    try {
      const saved = await submitReview({
        place: selectedPlace,
        rating: draft.rating,
        cleanliness: draft.cleanliness,
        safety: draft.safety,
        isAccessible: draft.isAccessible,
        stallType: draft.stallType,
        hasChangingTable: draft.hasChangingTable,
        isPublic: draft.isPublic,
        isOpenNow: draft.isOpenNow,
        isOpen24Hours: draft.isOpen24Hours,
        notes: draft.notes,
        photoUris: draft.photoUris,
      });

      setSelectedPlace({
        placeId: saved.restroom.placeId,
        name: saved.restroom.name,
        address: saved.restroom.address,
        latitude: saved.restroom.latitude,
        longitude: saved.restroom.longitude,
      });

      const list = await fetchReviews(saved.restroom.id);
      setReviews(list);
      setDraft(EMPTY_DRAFT);
      setShowReviewModal(false);
    } catch {
      // context already sets error
    }
    setSavingReview(false);
  }

  useEffect(() => {
    loadCurrentLocation();
  }, []);

  useEffect(() => {
    if (!selectedRestroom) {
      setReviews([]);
      return;
    }

    setReviewsLoading(true);
    fetchReviews(selectedRestroom.id)
      .then((list) => setReviews(list))
      .catch(() => setReviews([]))
      .finally(() => setReviewsLoading(false));
  }, [selectedRestroom?.id]);

  function onMapPress(event: MapPressEvent) {
    if (ignoreNextMapTap.current) {
      ignoreNextMapTap.current = false;
      return;
    }
    const coords = event.nativeEvent.coordinate;
    pickPlaceFromTap(coords.latitude, coords.longitude);
  }

  function openDirections(place: PlaceCandidate) {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`;
    Linking.openURL(url);
  }

  function getPlaceDistance(place: PlaceCandidate) {
    if (!userLocation) return null;
    return distanceMiles(userLocation.lat, userLocation.lng, place.latitude, place.longitude);
  }

  function getTopTags() {
    const tags: string[] = [];
    if (latestReview?.isAccessible) tags.push('Accessible');
    if (latestReview?.hasChangingTable) tags.push('Changing table');
    if (latestReview?.isPublic) tags.push('Public');
    if (latestReview?.isOpenNow) tags.push('Open now');
    if (latestReview?.stallType === 'multi') tags.push('Multi');
    if (latestReview?.stallType === 'single') tags.push('Single');
    return tags.slice(0, 3);
  }

  return (
    <View style={styles.container}>
      <View style={[styles.searchRowWrap, { top: topSpacing }]}>
        <View style={styles.searchPill}>
          <AppText style={styles.searchIcon}>S</AppText>
          <TextInput
            style={styles.searchInput}
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Search restrooms or locations"
            placeholderTextColor={theme.colors.muted}
            onSubmitEditing={searchPlaces}
          />
        </View>
        <Pressable style={styles.filterButton} onPress={goToMyLocation}>
          <AppText style={styles.filterIcon}>My</AppText>
        </Pressable>
        <Pressable style={styles.filterButton} onPress={() => setMapOnly((prev) => !prev)}>
          <AppText style={styles.filterIcon}>{mapOnly ? 'List' : 'Map'}</AppText>
        </Pressable>
      </View>

      <View
        style={[
          styles.mapWrap,
          mapOnly ? styles.mapWrapFull : { marginTop: topSpacing + 62 },
        ]}
      >
        <MapView
          ref={(ref) => {
            mapRef.current = ref;
          }}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={region}
          onRegionChangeComplete={(nextRegion) => setRegion(nextRegion)}
          onPress={onMapPress}
          showsUserLocation={true}
          showsMyLocationButton={true}
        >
          {visiblePlaces.map((place) => {
            const linked = state.restrooms.find((r) => r.placeId === place.placeId);
            const reviewed = (linked?.reviewCount || 0) > 0;
            return (
              <Marker
                key={place.placeId}
                coordinate={{ latitude: place.latitude, longitude: place.longitude }}
                title={place.name}
                description={place.address}
                pinColor={reviewed ? '#4C8E4A' : '#F09A2A'}
                onPress={() => {
                  ignoreNextMapTap.current = true;
                  setSelectedPlace(place);
                }}
              />
            );
          })}
        </MapView>
      </View>

      {!mapOnly && (
        <View style={[styles.sheet, { bottom: bottomSpacing }]}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetContent}>
            <AppText muted style={styles.miniNote}>
              MVP: this screen is Explore + Reviews only.
            </AppText>
            <View style={styles.titleRow}>
              <AppText variant="h1">Top Picks Nearby</AppText>
              <View style={styles.dotRow}>
                <View style={styles.dot} />
                <View style={styles.dot} />
                <View style={styles.dot} />
              </View>
            </View>

            <View style={styles.filterRow}>
              <Pressable style={styles.filterChip} onPress={() => setShowFilters((prev) => !prev)}>
                <AppText style={styles.filterChipText}>{showFilters ? 'Hide filters' : 'Show filters'}</AppText>
              </Pressable>
              <View style={styles.filterMiniRow}>
                <Pressable
                  style={[styles.filterMiniBtn, minOverall >= 3 && styles.filterMiniBtnActive]}
                  onPress={() => setMinOverall(minOverall >= 3 ? 0 : 3)}
                >
                  <AppText muted={minOverall < 3}>3+ stars</AppText>
                </Pressable>
                <Pressable
                  style={[styles.filterMiniBtn, filterAccessible && styles.filterMiniBtnActive]}
                  onPress={() => setFilterAccessible((prev) => !prev)}
                >
                  <AppText muted={!filterAccessible}>Accessible</AppText>
                </Pressable>
              </View>
            </View>

            {showFilters && (
              <Card style={styles.filterPanel}>
                <AppText style={styles.filterTitle}>Filters</AppText>
                <View style={styles.filterGroup}>
                  <AppText muted>Overall min</AppText>
                  <View style={styles.filterStarsRow}>
                    {[0, 1, 2, 3, 4].map((value) => (
                      <Pressable
                        key={`overall-${value}`}
                        style={[styles.filterStarBtn, minOverall === value && styles.filterStarBtnActive]}
                        onPress={() => setMinOverall(value)}
                      >
                        <AppText>{value === 0 ? 'Any' : value}</AppText>
                      </Pressable>
                    ))}
                  </View>
                </View>
                <View style={styles.filterGroup}>
                  <AppText muted>Cleanliness min</AppText>
                  <View style={styles.filterStarsRow}>
                    {[0, 1, 2, 3, 4].map((value) => (
                      <Pressable
                        key={`clean-${value}`}
                        style={[styles.filterStarBtn, minCleanliness === value && styles.filterStarBtnActive]}
                        onPress={() => setMinCleanliness(value)}
                      >
                        <AppText>{value === 0 ? 'Any' : value}</AppText>
                      </Pressable>
                    ))}
                  </View>
                </View>
                <View style={styles.filterSwitchRow}>
                  <AppText muted>Accessible</AppText>
                  <Switch value={filterAccessible} onValueChange={setFilterAccessible} />
                </View>
                <View style={styles.filterSwitchRow}>
                  <AppText muted>Changing table</AppText>
                  <Switch value={filterChangingTable} onValueChange={setFilterChangingTable} />
                </View>
                <View style={styles.filterSwitchRow}>
                  <AppText muted>Open now</AppText>
                  <Switch value={filterOpenNow} onValueChange={setFilterOpenNow} />
                </View>
                <View style={styles.filterSwitchRow}>
                  <AppText muted>Public</AppText>
                  <Switch value={filterPublic} onValueChange={setFilterPublic} />
                </View>
                <View style={styles.filterGroup}>
                  <AppText muted>Radius</AppText>
                  <View style={styles.filterStarsRow}>
                    {[0, 0.5, 1, 2, 5].map((value) => (
                      <Pressable
                        key={`radius-${value}`}
                        style={[styles.filterStarBtn, radiusMiles === value && styles.filterStarBtnActive]}
                        onPress={() => setRadiusMiles(value)}
                      >
                        <AppText>{value === 0 ? 'Any' : `${value} mi`}</AppText>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </Card>
            )}

            {placesLoading && <ActivityIndicator color={theme.colors.primary} style={{ marginBottom: 8 }} />}

            <FlatList
              data={topPicks}
              horizontal
              keyExtractor={(item) => item.placeId}
            contentContainerStyle={styles.pickRow}
            renderItem={({ item }) => {
              const linked = state.restrooms.find((r) => r.placeId === item.placeId);
              const cover = linked?.coverPhoto?.downloadURL;
              return (
                <Pressable
                  style={styles.pickCard}
                  onPress={() => {
                    setSelectedPlace(item);
                    mapRef.current?.animateToRegion(
                      {
                        latitude: item.latitude,
                        longitude: item.longitude,
                        latitudeDelta: 0.02,
                        longitudeDelta: 0.02,
                      },
                      350
                    );
                  }}
                >
                  {cover ? (
                    <Image source={{ uri: cover }} style={styles.pickImage} contentFit="cover" />
                  ) : (
                    <View style={styles.pickImagePlaceholder}>
                      <AppText muted>No photo</AppText>
                    </View>
                  )}
                  <View style={styles.pickOverlay}>
                    <AppText style={styles.pickTitle}>{item.name}</AppText>
                    <AppText style={styles.pickMeta}>
                      {linked ? `${linked.reviewCount} reviews` : 'No reviews yet'}
                    </AppText>
                  </View>
                </Pressable>
              );
            }}
          />

          {selectedPlace && (
            <Card style={styles.detailCard}>
              <View style={styles.detailRow}>
                {selectedRestroom?.coverPhoto?.downloadURL ? (
                  <Image
                    source={{ uri: selectedRestroom.coverPhoto.downloadURL }}
                    style={styles.detailImage}
                    contentFit="cover"
                  />
                ) : (
                  <View style={[styles.detailImage, styles.detailImagePlaceholder]}>
                    <AppText muted>Image</AppText>
                  </View>
                )}
                <View style={styles.detailBody}>
                  <AppText style={styles.detailTitle}>{selectedPlace.name}</AppText>
                  <StarRow rating={selectedRestroom ? Math.round(selectedRestroom.averageRating || 0) : 0} />
                  <AppText muted style={{ marginTop: 4 }}>
                    {selectedPlace.address || 'Address not available'}
                  </AppText>
                  <View style={styles.detailMetaRow}>
                    <AppText muted>
                      {selectedRestroom ? `${selectedRestroom.reviewCount} reviews` : 'No reviews yet'}
                    </AppText>
                    <AppText muted>
                      {getPlaceDistance(selectedPlace)
                        ? `${getPlaceDistance(selectedPlace)?.toFixed(1)} mi`
                        : 'Distance n/a'}
                    </AppText>
                  </View>
                  <View style={styles.tagRow}>
                    {getTopTags().length === 0 && (
                      <View style={[styles.tag, styles.tagOrange]}>
                        <AppText style={styles.tagText}>No tags yet</AppText>
                      </View>
                    )}
                    {getTopTags().map((tag) => (
                      <View key={tag} style={[styles.tag, styles.tagGreen]}>
                        <AppText style={styles.tagText}>{tag}</AppText>
                      </View>
                    ))}
                  </View>
                  <View style={styles.detailActions}>
                    <AppButton title="Directions" variant="ghost" onPress={() => openDirections(selectedPlace)} />
                    <AppButton title="Report issue" variant="ghost" onPress={() => setShowReportModal(true)} />
                  </View>
                </View>
              </View>
            </Card>
          )}

          {selectedPlace && selectedRestroom && reviewsLoading && (
            <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 8 }} />
          )}

          {selectedPlace && selectedRestroom && latestReview && !reviewsLoading && (
            <Card style={styles.reviewCard}>
              <View style={styles.reviewHead}>
                <View style={styles.avatar}>
                  <AppText style={styles.avatarText}>L</AppText>
                </View>
                <View style={{ flex: 1 }}>
                  <AppText style={styles.reviewName}>Latest review</AppText>
                  <AppText muted>
                    {new Date(latestReview.createdAtMs).toLocaleString()}
                  </AppText>
                </View>
              </View>
              <AppText style={styles.reviewNotes}>
                {latestReview.notes || 'No notes added for this review.'}
              </AppText>
              <StarRow rating={latestReview.rating} />
            </Card>
          )}

            {reviews.length > 0 && (
              <Card style={styles.reviewListCard}>
                <AppText style={styles.reviewListTitle}>All reviews</AppText>
                {reviews.slice(0, 3).map((review) => (
                  <View key={review.id} style={styles.reviewListItem}>
                    <AppText style={styles.reviewListName}>User</AppText>
                    <AppText muted>{new Date(review.createdAtMs).toLocaleDateString()}</AppText>
                    <StarRow rating={review.rating} />
                    <AppText muted style={{ marginTop: 4 }}>
                      {review.notes || 'No notes'}
                    </AppText>
                  </View>
                ))}
                {reviews.length > 3 && <AppText muted>Showing latest 3 reviews.</AppText>}
              </Card>
            )}

            <Pressable
              style={styles.writeReviewButton}
              onPress={() => {
                if (!selectedPlace && topPicks.length > 0) {
                  setSelectedPlace(topPicks[0]);
                }
                setDraft(EMPTY_DRAFT);
                setShowReviewModal(true);
              }}
            >
              <AppText style={styles.writeReviewText}>Write a Review</AppText>
            </Pressable>
          </ScrollView>
        </View>
      )}

      <Modal visible={showReviewModal} transparent animationType="slide">
        <Pressable style={styles.modalBackdrop} onPress={Keyboard.dismiss}>
          <Pressable style={styles.modalCard} onPress={(event) => event.stopPropagation()}>
            <AppText variant="h2">Add Review</AppText>
            <AppText muted>Overall rating</AppText>
            <StarRow rating={draft.rating} />
            <View style={styles.selectStarsRow}>
              {[1, 2, 3, 4].map((value) => (
                <Pressable
                  key={`overall-${value}`}
                  style={styles.selectStarBtn}
                  onPress={() => setDraft((old) => ({ ...old, rating: value }))}
                >
                  <AppText>{value}</AppText>
                </Pressable>
              ))}
            </View>

            <AppText muted>Cleanliness</AppText>
            <StarRow rating={draft.cleanliness} />
            <View style={styles.selectStarsRow}>
              {[1, 2, 3, 4].map((value) => (
                <Pressable
                  key={`clean-${value}`}
                  style={styles.selectStarBtn}
                  onPress={() => setDraft((old) => ({ ...old, cleanliness: value }))}
                >
                  <AppText>{value}</AppText>
                </Pressable>
              ))}
            </View>

            <AppText muted>Safety</AppText>
            <StarRow rating={draft.safety} />
            <View style={styles.selectStarsRow}>
              {[1, 2, 3, 4].map((value) => (
                <Pressable
                  key={`safe-${value}`}
                  style={styles.selectStarBtn}
                  onPress={() => setDraft((old) => ({ ...old, safety: value }))}
                >
                  <AppText>{value}</AppText>
                </Pressable>
              ))}
            </View>

            <View style={styles.switchRow}>
              <AppText muted>Accessible</AppText>
              <Switch value={draft.isAccessible} onValueChange={(value) => setDraft((old) => ({ ...old, isAccessible: value }))} />
            </View>
            <View style={styles.switchRow}>
              <AppText muted>Stall type</AppText>
              <View style={styles.modalTagRow}>
                <Pressable style={[styles.stallBtn, draft.stallType === 'single' && styles.stallBtnActive]} onPress={() => setDraft((old) => ({ ...old, stallType: 'single' }))}>
                  <AppText muted={draft.stallType !== 'single'}>Single</AppText>
                </Pressable>
                <Pressable style={[styles.stallBtn, draft.stallType === 'multi' && styles.stallBtnActive]} onPress={() => setDraft((old) => ({ ...old, stallType: 'multi' }))}>
                  <AppText muted={draft.stallType !== 'multi'}>Multi</AppText>
                </Pressable>
              </View>
            </View>
            <View style={styles.switchRow}>
              <AppText muted>Has changing table</AppText>
              <Switch value={draft.hasChangingTable} onValueChange={(value) => setDraft((old) => ({ ...old, hasChangingTable: value }))} />
            </View>
            <View style={styles.switchRow}>
              <AppText muted>Open to public</AppText>
              <Switch value={draft.isPublic} onValueChange={(value) => setDraft((old) => ({ ...old, isPublic: value }))} />
            </View>
            <View style={styles.switchRow}>
              <AppText muted>Open now</AppText>
              <Switch value={draft.isOpenNow} onValueChange={(value) => setDraft((old) => ({ ...old, isOpenNow: value }))} />
            </View>
            <View style={styles.switchRow}>
              <AppText muted>Open 24/7</AppText>
              <Switch value={draft.isOpen24Hours} onValueChange={(value) => setDraft((old) => ({ ...old, isOpen24Hours: value }))} />
            </View>

            <TextInput
              style={styles.notesInput}
              multiline
              numberOfLines={3}
              value={draft.notes}
              onChangeText={(value) => setDraft((old) => ({ ...old, notes: value }))}
              placeholder="Notes"
              placeholderTextColor={theme.colors.muted}
              returnKeyType="done"
              blurOnSubmit={true}
              onSubmitEditing={Keyboard.dismiss}
            />

            <View style={styles.modalButtonRow}>
              <AppButton title="Done Typing" variant="ghost" onPress={Keyboard.dismiss} />
              <AppButton title="Add Photos" variant="ghost" onPress={openPhotoPicker} />
            </View>
            <AppText muted>Photos selected: {draft.photoUris.length}</AppText>

            {draft.photoUris.length > 0 && (
              <ScrollView horizontal>
                {draft.photoUris.map((uri) => (
                  <Image key={uri} source={{ uri }} style={styles.photoThumb} />
                ))}
              </ScrollView>
            )}

            <View style={styles.modalButtonRow}>
              <AppButton title="Cancel" variant="ghost" onPress={() => setShowReviewModal(false)} />
              <AppButton title={savingReview ? 'Saving...' : 'Save Review'} onPress={saveReview} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={showReportModal} transparent animationType="fade">
        <Pressable style={styles.modalBackdrop} onPress={() => setShowReportModal(false)}>
          <Pressable style={styles.modalCard} onPress={(event) => event.stopPropagation()}>
            <AppText variant="h2">Report issue</AppText>
            <View style={styles.reportRow}>
              {[
                { id: 'closed', label: 'Closed / does not exist' },
                { id: 'wrong-location', label: 'Wrong location' },
                { id: 'unsafe', label: 'Unsafe' },
                { id: 'spam', label: 'Spam review' },
              ].map((item) => (
                <Pressable
                  key={item.id}
                  style={styles.reportOption}
                  onPress={async () => {
                    if (!selectedPlace) return;
                    setReporting(true);
                    try {
                      const restroom = await ensureRestroomForPlace(selectedPlace);
                      await submitReport(restroom.id, item.id);
                      setShowReportModal(false);
                    } catch {
                      // context already sets error
                    }
                    setReporting(false);
                  }}
                >
                  <AppText>{item.label}</AppText>
                </Pressable>
              ))}
            </View>
            <AppButton title={reporting ? 'Sending...' : 'Close'} variant="ghost" onPress={() => setShowReportModal(false)} />
          </Pressable>
        </Pressable>
      </Modal>

      {!ready && (
        <View style={styles.blocker}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <AppText muted>Getting map ready...</AppText>
        </View>
      )}

      {(locationError || placesError || state.error) && (
        <View style={[styles.errorBanner, { bottom: bottomSpacing + 12 }]}>
          <AppText style={styles.errorText}>{locationError || placesError || state.error}</AppText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  searchRowWrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    zIndex: 30,
  },
  searchPill: {
    flex: 1,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FAF6EA',
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  searchIcon: {
    fontSize: 28,
    color: '#A0732F',
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 20,
  },
  filterButton: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  filterIcon: {
    fontSize: 22,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  mapWrap: {
    marginHorizontal: 16,
    height: 250,
    borderRadius: 34,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#CDBB97',
    backgroundColor: '#D9C99D',
  },
  mapWrapFull: {
    ...StyleSheet.absoluteFillObject,
    marginHorizontal: 0,
    height: '100%',
    borderRadius: 0,
    borderWidth: 0,
  },
  map: {
    flex: 1,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 290,
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sheetContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
    gap: 14,
  },
  miniNote: {
    marginBottom: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  dotRow: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 99,
    backgroundColor: '#C9BA97',
  },
  filterRow: {
    gap: 10,
  },
  filterChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: '#F6EED9',
  },
  filterChipText: {
    fontWeight: '700',
  },
  filterMiniRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterMiniBtn: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F5EBD3',
  },
  filterMiniBtnActive: {
    borderColor: theme.colors.primary,
    backgroundColor: '#FFEBD9',
  },
  filterPanel: {
    backgroundColor: '#F8F0DE',
    gap: 10,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  filterGroup: {
    gap: 6,
  },
  filterStarsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterStarBtn: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#EFE4C9',
  },
  filterStarBtnActive: {
    borderColor: theme.colors.primary,
    backgroundColor: '#FFEBD9',
  },
  filterSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickRow: {
    gap: 12,
    paddingBottom: 4,
  },
  pickCard: {
    width: 220,
    height: 132,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: '#D8C8A8',
  },
  pickImage: {
    width: '100%',
    height: '100%',
  },
  pickImagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(32,30,26,0.56)',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  pickTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  pickMeta: {
    color: '#F3E9CF',
  },
  detailCard: {
    backgroundColor: '#F7F0DF',
  },
  detailRow: {
    flexDirection: 'row',
    gap: 12,
  },
  detailImage: {
    width: 102,
    height: 102,
    borderRadius: 14,
  },
  detailImagePlaceholder: {
    backgroundColor: '#E8DDBF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailBody: {
    flex: 1,
    gap: 4,
  },
  detailTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.text,
  },
  detailMetaRow: {
    flexDirection: 'row',
    gap: 12,
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  tagGreen: {
    backgroundColor: '#2FA26D',
  },
  tagOrange: {
    backgroundColor: '#F08A24',
  },
  tagText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  detailActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  reviewCard: {
    backgroundColor: '#FAF4E5',
  },
  reviewHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#E7DAB8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#6A5B45',
  },
  reviewName: {
    fontSize: 20,
    fontWeight: '700',
  },
  reviewNotes: {
    marginTop: 10,
    marginBottom: 6,
    fontSize: 18,
    lineHeight: 26,
  },
  reviewListCard: {
    backgroundColor: '#FAF4E5',
    gap: 10,
  },
  reviewListTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  reviewListItem: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 10,
    gap: 4,
  },
  reviewListName: {
    fontWeight: '700',
  },
  writeReviewButton: {
    marginTop: 4,
    height: 58,
    borderRadius: 29,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  writeReviewText: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.22)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#FAF3E1',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
    gap: 10,
    maxHeight: '90%',
  },
  selectStarsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  selectStarBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFE4C9',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTagRow: {
    flexDirection: 'row',
    gap: 8,
  },
  stallBtn: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F1E7CF',
  },
  stallBtnActive: {
    borderColor: theme.colors.primary,
    backgroundColor: '#FFEBD9',
  },
  notesInput: {
    minHeight: 90,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    backgroundColor: '#F2EAD6',
    paddingHorizontal: 10,
    paddingVertical: 10,
    color: theme.colors.text,
    textAlignVertical: 'top',
  },
  modalButtonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  photoThumb: {
    width: 86,
    height: 86,
    borderRadius: 10,
    marginRight: 8,
    marginTop: 6,
  },
  reportRow: {
    gap: 10,
  },
  reportOption: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#F2EAD6',
  },
  blocker: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.62)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  errorBanner: {
    position: 'absolute',
    left: 12,
    right: 12,
    backgroundColor: '#FFE7E1',
    borderWidth: 1,
    borderColor: '#E8B8AE',
    borderRadius: 12,
    padding: 10,
  },
  errorText: {
    color: '#A32610',
  },
});
