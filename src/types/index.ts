export type StallType = 'single' | 'multi';

export interface ReviewPhoto {
  downloadURL: string;
  storagePath: string;
  width: number;
  height: number;
  createdAtMs: number;
  uploadedBy: string | null;
}

export interface RestroomReview {
  id: string;
  restroomId: string;
  placeId: string;
  rating: number;
  cleanliness: number;
  safety: number;
  isAccessible: boolean;
  stallType: StallType;
  hasChangingTable: boolean;
  isPublic: boolean;
  isOpenNow: boolean;
  isOpen24Hours: boolean;
  notes: string;
  photos: ReviewPhoto[];
  createdAtMs: number;
}

export interface Restroom {
  id: string;
  placeId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  reviewCount: number;
  averageRating: number;
  averageCleanliness: number;
  averageSafety: number;
  latestReview?: Omit<RestroomReview, 'photos' | 'notes'> & { photoCount: number };
  coverPhoto?: ReviewPhoto;
}

export interface PlaceCandidate {
  placeId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

export interface ReviewDraft {
  rating: number;
  cleanliness: number;
  safety: number;
  isAccessible: boolean;
  stallType: StallType;
  hasChangingTable: boolean;
  isPublic: boolean;
  isOpenNow: boolean;
  isOpen24Hours: boolean;
  notes: string;
  photoUris: string[];
}
