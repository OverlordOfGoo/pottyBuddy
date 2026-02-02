import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Restroom } from '../types';

interface RestroomState {
  restrooms: Restroom[];
  loading: boolean;
  error: string | null;
}

type RestroomAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_RESTROOMS'; payload: Restroom[] }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'ADD_RESTROOM'; payload: Restroom };

const initialState: RestroomState = {
  restrooms: [],
  loading: false,
  error: null,
};

function restroomReducer(state: RestroomState, action: RestroomAction): RestroomState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_RESTROOMS':
      return { ...state, restrooms: action.payload, loading: false, error: null };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'ADD_RESTROOM':
      return { ...state, restrooms: [...state.restrooms, action.payload] };
    default:
      return state;
  }
}

interface RestroomContextType {
  state: RestroomState;
  fetchRestrooms: () => Promise<void>;
  addRestroom: (restroom: Restroom) => Promise<void>;
}

const RestroomContext = createContext<RestroomContextType | undefined>(undefined);

export const useRestrooms = () => {
  const context = useContext(RestroomContext);
  if (!context) {
    throw new Error('useRestrooms must be used within a RestroomProvider');
  }
  return context;
};

interface RestroomProviderProps {
  children: ReactNode;
}

export const RestroomProvider: React.FC<RestroomProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(restroomReducer, initialState);

  const fetchRestrooms = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const storedRestrooms = await AsyncStorage.getItem('restrooms');
      if (storedRestrooms) {
        const restrooms: Restroom[] = JSON.parse(storedRestrooms);
        dispatch({ type: 'SET_RESTROOMS', payload: restrooms });
      } else {
        // Mock data if none stored
        const mockRestrooms: Restroom[] = [
          {
            id: '1',
            name: 'Downtown Public Restroom',
            rating: 4.6,
            cleanliness: 4.8,
            safety: 4.4,
            distance: 0.3,
            isAccessible: true,
            hasChangingTable: true,
            isOpen: true,
            latitude: 40.7128,
            longitude: -74.0060,
          },
          {
            id: '2',
            name: 'Central Park Restroom',
            rating: 4.2,
            cleanliness: 4.5,
            safety: 4.0,
            distance: 0.8,
            isAccessible: false,
            hasChangingTable: false,
            isOpen: true,
            latitude: 40.7829,
            longitude: -73.9654,
          },
        ];
        await AsyncStorage.setItem('restrooms', JSON.stringify(mockRestrooms));
        dispatch({ type: 'SET_RESTROOMS', payload: mockRestrooms });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load restrooms' });
    }
  };

  const addRestroom = async (restroom: Restroom) => {
    try {
      const updatedRestrooms = [...state.restrooms, restroom];
      await AsyncStorage.setItem('restrooms', JSON.stringify(updatedRestrooms));
      dispatch({ type: 'ADD_RESTROOM', payload: restroom });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to add restroom' });
    }
  };

  useEffect(() => {
    fetchRestrooms();
  }, []);

  return (
    <RestroomContext.Provider value={{ state, fetchRestrooms, addRestroom }}>
      {children}
    </RestroomContext.Provider>
  );
};
