import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
// Import types for navigation
import { NativeStackScreenProps } from '@react-navigation/native-stack';
// Import the RootStackParamList to type the route params
import { RootStackParamList } from '../navigation/RootNavigator';

// Define the props type for the RestroomDetailScreen
type Props = NativeStackScreenProps<RootStackParamList, 'RestroomDetail'>;

// RestroomDetailScreen is a placeholder for the restroom detail feature
export default function RestroomDetailScreen({ route }: Props) {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>Restroom Detail Screen (Placeholder)</Text>
            <Text>restroomId: {route.params.restroomId}</Text>
        </View>
    );
}

// Styles for the RestroomDetailScreen component
const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: { 
        fontSize: 18,
        marginBottom: 8 
    },
});