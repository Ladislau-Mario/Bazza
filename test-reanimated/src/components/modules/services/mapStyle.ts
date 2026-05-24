// ─── Estilo de mapa partilhado (estilo Uber/Yango dark) ────────────────────
// Usado pelo cliente e pelo deliver para manter consistência visual.

export const MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#303E4D' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#FFFFFF' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1F2933' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#3D5166' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#1F2933' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#FFFFFF' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#4A6080' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#1a2a3a' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#2A3A4A' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#FFFFFF' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2A3A4A' }] },
  { featureType: 'administrative', elementType: 'labels.text.fill', stylers: [{ color: '#FFFFFF' }] },
];

// Camera defaults para visão 3D inclinada
export const MAP_CAMERA_DEFAULTS = {
  pitch: 45,
  heading: 0,
  zoom: 15,
};
