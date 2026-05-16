import { NavLink } from 'react-router-dom'
import { Activity, LayoutDashboard, Heart, ArrowLeftRight, FileSearch, PawPrint, Bell, BarChart2, Clock, Cpu } from 'lucide-react'

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/import', label: 'Import Animals', icon: PawPrint },
  { to: '/passport', label: 'Health Passport', icon: Heart },
  { to: '/matching', label: 'Transfer Matching', icon: ArrowLeftRight },
  { to: '/documents', label: 'Document Scanner', icon: FileSearch },
  { to: '/alerts', label: 'Alert Center', icon: Bell },
  { to: '/sla', label: 'SLA Monitor', icon: Clock },
  { to: '/analytics', label: 'Analytics', icon: BarChart2 },
  { to: '/orchestrator', label: 'AI Orchestrator', icon: Cpu },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', color: 'var(--text-1)' }}>
      <aside style={{
        width: 220, flexShrink: 0,
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex', flexDirection: 'column',
        padding: '1.5rem 1rem',
        background: 'rgba(4,8,15,0.98)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '2rem', padding: '0 0.5rem' }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7,
            background: 'linear-gradient(135deg,#00dc82,#00b8f5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Activity size={14} color="#04080f" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', letterSpacing: '-0.02em' }}>ArkFlow</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-3)' }}>Animal Transfer Platform</div>
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: '0.65rem',
                padding: '0.55rem 0.75rem', borderRadius: 8,
                fontSize: '0.84rem', textDecoration: 'none',
                transition: 'all 0.15s',
                background: isActive ? 'rgba(0,220,130,0.1)' : 'transparent',
                color: isActive ? 'var(--green)' : 'var(--text-2)',
                fontWeight: isActive ? 600 : 400,
                borderLeft: isActive ? '2px solid var(--green)' : '2px solid transparent',
              })}
            >
              <Icon size={15} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main style={{ flex: 1, padding: '2rem 2.5rem', overflow: 'auto' }}>
        {children}
      </main>
    </div>
  )
}
