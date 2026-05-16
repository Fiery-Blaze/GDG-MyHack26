import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { runAgent } from '@/api/client'

const INTENTS: Record<string, string> = {
  cites: 'document_cites',
  health: 'document_health_record',
  email: 'document_email_permit',
}

const PLACEHOLDERS: Record<string, string> = {
  cites: 'Paste CITES permit text here...\n\nExample: Permit No: 12345, Species: Panthera tigris, Quantity: 1, Origin: India, Destination: Malaysia, Expiry: 2025-12-31, Type: I',
  health: 'Paste veterinary health record here...\n\nExample: Microchip: MC-001, Animal: Raja, Species: Panthera tigris, Test: TB Test, Result: negative, Date: 2025-05-16, Clinic: WildCare',
  email: 'Paste CITES approval email here...',
}

export default function DocumentScanner() {
  const [tab, setTab] = useState('cites')
  const [text, setText] = useState('')
  const [result, setResult] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function extract() {
    if (!text.trim()) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await runAgent(INTENTS[tab], { text })
      if (res.success) setResult(res.data)
      else setError(res.error ?? 'Extraction failed')
    } catch {
      setError('Request failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Document Scanner</h2>
        <p className="text-muted-foreground">Extract structured data from permits and health records using Gemini</p>
      </div>

      <Tabs value={tab} onValueChange={(v) => { setTab(v); setResult(null); setText('') }}>
        <TabsList>
          <TabsTrigger value="cites">CITES Permit</TabsTrigger>
          <TabsTrigger value="health">Health Record</TabsTrigger>
          <TabsTrigger value="email">Approval Email</TabsTrigger>
        </TabsList>

        {['cites', 'health', 'email'].map((t) => (
          <TabsContent key={t} value={t} className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Paste Document Text</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  rows={8}
                  placeholder={PLACEHOLDERS[t]}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
                <Button onClick={extract} disabled={loading}>
                  {loading ? 'Extracting...' : 'Extract with Gemini'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {result && (
        <Card>
          <CardHeader><CardTitle>Extracted Data</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(result).map(([key, value]) => (
                <div key={key} className="border rounded-md px-3 py-2">
                  <p className="text-xs text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</p>
                  <div className="mt-1">
                    {typeof value === 'boolean' ? (
                      <Badge variant={value ? 'destructive' : 'secondary'}>{String(value)}</Badge>
                    ) : (
                      <p className="text-sm font-medium">{String(value)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
