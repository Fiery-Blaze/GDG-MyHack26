import { useState } from 'react'
import { runAgent } from '@/api/client'
import { ArrowLeftRight, Search, ShieldAlert, TrendingUp } from 'lucide-react'

interface Match {
  id: string
  name: string
  reason: string
}

export default function TransferMatching() {
  const [form, setForm] = useState({ species: '', sex: '', age: '', from_zoo_id: '' })
  const [matches, setMatches] = useState<Match[]>([])
  const [sla, setSla] = useState<{ delay_probability: number; high_risk: boolean; risk_factors: string[]; mitigations?: string[] } | null>(null)
  const [loading, setLoading] = useState(false)

  async function findMatches() {
    setLoading(true)
    try {
      const [matchRes, slaRes] = await Promise.all([
        runAgent('match_transfer', { ...form, age: Number(form.age) }),
        runAgent('sla_predict', { distance_km: 3000, cites_level: 2, num_permits: 2, quarantine_days: 7, past_delays_on_route: 1 }),
      ])
      setMatches(matchRes.data?.matches ?? [])
      setSla(slaRes.data)
    } finally {
      setLoading(false)
    }
  }

  const riskPct = sla ? Math.round(sla.delay_probability * 100) : 0
  const riskColor = riskPct > 60 ? '#f43f5e' : riskPct > 30 ? '#f59e0b' : '#00dc82'

  return (
    <div style={{ maxWidth: 900, display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <div className="label" style={{ marginBottom: '0.4rem' }}>Transfers</div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 700, letterSpacing: '-0.03em', margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <ArrowLeftRight size={22} color="var(--green)" /> Transfer Matching
        </h2>
        <p style={{ color: 'var(--text-2)', marginTop: '0.35rem', fontSize: '0.9rem' }}>
          Find the best zoo matches for an animal transfer
        </p>
      </div>

      {/* Form */}
      <div className="glass-card" style={{ padding: '1.75rem' }}>
        <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--green)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '1.25rem' }}>Animal Details</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
          {[
            { field: 'species', label: 'Species', placeholder: 'e.g. Panthera tigris' },
            { field: 'sex', label: 'Sex', placeholder: 'male / female' },
            { field: 'age', label: 'Age (years)', placeholder: 'e.g. 4', type: 'number' },
            { field: 'from_zoo_id', label: 'From Zoo ID', placeholder: 'e.g. zoo-001' },
          ].map(({ field, label, placeholder, type }) => (
            <div key={field} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-2)', fontWeight: 500 }}>{label}</label>
              <input
                className="input-dark"
                type={type ?? 'text'}
                placeholder={placeholder}
                value={form[field as keyof typeof form]}
                onChange={e => setForm({ ...form, [field]: e.target.value })}
              />
            </div>
          ))}
        </div>
        <button className="btn-primary" onClick={findMatches} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Search size={14} /> {loading ? 'Searching…' : 'Find Matches'}
        </button>
      </div>

      {/* SLA Risk */}
      {sla && (
        <div className="glass-card" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
            <ShieldAlert size={16} color={riskColor} />
            <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--green)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>SLA Risk Assessment</p>
            {sla.high_risk && <span className="badge badge-danger">High Risk</span>}
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-2)' }}>Delay Probability</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: riskColor }}>{riskPct}%</span>
            </div>
            <div className="risk-bar-wrap">
              <div className="risk-bar" style={{ width: `${riskPct}%`, background: riskColor }} />
            </div>
          </div>

          {sla.risk_factors.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>Risk Factors</p>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', listStyle: 'none', padding: 0, margin: 0 }}>
                {sla.risk_factors.map(f => (
                  <li key={f} style={{ fontSize: '0.875rem', color: 'var(--text-2)', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <span style={{ color: '#f59e0b', marginTop: 2 }}>·</span> {f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {sla.mitigations && (
            <div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>Recommended Actions</p>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', listStyle: 'none', padding: 0, margin: 0 }}>
                {sla.mitigations.map(m => (
                  <li key={m} style={{ fontSize: '0.875rem', color: '#00dc82', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <span style={{ marginTop: 1 }}>✓</span> {m}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Matches */}
      {matches.length > 0 && (
        <div className="glass-card" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
            <TrendingUp size={16} color="var(--green)" />
            <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--green)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Top Zoo Matches</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {matches.map((m, i) => (
              <div key={m.id} style={{
                padding: '1rem', borderRadius: 10,
                background: i === 0 ? 'rgba(0,220,130,0.06)' : 'rgba(6,18,44,0.04)',
                border: `1px solid ${i === 0 ? 'rgba(0,220,130,0.2)' : 'var(--border-subtle)'}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
                  <span style={{
                    width: 22, height: 22, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.72rem', fontWeight: 700,
                    background: i === 0 ? 'rgba(0,220,130,0.2)' : 'rgba(6,18,44,0.08)',
                    color: i === 0 ? 'var(--green)' : 'var(--text-2)',
                  }}>#{i + 1}</span>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{m.name}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginLeft: 'auto' }}>{m.id}</span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-2)', lineHeight: 1.6 }}>{m.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
