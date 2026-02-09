import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RestroomProvider } from './src/context/RestroomContext';
import MapScreen from './src/screens/MapScreen';

export default function App() {
  return (
    <SafeAreaProvider>
      <RestroomProvider>
        <MapScreen />
      </RestroomProvider>
    </SafeAreaProvider>
  );
}

