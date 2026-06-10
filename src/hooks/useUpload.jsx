import { useState, useCallback } from 'react';

/** Placeholder hook for future upload progress tracking. */
export function useUpload() {
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  const reset = useCallback(() => {
    setProgress(0);
    setUploading(false);
  }, []);

  return { progress, uploading, setProgress, setUploading, reset };
}
