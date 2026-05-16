import { useRef, useState } from 'react'
import { runAgent } from '@/api/client'
import { FileSearch, Upload, FileText } from 'lucide-react'

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

const DOC_TABS = [
  { id: 'cites', label: 'CITES Permit' },
  { id: 'health', label: 'Health Record' },
  { id: 'email', label: 'Approval Email' },
]

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
    setResult(null); setError(''); setText(''); setFile(null)
  }

  async function extract() {
    setLoading(true); setError(''); setResult(null)
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
    <div style={{ maxWidth: 900, display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <div className="label" style={{ marginBottom: '0.4rem' }}>AI Extraction</div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 700, letterSpacing: '-0.03em', margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <FileSearch size={22} color="var(--green)" /> Document Scanner
        </h2>
        <p style={{ color: 'var(--text-2)', marginTop: '0.35rem', fontSize: '0.9rem' }}>
          Extract structured data from permits and health records. Upload a file for Document AI + Gemini, or paste text for Gemini-only.
        </p>
      </div>

      {/* Doc type tabs */}
      <div style={{
        display: 'flex', gap: '0.25rem',
        background: 'rgba(6,18,44,0.04)', borderRadius: 10, padding: '0.25rem',
        width: 'fit-content',
      }}>
        {DOC_TABS.map(t => (
          <button key={t.id} onClick={() => { setDocType(t.id); resetState() }} style={{
            padding: '0.45rem 1.1rem', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: docType === t.id ? 'rgba(0,220,130,0.15)' : 'transparent',
            color: docType === t.id ? 'var(--green)' : 'var(--text-2)',
            fontWeight: docType === t.id ? 600 : 400, fontSize: '0.875rem',
            transition: 'all 0.15s',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Input card */}
      <div className="glass-card" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--green)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Input</p>
          {docType !== 'email' && (
            <div style={{ display: 'flex', gap: '0.4rem', background: 'rgba(6,18,44,0.04)', borderRadius: 8, padding: '0.2rem' }}>
              {([['text', 'Paste Text'], ['file', 'Upload File']] as const).map(([val, label]) => (
                <button key={val} onClick={() => { setInputMode(val); resetState() }} style={{
                  padding: '0.35rem 0.8rem', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: '0.8rem',
                  background: inputMode === val ? 'rgba(0,220,130,0.15)' : 'transparent',
                  color: inputMode === val ? 'var(--green)' : 'var(--text-3)',
                  fontWeight: inputMode === val ? 600 : 400, transition: 'all 0.15s',
                }}>
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {(inputMode === 'text' || docType === 'email') ? (
          <textarea
            className="input-dark"
            rows={8}
            placeholder={PLACEHOLDERS[docType]}
            value={text}
            onChange={e => setText(e.target.value)}
            style={{ resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }}
          />
        ) : (
          <div
            onClick={() => fileRef.current?.click()}
            style={{
              border: '2px dashed var(--border-strong)', borderRadius: 12, padding: '3rem',
              textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.2s',
              background: 'rgba(255,255,255,0.01)',
            }}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.tiff"
              style={{ display: 'none' }}
              onChange={e => setFile(e.target.files?.[0] ?? null)}
            />
            {file ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={28} color="var(--green)" />
                <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{file.name}</p>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>{(file.size / 1024).toFixed(0)} KB</p>
                <span className="badge badge-success">Document AI + Gemini</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                <Upload size={28} color="var(--text-3)" />
                <p style={{ fontSize: '0.875rem', color: 'var(--text-2)' }}>Click to upload PDF, JPG, PNG, or TIFF</p>
                <span className="badge" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.25)' }}>Document AI + Gemini</span>
              </div>
            )}
          </div>
        )}

        <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn-primary" onClick={extract} disabled={loading || !canExtract}>
            {loading ? 'Extracting…' : 'Extract'}
          </button>
          {error && <p style={{ fontSize: '0.85rem', color: '#f43f5e' }}>{error}</p>}
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className="glass-card" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--green)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Extracted Data</p>
            <span className={`badge ${usedDocAI ? 'badge-success' : ''}`} style={!usedDocAI ? { background: 'rgba(6,18,44,0.08)', color: 'var(--text-2)', border: '1px solid var(--border-subtle)' } : {}}>
              {usedDocAI ? 'Document AI + Gemini' : 'Gemini only'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {Object.entries(result)
              .filter(([key]) => key !== '_extraction_method')
              .map(([key, value]) => (
                <div key={key} style={{ padding: '0.75rem 1rem', borderRadius: 8, background: 'rgba(6,18,44,0.04)', border: '1px solid var(--border-subtle)' }}>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-3)', textTransform: 'capitalize', marginBottom: '0.35rem' }}>
                    {key.replace(/_/g, ' ')}
                  </p>
                  {typeof value === 'boolean' ? (
                    <span className={`badge ${value ? 'badge-danger' : 'badge-success'}`}>{String(value)}</span>
                  ) : (
                    <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-1)' }}>{String(value)}</p>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
