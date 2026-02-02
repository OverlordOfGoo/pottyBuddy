export interface Restroom {
  id: string;
  name: string;
  rating: number;
  cleanliness: number;
  safety: number;
  distance: number;
  isAccessible: boolean;
  hasChangingTable: boolean;
  isOpen: boolean;
  latitude: number;
  longitude: number;
}
