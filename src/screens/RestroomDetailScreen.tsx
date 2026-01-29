import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'RestroomDetail'>;

export default function RestroomDetailScreen({ route }: Props) {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>Restroom Detail Screen (Placeholder)</Text>
            <Text>restroomId: {route.params.restroomId}</Text>
        </View>
    );
}

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