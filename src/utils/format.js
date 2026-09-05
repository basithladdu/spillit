/** Relative time label for feed cards and timestamps. */
export function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  if (Number.isNaN(diff)) return '';

  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;

  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;

  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;

  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/** Human-readable date for detail views. */
export function formatDate(dateStr, options = {}) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    ...options,
  });
}

/** Count distinct cities from memory address strings. */
export function uniqueCityCount(memories) {
  return new Set(
    memories
      .map((m) => m.address?.split(',').pop()?.trim())
      .filter(Boolean),
  ).size;
}

/** Haversine distance in km between two lat/lng pairs. */
export function distanceKm(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function isValidCoord(lat, lng) {
  const present = (value) => (typeof value === 'number' || typeof value === 'string') && String(value).trim() !== '';
  if (!present(lat) || !present(lng)) return false;
  const a = Number(lat);
  const b = Number(lng);
  return Number.isFinite(a) && Number.isFinite(b) && Math.abs(a) <= 90 && Math.abs(b) <= 180;
}

/** Basic email shape check for client-side form validation. */
export function isValidEmail(value) {
  const email = value?.trim() ?? '';
  return email.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Client-side password strength label for registration hints. */
export function getPasswordStrength(password) {
  if (!password) return { label: '', level: 0 };
  if (password.length < 6) return { label: 'Too short — need at least 6 characters', level: 1 };
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  if (score <= 1) return { label: 'Weak — try mixing letters and numbers', level: 2 };
  if (score <= 2) return { label: 'Fair', level: 3 };
  return { label: 'Strong', level: 4 };
}
