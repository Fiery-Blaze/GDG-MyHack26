import React, { useState } from 'react'
import Landing from './pages/Landing'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import DocumentAgent from './pages/DocumentAgent'
import MatchingAgent from './pages/MatchingAgent'
import SLAMonitor from './pages/SLAMonitor'
import AlertCenter from './pages/AlertCenter'
import HealthPassport from './pages/HealthPassport'
import Orchestrator from './pages/Orchestrator'

const pages: Record<string, React.ReactElement> = {
  dashboard: <Dashboard />,
  document: <DocumentAgent />,
  matching: <MatchingAgent />,
  sla: <SLAMonitor />,
  alerts: <AlertCenter />,
  health: <HealthPassport />,
  orchestrator: <Orchestrator />,
}

function App() {
  const [view, setView] = useState<'landing' | 'app'>('landing')
  const [activePage, setActivePage] = useState('dashboard')

  if (view === 'landing') {
    return <Landing onEnterApp={() => setView('app')} />
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }} className="grid-lines">
      <Sidebar active={activePage} onNavigate={setActivePage} onBackToLanding={() => setView('landing')} />
      <main style={{ flex: 1, overflowY: 'auto', maxHeight: '100vh' }}>
        {pages[activePage] ?? <Dashboard />}
      </main>
    </div>
  )
}

export default App
