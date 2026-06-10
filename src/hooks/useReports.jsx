import { useState } from 'react';

/** Placeholder hook for future report/moderation features. */
export function useReports() {
  const [reports] = useState([]);
  const [loading] = useState(false);

  return { reports, loading };
}
