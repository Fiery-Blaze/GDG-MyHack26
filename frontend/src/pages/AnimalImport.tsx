import { useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { runAgent } from '@/api/client'

// ── types ──────────────────────────────────────────────────────────────────

interface Validation {
  valid: boolean
  issues: string[]
  warnings: string[]
  notes: string
}

interface ImportedRow {
  animal_id: number
  microchip_id: string
  validation: Validation
}

interface SkippedRow {
  record: Record<string, string>
  validation: Validation
  error?: string
}

interface BatchResult {
  imported_count: number
  skipped_count: number
  imported: ImportedRow[]
  skipped: SkippedRow[]
}

// ── CSV parser ─────────────────────────────────────────────────────────────

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split('\n').filter(Boolean)
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''))
  return lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''))
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? '']))
  })
}

// ── validation badge helpers ───────────────────────────────────────────────

function ValidationBadge({ valid }: { valid: boolean }) {
  return (
    <Badge variant={valid ? 'secondary' : 'destructive'}>
      {valid ? 'Valid' : 'Invalid'}
    </Badge>
  )
}

function ValidationDetail({ v }: { v: Validation }) {
  return (
    <div className="mt-1 space-y-0.5 text-xs">
      {v.notes && <p className="text-muted-foreground">{v.notes}</p>}
      {v.issues.map((issue, i) => (
        <p key={i} className="text-destructive">Issue: {issue}</p>
      ))}
      {v.warnings.map((w, i) => (
        <p key={i} className="text-yellow-600">Warning: {w}</p>
      ))}
    </div>
  )
}

// ── single import form ─────────────────────────────────────────────────────

const emptyForm = { microchip_id: '', name: '', species: '', sex: '', age: '', zoo_id: '' }

function SingleImport() {
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; data: Record<string, unknown>; error?: string } | null>(null)

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function submit() {
    if (!form.microchip_id || !form.species) return
    setLoading(true)
    setResult(null)
    try {
      const res = await runAgent('import_animal', {
        ...form,
        age: form.age ? Number(form.age) : undefined,
      })
      setResult(res)
    } catch (e: unknown) {
      setResult({ success: false, data: {}, error: String(e) })
    } finally {
      setLoading(false)
    }
  }

  const v: Validation | undefined = result?.data?.validation as Validation | undefined

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Microchip ID <span className="text-destructive">*</span></Label>
          <Input placeholder="e.g. MC-003" value={form.microchip_id} onChange={(e) => set('microchip_id', e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Name</Label>
          <Input placeholder="e.g. Raja" value={form.name} onChange={(e) => set('name', e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Species <span className="text-destructive">*</span></Label>
          <Input placeholder="e.g. Panthera tigris" value={form.species} onChange={(e) => set('species', e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Sex</Label>
          <Input placeholder="male / female / unknown" value={form.sex} onChange={(e) => set('sex', e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Age (years)</Label>
          <Input type="number" placeholder="e.g. 4" value={form.age} onChange={(e) => set('age', e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Zoo ID</Label>
          <Input placeholder="e.g. zoo-001" value={form.zoo_id} onChange={(e) => set('zoo_id', e.target.value)} />
        </div>
      </div>

      <Button onClick={submit} disabled={loading || !form.microchip_id || !form.species}>
        {loading ? 'Validating & importing...' : 'Import Animal'}
      </Button>

      {result && (
        <div className={`border rounded-md p-4 space-y-2 ${result.success ? 'border-green-300 bg-green-50' : 'border-destructive/30 bg-destructive/5'}`}>
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">{result.success ? 'Imported successfully' : 'Import rejected'}</p>
            {v && <ValidationBadge valid={v.valid} />}
          </div>
          {result.success && result.data.animal_id != null && (
            <p className="text-xs text-muted-foreground">DB id: {String(result.data.animal_id)} · Microchip: {String(result.data.microchip_id)}</p>
          )}
          {v && <ValidationDetail v={v} />}
          {result.error && <p className="text-xs text-destructive">{result.error}</p>}
        </div>
      )}
    </div>
  )
}

// ── CSV import ─────────────────────────────────────────────────────────────

function CSVImport() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<Record<string, string>[]>([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<BatchResult | null>(null)

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      setPreview(parseCSV(text))
      setResult(null)
    }
    reader.readAsText(file)
  }

  async function importBatch() {
    if (!preview.length) return
    setLoading(true)
    try {
      const res = await runAgent('import_animals_csv', { animals: preview })
      setResult(res.data as BatchResult)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Label>CSV File</Label>
        <p className="text-xs text-muted-foreground">
          Required columns: <code>microchip_id</code>, <code>species</code> — optional: <code>name</code>, <code>sex</code>, <code>age</code>, <code>zoo_id</code>
        </p>
        <Input ref={fileRef} type="file" accept=".csv,text/csv" onChange={onFile} />
      </div>

      {preview.length > 0 && (
        <>
          <div className="border rounded-md overflow-auto max-h-48">
            <table className="w-full text-xs">
              <thead className="bg-muted">
                <tr>
                  {Object.keys(preview[0]).map((h) => (
                    <th key={h} className="px-3 py-1.5 text-left font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr key={i} className="border-t">
                    {Object.values(row).map((v, j) => (
                      <td key={j} className="px-3 py-1.5">{v}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Button onClick={importBatch} disabled={loading}>
            {loading ? `Validating ${preview.length} records...` : `Import ${preview.length} animals`}
          </Button>
        </>
      )}

      {result && (
        <div className="space-y-3">
          <div className="flex gap-3">
            <Badge variant="secondary">{result.imported_count} imported</Badge>
            {result.skipped_count > 0 && (
              <Badge variant="destructive">{result.skipped_count} skipped</Badge>
            )}
          </div>

          {result.imported.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-green-700">Imported</p>
              {result.imported.map((row) => (
                <div key={row.microchip_id} className="border border-green-200 rounded-md px-3 py-2">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{row.microchip_id}</p>
                    <ValidationBadge valid={true} />
                    <span className="text-xs text-muted-foreground">id: {row.animal_id}</span>
                  </div>
                  <ValidationDetail v={row.validation} />
                </div>
              ))}
            </div>
          )}

          {result.skipped.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-destructive">Skipped</p>
              {result.skipped.map((row, i) => (
                <div key={i} className="border border-destructive/30 rounded-md px-3 py-2">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{row.record.microchip_id || '(no microchip)'}</p>
                    <ValidationBadge valid={false} />
                  </div>
                  <ValidationDetail v={row.validation} />
                  {row.error && <p className="text-xs text-destructive mt-0.5">Write error: {row.error}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── page ───────────────────────────────────────────────────────────────────

export default function AnimalImport() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Import Animals</h2>
        <p className="text-muted-foreground">
          Add animals individually or in bulk via CSV. Each record is validated by AI before import.
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle>Add Animals</CardTitle></CardHeader>
        <CardContent>
          <Tabs defaultValue="single">
            <TabsList className="mb-4">
              <TabsTrigger value="single">Single Entry</TabsTrigger>
              <TabsTrigger value="csv">CSV Upload</TabsTrigger>
            </TabsList>
            <TabsContent value="single"><SingleImport /></TabsContent>
            <TabsContent value="csv"><CSVImport /></TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
