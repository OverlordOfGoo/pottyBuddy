import React from 'react';

// top level container for navigation
import { NavigationContainer } from '@react-navigation/native';

// stack navigator for screen transitions
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// import navigators and screens, for bottom tabs
import TabNavigator from './TabNavigator.tsx';

// import restroom detail screen
import RestroomDetailScreen from '../screens/RestroomDetailScreen.tsx';

// create stack navigator. 
// RootStackParamList defines the types for the routes in this navigator.
// Tabs: main tab based navigation
// ResttroomDetail: screen showing details for a specific restroom
export type RootStackParamList = {
  Tabs: undefined;
  RestroomDetail: { restroomId: string };
};

// create the stack navigator
const Stack = createNativeStackNavigator<RootStackParamList>();

//top level navigator
//app loads into tabs --> user navigates to restroom detail screen as needed
export default function RootNavigator() {
  return (
    <NavigationContainer>
        <Stack.Navigator>
            <Stack.Screen
                name="Tabs"
                component={TabNavigator}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="RestroomDetail"
                component={RestroomDetailScreen}
                options={{ title: 'Restroom' }}
            />
        </Stack.Navigator>
    </NavigationContainer>
  );
}

