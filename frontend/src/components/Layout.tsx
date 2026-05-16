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
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F0F4F8' }}>
      {/* Dark navy sidebar */}
      <aside style={{
        width: 224, flexShrink: 0,
        background: '#06122C',
        display: 'flex', flexDirection: 'column',
        padding: '1.5rem 1rem',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '2rem', padding: '0 0.5rem' }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: 'linear-gradient(135deg, #2EE5B3, #4AD2AB)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Activity size={15} color="#06122C" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#FFFFFF', letterSpacing: '-0.02em' }}>ArkFlow</div>
            <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)' }}>Animal Transfer Platform</div>
          </div>
        </div>

        {/* Nav links */}
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
                background: isActive ? 'rgba(46,229,179,0.12)' : 'transparent',
                color: isActive ? '#2EE5B3' : 'rgba(255,255,255,0.6)',
                fontWeight: isActive ? 600 : 400,
                borderLeft: isActive ? '2px solid #2EE5B3' : '2px solid transparent',
              })}
            >
              <Icon size={15} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, padding: '2rem 2.5rem', overflow: 'auto', color: '#06122C' }}>
        {children}
      </main>
    </div>
  )
}
