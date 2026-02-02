import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AppText from '../components/AppText';
import AppButton from '../components/AppButton';
import AppInput from '../components/AppInput';
import Card from '../components/Card';
import { theme } from '../theme/theme';
import { useRestrooms } from '../context/RestroomContext';
import { Restroom } from '../types';

// AddRestroomScreen allows users to submit new restrooms
//  Form for adding restroom details with validation
export default function AddRestroomScreen() {
  const { addRestroom } = useRestrooms();
  const navigation = useNavigation();
  const [formData, setFormData] = useState({
    name: '',
    latitude: '',
    longitude: '',
    isAccessible: false,
    hasChangingTable: false,
    isOpen: true,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    // Validation
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter a restroom name');
      return;
    }

    const lat = parseFloat(formData.latitude);
    const lng = parseFloat(formData.longitude);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      Alert.alert('Error', 'Please enter a valid latitude (-90 to 90)');
      return;
    }

    if (isNaN(lng) || lng < -180 || lng > 180) {
      Alert.alert('Error', 'Please enter a valid longitude (-180 to 180)');
      return;
    }

    setLoading(true);
    try {
      const newRestroom: Restroom = {
        id: Date.now().toString(),
        name: formData.name.trim(),
        rating: 0,
        cleanliness: 0,
        safety: 0,
        distance: 0, // Will be calculated based on user location
        isAccessible: formData.isAccessible,
        hasChangingTable: formData.hasChangingTable,
        isOpen: formData.isOpen,
        latitude: lat,
        longitude: lng,
      };

      await addRestroom(newRestroom);
      Alert.alert('Success', 'Restroom added successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to add restroom. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <AppText variant="h1">Add Restroom</AppText>
        <AppText muted>Help others find clean restrooms</AppText>
      </View>

      <Card>
        <AppText variant="h2" style={{ marginBottom: theme.spacing.md }}>Basic Information</AppText>

        <AppInput
          label="Restroom Name"
          placeholder="e.g., Downtown Public Restroom"
          value={formData.name}
          onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
        />

        <AppInput
          label="Latitude"
          placeholder="e.g., 40.7128"
          value={formData.latitude}
          onChangeText={(text) => setFormData(prev => ({ ...prev, latitude: text }))}
          keyboardType="numeric"
        />

        <AppInput
          label="Longitude"
          placeholder="e.g., -74.0060"
          value={formData.longitude}
          onChangeText={(text) => setFormData(prev => ({ ...prev, longitude: text }))}
          keyboardType="numeric"
        />
      </Card>

      <Card>
        <AppText variant="h2" style={{ marginBottom: theme.spacing.md }}>Amenities</AppText>

        <View style={styles.checkboxContainer}>
          <AppButton
            title={formData.isAccessible ? '✓ Wheelchair Accessible' : 'Wheelchair Accessible'}
            variant={formData.isAccessible ? 'primary' : 'outline'}
            onPress={() => setFormData(prev => ({ ...prev, isAccessible: !prev.isAccessible }))}
            style={{ marginBottom: theme.spacing.sm }}
          />
          <AppButton
            title={formData.hasChangingTable ? '✓ Changing Table' : 'Changing Table'}
            variant={formData.hasChangingTable ? 'primary' : 'outline'}
            onPress={() => setFormData(prev => ({ ...prev, hasChangingTable: !prev.hasChangingTable }))}
            style={{ marginBottom: theme.spacing.sm }}
          />
          <AppButton
            title={formData.isOpen ? '✓ Currently Open' : 'Currently Closed'}
            variant={formData.isOpen ? 'primary' : 'outline'}
            onPress={() => setFormData(prev => ({ ...prev, isOpen: !prev.isOpen }))}
          />
        </View>
      </Card>

      <View style={styles.buttonContainer}>
        <AppButton
          title="Cancel"
          variant="ghost"
          onPress={() => navigation.goBack()}
          style={{ flex: 1, marginRight: theme.spacing.sm }}
        />
        <AppButton
          title={loading ? 'Adding...' : 'Add Restroom'}
          onPress={handleSubmit}
          disabled={loading}
          style={{ flex: 1, marginLeft: theme.spacing.sm }}
        />
      </View>
    </ScrollView>
  );
}

// Styles for the AddRestroomScreen component
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  header: { padding: theme.spacing.lg, paddingBottom: theme.spacing.md },
  checkboxContainer: { gap: theme.spacing.sm },
  buttonContainer: {
    flexDirection: 'row',
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
});
