import { useEffect, useState } from 'react'
import { runAgent } from '@/api/client'
import { AlertTriangle, CheckCircle, Clock, Activity } from 'lucide-react'

interface SLAEvent {
  id: number
  status: string
  deadline: string
}

const statusBadge = (status: string) => {
  if (status === 'missed') return <span className="badge badge-danger">{status}</span>
  if (status === 'at_risk') return <span className="badge badge-warning">{status}</span>
  return <span className="badge badge-success">{status}</span>
}

export default function Dashboard() {
  const [slaEvents, setSlaEvents] = useState<SLAEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    runAgent('sla_monitor', {})
      .then((res) => setSlaEvents(res.data?.events ?? []))
      .finally(() => setLoading(false))
  }, [])

  const atRisk = slaEvents.filter(e => e.status === 'at_risk').length
  const missed = slaEvents.filter(e => e.status === 'missed').length

  return (
    <div style={{ maxWidth: 960, display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <div className="label" style={{ marginBottom: '0.4rem' }}>Overview</div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 700, letterSpacing: '-0.03em', margin: 0 }}>Dashboard</h2>
        <p style={{ color: 'var(--text-2)', marginTop: '0.35rem', fontSize: '0.9rem' }}>
          Live overview of transfers and SLA status
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem' }}>
        {[
          { label: 'Active Transfers', value: slaEvents.length, icon: <Clock size={18} />, color: 'var(--accent-blue)', sub: 'Monitored by SLA agent' },
          { label: 'At Risk', value: atRisk, icon: <AlertTriangle size={18} />, color: '#f59e0b', sub: 'Deadline within 1 hour' },
          { label: 'Missed SLAs', value: missed, icon: <CheckCircle size={18} />, color: '#f43f5e', sub: 'Require immediate action' },
        ].map(s => (
          <div key={s.label} className="glass-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-2)' }}>{s.label}</span>
              <span style={{ color: s.color, opacity: 0.8 }}>{s.icon}</span>
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: s.color, letterSpacing: '-0.04em', lineHeight: 1 }}>
              {s.value}
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: '0.5rem' }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* SLA Events table */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
          <Activity size={16} color="var(--green)" />
          <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>SLA Events</span>
        </div>

        {loading ? (
          <p style={{ color: 'var(--text-3)', fontSize: '0.875rem' }}>Loading…</p>
        ) : slaEvents.length === 0 ? (
          <p style={{ color: 'var(--text-3)', fontSize: '0.875rem' }}>No active SLA events.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {slaEvents.map(e => (
              <div key={e.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0.75rem 1rem', borderRadius: 8,
                background: 'rgba(6,18,44,0.04)',
                border: '1px solid var(--border-subtle)',
              }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-1)' }}>Transfer #{e.id}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>
                    {new Date(e.deadline).toLocaleString()}
                  </span>
                  {statusBadge(e.status)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
