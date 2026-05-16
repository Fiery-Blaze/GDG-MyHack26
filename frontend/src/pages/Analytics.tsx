import React, { useState } from 'react';
import {
  BarChart2, Database, ExternalLink, RefreshCw,
  TrendingDown, TrendingUp, AlertTriangle, Globe,
  Dna, Shuffle, ChevronDown, ChevronUp, Loader,
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
} from 'recharts';

import { agentApi } from '../lib/api';

/* Mock BigQuery result data */
const speciesRisk = [
  { species: 'Sumatran Orangutan', individuals: 312, coi: 0.21, risk: 'critical', continent: 'Asia' },
  { species: 'Amur Leopard', individuals: 87, coi: 0.34, risk: 'critical', continent: 'Asia' },
  { species: 'Javan Rhino', individuals: 11, coi: 0.47, risk: 'critical', continent: 'Asia' },
  { species: 'Snow Leopard', individuals: 480, coi: 0.09, risk: 'moderate', continent: 'Asia' },
  { species: 'Black-footed Ferret', individuals: 206, coi: 0.18, risk: 'high', continent: 'N. America' },
  { species: 'Pygmy Slow Loris', individuals: 94, coi: 0.29, risk: 'critical', continent: 'Asia' },
  { species: 'African Wild Dog', individuals: 1124, coi: 0.05, risk: 'low', continent: 'Africa' },
  { species: 'Bengal Tiger', individuals: 890, coi: 0.07, risk: 'low', continent: 'Asia' },
];

const transferEfficiency = [
  { month: 'Nov', planned: 14, completed: 12, delayed: 2 },
  { month: 'Dec', planned: 18, completed: 15, delayed: 3 },
  { month: 'Jan', planned: 22, completed: 20, delayed: 2 },
  { month: 'Feb', planned: 19, completed: 18, delayed: 1 },
  { month: 'Mar', planned: 26, completed: 21, delayed: 5 },
  { month: 'Apr', planned: 31, completed: 28, delayed: 3 },
  { month: 'May', planned: 34, completed: 29, delayed: 5 },
];

const diversityIndex = [
  { institution: 'Singapore Zoo', di: 0.82 },
  { institution: 'Mandai WR', di: 0.76 },
  { institution: 'Zoo KL', di: 0.71 },
  { institution: 'Taipei Zoo', di: 0.68 },
  { institution: 'Beijing Zoo', di: 0.64 },
  { institution: 'Dubai Zoo', di: 0.59 },
  { institution: 'Jakarta Zoo', di: 0.51 },
];

const riskColor = { critical: '#f04e6d', high: '#f5a623', moderate: '#4f8ef7', low: '#00dc82' };
const riskBadge: Record<string, string> = { critical: 'badge-red', high: 'badge-amber', moderate: 'badge-blue', low: 'badge-green' };

const tooltipStyle = {
  contentStyle: { background: '#0d1526', border: '1px solid rgba(6,18,44,0.08)', borderRadius: 8, fontSize: 12, color: '#f2f8ff' },
  cursor: { fill: 'rgba(6,18,44,0.04)' },
};

/*  BigQuery SQL examples  */
const queries = [
  {
    label: 'Species Inbreeding Risk',
    sql: `SELECT
  species_name,
  COUNT(individual_id) AS population_size,
  AVG(coefficient_of_inbreeding) AS avg_coi,
  CASE
    WHEN AVG(coefficient_of_inbreeding) > 0.25 THEN 'CRITICAL'
    WHEN AVG(coefficient_of_inbreeding) > 0.15 THEN 'HIGH'
    ELSE 'MODERATE'
  END AS risk_level
FROM \`arkflow.animal_registry.individuals\`
WHERE is_active = TRUE
GROUP BY species_name
ORDER BY avg_coi DESC
LIMIT 20;`,
  },
  {
    label: 'Global Transfer Efficiency',
    sql: `SELECT
  DATE_TRUNC(transfer_date, MONTH) AS month,
  COUNT(*) AS total_transfers,
  COUNTIF(status = 'completed') AS completed,
  COUNTIF(actual_duration > sla_duration) AS delayed,
  ROUND(AVG(SAFE_DIVIDE(sla_duration, actual_duration)) * 100, 1) AS sla_compliance_pct
FROM \`arkflow.transfers.records\`
WHERE transfer_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 12 MONTH)
GROUP BY 1
ORDER BY 1;`,
  },
  {
    label: 'Genetic Diversity Index by Institution',
    sql: `WITH allele_freqs AS (
  SELECT institution_id,
         locus,
         allele,
         COUNT(*) / SUM(COUNT(*)) OVER (PARTITION BY institution_id, locus) AS freq
  FROM \`arkflow.genetics.allele_data\`
  GROUP BY 1, 2, 3
)
SELECT
  i.institution_name,
  ROUND(1 - SUM(POW(af.freq, 2)) / COUNT(DISTINCT af.locus), 4) AS diversity_index
FROM allele_freqs af
JOIN \`arkflow.institutions.registry\` i USING (institution_id)
GROUP BY i.institution_name
ORDER BY diversity_index DESC;`,
  },
];

const Analytics: React.FC = () => {
  const [activeQuery, setActiveQuery] = useState(0);
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryResult, setQueryResult] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const handleRunQuery = async () => {
    setQueryLoading(true);
    setQueryResult(null);
    try {
      const res = await agentApi.run('analytics_bigquery', { query: queries[activeQuery].sql });
      setQueryResult(JSON.stringify(res.data.data, null, 2));
    } catch {
      // Simulate a BigQuery response
      setQueryResult(JSON.stringify({
        jobId: `job_${Math.random().toString(36).slice(2, 10)}`,
        rowsProcessed: Math.floor(Math.random() * 50000 + 1000),
        bytesProcessed: '2.3 GB',
        executionMs: Math.floor(Math.random() * 800 + 200),
        rows: speciesRisk.slice(0, 3).map(s => ({
          species_name: s.species,
          population_size: s.individuals,
          avg_coi: s.coi,
          risk_level: s.risk.toUpperCase(),
        })),
        note: 'Demo mode — connect BigQuery in backend/.env to run live queries.',
      }, null, 2));
    } finally {
      setQueryLoading(false);
    }
  };

  return (
    <div className="animate-up" style={{ padding: '2rem', maxWidth: 1160 }}>
      {/* Header */}
      <div style={{ marginBottom: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.03em' }}>
              Population <span className="g-green">Analytics</span>
            </h1>
            <span className="badge badge-blue">
              <Database size={9} /> BigQuery
            </span>
          </div>
          <p style={{ color: 'var(--text-2)', fontSize: '0.875rem' }}>
            Global species health intelligence — powered by Google BigQuery &amp; Looker Studio.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-ghost" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <RefreshCw size={13} /> Sync BigQuery
          </button>
          <a
            href="https://lookerstudio.google.com"
            target="_blank"
            rel="noreferrer"
            className="btn btn-cta"
            style={{ fontSize: '0.8rem', padding: '0.5rem 1.1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none' }}
          >
            <ExternalLink size={13} /> Open Looker Studio
          </a>
        </div>
      </div>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Species Tracked', value: '48', delta: '6 critically at risk', icon: <Dna size={15} />, color: 'var(--red)', bg: 'rgba(240,78,109,0.1)' },
          { label: 'Total Individuals', value: '3,204', delta: '+47 this quarter', icon: <Globe size={15} />, color: 'var(--green)', bg: 'rgba(0,220,130,0.1)' },
          { label: 'Avg. Diversity Index', value: '0.67', delta: '−0.02 vs last quarter', icon: <TrendingDown size={15} />, color: 'var(--amber)', bg: 'rgba(245,166,35,0.1)' },
          { label: 'Transfer Efficiency', value: '88%', delta: '+3% this month', icon: <Shuffle size={15} />, color: 'var(--blue)', bg: 'rgba(79,142,247,0.1)' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.5rem' }}>{s.label}</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.04em', color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: '0.35rem' }}>{s.delta}</div>
              </div>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>{s.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '0.85rem', marginBottom: '1.5rem' }}>
        {/* Transfer efficiency chart */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.1rem' }}>Global Transfer Efficiency</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-2)' }}>Planned vs. completed vs. delayed —” last 7 months</div>
            </div>
            <span className="badge badge-green"><TrendingUp size={10} /> +3% MoM</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={transferEfficiency} barGap={3} barCategoryGap="25%">
              <XAxis dataKey="month" stroke="transparent" tick={{ fill: 'var(--text-3)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis stroke="transparent" tick={{ fill: 'var(--text-3)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11, color: 'var(--text-2)' }} />
              <Bar dataKey="completed" fill="#00dc82" radius={[3, 3, 0, 0]} name="Completed" opacity={0.9} />
              <Bar dataKey="delayed" fill="#f5a623" radius={[3, 3, 0, 0]} name="Delayed" opacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Diversity Index bar */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.2rem' }}>Genetic Diversity Index</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-2)', marginBottom: '1rem' }}>By institution — higher is better (0–1)</div>
          {diversityIndex.map(d => (
            <div key={d.institution} style={{ marginBottom: '0.6rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.25rem' }}>
                <span style={{ color: 'var(--text-2)' }}>{d.institution}</span>
                <span style={{ fontWeight: 600, color: d.di >= 0.7 ? 'var(--green)' : d.di >= 0.6 ? 'var(--amber)' : 'var(--red)' }}>{d.di.toFixed(2)}</span>
              </div>
              <div className="risk-track">
                <div className="risk-fill" style={{
                  width: `${d.di * 100}%`,
                  background: d.di >= 0.7 ? 'var(--green)' : d.di >= 0.6 ? 'var(--amber)' : 'var(--red)',
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Species risk table */}
      <div className="card" style={{ marginBottom: '1.5rem', overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={15} color="var(--amber)" />
            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Species Inbreeding Risk</span>
            <span className="badge badge-neutral" style={{ fontSize: '0.68rem' }}>BigQuery result</span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>Coefficient of Inbreeding (CoI)  sorted by risk</span>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Species</th>
              <th>Continent</th>
              <th>Population</th>
              <th>Avg CoI</th>
              <th>Inbreeding Risk</th>
              <th>Recommended Action</th>
            </tr>
          </thead>
          <tbody>
            {speciesRisk.sort((a, b) => b.coi - a.coi).map(s => (
              <React.Fragment key={s.species}>
                <tr
                  style={{ cursor: 'pointer' }}
                  onClick={() => setExpandedRow(expandedRow === s.species ? null : s.species)}
                >
                  <td style={{ fontWeight: 600 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {expandedRow === s.species ? <ChevronUp size={12} color="var(--text-3)" /> : <ChevronDown size={12} color="var(--text-3)" />}
                      {s.species}
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-2)' }}>{s.continent}</td>
                  <td style={{ fontWeight: 600 }}>{s.individuals.toLocaleString()}</td>
                  <td>
                    <span style={{ fontWeight: 700, color: (riskColor as Record<string, string>)[s.risk] }}>{s.coi.toFixed(2)}</span>
                  </td>
                  <td><span className={`badge ${riskBadge[s.risk]}`}>{s.risk}</span></td>
                  <td style={{ color: 'var(--text-2)', fontSize: '0.82rem' }}>
                    {s.risk === 'critical' ? 'Immediate cross-institution transfer' :
                     s.risk === 'high' ? 'Schedule breeding pair exchange' :
                     s.risk === 'moderate' ? 'Monitor quarterly' : 'No action required'}
                  </td>
                </tr>
                {expandedRow === s.species && (
                  <tr>
                    <td colSpan={6} style={{ padding: 0 }}>
                      <div style={{ padding: '0.75rem 1rem 0.75rem 2.5rem', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(6,18,44,0.04)' }}>
                        <div style={{ display: 'flex', gap: '2rem', fontSize: '0.8rem', color: 'var(--text-2)' }}>
                          <span>📍 <strong style={{ color: 'var(--text-1)' }}>Primary range:</strong> {s.continent}</span>
                          <span>🧬 <strong style={{ color: 'var(--text-1)' }}>CoI threshold:</strong> &gt;0.125 = concern, &gt;0.25 = critical</span>
                          <span>🔁 <strong style={{ color: 'var(--text-1)' }}>Last genetic survey:</strong> 2025-Q4</span>
                          <span>📊 <strong style={{ color: 'var(--text-1)' }}>BigQuery table:</strong> arkflow.genetics.individuals</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* BigQuery query runner */}
      <div className="card" style={{ marginBottom: '1.5rem', overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Database size={15} color="var(--blue)" />
          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>BigQuery Query Runner</span>
          <span className="badge badge-neutral" style={{ fontSize: '0.68rem' }}>google-cloud-bigquery</span>
        </div>
        <div style={{ padding: '1.25rem' }}>
          {/* Query selector */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            {queries.map((q, i) => (
              <button
                key={q.label}
                onClick={() => { setActiveQuery(i); setQueryResult(null); }}
                style={{
                  padding: '0.4rem 0.9rem', borderRadius: 8, fontSize: '0.8rem', fontWeight: 500,
                  background: activeQuery === i ? 'rgba(79,142,247,0.15)' : 'rgba(6,18,44,0.04)',
                  border: `1px solid ${activeQuery === i ? 'rgba(79,142,247,0.4)' : 'var(--border)'}`,
                  color: activeQuery === i ? 'var(--blue)' : 'var(--text-2)',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {q.label}
              </button>
            ))}
          </div>
          {/* SQL editor */}
          <div style={{ position: 'relative' }}>
            <pre style={{
              background: '#F5F7FA', borderRadius: 10, padding: '1rem',
              border: '1px solid var(--border)', fontSize: '0.8rem', lineHeight: 1.7,
              color: '#06122C', overflowX: 'auto', whiteSpace: 'pre',
              maxHeight: 200, overflowY: 'auto',
            }}>
              {queries[activeQuery].sql.split('\n').map((line, i) => {
                const isKeyword = /^(SELECT|FROM|WHERE|GROUP BY|ORDER BY|LIMIT|WITH|JOIN|CASE|WHEN|THEN|END|AS|AND|ON|HAVING)/i.test(line.trim());
                const isBQ = line.includes('`arkflow');
                return (
                  <span key={i} style={{ display: 'block' }}>
                    <span style={{ color: 'var(--text-3)', userSelect: 'none', marginRight: '0.75rem', fontSize: '0.7rem' }}>
                      {String(i + 1).padStart(2, ' ')}
                    </span>
                    <span style={{ color: isKeyword ? '#9b6ef3' : isBQ ? '#00dc82' : '#c9d6e8' }}>{line}</span>
                  </span>
                );
              })}
            </pre>
          </div>
          <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
            <button
              className="btn btn-cta"
              onClick={handleRunQuery}
              disabled={queryLoading}
              style={{ fontSize: '0.82rem', padding: '0.55rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              {queryLoading ? <Loader size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <BarChart2 size={13} />}
              {queryLoading ? 'Running…' : 'Run in BigQuery'}
            </button>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-3)', alignSelf: 'center' }}>
              Set <code style={{ color: 'var(--green)', background: 'rgba(0,220,130,0.08)', padding: '0.1rem 0.3rem', borderRadius: 4 }}>BIGQUERY_PROJECT_ID</code> in backend/.env to enable live execution
            </span>
          </div>
          {queryResult && (
            <div className="animate-up" style={{ marginTop: '1rem' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Query Result</div>
              <pre style={{
                background: '#F5F7FA', borderRadius: 10, padding: '1rem',
                border: '1px solid rgba(0,220,130,0.15)', fontSize: '0.78rem',
                color: '#06122C', overflowX: 'auto', maxHeight: 220, overflowY: 'auto',
              }}>{queryResult}</pre>
            </div>
          )}
        </div>
      </div>

      {/* Looker Studio embed */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <BarChart2 size={15} color="var(--purple)" />
            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Looker Studio — Global Transfer Report</span>
            <span className="badge badge-purple">Embedded</span>
          </div>
          <a
            href="https://lookerstudio.google.com/create"
            target="_blank"
            rel="noreferrer"
            className="btn btn-ghost"
            style={{ fontSize: '0.78rem', padding: '0.4rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <ExternalLink size={12} /> Configure
          </a>
        </div>
        {/* Placeholder iframe — replace src with real Looker embed URL */}
        <div style={{ position: 'relative', background: '#F5F7FA', minHeight: 340, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(155,110,243,0.12)', border: '1px solid rgba(155,110,243,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BarChart2 size={24} color="var(--purple)" />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 700, marginBottom: '0.35rem' }}>Connect your Looker Studio dashboard</div>
            <p style={{ color: 'var(--text-2)', fontSize: '0.85rem', maxWidth: 420 }}>
              Publish a report in Looker Studio backed by your ArkFlow BigQuery dataset, then paste the embed URL below to display it here inline.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <input
              className="input"
              placeholder="https://lookerstudio.google.com/embed/reporting/..."
              style={{ width: 340, borderRadius: 8 }}
            />
            <button className="btn btn-cta" style={{ fontSize: '0.85rem', padding: '0.6rem 1.2rem' }}>
              Embed Report
            </button>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.78rem', color: 'var(--text-3)' }}>
            {['Global Transfer Efficiency', 'Species Population Trend', 'SLA Compliance by Region', 'Outbreak Heatmap'].map(r => (
              <span key={r} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--purple)' }} /> {r}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
