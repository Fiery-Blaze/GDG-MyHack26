import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from '@/components/Layout'
import Dashboard from '@/pages/Dashboard'
import AnimalImport from '@/pages/AnimalImport'
import HealthPassport from '@/pages/HealthPassport'
import TransferMatching from '@/pages/TransferMatching'
import DocumentScanner from '@/pages/DocumentScanner'

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/import" element={<AnimalImport />} />
          <Route path="/passport" element={<HealthPassport />} />
          <Route path="/matching" element={<TransferMatching />} />
          <Route path="/documents" element={<DocumentScanner />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
