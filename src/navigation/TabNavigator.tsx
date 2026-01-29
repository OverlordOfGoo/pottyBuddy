import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import MapScreen from '../screens/MapScreen';
import SearchScreen from '../screens/SearchScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import ProfileScreen from '../screens/ProfileScreen';

export type TabParamList = {
  Map: undefined;
  Search: undefined;
  Favorites: undefined;
  Profile: undefined;
};

const Tab = createStackNavigator<TabParamList>();

export default function TabNavigator() {
  return (
    <Tab.Navigator
        screenOptions={({ route }) => ({
            tabBarIcon: ({ color, size }) => {
                const icons: Record<keyof TabParamList, keyof typeof Ionicons.glyphMap> = {
                    Map: 'map',
                    Search: 'search',
                    Favorites: 'heart',
                    Profile: 'person',
                };
                return <Ionicons name={icons[route.name]} size={size} color={color} />;
            },
            headerTitleAlign: 'center',
        })}
    >
        <Tab.Screen name="Map" component={MapScreen} />
        <Tab.Screen name="Search" component={SearchScreen} />
        <Tab.Screen name="Favorites" component={FavoritesScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}