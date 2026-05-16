import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, Loader, AlertCircle } from 'lucide-react';
import { agentApi } from '../lib/api';

type Stage = 'idle' | 'uploading' | 'extracting' | 'done' | 'error';

interface ExtractedData {
  permit_number?: string;
  species?: string;
  expiry?: string;
  origin_country?: string;
  destination_country?: string;
  microchip_id?: string;
  test_name?: string;
  result?: string;
  date?: string;
  vet_clinic?: string;
  [key: string]: unknown;
}

const docTypes = [
  { id: 'document_cites', label: 'CITES Permit', description: 'International wildlife trade permits' },
  { id: 'document_health_record', label: 'Health Record / Lab Report', description: 'Vet lab results and health certificates' },
  { id: 'document_email_permit', label: 'Email Permit (CITES approval)', description: 'Paste email body for permit extraction' },
];

const DocumentAgent: React.FC = () => {
  const [selectedType, setSelectedType] = useState(docTypes[0].id);
  const [textInput, setTextInput] = useState('');
  const [stage, setStage] = useState<Stage>('idle');
  const [result, setResult] = useState<ExtractedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleRun = async () => {
    if (!textInput.trim()) return;
    setStage('extracting');
    setResult(null);
    setError(null);
    try {
      const res = await agentApi.run(selectedType, { user_input: textInput });
      if (res.data.success) {
        setResult((res.data.data as ExtractedData) || { raw: res.data.data });
        setStage('done');
      } else {
        setError(res.data.error || 'Agent returned an error.');
        setStage('error');
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Could not reach backend. Is it running?';
      setError(msg);
      setStage('error');
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: '2rem', maxWidth: 900 }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.3rem' }}>
          <span className="gradient-text-green">Document</span> & Permit Agent
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Upload or paste permits and health records. AI extracts structured data automatically.
        </p>
      </div>

      {/* Doc type selector */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {docTypes.map(t => (
          <button
            key={t.id}
            onClick={() => setSelectedType(t.id)}
            style={{
              padding: '0.6rem 1rem',
              borderRadius: 10,
              border: selectedType === t.id ? '1px solid rgba(0,229,160,0.5)' : '1px solid var(--border-subtle)',
              background: selectedType === t.id ? 'rgba(0,229,160,0.1)' : 'transparent',
              color: selectedType === t.id ? 'var(--accent-green)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 500,
              transition: 'all 0.2s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Input area */}
      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if(f) { const r = new FileReader(); r.onload = ev => setTextInput(ev.target?.result as string || ''); r.readAsText(f); }}}
          style={{
            border: `2px dashed ${dragOver ? 'rgba(0,229,160,0.6)' : 'var(--border-subtle)'}`,
            borderRadius: 12, padding: '1.5rem', marginBottom: '1rem', textAlign: 'center',
            background: dragOver ? 'rgba(0,229,160,0.04)' : 'transparent',
            transition: 'all 0.2s',
          }}
        >
          <Upload size={24} color="var(--text-secondary)" style={{ margin: '0 auto 0.5rem' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Drop a text/PDF file here to auto-fill</p>
        </div>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Or paste document text / describe the document:
        </label>
        <textarea
          className="input-dark"
          rows={6}
          value={textInput}
          onChange={e => setTextInput(e.target.value)}
          placeholder={selectedType === 'document_cites'
            ? 'Paste CITES permit text here, e.g. "Permit No: MY-2026-0042, Species: Panthera tigris, Origin: Malaysia..."'
            : selectedType === 'document_health_record'
            ? 'Paste lab report text, e.g. "Microchip: 982000411234567, Test: Avian Influenza H5N1, Result: Negative, Date: 2026-05-10..."'
            : 'Paste the email body containing the CITES approval...'}
          style={{ resize: 'vertical' }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button
            className="btn-primary"
            onClick={handleRun}
            disabled={stage === 'extracting' || !textInput.trim()}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: (!textInput.trim()) ? 0.5 : 1 }}
          >
            {stage === 'extracting' ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <FileText size={16} />}
            {stage === 'extracting' ? 'Extracting...' : 'Extract with AI'}
          </button>
        </div>
      </div>

      {/* Results */}
      {stage === 'done' && result && (
        <div className="glass-card animate-fade-in" style={{ padding: '1.5rem', borderColor: 'rgba(0,229,160,0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <CheckCircle size={18} color="var(--accent-green)" />
            <span style={{ fontWeight: 600, color: 'var(--accent-green)' }}>Extraction Complete</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
            {Object.entries(result).map(([key, val]) => (
              <div key={key} style={{ background: 'rgba(5,10,20,0.5)', borderRadius: 8, padding: '0.75rem' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                  {key.replace(/_/g, ' ')}
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 500 }}>{String(val)}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
            <button className="btn-primary" style={{ fontSize: '0.85rem' }}>✓ Confirm & Save to Blueprint</button>
            <button className="btn-secondary" style={{ fontSize: '0.85rem' }} onClick={() => { setStage('idle'); setResult(null); setTextInput(''); }}>Clear</button>
          </div>
        </div>
      )}

      {stage === 'error' && (
        <div className="glass-card animate-fade-in" style={{ padding: '1.25rem', borderColor: 'rgba(244,63,94,0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={16} color="#f43f5e" />
            <span style={{ color: '#f43f5e', fontSize: '0.85rem' }}>{error}</span>
          </div>
        </div>
      )}

      {/* Pipeline visualization */}
      <div className="glass-card" style={{ padding: '1.25rem', marginTop: '1.5rem' }}>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', fontWeight: 600 }}>AI PIPELINE</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.8rem' }}>
          {['Upload / Paste', 'OCR if needed', 'Chunk text', 'Embed (text-embedding)', 'Vector search', 'LLM extraction', 'Validate', 'Auto-fill Blueprint'].map((step, i, arr) => (
            <React.Fragment key={step}>
              <span style={{ padding: '0.25rem 0.6rem', background: 'rgba(0,229,160,0.08)', border: '1px solid rgba(0,229,160,0.2)', borderRadius: 6, color: 'var(--accent-green)' }}>{step}</span>
              {i < arr.length - 1 && <span style={{ color: 'var(--text-secondary)' }}>→</span>}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DocumentAgent;
