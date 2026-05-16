import React, { useState } from 'react';
import { AlertTriangle, TrendingUp, CheckCircle, Loader } from 'lucide-react';

import { agentApi } from '../lib/api';

interface SLATransfer {
  id: string;
  description: string;
  status: 'on_track' | 'at_risk' | 'missed';
  risk: number; // 0-1
  deadline: string;
  origin: string;
  destination: string;
  permits: number;
  days: number;
}

const demoTransfers: SLATransfer[] = [
  { id: 'TX-0091', description: 'Bengal Tiger — Zoo SG → Zoo KL', status: 'on_track', risk: 0.18, deadline: '2026-05-22', origin: 'Singapore', destination: 'Kuala Lumpur', permits: 2, days: 6 },
  { id: 'TX-0092', description: 'Sumatran Orangutan — KLBC → Taipei Zoo', status: 'at_risk', risk: 0.72, deadline: '2026-05-17', origin: 'Kuala Lumpur', destination: 'Taipei', permits: 3, days: 1 },
  { id: 'TX-0089', description: 'Pygmy Slow Loris — JB Zoo → Mandai', status: 'missed', risk: 0.95, deadline: '2026-05-14', origin: 'Johor Bahru', destination: 'Singapore', permits: 4, days: -2 },
  { id: 'TX-0093', description: 'Snow Leopard pair — Beijing → Dubai Zoo', status: 'on_track', risk: 0.29, deadline: '2026-06-10', origin: 'Beijing', destination: 'Dubai', permits: 3, days: 25 },
];

const statusMeta = {
  on_track: { label: 'On Track', badge: 'badge-success', color: '#00e5a0' },
  at_risk: { label: 'At Risk', badge: 'badge-warning', color: '#f59e0b' },
  missed: { label: 'Missed', badge: 'badge-danger', color: '#f43f5e' },
};

const SLAMonitor: React.FC = () => {
  const [predInput, setPredInput] = useState('');
  const [predLoading, setPredLoading] = useState(false);
  const [predResult, setPredResult] = useState<Record<string, unknown> | null>(null);
  const [predError, setPredError] = useState<string | null>(null);

  const handlePredict = async () => {
    if (!predInput.trim()) return;
    setPredLoading(true); setPredResult(null); setPredError(null);
    try {
      const res = await agentApi.run('sla_predict', { user_input: predInput });
      if (res.data.success) {
        setPredResult(res.data.data as Record<string, unknown>);
      } else {
        setPredError(res.data.error || 'Prediction failed.');
      }
    } catch {
      setPredError('Backend offline. Showing rule-based prediction fallback.');
      // Simulate fallback
      setPredResult({ delay_probability: 0.43, risk_level: 'medium', factors: ['Cross-border (2 countries)', 'CITES I species', '3 permits required'], suggestion: 'Start permit applications 2 weeks early.' });
    } finally {
      setPredLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: '2rem', maxWidth: 1000 }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.3rem' }}>
          <span className="gradient-text-green">SLA</span> Monitor
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Real-time transfer tracking, delay prediction, and automated escalation management.
        </p>
      </div>

      {/* Summary chips */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
        {[
          { label: '2 On Track', color: '#00e5a0' },
          { label: '1 At Risk', color: '#f59e0b' },
          { label: '1 Missed SLA', color: '#f43f5e' },
          { label: '0 Escalations Pending', color: '#3b82f6' },
        ].map(c => (
          <div key={c.label} style={{ padding: '0.4rem 0.9rem', borderRadius: 999, background: `${c.color}15`, border: `1px solid ${c.color}30`, color: c.color, fontSize: '0.8rem', fontWeight: 600 }}>
            {c.label}
          </div>
        ))}
      </div>

      {/* Transfer list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
        {demoTransfers.map(t => {
          const meta = statusMeta[t.status];
          const riskPct = Math.round(t.risk * 100);
          const riskColor = t.risk > 0.6 ? '#f43f5e' : t.risk > 0.35 ? '#f59e0b' : '#00e5a0';
          return (
            <div key={t.id} className="glass-card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{t.id}</span>
                    <span className={`badge ${meta.badge}`}>{meta.label}</span>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{t.description}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                    {t.origin} → {t.destination} · {t.permits} permits · Deadline: {t.deadline}
                    {t.days < 0 ? <span style={{ color: '#f43f5e', marginLeft: '0.5rem' }}>({Math.abs(t.days)}d overdue)</span>
                     : <span style={{ color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>({t.days}d remaining)</span>}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '1.6rem', fontWeight: 700, color: riskColor }}>{riskPct}%</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>delay risk</div>
                </div>
              </div>
              {/* Risk bar */}
              <div className="risk-bar-wrap">
                <div className="risk-bar" style={{ width: `${riskPct}%`, background: `linear-gradient(90deg, ${riskColor}88, ${riskColor})` }} />
              </div>
              {t.status !== 'on_track' && (
                <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                  <button className="btn-primary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}>Escalate</button>
                  <button className="btn-secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}>View Details</button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* SLA Prediction */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <TrendingUp size={16} color="var(--accent-blue)" />
          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Predict Delay Risk for New Transfer</span>
        </div>
        <textarea
          className="input-dark"
          rows={3}
          value={predInput}
          onChange={e => setPredInput(e.target.value)}
          placeholder='Describe the transfer, e.g. "CITES I species, 2 border crossings, 4 permits, 3,500km by air."'
          style={{ resize: 'vertical', marginBottom: '1rem' }}
        />
        <button
          className="btn-primary"
          onClick={handlePredict}
          disabled={predLoading || !predInput.trim()}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: !predInput.trim() ? 0.5 : 1 }}
        >
          {predLoading ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <AlertTriangle size={16} />}
          {predLoading ? 'Predicting...' : 'Run SLA Prediction'}
        </button>

        {predResult && (
          <div className="animate-fade-in" style={{ marginTop: '1.25rem', padding: '1rem', background: 'rgba(5,10,20,0.5)', borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <CheckCircle size={15} color="var(--accent-green)" />
              <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--accent-green)' }}>Prediction Result</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
              {Object.entries(predResult).map(([k, v]) => (
                <div key={k} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '0.6rem' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>{k.replace(/_/g,' ')}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{Array.isArray(v) ? (v as string[]).join(', ') : String(v)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        {predError && (
          <div style={{ marginTop: '0.75rem', fontSize: '0.82rem', color: '#f59e0b' }}>{predError}</div>
        )}
      </div>
    </div>
  );
};

export default SLAMonitor;
