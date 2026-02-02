//entry point

//render top level navigator
import React from 'react';
import RootNavigator from './src/navigation/RootNavigator';
import { RestroomProvider } from './src/context/RestroomContext';

export default function App() {
//RootNavigator contains the NavigationContainer +Stack + Tabs
  return (
    <RestroomProvider>
      <RootNavigator />
    </RestroomProvider>
  );
}

