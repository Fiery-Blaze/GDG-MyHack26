import { useRef, useState } from 'react'
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
  cites: 'Paste CITES permit text here…\n\nExample: Permit No: 12345, Species: Panthera tigris, Quantity: 1, Origin: India, Destination: Malaysia, Expiry: 2025-12-31, Type: I',
  health: 'Paste veterinary health record here…\n\nExample: Microchip: MC-001, Animal: Raja, Species: Panthera tigris, Test: TB Test, Result: negative, Date: 2025-05-16, Clinic: WildCare',
  email: 'Paste CITES approval email here…',
}

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function DocumentScanner() {
  const [docType, setDocType] = useState('cites')
  const [inputMode, setInputMode] = useState<'text' | 'file'>('text')
  const [text, setText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  function resetState() {
    setResult(null)
    setError('')
    setText('')
    setFile(null)
  }

  async function extract() {
    setLoading(true)
    setError('')
    setResult(null)

    try {
      let payload: Record<string, string>

      if (inputMode === 'file' && file) {
        const document_base64 = await toBase64(file)
        payload = { document_base64, mime_type: file.type }
      } else {
        if (!text.trim()) { setLoading(false); return }
        payload = { text }
      }

      const res = await runAgent(INTENTS[docType], payload)
      if (res.success) setResult(res.data)
      else setError(res.error ?? 'Extraction failed')
    } catch {
      setError('Request failed.')
    } finally {
      setLoading(false)
    }
  }

  const canExtract = inputMode === 'file' ? !!file : !!text.trim()
  const usedDocAI = result?.['_extraction_method'] === 'docai+gemini'

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Document Scanner</h2>
        <p className="text-muted-foreground">
          Extract structured data from permits and health records — upload a file for Document AI + Gemini, or paste text for Gemini-only extraction
        </p>
      </div>

      {/* Document type tabs */}
      <Tabs value={docType} onValueChange={v => { setDocType(v); resetState() }}>
        <TabsList>
          <TabsTrigger value="cites">CITES Permit</TabsTrigger>
          <TabsTrigger value="health">Health Record</TabsTrigger>
          <TabsTrigger value="email">Approval Email</TabsTrigger>
        </TabsList>

        {['cites', 'health', 'email'].map(t => (
          <TabsContent key={t} value={t} className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Input</CardTitle>
                  {/* Input mode toggle — email is always text */}
                  {t !== 'email' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={inputMode === 'text' ? 'default' : 'outline'}
                        onClick={() => { setInputMode('text'); resetState() }}
                      >
                        Paste Text
                      </Button>
                      <Button
                        size="sm"
                        variant={inputMode === 'file' ? 'default' : 'outline'}
                        onClick={() => { setInputMode('file'); resetState() }}
                      >
                        Upload File
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {(inputMode === 'text' || t === 'email') ? (
                  <Textarea
                    rows={8}
                    placeholder={PLACEHOLDERS[t]}
                    value={text}
                    onChange={e => setText(e.target.value)}
                  />
                ) : (
                  <div
                    className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => fileRef.current?.click()}
                  >
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.tiff"
                      className="hidden"
                      onChange={e => setFile(e.target.files?.[0] ?? null)}
                    />
                    {file ? (
                      <div className="space-y-1">
                        <p className="font-medium text-sm">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
                        <Badge variant="secondary" className="mt-1">Document AI + Gemini</Badge>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Click to upload PDF, JPG, PNG, or TIFF</p>
                        <Badge variant="secondary">Document AI + Gemini</Badge>
                      </div>
                    )}
                  </div>
                )}

                <Button onClick={extract} disabled={loading || !canExtract}>
                  {loading ? 'Extracting…' : 'Extract'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {result && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <CardTitle>Extracted Data</CardTitle>
              <Badge variant={usedDocAI ? 'default' : 'secondary'}>
                {usedDocAI ? 'Document AI + Gemini' : 'Gemini only'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(result)
                .filter(([key]) => key !== '_extraction_method')
                .map(([key, value]) => (
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
