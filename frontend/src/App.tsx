import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from '@/components/Layout'
import Dashboard from '@/pages/Dashboard'
import AnimalImport from '@/pages/AnimalImport'
import HealthPassport from '@/pages/HealthPassport'
import TransferMatching from '@/pages/TransferMatching'
import DocumentScanner from '@/pages/DocumentScanner'
import AlertCenter from '@/pages/AlertCenter'
import Analytics from '@/pages/Analytics'
import SLAMonitor from '@/pages/SLAMonitor'
import Orchestrator from '@/pages/Orchestrator'
import Landing from '@/pages/Landing'

export default function App() {
  const [showApp, setShowApp] = useState(false)

  if (!showApp) {
    return <Landing onEnterApp={() => setShowApp(true)} />
  }

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/import" element={<AnimalImport />} />
          <Route path="/passport" element={<HealthPassport />} />
          <Route path="/matching" element={<TransferMatching />} />
          <Route path="/documents" element={<DocumentScanner />} />
          <Route path="/alerts" element={<AlertCenter />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/sla" element={<SLAMonitor />} />
          <Route path="/orchestrator" element={<Orchestrator />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
