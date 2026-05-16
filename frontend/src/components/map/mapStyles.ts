/**
 * Dark map style JSON for Google Maps.
 *
 * Applied at map init via the `styles` option — no third-party URL or
 * subscription required. Palette tuned to match the app's dark theme.
 */
export const darkMapStyle: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#0d1526' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0d1526' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#4d6585' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#1a2740' }] },
  { featureType: 'administrative.country', elementType: 'labels.text.fill', stylers: [{ color: '#8ba3c4' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#8ba3c4' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#4d6585' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#0d1f33' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#3d5a78' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1a2740' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#111d33' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#4d6585' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#1e3050' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#172540' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#6688aa' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#111d33' }] },
  { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#4d6585' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#050a14' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#2a4060' }] },
  { featureType: 'water', elementType: 'labels.text.stroke', stylers: [{ color: '#050a14' }] },
];
