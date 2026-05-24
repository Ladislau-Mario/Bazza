/**
 * src/pages/client/mainClient/home/hooks/useLocation.ts
 *
 * Hook que gere a localização GPS do cliente:
 *   - Pede permissão ao arranque
 *   - Obtém coordenadas actuais com alta precisão
 *   - Faz reverse-geocoding para obter o endereço legível
 *   - Monitoriza mudanças de posição em tempo real (watchPosition)
 *   - Expõe estado de loading e erros
 *
 * DEPENDÊNCIA:  npx expo install expo-location
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import * as Location from 'expo-location';
import type { LocationCoords } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// Tipos internos do hook
// ─────────────────────────────────────────────────────────────────────────────

export interface UseLocationReturn {
  /** Coordenadas actuais do cliente (null enquanto não obtidas). */
  myLocation: LocationCoords | null;
  /** Endereço legível obtido por reverse-geocoding. */
  myAddressLabel: string;
  /** true enquanto a permissão / posição inicial está a ser carregada. */
  loading: boolean;
  /** Mensagem de erro, se alguma coisa falhou. */
  error: string | null;
  /** Permissão foi concedida? */
  permissionGranted: boolean;
  /** Força uma nova leitura da posição actual. */
  refresh: () => Promise<void>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constante de fallback (Luanda centro)
// ─────────────────────────────────────────────────────────────────────────────

const LUANDA_FALLBACK: LocationCoords = {
  latitude: -8.8390,
  longitude: 13.2894,
  address: 'Luanda, Angola',
};

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useLocation(): UseLocationReturn {
  const [myLocation, setMyLocation] = useState<LocationCoords | null>(null);
  const [myAddressLabel, setMyAddressLabel] = useState('A obter localização...');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);

  /** Referência para o subscriber de watchPosition (cleanup no desmonte). */
  const watchRef = useRef<Location.LocationSubscription | null>(null);

  // ─── Reverse-geocoding ────────────────────────────────────────────────────
  const reverseGeocode = useCallback(async (coords: LocationCoords): Promise<string> => {
    try {
      const results = await Location.reverseGeocodeAsync({
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
      if (results.length > 0) {
        const r = results[0];
        const parts = [r.street, r.subregion, r.district, r.city].filter(Boolean);
        return parts.length > 0 ? parts.join(', ') : 'Minha localização actual';
      }
    } catch (_) {
      // Falha silenciosa — o endereço não é crítico
    }
    return 'Minha localização actual';
  }, []);

  // ─── Obter posição (usada no arranque e no refresh) ───────────────────────
  const fetchPosition = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Pedir permissão
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setPermissionGranted(false);
        setError('Permissão de localização negada. Activa nas definições.');
        setMyLocation(LUANDA_FALLBACK);
        setMyAddressLabel('Luanda, Angola');
        return;
      }
      setPermissionGranted(true);

      // 2. Posição actual (alta precisão)
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const coords: LocationCoords = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      };

      setMyLocation(coords);

      // 3. Reverse-geocoding
      const label = await reverseGeocode(coords);
      setMyAddressLabel(label);

      // 4. Monitorizar mudanças (para actualizar a posição enquanto o utilizador se move)
      if (watchRef.current) {
        watchRef.current.remove();
      }
      watchRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 20,       // actualiza a cada 20 metros
          timeInterval: 15_000,       // ou a cada 15 segundos
        },
        async (newPos) => {
          const newCoords: LocationCoords = {
            latitude: newPos.coords.latitude,
            longitude: newPos.coords.longitude,
          };
          setMyLocation(newCoords);
          // Não fazemos reverse-geocode a cada actualização (caro)
          // — apenas na primeira vez e no refresh manual.
        }
      );
    } catch (err: any) {
      setError(err?.message ?? 'Erro ao obter localização.');
      setMyLocation(LUANDA_FALLBACK);
      setMyAddressLabel('Luanda, Angola');
    } finally {
      setLoading(false);
    }
  }, [reverseGeocode]);

  // ─── Refresh público ──────────────────────────────────────────────────────
  const refresh = useCallback(async () => {
    await fetchPosition();
    // Após refresh, refaz o reverse-geocoding
    if (myLocation) {
      const label = await reverseGeocode(myLocation);
      setMyAddressLabel(label);
    }
  }, [fetchPosition, myLocation, reverseGeocode]);

  // ─── Arranque ─────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchPosition();
    return () => {
      // Limpa o watcher quando o componente desmonta
      watchRef.current?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    myLocation,
    myAddressLabel,
    loading,
    error,
    permissionGranted,
    refresh,
  };
}
