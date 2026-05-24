// ─── Serviço de Rotas (Google Directions API) ──────────────────────────────
// Obtém rotas reais que seguem as estradas entre dois pontos.

import { Platform } from 'react-native';

const GOOGLE_API_KEY = 'AIzaSyCS49i-iw50bsLu-qta5K4aAl0HwMekXOU';

export interface LatLng {
  latitude: number;
  longitude: number;
}

// ─── Decodificador de Polyline do Google ────────────────────────────────────
function decodePolyline(encoded: string): LatLng[] {
  const points: LatLng[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let b: number;
    let shift = 0;
    let result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push({
      latitude: lat / 1e5,
      longitude: lng / 1e5,
    });
  }

  return points;
}

// ─── Obter rota entre dois pontos ───────────────────────────────────────────
export async function getRoute(
  origin: LatLng,
  destination: LatLng
): Promise<{ coords: LatLng[]; distanceMeters: number; durationSeconds: number } | null> {
  try {
    const url =
      `https://maps.googleapis.com/maps/api/directions/json` +
      `?origin=${origin.latitude},${origin.longitude}` +
      `&destination=${destination.latitude},${destination.longitude}` +
      `&mode=driving` +
      `&key=${GOOGLE_API_KEY}`;

    const res = await fetch(url);
    const json = await res.json();

    if (json.status !== 'OK' || !json.routes?.length) {
      console.warn('[routeService] Sem rotas:', json.status);
      return null;
    }

    const route = json.routes[0];
    const leg = route.legs[0];
    const encoded = route.overview_polyline.points;
    const coords = decodePolyline(encoded);

    return {
      coords,
      distanceMeters: leg.distance.value,
      durationSeconds: leg.duration.value,
    };
  } catch (err) {
    console.warn('[routeService] Erro ao obter rota:', err);
    return null;
  }
}
