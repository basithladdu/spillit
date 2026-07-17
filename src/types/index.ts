/**
 * Global Type Definitions for Spillit
 */

// ============ Firestore Models ============

export interface Memory {
  id: string;
  caption: string;
  imageUrl: string;
  type?: 'Moment' | 'Crush' | 'Secret' | 'Laugh';
  lat: number;
  lng: number;
  address: string;
  anonymous: boolean;
  userId: string;
  upvotes: number;
  upvotedBy?: string[];
  ts: FirebaseFirestore.Timestamp;
  status?: 'live' | 'archived';
  colorChoice?: string;
  vibe?: string;
}

export interface MemoryInput {
  caption: string;
  imageUrl: string;
  type: 'Moment' | 'Crush' | 'Secret' | 'Laugh';
  lat: number;
  lng: number;
  address: string;
  anonymous: boolean;
}

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

export interface LocationData {
  lat: number;
  lng: number;
  address: string;
}

// ============ API/Backend Types ============

export interface VideoProcessorConfig {
  cloudinary: {
    cloudName: string;
    uploadPreset: string;
  };
  backend: {
    baseUrl: string;
    apiKey: string;
  };
  processing: {
    maxFileSize: number;
    allowedFormats: string[];
    confidenceThreshold: number;
  };
}

export interface VideoProcessRequest {
  videoUrl: string;
  confidence?: number;
}

export interface VideoDetection {
  frameIndex: number;
  timestamp: number;
  detections: Array<{
    class: string;
    confidence: number;
    bbox: [number, number, number, number];
  }>;
  frameUrl: string;
}

export interface VideoProcessResponse {
  success: boolean;
  videoId: string;
  detections: VideoDetection[];
  processedFrames: number;
  totalFrames: number;
  duration: number;
  error?: string;
}

// ============ UI Component Props ============

export interface MemoryCardProps {
  summaryData: Memory;
  setShowSummary: (show: boolean) => void;
}

export interface LocationVerifierProps {
  file: File | null;
  onLocationVerified: (location: LocationData) => void;
  className?: string;
}

export interface SpillMemoryModalProps {
  show: boolean;
  onClose: () => void;
  onSuccess: (memory: Memory) => void;
}

export interface NavbarProps {
  // No required props, but available for extension
}

export interface OnboardingTourProps {
  onComplete: () => void;
  targetRefs: Record<string, React.RefObject<HTMLElement>>;
  setShowForm: (show: boolean) => void;
}

export interface ToastProps {
  message: string;
  type?: 'error' | 'success';
  onClose: () => void;
}

// ============ React Hook Returns ============

export interface UseAuthReturn {
  currentUser: User | null;
  userRole?: 'admin' | 'user';
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export interface UseUploadReturn {
  uploading: boolean;
  progress: number;
  error: Error | null;
  upload: (file: File) => Promise<string>;
}

export interface UseReportsReturn {
  reports: Memory[];
  loading: boolean;
  error: Error | null;
  addReport: (report: MemoryInput) => Promise<string>;
  deleteReport: (id: string) => Promise<void>;
}

// ============ Error Types ============

export class APIError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export class FirebaseError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = 'FirebaseError';
  }
}

export class ValidationError extends Error {
  constructor(
    public field: string,
    message: string,
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

// ============ State Management Types ============

export interface FormState<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
}

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

// ============ Map Types ============

export interface MapViewState {
  latitude: number;
  longitude: number;
  zoom: number;
  bearing?: number;
  pitch?: number;
}

export interface MapStyle {
  name: string;
  id: string;
  color: string;
}

// ============ Filter/Sort Types ============

export interface FilterConfig {
  status?: 'live' | 'archived' | 'all';
  vibe?: string;
  searchQuery?: string;
}

export interface SortConfig {
  key: keyof Memory | 'ts';
  direction: 'asc' | 'desc';
}

// ============ Environment Types ============

declare global {
  interface ImportMetaEnv {
    VITE_FIREBASE_API_KEY: string;
    VITE_FIREBASE_AUTH_DOMAIN: string;
    VITE_FIREBASE_PROJECT_ID: string;
    VITE_FIREBASE_STORAGE_BUCKET: string;
    VITE_FIREBASE_MESSAGING_SENDER_ID: string;
    VITE_FIREBASE_APP_ID: string;
    VITE_MAPBOX_TOKEN: string;
    VITE_CLOUDINARY_CLOUD_NAME: string;
    VITE_CLOUDINARY_UPLOAD_PRESET: string;
    VITE_VIDEO_PROCESSOR_BASE_URL?: string;
    VITE_VIDEO_PROCESSOR_API_KEY?: string;
    VITE_ROBOFLOW_API_KEY?: string;
  }

  interface ImportMeta {
    env: ImportMetaEnv;
  }
}

export {};
