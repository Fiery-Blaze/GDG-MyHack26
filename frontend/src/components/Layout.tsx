import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Heart, ArrowLeftRight, FileSearch, PawPrint } from 'lucide-react'

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/import', label: 'Import Animals', icon: PawPrint },
  { to: '/passport', label: 'Health Passport', icon: Heart },
  { to: '/matching', label: 'Transfer Matching', icon: ArrowLeftRight },
  { to: '/documents', label: 'Document Scanner', icon: FileSearch },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="w-60 border-r flex flex-col p-4 gap-1">
        <div className="mb-6 px-2">
          <h1 className="text-xl font-bold tracking-tight">ArkFlow</h1>
          <p className="text-xs text-muted-foreground">Animal Transfer Platform</p>
        </div>
        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </aside>
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  )
}
