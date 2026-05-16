import React, { useState, useRef, useEffect } from 'react';
import { Cpu, Send, Loader, RefreshCw } from 'lucide-react';
import { agentApi } from '../lib/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  intent?: string;
  agent?: string;
  success?: boolean;
}

const examplePrompts = [
  'I have a CITES permit PDF for a Bengal Tiger transfer',
  'Where should I send this 12-year-old male orangutan?',
  'Will my transfer from Singapore to Taipei be delayed?',
  'Bird flu reported near Selangor — alert all zoos within 100km',
  'Show health passport for microchip 982000411234567',
  'Add blood test result for animal 9834771',
];

const Orchestrator: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hello! I'm the ArkFlow orchestrator. Tell me what you need and I'll route your request to the right agent automatically. Try one of the examples below.",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const msg = input.trim();
    if (!msg || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setLoading(true);

    try {
      const res = await agentApi.ask(msg);
      const d = res.data;
      let replyContent = '';

      if (d.success) {
        replyContent = `**Intent classified:** \`${d.intent || 'unknown'}\`\n**Agent:** ${d.agent || 'orchestrator'}\n\n`;
        if (d.data && typeof d.data === 'object') {
          replyContent += '**Response:**\n```json\n' + JSON.stringify(d.data, null, 2) + '\n```';
        }
      } else {
        replyContent = `⚠️ ${d.error || 'The orchestrator could not classify your intent. Please be more specific.'}`;
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: replyContent,
        intent: d.intent as string | undefined,
        agent: d.agent as string | undefined,
        success: d.success,
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '⚠️ **Backend offline.** The API server at localhost:8000 is not reachable. Start the backend with `uvicorn app.main:app --reload` in the `backend/` directory.',
        success: false,
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: '2rem', maxWidth: 860, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 40px)' }}>
      <div style={{ marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.3rem' }}>
          <span className="gradient-text-green">AI</span> Orchestrator
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Natural language interface. Describe what you need — the orchestrator classifies your intent and routes to the correct agent automatically.
        </p>
      </div>

      {/* Intent map */}
      <div className="glass-card" style={{ padding: '0.9rem 1.1rem', marginBottom: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginRight: '0.25rem' }}>AGENTS:</span>
        {[
          { label: 'Document', color: '#3b82f6' },
          { label: 'Matching', color: '#00e5a0' },
          { label: 'SLA', color: '#f59e0b' },
          { label: 'Alert', color: '#f43f5e' },
          { label: 'Health', color: '#8b5cf6' },
        ].map(a => (
          <span key={a.label} style={{ padding: '0.2rem 0.6rem', borderRadius: 6, background: `${a.color}15`, border: `1px solid ${a.color}30`, color: a.color, fontSize: '0.75rem', fontWeight: 600 }}>{a.label}</span>
        ))}
      </div>

      {/* Chat */}
      <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
              {m.role === 'assistant' && (
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #00e5a0, #00b4d8)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginRight: '0.6rem', marginTop: 2 }}>
                  <Cpu size={13} color="#050a14" />
                </div>
              )}
              <div style={{
                maxWidth: '72%',
                background: m.role === 'user' ? 'linear-gradient(135deg, rgba(0,229,160,0.2), rgba(0,180,216,0.15))' : 'rgba(6,18,44,0.04)',
                border: m.role === 'user' ? '1px solid rgba(0,229,160,0.3)' : '1px solid var(--border-subtle)',
                borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                padding: '0.75rem 1rem',
                fontSize: '0.88rem',
                color: 'var(--text-primary)',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
              }}>
                {m.content.split('```').map((part, pi) =>
                  pi % 2 === 1 ? (
                    <pre key={pi} style={{ background: '#FFFFFF', borderRadius: 8, padding: '0.75rem', overflowX: 'auto', fontSize: '0.78rem', margin: '0.5rem 0', border: '1px solid var(--border-subtle)' }}>{part.replace(/^json\n/, '')}</pre>
                  ) : (
                    <span key={pi}>{part.replace(/\*\*(.*?)\*\*/g, '$1')}</span>
                  )
                )}
                {m.intent && (
                  <div style={{ marginTop: '0.4rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem', background: 'rgba(0,229,160,0.12)', border: '1px solid rgba(0,229,160,0.25)', borderRadius: 4, color: '#00e5a0' }}>intent: {m.intent}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #00e5a0, #00b4d8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Cpu size={13} color="#050a14" />
              </div>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                {[0,1,2].map(d => (
                  <div key={d} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-green)', opacity: 0.5, animation: `pulse 1s ${d * 0.2}s infinite` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Example prompts */}
        {messages.length <= 1 && (
          <div style={{ padding: '0 1.25rem 1rem', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {examplePrompts.map(p => (
              <button key={p} onClick={() => setInput(p)} style={{
                padding: '0.3rem 0.7rem', borderRadius: 8,
                background: 'rgba(6,18,44,0.04)', border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)', fontSize: '0.78rem', cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(0,229,160,0.3)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(6,18,44,0.07)')}
              >
                {p}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '1rem', display: 'flex', gap: '0.75rem' }}>
          <input
            className="input-dark"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Describe what you need in natural language..."
            disabled={loading}
          />
          <button
            className="btn-primary"
            onClick={handleSend}
            disabled={loading || !input.trim()}
            style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.4rem', opacity: !input.trim() ? 0.5 : 1 }}
          >
            {loading ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={16} />}
          </button>
          <button
            className="btn-secondary"
            onClick={() => setMessages([{ role: 'assistant', content: "Hello! I'm the ArkFlow orchestrator. Tell me what you need." }])}
            title="Clear chat"
            style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.6rem' }}
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Orchestrator;
