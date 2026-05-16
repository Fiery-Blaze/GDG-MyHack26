import React, { useState, useRef } from 'react';
import { Plus, Upload, Download, Trash2, CheckCircle, AlertCircle, PawPrint, X } from 'lucide-react';

interface Animal {
  microchip: string;
  name: string;
  species: string;
  sex: 'male' | 'female' | 'unknown';
  dob: string;
  location: string;
  status: 'healthy' | 'monitoring' | 'critical';
}

const DEMO_ANIMALS: Animal[] = [
  { microchip: '982000411234567', name: 'Raja', species: 'Bengal Tiger', sex: 'male', dob: '2014-03-12', location: 'Zoo Negara, KL', status: 'healthy' },
  { microchip: '982000411234568', name: 'Sari', species: 'Sumatran Orangutan', sex: 'female', dob: '2011-07-04', location: 'Singapore Zoo', status: 'monitoring' },
  { microchip: '982000411234569', name: 'Budi', species: 'Pygmy Slow Loris', sex: 'male', dob: '2019-01-22', location: 'Mandai Wildlife Reserve', status: 'healthy' },
  { microchip: '982000411234570', name: 'Lena', species: 'Snow Leopard', sex: 'female', dob: '2016-09-08', location: 'Dubai Safari Park', status: 'critical' },
];

const CSV_TEMPLATE = `microchip,name,species,sex,dob,location,status
982000411234571,Kibo,African Elephant,male,2010-05-15,Taronga Zoo,healthy
982000411234572,Mia,Clouded Leopard,female,2018-11-03,Night Safari SG,monitoring`;

const statusMeta: Record<string, { label: string; cls: string }> = {
  healthy:    { label: 'Healthy',    cls: 'badge-green' },
  monitoring: { label: 'Monitoring', cls: 'badge-amber' },
  critical:   { label: 'Critical',   cls: 'badge-red'   },
};

const emptyForm = (): Animal => ({ microchip: '', name: '', species: '', sex: 'unknown', dob: '', location: '', status: 'healthy' });

const Animals: React.FC = () => {
  const [animals, setAnimals] = useState<Animal[]>(DEMO_ANIMALS);
  const [tab, setTab] = useState<'list' | 'manual' | 'import'>('list');
  const [form, setForm] = useState<Animal>(emptyForm());
  const [formMsg, setFormMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [importText, setImportText] = useState('');
  const [importMsg, setImportMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Manual add ──
  const handleFormChange = (k: keyof Animal, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleAddAnimal = () => {
    if (!form.microchip || !form.species || !form.name) {
      setFormMsg({ ok: false, text: 'Microchip ID, Name, and Species are required.' });
      return;
    }
    if (animals.find(a => a.microchip === form.microchip)) {
      setFormMsg({ ok: false, text: `Microchip ${form.microchip} already exists.` });
      return;
    }
    setAnimals(prev => [form, ...prev]);
    setForm(emptyForm());
    setFormMsg({ ok: true, text: `${form.name} registered successfully.` });
    setTimeout(() => setTab('list'), 1200);
  };

  // ── CSV / JSON import ──
  const parseCSV = (text: string): { added: number; errors: string[] } => {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const errors: string[] = [];
    let added = 0;
    const newAnimals: Animal[] = [];
    lines.slice(1).forEach((line, i) => {
      if (!line.trim()) return;
      const vals = line.split(',').map(v => v.trim());
      const row: Record<string, string> = {};
      headers.forEach((h, j) => { row[h] = vals[j] ?? ''; });
      if (!row.microchip || !row.species) { errors.push(`Row ${i + 2}: missing microchip or species`); return; }
      if (animals.find(a => a.microchip === row.microchip) || newAnimals.find(a => a.microchip === row.microchip)) {
        errors.push(`Row ${i + 2}: microchip ${row.microchip} already exists`); return;
      }
      newAnimals.push({
        microchip: row.microchip, name: row.name || 'Unnamed',
        species: row.species,
        sex: (['male','female','unknown'].includes(row.sex) ? row.sex : 'unknown') as Animal['sex'],
        dob: row.dob || '', location: row.location || '',
        status: (['healthy','monitoring','critical'].includes(row.status) ? row.status : 'healthy') as Animal['status'],
      });
      added++;
    });
    setAnimals(prev => [...newAnimals, ...prev]);
    return { added, errors };
  };

  const parseJSON = (text: string): { added: number; errors: string[] } => {
    try {
      const arr: Animal[] = JSON.parse(text);
      if (!Array.isArray(arr)) return { added: 0, errors: ['JSON must be an array of animal objects.'] };
      const errors: string[] = [];
      const newAnimals: Animal[] = [];
      arr.forEach((row, i) => {
        if (!row.microchip || !row.species) { errors.push(`Item ${i}: missing microchip or species`); return; }
        if (animals.find(a => a.microchip === row.microchip)) { errors.push(`Item ${i}: microchip already exists`); return; }
        newAnimals.push({ ...emptyForm(), ...row });
      });
      setAnimals(prev => [...newAnimals, ...prev]);
      return { added: newAnimals.length, errors };
    } catch {
      return { added: 0, errors: ['Invalid JSON format.'] };
    }
  };

  const handleImport = () => {
    const text = importText.trim();
    if (!text) { setImportMsg({ ok: false, text: 'Paste CSV or JSON data above.' }); return; }
    const result = text.startsWith('[') || text.startsWith('{') ? parseJSON(text) : parseCSV(text);
    if (result.added > 0) {
      setImportMsg({ ok: true, text: `${result.added} animal(s) imported.${result.errors.length ? ' ' + result.errors.length + ' row(s) skipped.' : ''}` });
      setImportText('');
      setTimeout(() => setTab('list'), 1500);
    } else {
      setImportMsg({ ok: false, text: result.errors[0] || 'No animals imported.' });
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) readFile(file);
  };

  const readFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = ev => setImportText(ev.target?.result as string);
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'arkflow_animals_template.csv';
    a.click();
  };

  return (
    <div className="animate-up" style={{ padding: '2rem', maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ marginBottom: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: '0.2rem' }}>
            <span className="g-green">Animals</span> Registry
          </h1>
          <p style={{ color: 'var(--text-2)', fontSize: '0.875rem' }}>
            {animals.length} animals registered · Add manually or import from CSV / JSON
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-ghost" onClick={() => { setTab('import'); setImportMsg(null); }} style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Upload size={14} /> Import
          </button>
          <button className="btn btn-cta" onClick={() => { setTab('manual'); setFormMsg(null); }} style={{ fontSize: '0.85rem', padding: '0.5rem 1.1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Plus size={14} /> Add Animal
          </button>
        </div>
      </div>

      {/* ── MANUAL FORM ── */}
      {tab === 'manual' && (
        <div className="card animate-up" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <span style={{ fontWeight: 700, fontSize: '1rem' }}>Register New Animal</span>
            <button className="btn btn-icon" onClick={() => setTab('list')}><X size={14} /></button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
            {[
              { label: 'Microchip ID *', key: 'microchip', placeholder: '982000411234567' },
              { label: 'Name *', key: 'name', placeholder: 'e.g. Raja' },
              { label: 'Species *', key: 'species', placeholder: 'e.g. Bengal Tiger' },
              { label: 'Date of Birth', key: 'dob', placeholder: 'YYYY-MM-DD', type: 'date' },
              { label: 'Location / Zoo', key: 'location', placeholder: 'e.g. Zoo Negara, KL' },
            ].map(f => (
              <div key={f.key}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-2)', fontWeight: 600, display: 'block', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{f.label}</label>
                <input
                  className="input"
                  type={f.type || 'text'}
                  value={form[f.key as keyof Animal] as string}
                  onChange={e => handleFormChange(f.key as keyof Animal, e.target.value)}
                  placeholder={f.placeholder}
                />
              </div>
            ))}
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-2)', fontWeight: 600, display: 'block', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Sex</label>
              <select className="input" value={form.sex} onChange={e => handleFormChange('sex', e.target.value)} style={{ cursor: 'pointer' }}>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-2)', fontWeight: 600, display: 'block', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Health Status</label>
              <select className="input" value={form.status} onChange={e => handleFormChange('status', e.target.value)} style={{ cursor: 'pointer' }}>
                <option value="healthy">Healthy</option>
                <option value="monitoring">Monitoring</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
          {formMsg && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.9rem', borderRadius: 8, marginBottom: '1rem', background: formMsg.ok ? 'rgba(0,220,130,0.08)' : 'rgba(240,78,109,0.08)', border: `1px solid ${formMsg.ok ? 'rgba(0,220,130,0.25)' : 'rgba(240,78,109,0.25)'}`, fontSize: '0.85rem', color: formMsg.ok ? 'var(--green)' : 'var(--red)' }}>
              {formMsg.ok ? <CheckCircle size={14} /> : <AlertCircle size={14} />} {formMsg.text}
            </div>
          )}
          <button className="btn btn-cta" onClick={handleAddAnimal} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Plus size={15} /> Register Animal
          </button>
        </div>
      )}

      {/* ── IMPORT PANEL ── */}
      {tab === 'import' && (
        <div className="card animate-up" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontWeight: 700, fontSize: '1rem' }}>Bulk Import</span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-ghost" onClick={downloadTemplate} style={{ fontSize: '0.8rem', padding: '0.4rem 0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Download size={13} /> Download CSV template
              </button>
              <button className="btn btn-icon" onClick={() => setTab('list')}><X size={14} /></button>
            </div>
          </div>

          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleFileDrop}
            onClick={() => fileRef.current?.click()}
            style={{
              border: `2px dashed ${dragging ? 'var(--green)' : 'rgba(255,255,255,0.12)'}`,
              borderRadius: 12, padding: '1.5rem', textAlign: 'center',
              cursor: 'pointer', marginBottom: '1rem', transition: 'border-color 0.2s',
              background: dragging ? 'rgba(0,220,130,0.04)' : 'transparent',
            }}
          >
            <Upload size={22} color="var(--text-3)" style={{ margin: '0 auto 0.5rem' }} />
            <p style={{ fontSize: '0.875rem', color: 'var(--text-2)' }}>
              Drag & drop a <strong>.csv</strong> or <strong>.json</strong> file, or <span style={{ color: 'var(--green)' }}>click to browse</span>
            </p>
            <input ref={fileRef} type="file" accept=".csv,.json" style={{ display: 'none' }} onChange={e => e.target.files && readFile(e.target.files[0])} />
          </div>

          <p style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginBottom: '0.5rem' }}>Or paste CSV / JSON directly:</p>
          <textarea
            className="input"
            rows={8}
            value={importText}
            onChange={e => setImportText(e.target.value)}
            placeholder={'microchip,name,species,sex,dob,location,status\n982000411234571,Kibo,African Elephant,male,2010-05-15,Taronga Zoo,healthy'}
            style={{ fontFamily: 'monospace', fontSize: '0.82rem', marginBottom: '1rem' }}
          />

          <p style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginBottom: '1rem' }}>
            Required fields: <code style={{ color: 'var(--green)' }}>microchip</code>, <code style={{ color: 'var(--green)' }}>species</code>.
            Optional: <code>name, sex, dob, location, status</code>.
          </p>

          {importMsg && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.9rem', borderRadius: 8, marginBottom: '1rem', background: importMsg.ok ? 'rgba(0,220,130,0.08)' : 'rgba(240,78,109,0.08)', border: `1px solid ${importMsg.ok ? 'rgba(0,220,130,0.25)' : 'rgba(240,78,109,0.25)'}`, fontSize: '0.85rem', color: importMsg.ok ? 'var(--green)' : 'var(--red)' }}>
              {importMsg.ok ? <CheckCircle size={14} /> : <AlertCircle size={14} />} {importMsg.text}
            </div>
          )}
          <button className="btn btn-cta" onClick={handleImport} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Upload size={15} /> Import Animals
          </button>
        </div>
      )}

      {/* ── TABLE ── */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '1.1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <PawPrint size={15} color="var(--green)" />
          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Registered Animals</span>
          <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: 'var(--text-3)' }}>{animals.length} total</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Microchip</th>
                <th>Name</th>
                <th>Species</th>
                <th>Sex</th>
                <th>DOB</th>
                <th>Location</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {animals.map(a => {
                const s = statusMeta[a.status];
                return (
                  <tr key={a.microchip}>
                    <td><code style={{ fontSize: '0.78rem', color: 'var(--text-2)' }}>{a.microchip}</code></td>
                    <td style={{ fontWeight: 600 }}>{a.name || '—'}</td>
                    <td style={{ color: 'var(--text-2)' }}>{a.species}</td>
                    <td style={{ color: 'var(--text-2)', textTransform: 'capitalize' }}>{a.sex}</td>
                    <td style={{ color: 'var(--text-2)' }}>{a.dob || '—'}</td>
                    <td style={{ color: 'var(--text-2)' }}>{a.location || '—'}</td>
                    <td><span className={`badge ${s.cls}`}>{s.label}</span></td>
                    <td>
                      <button
                        className="btn btn-icon"
                        style={{ padding: '0.3rem' }}
                        title="Remove"
                        onClick={() => setAnimals(prev => prev.filter(x => x.microchip !== a.microchip))}
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {animals.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-3)' }}>
                    No animals registered yet. Add one or import from CSV.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Animals;
