//entry point

//render top level navigator
import React from 'react';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
//RootNavigator contains the NavigationContainer +Stack + Tabs
  return <RootNavigator />;
}