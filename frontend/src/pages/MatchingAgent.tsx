import React, { useState } from 'react';
import { Shuffle, MapPin, Search, Loader, CheckCircle, AlertCircle } from 'lucide-react';
import { agentApi } from '../lib/api';

type MatchType = 'match_transfer' | 'match_referral' | 'match_lost_pet';

const matchTypes: { id: MatchType; label: string; desc: string; placeholder: string }[] = [
  {
    id: 'match_transfer',
    label: 'Zoo Transfer',
    desc: 'Find the best destination zoo for an animal',
    placeholder: 'e.g. "Transfer male orangutan, 12 years old, from Zoo SG. Needs quarantine space and CITES I clearance."',
  },
  {
    id: 'match_referral',
    label: 'Vet Referral',
    desc: 'Find a specialist vet for an exotic animal',
    placeholder: 'e.g. "Small vet clinic in KL needs a specialist for an injured exotic bird. Distance < 100km."',
  },
  {
    id: 'match_lost_pet',
    label: 'Lost Pet',
    desc: 'Alert nearby vets, shelters, and zoos',
    placeholder: 'e.g. "My dog is lost. Microchip ID: 9820004112345. Last seen near Bangsar, KL."',
  },
];

interface MatchResult {
  matches?: Array<{ name: string; score: number; reason: string; location?: string }>;
  [key: string]: unknown;
}

const MatchingAgent: React.FC = () => {
  const [type, setType] = useState<MatchType>('match_transfer');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MatchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const current = matchTypes.find(t => t.id === type)!;

  const handleRun = async () => {
    if (!input.trim()) return;
    setLoading(true); setResult(null); setError(null);
    try {
      const res = await agentApi.run(type, { user_input: input });
      if (res.data.success) {
        setResult(res.data.data as MatchResult);
      } else {
        setError(res.data.error || 'No result returned.');
      }
    } catch {
      setError('Could not reach backend. Make sure the server is running at localhost:8000.');
    } finally {
      setLoading(false);
    }
  };

  const demoMatches = [
    { name: 'Zoo Negara Malaysia', score: 94, reason: 'High genetic diversity, quarantine capacity available, 3 successful past transfers', location: 'Kuala Lumpur, MY' },
    { name: 'Singapore Zoo', score: 88, reason: 'CITES I certified, avian vet on-site, SLA met rate 97%', location: 'Singapore' },
    { name: 'Taipei Zoo', score: 81, reason: 'Matching species population, strong trust score 0.91', location: 'Taipei, TW' },
  ];

  const displayMatches = result?.matches || (result ? [] : null);

  return (
    <div className="animate-fade-in" style={{ padding: '2rem', maxWidth: 900 }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.3rem' }}>
          <span className="gradient-text-green">Matching</span> Agent
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          AI-powered matching for transfers, referrals, and lost pets using vector embeddings + LLM re-ranking.
        </p>
      </div>

      {/* Type selector */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {matchTypes.map(t => (
          <button
            key={t.id}
            onClick={() => { setType(t.id); setResult(null); setError(null); setInput(''); }}
            style={{
              padding: '0.6rem 1.1rem',
              borderRadius: 10,
              border: type === t.id ? '1px solid rgba(0,229,160,0.5)' : '1px solid var(--border-subtle)',
              background: type === t.id ? 'rgba(0,229,160,0.1)' : 'transparent',
              color: type === t.id ? 'var(--accent-green)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 500,
              transition: 'all 0.2s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <Shuffle size={15} color="var(--accent-green)" />
          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{current.label}</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>— {current.desc}</span>
        </div>
        <textarea
          className="input-dark"
          rows={4}
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={current.placeholder}
          style={{ resize: 'vertical', marginBottom: '1rem' }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            className="btn-primary"
            onClick={handleRun}
            disabled={loading || !input.trim()}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: !input.trim() ? 0.5 : 1 }}
          >
            {loading ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Search size={16} />}
            {loading ? 'Finding Matches...' : 'Find Best Matches'}
          </button>
        </div>
      </div>

      {/* Results */}
      {error && (
        <div className="glass-card animate-fade-in" style={{ padding: '1.25rem', borderColor: 'rgba(244,63,94,0.3)', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={16} color="#f43f5e" />
            <span style={{ color: '#f43f5e', fontSize: '0.85rem' }}>{error}</span>
          </div>
        </div>
      )}

      {/* Demo results (shown before any API call) */}
      {!result && !error && !loading && (
        <div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ padding: '0.1rem 0.5rem', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 4, color: '#f59e0b', fontSize: '0.7rem' }}>DEMO</span>
            Sample output for "Transfer male orangutan from Zoo SG":
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {demoMatches.map((m, i) => (
              <div key={i} className="glass-card" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(0,229,160,0.1)', border: '1px solid rgba(0,229,160,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--accent-green)', flexShrink: 0 }}>#{i+1}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{m.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                      <MapPin size={11} />{m.location}
                    </div>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{m.reason}</div>
                </div>
                <div style={{ textAlign: 'center', flexShrink: 0 }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: m.score > 90 ? '#00e5a0' : m.score > 80 ? '#3b82f6' : '#f59e0b' }}>{m.score}%</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>match score</div>
                </div>
                <button className="btn-primary" style={{ fontSize: '0.8rem', flexShrink: 0 }}>Select</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {displayMatches && displayMatches.length > 0 && (
        <div className="animate-fade-in">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <CheckCircle size={16} color="var(--accent-green)" />
            <span style={{ fontWeight: 600, color: 'var(--accent-green)', fontSize: '0.9rem' }}>Top Matches Found</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {displayMatches.map((m, i) => (
              <div key={i} className="glass-card" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(0,229,160,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--accent-green)', flexShrink: 0 }}>#{i+1}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, marginBottom: '0.2rem' }}>{m.name}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{m.reason}</div>
                </div>
                <div style={{ fontWeight: 700, fontSize: '1.4rem', color: '#00e5a0', flexShrink: 0 }}>{Math.round(m.score * 100)}%</div>
                <button className="btn-primary" style={{ fontSize: '0.8rem', flexShrink: 0 }}>Select</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchingAgent;
