import React from 'react';
import { Shuffle, Clock, Bell, Heart, TrendingUp, AlertTriangle, ArrowUpRight, Activity, FileText } from 'lucide-react';
import { XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart, BarChart, Bar } from 'recharts';

const slaData = [
  { m: 'Jan', met: 88 }, { m: 'Feb', met: 92 }, { m: 'Mar', met: 79 },
  { m: 'Apr', met: 95 }, { m: 'May', met: 91 },
];
const alertsData = [
  { d: 'Mon', n: 3 }, { d: 'Tue', n: 7 }, { d: 'Wed', n: 2 },
  { d: 'Thu', n: 9 }, { d: 'Fri', n: 4 }, { d: 'Sat', n: 1 }, { d: 'Sun', n: 6 },
];

const stats = [
  { label: 'Active Transfers', value: '34', delta: '+5 this week', icon: <Shuffle size={16} />, color: 'var(--green)', bg: 'rgba(0,220,130,0.1)' },
  { label: 'SLA Compliance', value: '91%', delta: '+3% vs last mo.', icon: <Clock size={16} />, color: 'var(--blue)', bg: 'rgba(79,142,247,0.1)' },
  { label: 'Health Passports', value: '1,248', delta: '+12 today', icon: <Heart size={16} />, color: 'var(--purple)', bg: 'rgba(155,110,243,0.1)' },
  { label: 'Active Alerts', value: '7', delta: '2 high-priority', icon: <Bell size={16} />, color: 'var(--amber)', bg: 'rgba(245,166,35,0.1)' },
];

const activity = [
  { text: 'Male orangutan matched — Zoo SG → Zoo KL', time: '2m ago', tag: 'Match', tagColor: 'badge-green', dot: 'var(--green)' },
  { text: 'Avian influenza outbreak detected within 100km', time: '18m ago', tag: 'Alert', tagColor: 'badge-red', dot: 'var(--red)' },
  { text: 'CITES permit auto-extracted — Bengal Tiger #A-4421', time: '41m ago', tag: 'Document', tagColor: 'badge-blue', dot: 'var(--blue)' },
  { text: 'SLA breach escalated — Transfer TX-0092 overdue 4h', time: '1h ago', tag: 'SLA', tagColor: 'badge-amber', dot: 'var(--amber)' },
  { text: 'Health passport updated — Microchip #9834771', time: '2h ago', tag: 'Health', tagColor: 'badge-purple', dot: 'var(--purple)' },
];

const tooltipStyle = {
  contentStyle: { background: '#0d1526', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 12, color: '#f2f8ff' },
  cursor: { fill: 'rgba(255,255,255,0.03)' },
};

const Dashboard: React.FC = () => (
  <div className="animate-up" style={{ padding: '2rem', maxWidth: 1160 }}>
    {/* Header */}
    <div style={{ marginBottom: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: '0.2rem' }}>
          Good morning, Krishna 👋
        </h1>
        <p style={{ color: 'var(--text-2)', fontSize: '0.875rem' }}>Here's what's happening across your ecosystem today.</p>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button className="btn btn-ghost" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}>Export report</button>
        <button className="btn btn-cta" style={{ fontSize: '0.8rem', padding: '0.5rem 1.1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <FileText size={14} /> New transfer
        </button>
      </div>
    </div>

    {/* Stats */}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem', marginBottom: '1.5rem' }}>
      {stats.map(s => (
        <div key={s.label} className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.6rem' }}>{s.label}</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.04em', color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: '0.4rem' }}>{s.delta}</div>
            </div>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>
              {s.icon}
            </div>
          </div>
        </div>
      ))}
    </div>

    {/* Charts */}
    <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '0.85rem', marginBottom: '1.5rem' }}>
      {/* SLA Area chart */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.1rem' }}>SLA Performance</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-2)' }}>Monthly compliance rate</div>
          </div>
          <span className="badge badge-green"><TrendingUp size={10} /> +3%</span>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={slaData}>
            <defs>
              <linearGradient id="gSLA" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00dc82" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#00dc82" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="m" stroke="transparent" tick={{ fill: 'var(--text-3)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis domain={[60, 100]} stroke="transparent" tick={{ fill: 'var(--text-3)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip {...tooltipStyle} />
            <Area type="monotone" dataKey="met" stroke="#00dc82" strokeWidth={2} fill="url(#gSLA)" name="SLA %" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Alerts bar chart */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.1rem' }}>Weekly Alerts</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-2)' }}>Alerts dispatched per day</div>
          </div>
          <span className="badge badge-amber"><AlertTriangle size={10} /> 7 active</span>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={alertsData} barCategoryGap="30%">
            <XAxis dataKey="d" stroke="transparent" tick={{ fill: 'var(--text-3)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis stroke="transparent" tick={{ fill: 'var(--text-3)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip {...tooltipStyle} />
            <Bar dataKey="n" fill="#f5a623" radius={[4, 4, 0, 0]} name="Alerts" opacity={0.85} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>

    {/* Activity feed */}
    <div className="card" style={{ overflow: 'hidden' }}>
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Activity size={15} color="var(--blue)" />
          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Recent Activity</span>
        </div>
        <button className="btn btn-text" style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>View all <ArrowUpRight size={12} /></button>
      </div>
      {activity.map((item, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.9rem 1.5rem', gap: '1rem',
          borderBottom: i < activity.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
          transition: 'background 0.1s',
        }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flex: 1, minWidth: 0 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: item.dot, flexShrink: 0 }} />
            <span style={{ fontSize: '0.875rem', color: 'var(--text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.text}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
            <span className={`badge ${item.tagColor}`}>{item.tag}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>{item.time}</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default Dashboard;
