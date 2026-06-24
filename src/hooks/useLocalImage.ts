import { useState, useEffect } from 'react';
import { get } from 'idb-keyval';

export function useLocalImage(coverUrl?: string, coverSource?: string) {
  const [localUrl, setLocalUrl] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;

    async function loadLocalImage() {
      if (coverSource === 'local' && coverUrl) {
        try {
          const blob = await get(coverUrl);
          if (blob instanceof Blob) {
            objectUrl = URL.createObjectURL(blob);
            setLocalUrl(objectUrl);
          } else {
            setLocalUrl(null);
          }
        } catch (error) {
          console.error('Failed to load local image:', error);
          setLocalUrl(null);
        }
      } else {
        setLocalUrl(null);
      }
    }

    loadLocalImage();

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [coverUrl, coverSource]);

  if (coverSource === 'local') {
    return localUrl;
  }
  
  return coverUrl;
}
