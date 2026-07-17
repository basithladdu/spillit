/**
 * Error Handling Utilities for Production
 */

import { APIError, FirebaseError, ValidationError } from '@/types';

/**
 * Firebase Error Handler
 * Maps Firebase error codes to user-friendly messages
 */
export function handleFirebaseError(error: any): FirebaseError {
  const code = error?.code || 'unknown';
  const message = getFirebaseErrorMessage(code, error?.message);
  return new FirebaseError(code, message);
}

function getFirebaseErrorMessage(code: string, fallback?: string): string {
  const errorMap: Record<string, string> = {
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/weak-password': 'Password is too weak. Use at least 6 characters.',
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/too-many-requests':
      'Too many login attempts. Please try again later.',
    'auth/operation-not-allowed': 'Email/password authentication is disabled.',
    'permission-denied': 'You do not have permission to perform this action.',
    'not-found': 'The requested item was not found.',
    'already-exists': 'This item already exists.',
    'resource-exhausted': 'Resource limit exceeded. Try again later.',
    'unavailable': 'Service temporarily unavailable. Try again later.',
  };

  return errorMap[code] || fallback || 'An error occurred. Please try again.';
}

/**
 * API Error Handler
 * Maps HTTP status codes to user-friendly messages
 */
export function handleAPIError(error: any): APIError {
  const statusCode = error?.status || 500;
  const code = error?.code || `HTTP_${statusCode}`;
  const message = getAPIErrorMessage(statusCode, error?.message);
  return new APIError(statusCode, code, message);
}

function getAPIErrorMessage(statusCode: number, fallback?: string): string {
  const errorMap: Record<number, string> = {
    400: 'Bad request. Please check your input.',
    401: 'Please log in to continue.',
    403: 'You do not have permission to perform this action.',
    404: 'The requested resource was not found.',
    409: 'A conflict occurred. This item may already exist.',
    429: 'Too many requests. Please wait before trying again.',
    500: 'Server error. Our team has been notified.',
    502: 'Bad gateway. Please try again later.',
    503: 'Service temporarily unavailable. Please try again later.',
  };

  return errorMap[statusCode] || fallback || 'An unexpected error occurred.';
}

/**
 * Validation Error Handler
 */
export function handleValidationError(
  field: string,
  value: any,
  rules: ValidationRule[],
): ValidationError | null {
  for (const rule of rules) {
    if (!rule.validate(value)) {
      return new ValidationError(field, rule.message);
    }
  }
  return null;
}

export interface ValidationRule {
  validate: (value: any) => boolean;
  message: string;
}

/**
 * Validation Rules
 */
export const ValidationRules = {
  email: {
    validate: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message: 'Please enter a valid email address.',
  },
  required: {
    validate: (value: any) => value !== null && value !== undefined && value !== '',
    message: 'This field is required.',
  },
  minLength: (min: number) => ({
    validate: (value: string) => value?.length >= min,
    message: `Minimum ${min} characters required.`,
  }),
  maxLength: (max: number) => ({
    validate: (value: string) => value?.length <= max,
    message: `Maximum ${max} characters allowed.`,
  }),
  url: {
    validate: (value: string) => {
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    message: 'Please enter a valid URL.',
  },
  latitude: {
    validate: (value: number) => value >= -90 && value <= 90,
    message: 'Latitude must be between -90 and 90.',
  },
  longitude: {
    validate: (value: number) => value >= -180 && value <= 180,
    message: 'Longitude must be between -180 and 180.',
  },
};

/**
 * Safe JSON Parse with Type Guard
 */
export function safeJsonParse<T>(
  json: string,
  fallback: T,
): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    console.error('Failed to parse JSON:', json);
    return fallback;
  }
}

/**
 * Safe Local Storage Operations
 */
export const safeStorage = {
  getItem<T>(key: string, fallback: T): T {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : fallback;
    } catch {
      return fallback;
    }
  },

  setItem<T>(key: string, value: T): boolean {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      console.error('Failed to set localStorage item:', key);
      return false;
    }
  },

  removeItem(key: string): boolean {
    try {
      localStorage.removeItem(key);
      return true;
    } catch {
      console.error('Failed to remove localStorage item:', key);
      return false;
    }
  },
};

/**
 * Async Error Wrapper for Promise-based operations
 */
export async function asyncWrapper<T>(
  fn: () => Promise<T>,
  onError?: (error: Error) => void,
): Promise<[T | null, Error | null]> {
  try {
    const data = await fn();
    return [data, null];
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    onError?.(err);
    return [null, err];
  }
}

/**
 * Retry Logic for Failing Operations
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delayMs: number = 1000,
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
      }
    }
  }

  throw lastError || new Error('Max retry attempts reached');
}

/**
 * Rate Limiter
 */
export class RateLimiter {
  private lastCallTime = 0;
  private cooldownMs: number;

  constructor(cooldownMs: number = 1000) {
    this.cooldownMs = cooldownMs;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastCallTime;

    if (timeSinceLastCall < this.cooldownMs) {
      await new Promise((resolve) =>
        setTimeout(resolve, this.cooldownMs - timeSinceLastCall),
      );
    }

    this.lastCallTime = Date.now();
    return fn();
  }
}

/**
 * Debounce Function with Type Safety
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delayMs: number,
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delayMs);
  };
}

/**
 * Throttle Function with Type Safety
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  delayMs: number,
): (...args: Parameters<T>) => void {
  let lastCallTime = 0;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCallTime >= delayMs) {
      fn(...args);
      lastCallTime = now;
    }
  };
}
