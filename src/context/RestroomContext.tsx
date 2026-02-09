import React, { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import * as ImageManipulator from 'expo-image-manipulator';
import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, storage } from '../firebase';
import { PlaceCandidate, Restroom, RestroomReview, ReviewPhoto, StallType } from '../types';

type SubmitReviewInput = {
  place: PlaceCandidate;
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
};

type RestroomState = {
  restrooms: Restroom[];
  loading: boolean;
  error: string | null;
};

type RestroomContextType = {
  state: RestroomState;
  fetchRestrooms: () => Promise<void>;
  fetchReviews: (restroomId: string) => Promise<RestroomReview[]>;
  submitReview: (input: SubmitReviewInput) => Promise<{ restroom: Restroom; review: RestroomReview }>;
  ensureRestroomForPlace: (place: PlaceCandidate) => Promise<Restroom>;
  submitReport: (restroomId: string, reason: string) => Promise<void>;
};

const RestroomContext = createContext<RestroomContextType | undefined>(undefined);

export function useRestrooms() {
  const context = useContext(RestroomContext);
  if (!context) {
    throw new Error('useRestrooms must be used inside RestroomProvider');
  }
  return context;
}

function toNumber(value: unknown, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  return fallback;
}

function mapRestroom(docId: string, raw: Record<string, unknown>): Restroom {
  return {
    id: docId,
    placeId: String(raw.placeId ?? ''),
    name: String(raw.name ?? 'Unnamed place'),
    address: String(raw.address ?? ''),
    latitude: toNumber(raw.latitude),
    longitude: toNumber(raw.longitude),
    reviewCount: toNumber(raw.reviewCount),
    averageRating: toNumber(raw.averageRating),
    averageCleanliness: toNumber(raw.averageCleanliness),
    averageSafety: toNumber(raw.averageSafety),
    latestReview: raw.latestReview as Restroom['latestReview'],
    coverPhoto: raw.coverPhoto as Restroom['coverPhoto'],
  };
}

function mapReview(
  docId: string,
  restroomId: string,
  raw: Record<string, unknown>,
  fallbackPlaceId: string
): RestroomReview {
  return {
    id: docId,
    restroomId,
    placeId: String(raw.placeId ?? fallbackPlaceId),
    rating: toNumber(raw.rating),
    cleanliness: toNumber(raw.cleanliness),
    safety: toNumber(raw.safety),
    isAccessible: Boolean(raw.isAccessible),
    stallType: (raw.stallType === 'multi' ? 'multi' : 'single') as StallType,
    hasChangingTable: Boolean(raw.hasChangingTable),
    isPublic: Boolean(raw.isPublic),
    isOpenNow: Boolean(raw.isOpenNow),
    isOpen24Hours: Boolean(raw.isOpen24Hours),
    notes: String(raw.notes ?? ''),
    photos: (raw.photos as ReviewPhoto[]) ?? [],
    createdAtMs: toNumber(raw.createdAtMs),
  };
}

async function uploadReviewPhotos(
  restroomId: string,
  reviewId: string,
  photoUris: string[],
  shouldCreateCover: boolean
): Promise<{ photos: ReviewPhoto[]; coverPhoto?: ReviewPhoto }> {
  const photos: ReviewPhoto[] = [];
  let coverPhoto: ReviewPhoto | undefined;

  for (let i = 0; i < photoUris.length; i += 1) {
    const uri = photoUris[i];
    const compressed = await ImageManipulator.manipulateAsync(
      uri,
      [],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
    );

    const response = await fetch(compressed.uri);
    const blob = await response.blob();

    const now = Date.now();
    const random = Math.random().toString(36).slice(2, 8);
    const reviewPath = `reviews/${restroomId}/${reviewId}/${now}_${random}.jpg`;
    const reviewRef = ref(storage, reviewPath);
    await uploadBytes(reviewRef, blob, { contentType: 'image/jpeg' });
    const reviewUrl = await getDownloadURL(reviewRef);

    const photo: ReviewPhoto = {
      downloadURL: reviewUrl,
      storagePath: reviewPath,
      width: compressed.width ?? 0,
      height: compressed.height ?? 0,
      createdAtMs: now,
      uploadedBy: null,
    };

    photos.push(photo);

    if (!coverPhoto && shouldCreateCover && i === 0) {
      const coverPath = `restrooms/${restroomId}/${now}_${random}.jpg`;
      const coverRef = ref(storage, coverPath);
      await uploadBytes(coverRef, blob, { contentType: 'image/jpeg' });
      const coverUrl = await getDownloadURL(coverRef);
      coverPhoto = { ...photo, downloadURL: coverUrl, storagePath: coverPath };
    }
  }

  return { photos, coverPhoto };
}

export function RestroomProvider({ children }: { children: ReactNode }) {
  const [restrooms, setRestrooms] = useState<Restroom[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRestrooms = async () => {
    setLoading(true);
    setError(null);
    try {
      const snapshot = await getDocs(collection(db, 'restrooms'));
      const list = snapshot.docs.map((docSnap) =>
        mapRestroom(docSnap.id, docSnap.data() as Record<string, unknown>)
      );
      setRestrooms(list);
    } catch {
      setError('Failed to load restrooms.');
    } finally {
      setLoading(false);
    }
  };

  const ensureRestroomForPlace = async (place: PlaceCandidate): Promise<Restroom> => {
    const local = restrooms.find((item) => item.placeId === place.placeId);
    if (local) return local;

    const matches = await getDocs(
      query(collection(db, 'restrooms'), where('placeId', '==', place.placeId), limit(1))
    );

    if (!matches.empty) {
      const found = mapRestroom(
        matches.docs[0].id,
        matches.docs[0].data() as Record<string, unknown>
      );
      setRestrooms((prev) => {
        const exists = prev.some((item) => item.id === found.id);
        if (exists) return prev.map((item) => (item.id === found.id ? found : item));
        return [found, ...prev];
      });
      return found;
    }

    const newRef = doc(collection(db, 'restrooms'));
    const newRestroom: Restroom = {
      id: newRef.id,
      placeId: place.placeId,
      name: place.name,
      address: place.address,
      latitude: place.latitude,
      longitude: place.longitude,
      reviewCount: 0,
      averageRating: 0,
      averageCleanliness: 0,
      averageSafety: 0,
    };

    await setDoc(newRef, {
      placeId: newRestroom.placeId,
      name: newRestroom.name,
      address: newRestroom.address,
      latitude: newRestroom.latitude,
      longitude: newRestroom.longitude,
      reviewCount: 0,
      averageRating: 0,
      averageCleanliness: 0,
      averageSafety: 0,
      createdAtMs: Date.now(),
    });

    setRestrooms((prev) => [newRestroom, ...prev]);
    return newRestroom;
  };

  const fetchReviews = async (restroomId: string): Promise<RestroomReview[]> => {
    const restroom = restrooms.find((item) => item.id === restroomId);
    const snapshot = await getDocs(
      query(collection(db, 'restrooms', restroomId, 'reviews'), orderBy('createdAtMs', 'desc'))
    );

    return snapshot.docs.map((docSnap) =>
      mapReview(
        docSnap.id,
        restroomId,
        docSnap.data() as Record<string, unknown>,
        restroom?.placeId ?? ''
      )
    );
  };

  const submitReview = async (
    input: SubmitReviewInput
  ): Promise<{ restroom: Restroom; review: RestroomReview }> => {
    setError(null);

    try {
      const restroom = await ensureRestroomForPlace(input.place);
      const reviewRef = doc(collection(db, 'restrooms', restroom.id, 'reviews'));
      const createdAtMs = Date.now();

      const uploaded = await uploadReviewPhotos(
        restroom.id,
        reviewRef.id,
        input.photoUris,
        !restroom.coverPhoto
      );

      const review: RestroomReview = {
        id: reviewRef.id,
        restroomId: restroom.id,
        placeId: restroom.placeId,
        rating: input.rating,
        cleanliness: input.cleanliness,
        safety: input.safety,
        isAccessible: input.isAccessible,
        stallType: input.stallType,
        hasChangingTable: input.hasChangingTable,
        isPublic: input.isPublic,
        isOpenNow: input.isOpenNow || input.isOpen24Hours,
        isOpen24Hours: input.isOpen24Hours,
        notes: input.notes.trim(),
        photos: uploaded.photos,
        createdAtMs,
      };

      await setDoc(reviewRef, review);

      const nextCount = restroom.reviewCount + 1;
      const nextAverage =
        (restroom.averageRating * restroom.reviewCount + input.rating) / nextCount;
      const nextCleanliness =
        (restroom.averageCleanliness * restroom.reviewCount + input.cleanliness) / nextCount;
      const nextSafety =
        (restroom.averageSafety * restroom.reviewCount + input.safety) / nextCount;

      const updatedRestroom: Restroom = {
        ...restroom,
        reviewCount: nextCount,
        averageRating: Number(nextAverage.toFixed(2)),
        averageCleanliness: Number(nextCleanliness.toFixed(2)),
        averageSafety: Number(nextSafety.toFixed(2)),
        latestReview: {
          id: review.id,
          restroomId: review.restroomId,
          placeId: review.placeId,
          rating: review.rating,
          cleanliness: review.cleanliness,
          safety: review.safety,
          isAccessible: review.isAccessible,
          stallType: review.stallType,
          hasChangingTable: review.hasChangingTable,
          isPublic: review.isPublic,
          isOpenNow: review.isOpenNow,
          isOpen24Hours: review.isOpen24Hours,
          createdAtMs: review.createdAtMs,
          photoCount: review.photos.length,
        },
        coverPhoto: restroom.coverPhoto ?? uploaded.coverPhoto,
      };

      await updateDoc(doc(db, 'restrooms', restroom.id), {
        reviewCount: updatedRestroom.reviewCount,
        averageRating: updatedRestroom.averageRating,
        averageCleanliness: updatedRestroom.averageCleanliness,
        averageSafety: updatedRestroom.averageSafety,
        latestReview: updatedRestroom.latestReview,
        ...(updatedRestroom.coverPhoto ? { coverPhoto: updatedRestroom.coverPhoto } : {}),
        updatedAtMs: Date.now(),
      });

      setRestrooms((prev) =>
        prev.map((item) => (item.id === updatedRestroom.id ? updatedRestroom : item))
      );

      return { restroom: updatedRestroom, review };
    } catch {
      setError('Failed to save review.');
      throw new Error('submitReview failed');
    }
  };

  const submitReport = async (restroomId: string, reason: string) => {
    const reportRef = doc(collection(db, 'restrooms', restroomId, 'reports'));
    await setDoc(reportRef, {
      reason,
      createdAtMs: Date.now(),
    });
  };

  useEffect(() => {
    fetchRestrooms();
  }, []);

  return (
    <RestroomContext.Provider
      value={{
        state: { restrooms, loading, error },
        fetchRestrooms,
        fetchReviews,
        submitReview,
        ensureRestroomForPlace,
        submitReport,
      }}
    >
      {children}
    </RestroomContext.Provider>
  );
}
