/**
 * Image optimization and utility functions
 */

export interface ImageOptimizationOptions {
  width?: number;
  quality?: number;
  format?: 'auto' | 'webp' | 'avif' | 'jpg';
}

/**
 * Generate optimized image URL using Cloudinary
 */
export function getOptimizedImageUrl(
  url: string,
  width: number = 800,
  options: ImageOptimizationOptions = {},
): string {
  if (!url) return '';

  // Already optimized or not from Cloudinary
  if (!url.includes('cloudinary')) {
    return url;
  }

  const {
    quality = 80,
    format = 'auto',
  } = options;

  // Extract cloudinary path
  const cloudinaryMatch = url.match(/cloudinary\.com\/.*?(v\d+\/.*)/);
  if (!cloudinaryMatch) return url;

  const path = cloudinaryMatch[1];
  const transformations = [
    `w_${width}`,
    `q_${quality}`,
    `f_${format}`,
    'c_fill',
  ].join(',');

  return `https://res.cloudinary.com/${transformations}/${path}`;
}

/**
 * Get responsive image srcset
 */
export function getImageSrcSet(url: string, format: string = 'jpg'): string {
  const sizes = [400, 800, 1200, 1600];
  return sizes
    .map((size) => `${getOptimizedImageUrl(url, size)} ${size}w`)
    .join(', ');
}

/**
 * Preload image
 */
export function preloadImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to preload image: ${url}`));
    img.src = url;
  });
}

/**
 * Lazy load image observer
 */
export function setupLazyLoadObserver(selector: string = 'img[data-lazy]') {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return null;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        const src = img.dataset.lazy;
        if (src) {
          img.src = src;
          img.removeAttribute('data-lazy');
          observer.unobserve(img);
        }
      }
    });
  });

  document.querySelectorAll(selector).forEach((img) => {
    observer.observe(img);
  });

  return observer;
}

/**
 * Compress image client-side
 */
export async function compressImage(
  file: File,
  options: {
    maxSizeMB?: number;
    maxWidthOrHeight?: number;
    useWebWorker?: boolean;
  } = {},
): Promise<File> {
  try {
    // Dynamically import compression library
    const { default: imageCompression } = await import('browser-image-compression');

    const compressed = await imageCompression(file, {
      maxSizeMB: options.maxSizeMB || 0.5,
      maxWidthOrHeight: options.maxWidthOrHeight || 1280,
      useWebWorker: options.useWebWorker ?? true,
    });

    return new File([compressed], file.name, { type: 'image/jpeg' });
  } catch (error) {
    console.error('Image compression failed, using original', error);
    return file;
  }
}

/**
 * Calculate aspect ratio
 */
export function getAspectRatio(width: number, height: number): string {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(width, height);
  return `${width / divisor}/${height / divisor}`;
}

/**
 * Generate blurred image placeholder (LQIP)
 */
export function generateBlurPlaceholder(color: string = '#e5e7eb'): string {
  // Generate a small blurred SVG placeholder
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect fill='${encodeURIComponent(color)}' width='400' height='300'/%3E%3Cfilter id='b'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.5' numOctaves='3' result='noise'/%3E%3C/filter%3E%3Crect fill='${encodeURIComponent(color)}' width='400' height='300' filter='url(%23b)' opacity='.05'/%3E%3C/svg%3E`;
}

/**
 * Validate image file
 */
export function validateImageFile(
  file: File,
  options: {
    maxSizeMB?: number;
    allowedFormats?: string[];
  } = {},
): { valid: boolean; error?: string } {
  const maxSize = (options.maxSizeMB || 10) * 1024 * 1024;
  const allowed = options.allowedFormats || ['image/jpeg', 'image/png', 'image/webp'];

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `Image is too large. Maximum size is ${options.maxSizeMB}MB.`,
    };
  }

  if (!allowed.includes(file.type)) {
    return {
      valid: false,
      error: `Image format not supported. Allowed: ${allowed.join(', ')}`,
    };
  }

  return { valid: true };
}
