import React, { useState } from 'react';
import { Bell, Loader, Send, Bug, FileWarning, Siren, Map, ExternalLink } from 'lucide-react';
import { agentApi } from '../lib/api';
import { useGoogleMaps } from '../hooks/useGoogleMaps';
import type { OutbreakPoint, AnimalLocation } from '../components/map/OutbreakMap';

// Dynamic import so the ~130 KB Maps bundle is only loaded when the
// component is actually rendered — not on initial app load.
import OutbreakMap from '../components/map/OutbreakMap';

// ── Typed data ────────────────────────────────────────────────────────────────
// In production these come from the /agents/run?intent=alert_outbreak_map
// endpoint, which queries the Neo4j graph for animal locations and the
// alert log for active outbreak coordinates.

const OUTBREAK_DATA: OutbreakPoint[] = [
  {
    id: 'OBK-001',
    lat: 3.0738, lng: 101.5183,
    severity: 'critical',
    pathogen: 'Avian Influenza H5N1',
    affectedSpecies: ['Hornbill', 'Mynah', 'Peacock'],
    radiusKm: 100,
    reportedAt: '2026-05-16 18:00 MYT',
    source: 'Malaysian DoV + WHO Alert',
  },
  {
    id: 'OBK-002',
    lat: 1.3521, lng: 103.8198,
    severity: 'medium',
    pathogen: 'Salmonella Typhimurium',
    affectedSpecies: ['Reptiles', 'Amphibians'],
    radiusKm: 25,
    reportedAt: '2026-05-14 09:00 SGT',
    source: 'AVS Singapore',
  },
  {
    id: 'OBK-003',
    lat: 13.7651, lng: 100.5062,
    severity: 'low',
    pathogen: 'Herpesvirus (Elephant)',
    affectedSpecies: ['Asian Elephant'],
    radiusKm: 15,
    reportedAt: '2026-05-10 14:00 ICT',
    source: 'Dusit Zoo Thailand',
  },
  {
    id: 'OBK-004',
    lat: -6.2088, lng: 106.8456,
    severity: 'high',
    pathogen: 'Foot-and-Mouth Disease',
    affectedSpecies: ['Ungulates', 'Bovines'],
    radiusKm: 50,
    reportedAt: '2026-05-15 11:00 WIB',
    source: 'Indonesian BPOM',
  },
];

const ANIMAL_DATA: AnimalLocation[] = [
  { id: 'A001', microchip: '982000411234567', species: 'Sumatran Orangutan', lat: 3.2115, lng: 101.6840, institution: 'Zoo Negara KL', healthStatus: 'under_observation' },
  { id: 'A002', microchip: '982000411234568', species: 'Bengal Tiger', lat: 1.4043, lng: 103.7930, institution: 'Singapore Zoo', healthStatus: 'healthy' },
  { id: 'A003', microchip: '982000411234569', species: 'Pygmy Slow Loris', lat: 1.4656, lng: 103.7661, institution: 'Night Safari SG', healthStatus: 'healthy' },
  { id: 'A004', microchip: '982000411234570', species: 'Javan Rhino', lat: -6.7461, lng: 105.3296, institution: 'Ujung Kulon Reserve', healthStatus: 'quarantined' },
  { id: 'A005', microchip: '982000411234571', species: 'Asian Elephant', lat: 13.7561, lng: 100.5114, institution: 'Dusit Zoo Bangkok', healthStatus: 'under_observation' },
  { id: 'A006', microchip: '982000411234572', species: 'Snow Leopard', lat: 24.9990, lng: 121.5816, institution: 'Taipei Zoo', healthStatus: 'healthy' },
];

// ── Alert types ───────────────────────────────────────────────────────────────

type AlertType = 'alert_outbreak' | 'alert_sla_breach' | 'alert_regulatory';

const alertTypes = [
  { id: 'alert_outbreak' as AlertType, label: 'Zoonotic Outbreak', icon: <Bug size={15} />, color: '#f04e6d' },
  { id: 'alert_sla_breach' as AlertType, label: 'SLA Breach', icon: <Siren size={15} />, color: '#f5a623' },
  { id: 'alert_regulatory' as AlertType, label: 'Regulatory Change', icon: <FileWarning size={15} />, color: '#4f8ef7' },
];

const demoAlerts = [
  { id: 'ALT-041', type: 'alert_outbreak', label: 'Zoonotic Outbreak', severity: 'HIGH', message: 'Avian influenza H5N1 detected in Selangor. 3 zoos and 12 clinics within 100km notified.', time: '18 min ago', badgeCls: 'badge-red', affected: '15 recipients', dot: '#f04e6d' },
  { id: 'ALT-040', type: 'alert_sla_breach', label: 'SLA Breach', severity: 'MEDIUM', message: 'Transfer TX-0089 (Pygmy Slow Loris) missed deadline. Escalated to department head.', time: '2h ago', badgeCls: 'badge-amber', affected: '3 recipients', dot: '#f5a623' },
  { id: 'ALT-039', type: 'alert_regulatory', label: 'Regulatory Change', severity: 'LOW', message: 'New CITES packaging requirements for live primates — 4 active blueprints updated automatically.', time: '1d ago', badgeCls: 'badge-blue', affected: '4 blueprints affected', dot: '#4f8ef7' },
];

// ── Component ─────────────────────────────────────────────────────────────────

const AlertCenter: React.FC = () => {
  const { status: mapsStatus } = useGoogleMaps();

  const [alertType, setAlertType] = useState<AlertType>('alert_outbreak');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnimal, setSelectedAnimal] = useState<AnimalLocation | null>(null);

  const handleSend = async () => {
    if (!message.trim()) return;
    setLoading(true); setSent(false); setError(null);
    try {
      const res = await agentApi.run(alertType, { user_input: message });
      setSent(res.data.success);
      if (!res.data.success) setError(res.data.error || 'Failed to send alert.');
    } catch {
      setError('Backend offline. Alert queued for retry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-up" style={{ padding: '2rem', maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ marginBottom: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: '0.2rem' }}>
            Alert <span className="g-green">Center</span>
          </h1>
          <p style={{ color: 'var(--text-2)', fontSize: '0.875rem' }}>
            Multi-channel notifications · Outbreak heatmap across SEA
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <span className={`badge ${mapsStatus === 'ready' ? 'badge-green' : mapsStatus === 'loading' ? 'badge-amber' : 'badge-neutral'}`} style={{ alignSelf: 'center' }}>
            <Map size={9} />
            {mapsStatus === 'ready' ? 'Maps live' : mapsStatus === 'loading' ? 'Maps loading' : 'Maps unconfigured'}
          </span>
        </div>
      </div>

      {/* ── Outbreak Map ── */}
      <div className="card" style={{ marginBottom: '1.5rem', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Map size={15} color="var(--red)" />
            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Zoonotic Risk Heatmap — Southeast Asia</span>
            <span className="badge badge-neutral" style={{ fontSize: '0.68rem' }}>Google Maps · Visualization API</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>{OUTBREAK_DATA.length} active outbreaks · {ANIMAL_DATA.length} tracked animals</span>
          </div>
        </div>

        {mapsStatus === 'ready' ? (
          <div style={{ padding: '1rem' }}>
            <OutbreakMap
              outbreaks={OUTBREAK_DATA}
              animals={ANIMAL_DATA}
              onAnimalSelect={setSelectedAnimal}
            />
            {selectedAnimal && (
              <div className="animate-up" style={{ marginTop: '0.75rem', padding: '0.75rem 1rem', background: 'rgba(0,220,130,0.05)', border: '1px solid rgba(0,220,130,0.2)', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.85rem' }}>
                  <span style={{ fontWeight: 600 }}>{selectedAnimal.species}</span>
                  <span style={{ color: 'var(--text-2)', marginLeft: '0.5rem' }}>at {selectedAnimal.institution}</span>
                  <span style={{ marginLeft: '0.75rem', fontSize: '0.75rem', color: 'var(--text-3)' }}>#{selectedAnimal.microchip}</span>
                </div>
                <button className="btn btn-ghost" style={{ fontSize: '0.78rem', padding: '0.3rem 0.75rem' }}>View passport</button>
              </div>
            )}
          </div>
        ) : mapsStatus === 'loading' ? (
          <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', color: 'var(--text-2)' }}>
            <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: '0.875rem' }}>Loading Google Maps…</span>
          </div>
        ) : (
          /* Fallback — useful even without the map; shows geographic risk data */
          <div style={{ padding: '1.25rem' }}>
            <div style={{ padding: '0.75rem 1rem', background: 'rgba(79,142,247,0.06)', border: '1px solid rgba(79,142,247,0.2)', borderRadius: 8, marginBottom: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '1rem' }}>ℹ</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.2rem' }}>Google Maps key not configured</div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-2)', lineHeight: 1.6 }}>
                  Add <code style={{ background: 'rgba(0,220,130,0.1)', color: 'var(--green)', padding: '0.1rem 0.35rem', borderRadius: 4, fontSize: '0.78rem' }}>VITE_GOOGLE_MAPS_API_KEY=your_key</code> to <code style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-1)', padding: '0.1rem 0.35rem', borderRadius: 4, fontSize: '0.78rem' }}>frontend/.env</code> to enable the heatmap. Enable the <strong>Maps JavaScript API</strong> and <strong>Maps Visualization API</strong> in your GCP project.
                </p>
                <a href="https://console.cloud.google.com/apis/library/maps-backend.googleapis.com" target="_blank" rel="noreferrer" className="btn btn-ghost" style={{ marginTop: '0.5rem', fontSize: '0.78rem', padding: '0.35rem 0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <ExternalLink size={11} /> Enable in GCP Console
                </a>
              </div>
            </div>
            {/* Tabular fallback — the data is still useful without the map */}
            <table className="data-table">
              <thead>
                <tr>
                  <th>Pathogen</th>
                  <th>Location (lat, lng)</th>
                  <th>Risk radius</th>
                  <th>Severity</th>
                  <th>Reported</th>
                </tr>
              </thead>
              <tbody>
                {OUTBREAK_DATA.map(o => (
                  <tr key={o.id}>
                    <td style={{ fontWeight: 600 }}>{o.pathogen}</td>
                    <td style={{ color: 'var(--text-2)', fontSize: '0.82rem', fontFamily: 'monospace' }}>{o.lat.toFixed(4)}, {o.lng.toFixed(4)}</td>
                    <td style={{ color: 'var(--text-2)' }}>{o.radiusKm} km</td>
                    <td><span className={`badge badge-${o.severity === 'critical' || o.severity === 'high' ? 'red' : o.severity === 'medium' ? 'amber' : 'blue'}`}>{o.severity}</span></td>
                    <td style={{ color: 'var(--text-2)', fontSize: '0.82rem' }}>{o.reportedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {/* Recent Alerts */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: '0.875rem' }}>Recent Alerts</div>
          {demoAlerts.map(a => (
            <div key={a.id} style={{ padding: '0.9rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.03)', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: a.dot, marginTop: 5, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                  <span className={`badge ${a.badgeCls}`}>{a.label}</span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-3)' }}>{a.id}</span>
                </div>
                <div style={{ fontSize: '0.83rem', color: 'var(--text-1)', lineHeight: 1.5, marginBottom: '0.2rem' }}>{a.message}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>{a.time} · {a.affected}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Send Alert */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.1rem' }}>
            <Bell size={15} color="var(--green)" />
            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Send New Alert</span>
          </div>

          <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.85rem', flexWrap: 'wrap' }}>
            {alertTypes.map(t => (
              <button key={t.id} onClick={() => setAlertType(t.id)} style={{
                display: 'flex', alignItems: 'center', gap: '0.35rem',
                padding: '0.4rem 0.75rem', borderRadius: 7, fontSize: '0.8rem', fontWeight: 500,
                border: alertType === t.id ? `1px solid ${t.color}50` : '1px solid var(--border)',
                background: alertType === t.id ? `${t.color}12` : 'transparent',
                color: alertType === t.id ? t.color : 'var(--text-2)',
                cursor: 'pointer', transition: 'all 0.15s',
              }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          <textarea
            className="input"
            rows={4}
            value={message}
            onChange={e => { setMessage(e.target.value); setSent(false); }}
            placeholder={
              alertType === 'alert_outbreak'
                ? 'e.g. "Avian influenza detected in Selangor. Alert all zoos and vets within 100km."'
                : alertType === 'alert_sla_breach'
                ? 'e.g. "SLA missed on TX-0092. Escalate to department head."'
                : 'e.g. "New CITES packaging requirements for live primates effective June 2026."'
            }
            style={{ resize: 'vertical', marginBottom: '0.75rem' }}
          />

          <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
            {['📧 SendGrid', '📱 Twilio SMS', '🔔 Push'].map(ch => (
              <div key={ch} style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 5, color: 'var(--text-3)' }}>{ch}</div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              className="btn btn-cta"
              onClick={handleSend}
              disabled={loading || !message.trim()}
              style={{ fontSize: '0.85rem', padding: '0.55rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem', opacity: !message.trim() ? 0.5 : 1 }}
            >
              {loading ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={14} />}
              {loading ? 'Sending…' : 'Send Alert'}
            </button>
            {sent && <span style={{ color: 'var(--green)', fontSize: '0.82rem' }}>✓ Dispatched</span>}
            {error && <span style={{ color: 'var(--amber)', fontSize: '0.8rem' }}>{error}</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertCenter;
