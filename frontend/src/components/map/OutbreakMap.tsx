/// <reference types="@types/google.maps" />
/**
 * OutbreakMap — Google Maps heatmap component for zoonotic risk visualization.
 *
 * Architecture decisions:
 *  - Accepts typed props; all map business logic lives here, not in the page.
 *  - useRef holds the map instance. A new map is never created on re-render —
 *    only when the container ref changes (i.e., on mount/unmount).
 *  - The useEffect cleanup function removes all overlays before the component
 *    unmounts, preventing memory leaks from dangling Maps objects.
 *  - HeatmapLayer uses WeightedLocation so severity drives visual intensity,
 *    not just point density.
 *  - Risk circles are a separate overlay from the heatmap — they communicate
 *    the affected radius clearly, which a heatmap blob alone cannot do.
 *  - InfoWindows are created lazily (one shared instance, repositioned on click)
 *    rather than one per marker, which is the correct pattern for Maps.
 */

import React, { useEffect, useRef, useState } from 'react';
import { darkMapStyle } from './mapStyles';

// ── Data model ────────────────────────────────────────────────────────────────

export type OutbreakSeverity = 'low' | 'medium' | 'high' | 'critical';
export type AnimalHealthStatus = 'healthy' | 'under_observation' | 'quarantined';

export interface OutbreakPoint {
  id: string;
  lat: number;
  lng: number;
  severity: OutbreakSeverity;
  pathogen: string;
  affectedSpecies: string[];
  radiusKm: number;
  reportedAt: string;
  source: string;
}

export interface AnimalLocation {
  id: string;
  microchip: string;
  species: string;
  lat: number;
  lng: number;
  institution: string;
  healthStatus: AnimalHealthStatus;
}

interface OutbreakMapProps {
  outbreaks: OutbreakPoint[];
  animals: AnimalLocation[];
  /** Called when the user clicks an animal marker. */
  onAnimalSelect?: (animal: AnimalLocation) => void;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const SEVERITY_WEIGHT: Record<OutbreakSeverity, number> = {
  low: 0.25,
  medium: 0.5,
  high: 0.8,
  critical: 1.0,
};

const SEVERITY_CIRCLE_COLOR: Record<OutbreakSeverity, string> = {
  low: '#4f8ef7',
  medium: '#f5a623',
  high: '#f04e6d',
  critical: '#ff1744',
};

const HEALTH_PIN_COLOR: Record<AnimalHealthStatus, string> = {
  healthy: '#00dc82',
  under_observation: '#f5a623',
  quarantined: '#f04e6d',
};

// ── Component ──────────────────────────────────────────────────────────────────

const OutbreakMap: React.FC<OutbreakMapProps> = ({ outbreaks, animals, onAnimalSelect }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  // Overlay refs for cleanup on unmount.
  const heatmapRef = useRef<google.maps.visualization.HeatmapLayer | null>(null);
  const circlesRef = useRef<google.maps.Circle[]>([]);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  const [layers, setLayers] = useState({ heatmap: true, circles: true, animals: true });

  // ── Map initialisation ────────────────────────────────────────────────────

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    mapRef.current = new google.maps.Map(containerRef.current, {
      center: { lat: 4.5, lng: 109 },  // Centered on Southeast Asia
      zoom: 5,
      styles: darkMapStyle,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      zoomControlOptions: { position: google.maps.ControlPosition.RIGHT_CENTER },
    });

    // Shared InfoWindow — one instance repositioned on each click.
    infoWindowRef.current = new google.maps.InfoWindow();

    return () => {
      // Clean up all overlays. The map itself cannot be explicitly destroyed
      // but clearing overlays prevents listener/memory leaks.
      heatmapRef.current?.setMap(null);
      circlesRef.current.forEach(c => c.setMap(null));
      markersRef.current.forEach(m => m.setMap(null));
      infoWindowRef.current?.close();
    };
  }, []); // Empty deps — run exactly once on mount.

  // ── Heatmap layer ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (!mapRef.current) return;

    heatmapRef.current?.setMap(null); // Remove previous layer before rebuilding.

    const weightedData: google.maps.visualization.WeightedLocation[] = outbreaks.map(o => ({
      location: new google.maps.LatLng(o.lat, o.lng),
      weight: SEVERITY_WEIGHT[o.severity],
    }));

    heatmapRef.current = new google.maps.visualization.HeatmapLayer({
      data: weightedData,
      map: layers.heatmap ? mapRef.current : null,
      radius: 60,
      gradient: [
        'rgba(0,0,0,0)',
        'rgba(79,142,247,0.6)',
        'rgba(245,166,35,0.8)',
        'rgba(240,78,109,0.9)',
        'rgba(255,23,68,1)',
      ],
    });
  }, [outbreaks, layers.heatmap]);

  // ── Risk radius circles ───────────────────────────────────────────────────

  useEffect(() => {
    if (!mapRef.current) return;

    circlesRef.current.forEach(c => c.setMap(null));
    circlesRef.current = [];

    if (!layers.circles) return;

    circlesRef.current = outbreaks.map(o => {
      const color = SEVERITY_CIRCLE_COLOR[o.severity];

      const circle = new google.maps.Circle({
        map: mapRef.current!,
        center: { lat: o.lat, lng: o.lng },
        radius: o.radiusKm * 1000, // metres
        fillColor: color,
        fillOpacity: 0.08,
        strokeColor: color,
        strokeOpacity: 0.5,
        strokeWeight: 1.5,
        clickable: true,
      });

      circle.addListener('click', () => {
        infoWindowRef.current?.setContent(`
          <div style="font-family:Inter,sans-serif;padding:4px 2px;min-width:220px">
            <div style="font-weight:700;font-size:13px;margin-bottom:6px;color:#f04e6d">
              ⚠ ${o.pathogen}
            </div>
            <div style="font-size:12px;color:#8ba3c4;margin-bottom:4px">
              <strong style="color:#f2f8ff">Severity:</strong> ${o.severity.toUpperCase()}
            </div>
            <div style="font-size:12px;color:#8ba3c4;margin-bottom:4px">
              <strong style="color:#f2f8ff">Risk radius:</strong> ${o.radiusKm} km
            </div>
            <div style="font-size:12px;color:#8ba3c4;margin-bottom:4px">
              <strong style="color:#f2f8ff">Affected species:</strong> ${o.affectedSpecies.join(', ')}
            </div>
            <div style="font-size:12px;color:#8ba3c4;margin-bottom:4px">
              <strong style="color:#f2f8ff">Reported:</strong> ${o.reportedAt}
            </div>
            <div style="font-size:11px;color:#4d6585">Source: ${o.source}</div>
          </div>
        `);
        infoWindowRef.current?.setPosition({ lat: o.lat, lng: o.lng });
        infoWindowRef.current?.open(mapRef.current!);
      });

      return circle;
    });
  }, [outbreaks, layers.circles]);

  // ── Animal markers ────────────────────────────────────────────────────────

  useEffect(() => {
    if (!mapRef.current) return;

    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    if (!layers.animals) return;

    markersRef.current = animals.map(animal => {
      const color = HEALTH_PIN_COLOR[animal.healthStatus];

      // SVG pin — no external image request, renders instantly.
      const svgPin = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="32" viewBox="0 0 24 32">
          <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 20 12 20s12-11 12-20C24 5.4 18.6 0 12 0z"
                fill="${color}" fill-opacity="0.9"/>
          <circle cx="12" cy="12" r="5" fill="white" fill-opacity="0.9"/>
        </svg>`;

      const marker = new google.maps.Marker({
        map: mapRef.current!,
        position: { lat: animal.lat, lng: animal.lng },
        icon: {
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgPin)}`,
          scaledSize: new google.maps.Size(24, 32),
          anchor: new google.maps.Point(12, 32),
        },
        title: animal.species,
      });

      marker.addListener('click', () => {
        const statusLabel: Record<AnimalHealthStatus, string> = {
          healthy: '✓ Healthy',
          under_observation: '⚠ Under Observation',
          quarantined: '✕ Quarantined',
        };
        infoWindowRef.current?.setContent(`
          <div style="font-family:Inter,sans-serif;padding:4px 2px;min-width:200px">
            <div style="font-weight:700;font-size:13px;margin-bottom:6px;color:#f2f8ff">
              ${animal.species}
            </div>
            <div style="font-size:12px;color:#8ba3c4;margin-bottom:4px">
              <strong style="color:#f2f8ff">Institution:</strong> ${animal.institution}
            </div>
            <div style="font-size:12px;color:#8ba3c4;margin-bottom:4px">
              <strong style="color:#f2f8ff">Health:</strong>
              <span style="color:${color}">${statusLabel[animal.healthStatus]}</span>
            </div>
            <div style="font-size:11px;color:#4d6585">Microchip: ${animal.microchip}</div>
          </div>
        `);
        infoWindowRef.current?.open({ map: mapRef.current!, anchor: marker });
        onAnimalSelect?.(animal);
      });

      return marker;
    });
  }, [animals, layers.animals, onAnimalSelect]);

  // ── Layer toggle sync ─────────────────────────────────────────────────────

  useEffect(() => {
    heatmapRef.current?.setMap(layers.heatmap ? mapRef.current : null);
  }, [layers.heatmap]);

  useEffect(() => {
    circlesRef.current.forEach(c => c.setMap(layers.circles ? mapRef.current : null));
  }, [layers.circles]);

  useEffect(() => {
    markersRef.current.forEach(m => m.setMap(layers.animals ? mapRef.current : null));
  }, [layers.animals]);

  // ── Render ────────────────────────────────────────────────────────────────

  const toggleBtn = (key: keyof typeof layers, label: string, color: string) => (
    <button
      onClick={() => setLayers(l => ({ ...l, [key]: !l[key] }))}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.4rem',
        padding: '0.3rem 0.65rem', borderRadius: 6, fontSize: '0.72rem', fontWeight: 600,
        cursor: 'pointer', border: 'none', transition: 'all 0.15s',
        background: layers[key] ? `${color}20` : 'rgba(255,255,255,0.04)',
        color: layers[key] ? color : 'var(--text-3)',
        outline: layers[key] ? `1px solid ${color}40` : '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: layers[key] ? color : 'var(--text-3)', display: 'inline-block' }} />
      {label}
    </button>
  );

  return (
    <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
      {/* Layer controls — floating over the map */}
      <div style={{
        position: 'absolute', top: 12, left: 12, zIndex: 10,
        display: 'flex', gap: '0.35rem', flexWrap: 'wrap',
        background: 'rgba(4,8,15,0.75)', backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 8, padding: '0.4rem 0.5rem',
      }}>
        <span style={{ fontSize: '0.68rem', color: 'var(--text-3)', alignSelf: 'center', paddingRight: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Layers</span>
        {toggleBtn('heatmap', 'Risk Heatmap', '#f04e6d')}
        {toggleBtn('circles', 'Radius Zones', '#f5a623')}
        {toggleBtn('animals', 'Animals', '#00dc82')}
      </div>

      {/* Legend */}
      <div style={{
        position: 'absolute', bottom: 12, left: 12, zIndex: 10,
        background: 'rgba(4,8,15,0.75)', backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 8, padding: '0.6rem 0.75rem',
        display: 'flex', flexDirection: 'column', gap: '0.3rem',
      }}>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.1rem' }}>Severity</div>
        {(['critical', 'high', 'medium', 'low'] as OutbreakSeverity[]).map(s => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: SEVERITY_CIRCLE_COLOR[s] }} />
            <span style={{ fontSize: '0.72rem', color: 'var(--text-2)', textTransform: 'capitalize' }}>{s}</span>
          </div>
        ))}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: '0.25rem', paddingTop: '0.3rem' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.25rem' }}>Animal status</div>
          {(['healthy', 'under_observation', 'quarantined'] as AnimalHealthStatus[]).map(s => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: HEALTH_PIN_COLOR[s] }} />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-2)', textTransform: 'capitalize' }}>{s.replace('_', ' ')}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Map container — DO NOT add style transforms here; they break Maps rendering */}
      <div ref={containerRef} style={{ width: '100%', height: 440 }} />
    </div>
  );
};

export default OutbreakMap;
