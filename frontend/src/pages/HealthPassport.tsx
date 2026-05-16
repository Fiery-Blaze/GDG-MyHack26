import { useState } from 'react'
import { runAgent } from '@/api/client'
import { Heart, Search, Plus, Stethoscope } from 'lucide-react'

interface HealthRecord {
  id: number
  test_name: string
  result: string
  record_date: string
  vet_clinic: string
  zoonotic_flag: boolean
}

interface Passport {
  microchip_id: string
  animal?: { name: string; species: string; sex: string; age: number }
  health_records: HealthRecord[]
  transfers: unknown[]
}

interface VetSuggestion {
  id: string
  name: string
  trust_score: number
  availability_days: number
  specialisation: string[]
  prior_patient_count: number
  reason: string
}

const resultColor = (r: string) =>
  r === 'negative' ? { bg: 'rgba(0,220,130,0.08)', border: 'rgba(0,220,130,0.2)', text: '#00dc82' }
  : { bg: 'rgba(244,63,94,0.08)', border: 'rgba(244,63,94,0.2)', text: '#f43f5e' }

export default function HealthPassport() {
  const [microchipId, setMicrochipId] = useState('')
  const [passport, setPassport] = useState<Passport | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({ test_name: '', result: '', date: '', vet_clinic: '', zoonotic_flag: false })
  const [adding, setAdding] = useState(false)

  const [vetSuggestions, setVetSuggestions] = useState<VetSuggestion[]>([])
  const [vetCondition, setVetCondition] = useState('')
  const [loadingVets, setLoadingVets] = useState(false)

  async function fetchPassport() {
    if (!microchipId) return
    setLoading(true)
    setError('')
    try {
      const res = await runAgent('health_passport', { microchip_id: microchipId, requester_role: 'owner' })
      setPassport(res.data)
    } catch {
      setError('Failed to fetch passport.')
    } finally {
      setLoading(false)
    }
  }

  async function suggestVets() {
    if (!passport?.animal?.species) return
    setLoadingVets(true)
    try {
      const res = await runAgent('suggest_vets', { species: passport.animal.species, condition: vetCondition })
      setVetSuggestions(res.data.suggestions ?? [])
    } finally {
      setLoadingVets(false)
    }
  }

  async function addRecord() {
    if (!microchipId) return
    setAdding(true)
    try {
      await runAgent('health_record', { microchip_id: microchipId, ...form })
      await fetchPassport()
      setForm({ test_name: '', result: '', date: '', vet_clinic: '', zoonotic_flag: false })
    } finally {
      setAdding(false)
    }
  }

  return (
    <div style={{ maxWidth: 900, display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <div className="label" style={{ marginBottom: '0.4rem' }}>Animal Health</div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 700, letterSpacing: '-0.03em', margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Heart size={22} color="var(--green)" /> Health Passport
        </h2>
        <p style={{ color: 'var(--text-2)', marginTop: '0.35rem', fontSize: '0.9rem' }}>
          View and manage animal health records
        </p>
      </div>

      {/* Search */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <p style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-1)' }}>Search by Microchip ID</p>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <input
            className="input-dark"
            placeholder="e.g. MC-001"
            value={microchipId}
            onChange={e => setMicrochipId(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchPassport()}
            style={{ maxWidth: 300 }}
          />
          <button className="btn-primary" onClick={fetchPassport} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Search size={14} /> {loading ? 'Loading…' : 'Search'}
          </button>
        </div>
        {error && <p style={{ fontSize: '0.8rem', color: '#f43f5e', marginTop: '0.5rem' }}>{error}</p>}
      </div>

      {passport && (
        <>
          {/* Animal profile */}
          {passport.animal && (
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--green)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '1rem' }}>Animal Profile</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem' }}>
                {[
                  { label: 'Name', value: passport.animal.name },
                  { label: 'Species', value: passport.animal.species },
                  { label: 'Sex', value: passport.animal.sex },
                  { label: 'Age', value: `${passport.animal.age} yrs` },
                ].map(f => (
                  <div key={f.label}>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginBottom: '0.25rem' }}>{f.label}</p>
                    <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>{f.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Health records */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--green)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '1rem' }}>
              Health Records ({passport.health_records.length})
            </p>
            {passport.health_records.length === 0 ? (
              <p style={{ fontSize: '0.875rem', color: 'var(--text-3)' }}>No records yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {passport.health_records.map(r => {
                  const c = resultColor(r.result)
                  return (
                    <div key={r.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '0.75rem 1rem', borderRadius: 8,
                      background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)',
                    }}>
                      <div>
                        <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>{r.test_name}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: '0.15rem' }}>
                          {r.vet_clinic} · {r.record_date}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span style={{ padding: '0.2rem 0.65rem', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600, background: c.bg, border: `1px solid ${c.border}`, color: c.text }}>
                          {r.result}
                        </span>
                        {r.zoonotic_flag && <span className="badge badge-danger">Zoonotic</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Vet suggestions */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--green)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '1rem' }}>
              Suggested Vets
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
              <input
                className="input-dark"
                placeholder="Condition or concern (optional)"
                value={vetCondition}
                onChange={e => setVetCondition(e.target.value)}
              />
              <button className="btn-primary" onClick={suggestVets} disabled={loadingVets} style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Stethoscope size={14} /> {loadingVets ? 'Finding…' : 'Find Vets'}
              </button>
            </div>

            {vetSuggestions.length === 0 && !loadingVets && (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-3)' }}>
                Click "Find Vets" to get AI-powered recommendations based on specialisation and prior patients.
              </p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {vetSuggestions.map(v => (
                <div key={v.id} style={{ padding: '1rem', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{v.name}</p>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <span className="badge badge-success">Trust {Math.round(v.trust_score * 100)}%</span>
                      <span className="badge badge-warning">Avail. in {v.availability_days}d</span>
                      {v.prior_patient_count > 0 && (
                        <span className="badge" style={{ background: 'rgba(59,130,246,0.12)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.25)' }}>
                          {v.prior_patient_count} prior patient{v.prior_patient_count > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  {v.specialisation?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.5rem' }}>
                      {v.specialisation.map(s => (
                        <span key={s} style={{ padding: '0.15rem 0.5rem', borderRadius: 6, fontSize: '0.72rem', background: 'rgba(255,255,255,0.06)', color: 'var(--text-2)', border: '1px solid var(--border-subtle)' }}>{s}</span>
                      ))}
                    </div>
                  )}
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>{v.reason}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Add record */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--green)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Plus size={14} /> Add Health Record
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              {[
                { field: 'test_name', label: 'Test Name' },
                { field: 'result', label: 'Result' },
                { field: 'date', label: 'Date', type: 'date' },
                { field: 'vet_clinic', label: 'Vet Clinic' },
              ].map(({ field, label, type }) => (
                <div key={field} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-2)', fontWeight: 500 }}>{label}</label>
                  <input
                    className="input-dark"
                    type={type ?? 'text'}
                    value={form[field as keyof typeof form] as string}
                    onChange={e => setForm({ ...form, [field]: e.target.value })}
                  />
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <input
                type="checkbox"
                id="zoonotic_flag"
                checked={form.zoonotic_flag}
                onChange={e => setForm({ ...form, zoonotic_flag: e.target.checked })}
                style={{ width: 16, height: 16, accentColor: 'var(--green)', cursor: 'pointer' }}
              />
              <label htmlFor="zoonotic_flag" style={{ fontSize: '0.875rem', color: 'var(--text-2)', cursor: 'pointer' }}>
                Zoonotic flag <span style={{ color: '#f43f5e', fontSize: '0.78rem' }}>(triggers alert notifications)</span>
              </label>
            </div>

            <button className="btn-primary" onClick={addRecord} disabled={adding}>
              {adding ? 'Saving…' : 'Add Record'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
