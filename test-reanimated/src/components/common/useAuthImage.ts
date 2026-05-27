// src/components/common/useAuthImage.ts
import { useState, useEffect } from 'react';
import { getIdToken } from '../modules/services/firebase-token';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.43.220:3000';

/**
 * Carrega imagem autenticada via XMLHttpRequest (mais fiável no React Native).
 */
export function useAuthImage(url: string | null) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!url) {
      setDataUrl(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(false);
    setDataUrl(null);

    const load = async () => {
      try {
        const token = await getIdToken();
        const fullUrl = `${BASE_URL}${url}`;

        const base64 = await new Promise<string>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('GET', fullUrl);
          xhr.responseType = 'arraybuffer';

          if (token) {
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
          }

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const bytes = new Uint8Array(xhr.response as ArrayBuffer);
                let binary = '';
                const chunkSize = 8192;
                for (let i = 0; i < bytes.length; i += chunkSize) {
                  const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
                  binary += String.fromCharCode.apply(null, chunk as any);
                }
                resolve(btoa(binary));
              } catch {
                reject(new Error('decode failed'));
              }
            } else {
              reject(new Error(`HTTP ${xhr.status}`));
            }
          };

          xhr.onerror = () => reject(new Error('network error'));
          xhr.send();
        });

        if (!cancelled) {
          const contentType = 'image/jpeg'; // fallback
          setDataUrl(`data:${contentType};base64,${base64}`);
        }
      } catch (e) {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [url]);

  return { dataUrl, loading, error };
}
