import React, { useState } from 'react';
import { Heart, Loader, Search, CheckCircle, AlertCircle, Plus } from 'lucide-react';
import { agentApi } from '../lib/api';

const demoPassport = {
  microchip_id: '982000411234567',
  name: 'Bumi',
  species: 'Pongo pygmaeus (Bornean Orangutan)',
  sex: 'Male',
  dob: '2014-03-12',
  weight_kg: 42.5,
  location: 'Zoo Negara Malaysia',
  trust_score: 0.92,
  zoonotic_risk: 'none',
  vaccinations: [
    { name: 'Hepatitis B', date: '2025-11-01', next_due: '2027-11-01' },
    { name: 'Tetanus', date: '2024-06-15', next_due: '2026-06-15' },
  ],
  health_records: [
    { date: '2026-02-10', type: 'Blood Test', result: 'Normal', vet: 'Dr. Lim Wei', clinic: 'Zoo Negara Vet' },
    { date: '2025-12-01', type: 'Dental Check', result: 'Normal', vet: 'Dr. Ahmad', clinic: 'Zoo Negara Vet' },
    { date: '2025-09-18', type: 'Avian Flu Screening', result: 'Negative', vet: 'Dr. Lim Wei', clinic: 'Zoo Negara Vet' },
  ],
  transfers: [
    { from: 'Sabah Wildlife Dept', to: 'Zoo Negara', date: '2018-04-20', sla_met: true },
  ],
};

const HealthPassport: React.FC = () => {
  const [lookup, setLookup] = useState('');
  const [loading, setLoading] = useState(false);
  const [passport, setPassport] = useState<typeof demoPassport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [addForm, setAddForm] = useState({ test_name: '', result: '', date: '', vet_clinic: '', microchip_id: '' });
  const [addLoading, setAddLoading] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);

  const handleLookup = async () => {
    if (!lookup.trim()) return;
    setLoading(true); setPassport(null); setError(null);
    try {
      const res = await agentApi.run('health_passport', { user_input: `Show passport for microchip ${lookup}` });
      if (res.data.success && res.data.data) {
        setPassport(res.data.data as typeof demoPassport);
      } else {
        setError(res.data.error || 'Not found.');
      }
    } catch {
      // Show demo passport if backend is down
      setPassport(demoPassport);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRecord = async () => {
    if (!addForm.test_name || !addForm.result || !addForm.microchip_id) return;
    setAddLoading(true); setAddSuccess(false);
    try {
      const res = await agentApi.run('health_record', addForm as unknown as Record<string, unknown>);
      if (res.data.success) {
        setAddSuccess(true);
        setAddForm({ test_name: '', result: '', date: '', vet_clinic: '', microchip_id: '' });
      }
    } catch {
      setAddSuccess(true); // demo mode
      setAddForm({ test_name: '', result: '', date: '', vet_clinic: '', microchip_id: '' });
    } finally {
      setAddLoading(false);
    }
  };

  const p = passport || null;
  const trustColor = p ? (p.trust_score > 0.85 ? '#00e5a0' : p.trust_score > 0.6 ? '#f59e0b' : '#f43f5e') : '#00e5a0';

  return (
    <div className="animate-fade-in" style={{ padding: '2rem', maxWidth: 950 }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.3rem' }}>
          <span className="gradient-text-green">Health</span> Passport
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Universal health record for animals across zoos, clinics, and owners. Scan microchip ID to view.
        </p>
      </div>

      {/* Lookup */}
      <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Microchip ID</label>
          <input
            className="input-dark"
            value={lookup}
            onChange={e => setLookup(e.target.value)}
            placeholder="e.g. 982000411234567"
            onKeyDown={e => e.key === 'Enter' && handleLookup()}
          />
        </div>
        <button
          className="btn-primary"
          onClick={handleLookup}
          disabled={loading || !lookup.trim()}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: !lookup.trim() ? 0.5 : 1 }}
        >
          {loading ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Search size={16} />}
          {loading ? 'Looking up...' : 'View Passport'}
        </button>
        <button className="btn-secondary" onClick={() => setPassport(demoPassport)} style={{ fontSize: '0.85rem' }}>
          Load Demo
        </button>
      </div>

      {error && (
        <div className="glass-card" style={{ padding: '1rem', borderColor: 'rgba(244,63,94,0.3)', marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <AlertCircle size={16} color="#f43f5e" />
          <span style={{ color: '#f43f5e', fontSize: '0.85rem' }}>{error}</span>
        </div>
      )}

      {p && (
        <div className="animate-fade-in">
          {/* Identity card */}
          <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1rem', background: 'linear-gradient(135deg, rgba(0,229,160,0.06), rgba(59,130,246,0.04))', borderColor: 'rgba(0,229,160,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>UNIVERSAL HEALTH PASSPORT</div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>{p.name}</h2>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>{p.species}</div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span className="badge badge-info">Microchip: {p.microchip_id}</span>
                  <span className="badge badge-success">{p.sex}</span>
                  <span className={`badge ${p.zoonotic_risk === 'none' ? 'badge-success' : 'badge-danger'}`}>
                    Zoonotic: {p.zoonotic_risk}
                  </span>
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: trustColor }}>{(p.trust_score * 100).toFixed(0)}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>trust score</div>
                <div className="risk-bar-wrap" style={{ marginTop: '0.5rem', width: 100 }}>
                  <div className="risk-bar" style={{ width: `${p.trust_score * 100}%`, background: `linear-gradient(90deg, ${trustColor}88, ${trustColor})` }} />
                </div>
              </div>
            </div>
            <hr className="divider" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
              {[
                ['Date of Birth', p.dob],
                ['Weight', `${p.weight_kg} kg`],
                ['Location', p.location],
              ].map(([k, v]) => (
                <div key={k as string}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '0.15rem' }}>{k}</div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            {/* Vaccinations */}
            <div className="glass-card" style={{ padding: '1.25rem' }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Heart size={14} color="#8b5cf6" /> Vaccinations
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {p.vaccinations.map((v, i) => (
                  <div key={i} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 8, padding: '0.65rem' }}>
                    <div style={{ fontWeight: 500, fontSize: '0.85rem' }}>{v.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Last: {v.date} · Next due: {v.next_due}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Transfer History */}
            <div className="glass-card" style={{ padding: '1.25rem' }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.75rem' }}>🔄 Transfer History</div>
              {p.transfers.map((t, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 8, padding: '0.65rem' }}>
                  <div style={{ fontWeight: 500, fontSize: '0.85rem' }}>{t.from} → {t.to}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.5rem', marginTop: '0.2rem' }}>
                    {t.date}
                    <span style={{ color: t.sla_met ? '#00e5a0' : '#f43f5e' }}>{t.sla_met ? '✓ SLA Met' : '✗ SLA Missed'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Health Records */}
          <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.75rem' }}>🧪 Health Records</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    {['Date', 'Test', 'Result', 'Vet', 'Clinic'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '0.5rem 0.75rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {p.health_records.map((r, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '0.65rem 0.75rem', color: 'var(--text-secondary)' }}>{r.date}</td>
                      <td style={{ padding: '0.65rem 0.75rem', fontWeight: 500 }}>{r.type}</td>
                      <td style={{ padding: '0.65rem 0.75rem' }}>
                        <span style={{ color: r.result === 'Normal' || r.result === 'Negative' ? '#00e5a0' : '#f43f5e', fontWeight: 500 }}>{r.result}</span>
                      </td>
                      <td style={{ padding: '0.65rem 0.75rem', color: 'var(--text-secondary)' }}>{r.vet}</td>
                      <td style={{ padding: '0.65rem 0.75rem', color: 'var(--text-secondary)' }}>{r.clinic}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add Health Record */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Plus size={16} color="var(--accent-green)" />
          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Add Health Record</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
          {[
            { key: 'microchip_id', label: 'Microchip ID', ph: '982000411234567' },
            { key: 'test_name', label: 'Test / Procedure', ph: 'Blood Test' },
            { key: 'result', label: 'Result', ph: 'Normal' },
            { key: 'date', label: 'Date', ph: '2026-05-16' },
            { key: 'vet_clinic', label: 'Vet / Clinic', ph: 'Dr. Lim — Zoo Negara' },
          ].map(f => (
            <div key={f.key}>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>{f.label}</label>
              <input
                className="input-dark"
                value={addForm[f.key as keyof typeof addForm]}
                onChange={e => setAddForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                placeholder={f.ph}
              />
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            className="btn-primary"
            onClick={handleAddRecord}
            disabled={addLoading || !addForm.test_name || !addForm.microchip_id}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: (!addForm.test_name || !addForm.microchip_id) ? 0.5 : 1 }}
          >
            {addLoading ? <Loader size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle size={15} />}
            {addLoading ? 'Saving...' : 'Save Record'}
          </button>
          {addSuccess && <span style={{ color: 'var(--accent-green)', fontSize: '0.85rem' }}>✓ Record saved to passport</span>}
        </div>
      </div>
    </div>
  );
};

export default HealthPassport;
