import { useRef, useState } from 'react'
import { runAgent } from '@/api/client'
import { Upload, PawPrint } from 'lucide-react'

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

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split('\n').filter(Boolean)
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? '']))
  })
}

function ValidationDetail({ v }: { v: Validation }) {
  return (
    <div style={{ marginTop: '0.4rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
      {v.notes && <p style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>{v.notes}</p>}
      {v.issues.map((issue, i) => <p key={i} style={{ fontSize: '0.75rem', color: '#f43f5e' }}>Issue: {issue}</p>)}
      {v.warnings.map((w, i) => <p key={i} style={{ fontSize: '0.75rem', color: '#f59e0b' }}>Warning: {w}</p>)}
    </div>
  )
}

const emptyForm = { microchip_id: '', name: '', species: '', sex: '', age: '', zoo_id: '' }

function SingleImport() {
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; data: Record<string, unknown>; error?: string } | null>(null)

  function set(field: string, value: string) {
    if (field === 'age' && Number(value) < 0) return
    setForm(f => ({ ...f, [field]: value }))
  }

  async function submit() {
    if (!form.microchip_id || !form.species) return
    setLoading(true)
    setResult(null)
    try {
      const res = await runAgent('import_animal', { ...form, age: form.age ? Number(form.age) : undefined })
      setResult(res)
    } catch (e: unknown) {
      setResult({ success: false, data: {}, error: String(e) })
    } finally {
      setLoading(false)
    }
  }

  const v = result?.data?.validation as Validation | undefined

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {[
          { field: 'microchip_id', label: 'Microchip ID', placeholder: 'e.g. MC-003', required: true },
          { field: 'name', label: 'Name', placeholder: 'e.g. Raja' },
          { field: 'species', label: 'Species', placeholder: 'e.g. Panthera tigris', required: true },
          { field: 'sex', label: 'Sex', placeholder: 'male / female / unknown' },
          { field: 'age', label: 'Age (years)', placeholder: 'e.g. 4', type: 'number', min: '0' },
          { field: 'zoo_id', label: 'Zoo ID', placeholder: 'e.g. zoo-001' },
        ].map(({ field, label, placeholder, required, type, min }) => (
          <div key={field} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-2)', fontWeight: 500 }}>
              {label} {required && <span style={{ color: '#f43f5e' }}>*</span>}
            </label>
            <input
              className="input-dark"
              type={type ?? 'text'}
              placeholder={placeholder}
              min={min}
              value={form[field as keyof typeof form]}
              onChange={e => set(field, e.target.value)}
            />
          </div>
        ))}
      </div>

      <div>
        <button
          className="btn-primary"
          onClick={submit}
          disabled={loading || !form.microchip_id || !form.species}
        >
          {loading ? 'Validating & importing…' : 'Import Animal'}
        </button>
      </div>

      {result && (
        <div style={{
          padding: '1rem', borderRadius: 10,
          background: result.success ? 'rgba(0,220,130,0.06)' : 'rgba(244,63,94,0.06)',
          border: `1px solid ${result.success ? 'rgba(0,220,130,0.25)' : 'rgba(244,63,94,0.25)'}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: result.success ? 'var(--green)' : '#f43f5e' }}>
              {result.success ? 'Imported successfully' : 'Import rejected'}
            </p>
            {v && <span className={`badge ${v.valid ? 'badge-success' : 'badge-danger'}`}>{v.valid ? 'Valid' : 'Invalid'}</span>}
          </div>
          {result.success && result.data.animal_id != null && (
            <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: '0.35rem' }}>
              DB id: {String(result.data.animal_id)} · Microchip: {String(result.data.microchip_id)}
            </p>
          )}
          {v && <ValidationDetail v={v} />}
          {result.error && <p style={{ fontSize: '0.75rem', color: '#f43f5e', marginTop: '0.35rem' }}>{result.error}</p>}
        </div>
      )}
    </div>
  )
}

function CSVImport() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<Record<string, string>[]>([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<BatchResult | null>(null)

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      setPreview(parseCSV(ev.target?.result as string))
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <label style={{ fontSize: '0.78rem', color: 'var(--text-2)', fontWeight: 500 }}>CSV File</label>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>
          Required: <code style={{ color: 'var(--green)' }}>microchip_id</code>, <code style={{ color: 'var(--green)' }}>species</code> — optional: name, sex, age, zoo_id
        </p>
        <input className="input-dark" type="file" accept=".csv,text/csv" onChange={onFile} ref={fileRef} />
      </div>

      {preview.length > 0 && (
        <>
          <div style={{ borderRadius: 8, border: '1px solid var(--border-subtle)', overflow: 'auto', maxHeight: 200 }}>
            <table style={{ width: '100%', fontSize: '0.78rem', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(6,18,44,0.04)' }}>
                  {Object.keys(preview[0]).map(h => (
                    <th key={h} style={{ padding: '0.5rem 0.75rem', textAlign: 'left', color: 'var(--text-2)', fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr key={i} style={{ borderTop: '1px solid var(--border-subtle)' }}>
                    {Object.values(row).map((v, j) => (
                      <td key={j} style={{ padding: '0.5rem 0.75rem', color: 'var(--text-1)' }}>{v}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <button className="btn-primary" onClick={importBatch} disabled={loading}>
              {loading ? `Validating ${preview.length} records…` : `Import ${preview.length} animals`}
            </button>
          </div>
        </>
      )}

      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <span className="badge badge-success">{result.imported_count} imported</span>
            {result.skipped_count > 0 && <span className="badge badge-danger">{result.skipped_count} skipped</span>}
          </div>

          {result.imported.map(row => (
            <div key={row.microchip_id} style={{
              padding: '0.75rem 1rem', borderRadius: 8,
              background: 'rgba(0,220,130,0.05)', border: '1px solid rgba(0,220,130,0.2)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>{row.microchip_id}</p>
                <span className="badge badge-success">Valid</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>id: {row.animal_id}</span>
              </div>
              <ValidationDetail v={row.validation} />
            </div>
          ))}

          {result.skipped.map((row, i) => (
            <div key={i} style={{
              padding: '0.75rem 1rem', borderRadius: 8,
              background: 'rgba(244,63,94,0.05)', border: '1px solid rgba(244,63,94,0.2)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>{row.record.microchip_id || '(no microchip)'}</p>
                <span className="badge badge-danger">Invalid</span>
              </div>
              <ValidationDetail v={row.validation} />
              {row.error && <p style={{ fontSize: '0.75rem', color: '#f43f5e', marginTop: '0.25rem' }}>Write error: {row.error}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function AnimalImport() {
  const [tab, setTab] = useState<'single' | 'csv'>('single')

  return (
    <div style={{ maxWidth: 900, display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <div className="label" style={{ marginBottom: '0.4rem' }}>Animal Management</div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 700, letterSpacing: '-0.03em', margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <PawPrint size={22} color="var(--green)" /> Import Animals
        </h2>
        <p style={{ color: 'var(--text-2)', marginTop: '0.35rem', fontSize: '0.9rem' }}>
          Add animals individually or in bulk via CSV. Each record is validated by AI before import.
        </p>
      </div>

      <div className="glass-card" style={{ padding: '1.75rem' }}>
        {/* Tab switcher */}
        <div style={{
          display: 'flex', gap: '0.25rem', marginBottom: '1.5rem',
          background: 'rgba(6,18,44,0.04)', borderRadius: 10, padding: '0.25rem',
          width: 'fit-content',
        }}>
          {([['single', 'Single Entry'], ['csv', 'CSV Upload']] as const).map(([val, label]) => (
            <button key={val} onClick={() => setTab(val)} style={{
              padding: '0.45rem 1.1rem', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: tab === val ? 'rgba(0,220,130,0.15)' : 'transparent',
              color: tab === val ? 'var(--green)' : 'var(--text-2)',
              fontWeight: tab === val ? 600 : 400, fontSize: '0.875rem',
              transition: 'all 0.15s',
            }}>
              {label}
            </button>
          ))}
        </div>

        {tab === 'single' ? <SingleImport /> : <CSVImport />}
      </div>

      {tab === 'csv' && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '1rem 1.25rem', borderRadius: 10, background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)' }}>
          <Upload size={16} color="var(--accent-blue)" style={{ marginTop: 2, flexShrink: 0 }} />
          <p style={{ fontSize: '0.8rem', color: 'var(--text-2)', lineHeight: 1.6 }}>
            Download the <span style={{ color: 'var(--text-1)' }}>sample CSV template</span> to get the correct column format.
            All records are validated by the AI import agent before being written to the database.
          </p>
        </div>
      )}
    </div>
  )
}
