import React, { useState } from 'react';
import {
  LayoutDashboard, FileText, Shuffle, Clock, Bell, Heart,
  Cpu, ChevronLeft, ChevronRight, Activity, ArrowLeft, Zap, PawPrint,
} from 'lucide-react';


interface SidebarProps {
  active: string;
  onNavigate: (id: string) => void;
  onBackToLanding: () => void;
}

const nav = [
  { id: 'dashboard',    label: 'Dashboard',       icon: <LayoutDashboard size={16} /> },
  { id: 'animals',      label: 'Animals',          icon: <PawPrint size={16} /> },
  { id: 'document',     label: 'Documents',        icon: <FileText size={16} /> },
  { id: 'matching',     label: 'Matching',         icon: <Shuffle size={16} /> },
  { id: 'sla',          label: 'SLA Monitor',      icon: <Clock size={16} /> },
  { id: 'alerts',       label: 'Alerts',           icon: <Bell size={16} /> },
  { id: 'health',       label: 'Health Passport',  icon: <Heart size={16} /> },
  { id: 'orchestrator', label: 'AI Orchestrator',  icon: <Cpu size={16} /> },
];


const Sidebar: React.FC<SidebarProps> = ({ active, onNavigate, onBackToLanding }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside style={{
      width: collapsed ? 60 : 228,
      minHeight: '100vh',
      background: 'var(--surface-1)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.22s cubic-bezier(0.4,0,0.2,1)',
      position: 'relative',
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ height: 56, display: 'flex', alignItems: 'center', gap: '0.65rem', padding: collapsed ? '0 1rem' : '0 1.1rem', borderBottom: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{
          width: 28, height: 28, borderRadius: 7, flexShrink: 0,
          background: 'linear-gradient(135deg,#00dc82,#00b8f5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Activity size={14} color="#04080f" />
        </div>
        {!collapsed && (
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>ArkFlow</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', whiteSpace: 'nowrap' }}>Connect — Beta</div>
          </div>
        )}
      </div>

      {/* Upgrade nudge */}
      {!collapsed && (
        <div style={{ margin: '0.75rem 0.75rem 0', padding: '0.75rem', borderRadius: 10, background: 'rgba(0,220,130,0.06)', border: '1px solid rgba(0,220,130,0.15)', cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
            <Zap size={12} color="var(--green)" />
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Trial — 12 days left</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-2)', lineHeight: 1.5 }}>Upgrade to Pro for unlimited animals & API access.</p>
          <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--green)' }}>Upgrade now →</div>
        </div>
      )}

      {/* Nav */}
      <nav style={{ flex: 1, padding: '0.75rem 0.5rem', display: 'flex', flexDirection: 'column', gap: '0.1rem', overflowY: 'auto' }}>
        {nav.map(item => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`nav-item${active === item.id ? ' active' : ''}`}
            title={collapsed ? item.label : undefined}
            style={{ justifyContent: collapsed ? 'center' : 'flex-start', padding: collapsed ? '0.6rem' : undefined }}
          >
            <span style={{ flexShrink: 0 }}>{item.icon}</span>
            {!collapsed && <span>{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Back to landing */}
      <div style={{ padding: '0.5rem 0.5rem', borderTop: '1px solid var(--border)' }}>
        <button
          onClick={onBackToLanding}
          className="nav-item"
          title={collapsed ? 'Back to site' : undefined}
          style={{ justifyContent: collapsed ? 'center' : undefined, padding: collapsed ? '0.6rem' : undefined }}
        >
          <ArrowLeft size={15} />
          {!collapsed && <span style={{ fontSize: '0.82rem' }}>Back to site</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(c => !c)}
        style={{
          position: 'absolute', top: '50%', right: -12, transform: 'translateY(-50%)',
          width: 24, height: 24, borderRadius: '50%',
          background: 'var(--surface-2)', border: '1px solid var(--border-strong)',
          color: 'var(--text-2)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10, transition: 'all 0.2s',
        }}
      >
        {collapsed ? <ChevronRight size={11} /> : <ChevronLeft size={11} />}
      </button>
    </aside>
  );
};

export default Sidebar;
