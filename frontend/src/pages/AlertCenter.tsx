import React, { useState } from 'react';
import { Bell, Loader, Send, Bug, FileWarning, Siren } from 'lucide-react';
import { agentApi } from '../lib/api';

type AlertType = 'alert_outbreak' | 'alert_sla_breach' | 'alert_regulatory';

const alertTypes = [
  { id: 'alert_outbreak' as AlertType, label: 'Zoonotic Outbreak', icon: <Bug size={16} />, color: '#f43f5e' },
  { id: 'alert_sla_breach' as AlertType, label: 'SLA Breach', icon: <Siren size={16} />, color: '#f59e0b' },
  { id: 'alert_regulatory' as AlertType, label: 'Regulatory Change', icon: <FileWarning size={16} />, color: '#3b82f6' },
];

const demoAlerts = [
  {
    id: 'ALT-041',
    type: 'alert_outbreak',
    label: 'Zoonotic Outbreak',
    severity: 'HIGH',
    message: 'Avian influenza H5N1 detected in Selangor. 3 zoos and 12 clinics within 100km notified.',
    time: '18 min ago',
    badge: 'badge-danger',
    affected: '15 recipients',
  },
  {
    id: 'ALT-040',
    type: 'alert_sla_breach',
    label: 'SLA Breach',
    severity: 'MEDIUM',
    message: 'Transfer TX-0089 (Pygmy Slow Loris) missed deadline. Escalated to department head.',
    time: '2h ago',
    badge: 'badge-warning',
    affected: '3 recipients',
  },
  {
    id: 'ALT-039',
    type: 'alert_regulatory',
    label: 'Regulatory Change',
    severity: 'LOW',
    message: 'New CITES packaging requirements for live primates — 4 active blueprints updated automatically.',
    time: '1d ago',
    badge: 'badge-info',
    affected: '4 blueprints affected',
  },
];

const AlertCenter: React.FC = () => {
  const [alertType, setAlertType] = useState<AlertType>('alert_outbreak');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    if (!message.trim()) return;
    setLoading(true); setSent(false); setError(null);
    try {
      const res = await agentApi.run(alertType, { user_input: message });
      if (res.data.success) {
        setSent(true);
      } else {
        setError(res.data.error || 'Failed to send alert.');
      }
    } catch {
      setError('Backend offline. Alert would be queued for retry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: '2rem', maxWidth: 900 }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.3rem' }}>
          <span className="gradient-text-green">Alert</span> Center
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Multi-channel notifications via Email (SendGrid), SMS (Twilio), and Push (Expo) for SLA breaches, outbreaks, and regulatory changes.
        </p>
      </div>

      {/* Recent Alerts */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.75rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Recent Alerts</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {demoAlerts.map(a => (
            <div key={a.id} className="glass-card" style={{ padding: '1.1rem 1.25rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: a.badge === 'badge-danger' ? '#f43f5e' : a.badge === 'badge-warning' ? '#f59e0b' : '#3b82f6', marginTop: 5, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
                  <span className={`badge ${a.badge}`}>{a.label}</span>
                  <span style={{ fontSize: '0.72rem', padding: '0.1rem 0.4rem', borderRadius: 4, background: 'rgba(255,255,255,0.04)', color: 'var(--text-secondary)' }}>SEVERITY: {a.severity}</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{a.id}</span>
                </div>
                <div style={{ fontSize: '0.87rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{a.message}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{a.time} · {a.affected}</div>
              </div>
              <button className="btn-secondary" style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem', flexShrink: 0 }}>Details</button>
            </div>
          ))}
        </div>
      </div>

      {/* Send Alert */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <Bell size={16} color="var(--accent-green)" />
          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Send New Alert</span>
        </div>

        {/* Type selector */}
        <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          {alertTypes.map(t => (
            <button
              key={t.id}
              onClick={() => setAlertType(t.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.5rem 0.9rem', borderRadius: 8,
                border: alertType === t.id ? `1px solid ${t.color}60` : '1px solid var(--border-subtle)',
                background: alertType === t.id ? `${t.color}12` : 'transparent',
                color: alertType === t.id ? t.color : 'var(--text-secondary)',
                cursor: 'pointer', fontSize: '0.82rem', fontWeight: 500,
                transition: 'all 0.2s',
              }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <textarea
          className="input-dark"
          rows={3}
          value={message}
          onChange={e => { setMessage(e.target.value); setSent(false); }}
          placeholder={
            alertType === 'alert_outbreak' ? 'e.g. "Avian influenza detected in X. Alert all zoos and vets within 100km."'
            : alertType === 'alert_sla_breach' ? 'e.g. "SLA missed on transfer TX-0092. Escalate to manager."'
            : 'e.g. "New CITES packaging requirements for live primates effective June 2026."'
          }
          style={{ resize: 'vertical', marginBottom: '1rem' }}
        />

        {/* Channel pills */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          {['📧 SendGrid Email', '📱 Twilio SMS', '🔔 Expo Push'].map(ch => (
            <div key={ch} style={{ fontSize: '0.78rem', padding: '0.25rem 0.65rem', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-secondary)' }}>{ch}</div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            className="btn-primary"
            onClick={handleSend}
            disabled={loading || !message.trim()}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: !message.trim() ? 0.5 : 1 }}
          >
            {loading ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={16} />}
            {loading ? 'Sending...' : 'Send Alert'}
          </button>
          {sent && <span style={{ color: 'var(--accent-green)', fontSize: '0.85rem' }}>✓ Alert dispatched successfully</span>}
          {error && <span style={{ color: '#f59e0b', fontSize: '0.82rem' }}>{error}</span>}
        </div>
      </div>

      {/* Channel info */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginTop: '1.25rem' }}>
        {[
          { icon: '📧', label: 'Email', detail: 'via SendGrid API', status: 'Configured' },
          { icon: '📱', label: 'SMS', detail: 'via Twilio API', status: 'Configured' },
          { icon: '🔔', label: 'Push', detail: 'via Expo Notifications', status: 'Configured' },
          { icon: '🔗', label: 'Webhook', detail: 'to Government Agency APIs', status: 'Stub (MVP)' },
        ].map(ch => (
          <div key={ch.label} className="glass-card" style={{ padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.2rem' }}>{ch.icon}</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{ch.label} <span style={{ fontWeight: 400, color: 'var(--text-secondary)', fontSize: '0.78rem' }}>{ch.detail}</span></div>
              <div style={{ fontSize: '0.72rem', color: ch.status === 'Stub (MVP)' ? '#f59e0b' : '#00e5a0' }}>{ch.status}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AlertCenter;
