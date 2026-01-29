import React from 'react';
//import for creating bottom tab navigator
import { createStackNavigator } from '@react-navigation/stack';
//import Ionicons for tab bar icons
import { Ionicons } from '@expo/vector-icons';

import MapScreen from '../screens/MapScreen.tsx';
import SearchScreen from '../screens/SearchScreen.tsx';
import FavoritesScreen from '../screens/FavoritesScreen.tsx';
import ProfileScreen from '../screens/ProfileScreen.tsx';


//defines all screens inside the bottom tab navigator
//each tab screen here has no route parameters AS of now.
export type TabParamList = {
  Map: undefined;
  Search: undefined;
  Favorites: undefined;
  Profile: undefined;
};

//Create the bottom tab navigator type with TabParamList
const Tab = createStackNavigator<TabParamList>();

export default function TabNavigator() {
  return (
    <Tab.Navigator
        //controls shared configuration for all tab screens
        //example: icons, header title alignment
        screenOptions={({ route }) => ({
            //controls the icon shown in the bottom tab bar.
            //maping each route name to a Ionicons icon.
            tabBarIcon: ({ color, size }: { color: string; size: number }) => {
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
        //define each tab screen
        <Tab.Screen name="Map" component={MapScreen} />
        <Tab.Screen name="Search" component={SearchScreen} />
        <Tab.Screen name="Favorites" component={FavoritesScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}