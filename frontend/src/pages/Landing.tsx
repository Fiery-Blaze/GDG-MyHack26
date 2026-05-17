import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRight, Activity, Check,
  FileText, Shuffle, Clock, Bell, Heart, Cpu,
  Star, TrendingUp,
} from 'lucide-react';


interface LandingProps {
  onEnterApp: () => void;
}

/* ── Animated counter ── */
function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const dur = 1400;
    const step = (ts: number, origin = ts) => {
      const p = Math.min((ts - origin) / dur, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(Math.floor(ease * to));
      if (p < 1) requestAnimationFrame(t => step(t, origin));
    };
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { requestAnimationFrame(t => step(t, t)); io.disconnect(); } });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, [to]);
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

/* ── Soft glow blob ── */
const Blob = ({ cx, cy, r, color }: { cx: string; cy: string; r: number; color: string }) => (
  <div style={{
    position: 'absolute', left: cx, top: cy, width: r * 2, height: r * 2,
    borderRadius: '50%', background: color,
    filter: `blur(${r * 0.8}px)`, transform: 'translate(-50%,-50%)',
    pointerEvents: 'none', zIndex: 0,
  }} />
);

const features = [
  { icon: <FileText size={22} />, color: '#2563eb', label: 'Document & Permit Agent', desc: 'Upload CITES permits or vet records. AI extracts every field in under 3 seconds — no manual data entry, ever.' },
  { icon: <Shuffle size={22} />, color: '#18B98A', label: 'Intelligent Transfer Matching', desc: 'Vector embeddings + LLM re-ranking finds the optimal zoo, vet, or shelter match from thousands of candidates.' },
  { icon: <Clock size={22} />, color: '#d97706', label: 'SLA Prediction Engine', desc: 'Predicts transfer delays before they happen. Automated escalation at exactly the right moment.' },
  { icon: <Bell size={22} />, color: '#e11d48', label: 'Multi-Channel Alert System', desc: 'Zoonotic outbreak? SLA breach? Regulatory change? Every stakeholder notified in <30 seconds.' },
  { icon: <Heart size={22} />, color: '#7c3aed', label: 'Universal Health Passport', desc: 'One microchip scan reveals the complete health history across every zoo, clinic, and owner.' },
  { icon: <Cpu size={22} />, color: '#18B98A', label: 'AI Orchestrator', desc: 'Natural language commands routed to the right agent automatically. No training required.' },
];

const stats = [
  { label: 'Animals tracked', to: 48200, suffix: '+' },
  { label: 'Transfers completed', to: 3700, suffix: '+' },
  { label: 'SLA compliance', to: 94, suffix: '%' },
  { label: 'Zoos onboarded', to: 127, suffix: '' },
];

const testimonials = [
  { quote: 'Cut our CITES permit processing from 2 weeks to 4 hours. The ROI was immediate.', name: 'Dr. Sarah Chen', role: 'Head of Conservation, Singapore Zoo', avatar: 'SC' },
  { quote: 'We caught an avian flu outbreak 48 hours before WHO issued the alert. That speed saved lives.', name: 'Ahmad Rashid', role: 'Wildlife Director, Sabah Wildlife Dept.', avatar: 'AR' },
  { quote: "The health passport is the single best tool we've added in a decade. Vets love it.", name: 'Dr. Emma Torres', role: 'Chief Vet, Mandai Wildlife Group', avatar: 'ET' },
];

const pricing = [
  {
    tier: 'Starter', price: 0, unit: 'Free forever', cta: 'Start free', featured: false,
    perks: ['Up to 50 animals', '1 location', 'Health passports', 'Basic alerts', 'Community support'],
  },
  {
    tier: 'Pro', price: 299, unit: '/mo per location', cta: 'Get started', featured: true,
    perks: ['Unlimited animals', '5 locations', 'AI document extraction', 'SLA prediction', 'Transfer matching', 'Priority support', 'API access'],
  },
  {
    tier: 'Enterprise', price: null, unit: 'Custom pricing', cta: 'Book a demo', featured: false,
    perks: ['Unlimited everything', 'Custom integrations', 'ZIMS / VETport sync', 'SSO & audit logs', 'Dedicated CSM', 'SLA guarantee'],
  },
];

const Landing: React.FC<LandingProps> = ({ onEnterApp }) => {
  const [email, setEmail] = useState('');

  const handleStart = () => { onEnterApp(); };

  return (
    <div style={{ background: '#F0F4F8', color: '#06122C', overflowX: 'hidden' }}>

      {/* ── NAV ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 2rem', height: 60,
        background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(6,18,44,0.08)',
        boxShadow: '0 1px 8px rgba(6,18,44,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: 'linear-gradient(135deg,#2EE5B3,#4AD2AB)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Activity size={15} color="#06122C" />
          </div>
          <span style={{ fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.02em', color: '#06122C' }}>ArkFlow</span>
          <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: 4, background: 'rgba(46,229,179,0.15)', color: '#18B98A', border: '1px solid rgba(46,229,179,0.35)', fontWeight: 600 }}>BETA</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          {['Features', 'Pricing', 'Docs'].map(l => (
            <button key={l} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6C757D', fontSize: '0.875rem', padding: '0.4rem 0.7rem', borderRadius: 6 }}>{l}</button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button onClick={onEnterApp} style={{ background: 'rgba(6,18,44,0.05)', border: '1px solid rgba(6,18,44,0.12)', borderRadius: 10, color: '#06122C', padding: '0.5rem 1.1rem', fontSize: '0.875rem', cursor: 'pointer' }}>
            Sign in
          </button>
          <button className="btn-cta" onClick={onEnterApp} style={{ padding: '0.5rem 1.2rem', fontSize: '0.875rem' }}>
            Get started <ArrowRight size={14} />
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '120px 2rem 80px', textAlign: 'center', overflow: 'hidden', background: '#F0F4F8' }}>
        <Blob cx="15%" cy="30%" r={280} color="rgba(46,229,179,0.09)" />
        <Blob cx="85%" cy="20%" r={220} color="rgba(37,99,235,0.07)" />
        <Blob cx="50%" cy="80%" r={300} color="rgba(124,58,237,0.05)" />
        <div className="grid-lines" style={{ position: 'absolute', inset: 0, opacity: 1 }} />

        {/* Social proof pill */}
        <div className="animate-up" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', padding: '0.4rem 1rem 0.4rem 0.6rem', borderRadius: 999, background: '#FFFFFF', border: '1px solid rgba(6,18,44,0.1)', marginBottom: '2rem', position: 'relative', zIndex: 1, boxShadow: '0 1px 4px rgba(6,18,44,0.06)' }}>
          <div style={{ display: 'flex' }}>
            {['SC','AR','ET','MK'].map((init,i) => (
              <div key={i} style={{ width: 22, height: 22, borderRadius: '50%', background: `hsl(${i*60+140},55%,45%)`, border: '2px solid #F0F4F8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 700, color: '#fff', marginLeft: i ? -6 : 0 }}>{init}</div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 1 }}>
            {[1,2,3,4,5].map(s => <Star key={s} size={11} fill="#d97706" color="#d97706" />)}
          </div>
          <span style={{ fontSize: '0.8rem', color: '#6C757D' }}>Trusted by <strong style={{ color: '#06122C' }}>127 zoos</strong> worldwide</span>
        </div>

        <h1 className="display animate-up delay-1" style={{ position: 'relative', zIndex: 1, marginBottom: '1.5rem', maxWidth: 780, color: '#06122C' }}>
          The animal health platform<br />
          <span style={{ background: 'linear-gradient(135deg, #2EE5B3, #18B98A)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>your ecosystem runs on.</span>
        </h1>

        <p className="animate-up delay-2" style={{ position: 'relative', zIndex: 1, fontSize: '1.1rem', color: '#6C757D', lineHeight: 1.7, marginBottom: '2.5rem', maxWidth: 560 }}>
          ArkFlow Connect automates transfers, permits, health records, and outbreak alerts across zoos, vets, and pet owners — all powered by AI agents.
        </p>

        <div className="animate-up delay-3" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', position: 'relative', zIndex: 1, marginBottom: '1.25rem' }}>
          <input
            className="input-dark"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleStart()}
            placeholder="work@zoo.org"
            style={{ width: 260, borderRadius: 10 }}
          />
          <button className="btn-cta" style={{ padding: '0.65rem 1.75rem', fontSize: '1rem' }} onClick={handleStart}>
            Get started <ArrowRight size={16} />
          </button>
        </div>

        <p className="animate-up delay-4" style={{ fontSize: '0.78rem', color: '#9CA3AF', position: 'relative', zIndex: 1 }}>
          No credit card required · Cancel anytime
        </p>

        {/* App preview mockup */}
        <div className="animate-up delay-5" style={{ position: 'relative', zIndex: 1, marginTop: '4rem', width: '100%', maxWidth: 960 }}>
          <div style={{
            borderRadius: 20, overflow: 'hidden',
            border: '1px solid rgba(6,18,44,0.1)',
            boxShadow: '0 4px 40px rgba(6,18,44,0.12), 0 0 80px rgba(46,229,179,0.06)',
          }}>
            {/* Fake window chrome */}
            <div style={{ background: '#06122C', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              {['#e11d48','#d97706','#18B98A'].map(c => <div key={c} style={{ width: 11, height: 11, borderRadius: '50%', background: c, opacity: 0.8 }} />)}
              <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 6, padding: '0.2rem 1.5rem', fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)' }}>app.arkflow.io/dashboard</div>
              </div>
            </div>
            {/* Fake dashboard preview */}
            <div style={{ background: '#F0F4F8', padding: '1.5rem', display: 'flex', gap: '1rem' }}>
              {/* Sidebar preview */}
              <div style={{ width: 160, flexShrink: 0, background: '#06122C', borderRadius: 10, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {[
                  { label: 'Dashboard', active: true },
                  { label: 'Documents' },
                  { label: 'Transfers' },
                  { label: 'SLA Monitor' },
                  { label: 'Alerts' },
                  { label: 'Health Passports' },
                ].map(item => (
                  <div key={item.label} style={{
                    padding: '0.45rem 0.75rem', borderRadius: 7, fontSize: '0.78rem',
                    fontWeight: item.active ? 600 : 400,
                    background: item.active ? 'rgba(46,229,179,0.15)' : 'transparent',
                    color: item.active ? '#2EE5B3' : 'rgba(255,255,255,0.5)',
                    borderLeft: item.active ? '2px solid #2EE5B3' : '2px solid transparent',
                  }}>{item.label}</div>
                ))}
              </div>
              {/* Main content preview */}
              <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                {[
                  { label: 'Active Transfers', val: '34', color: '#18B98A' },
                  { label: 'SLA Compliance', val: '94%', color: '#2563eb' },
                  { label: 'Active Alerts', val: '7', color: '#d97706' },
                ].map(s => (
                  <div key={s.label} style={{ background: '#FFFFFF', border: '1px solid rgba(6,18,44,0.08)', borderRadius: 10, padding: '0.9rem', boxShadow: '0 1px 4px rgba(6,18,44,0.05)' }}>
                    <div style={{ fontSize: '0.7rem', color: '#9CA3AF', marginBottom: '0.35rem' }}>{s.label}</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: s.color }}>{s.val}</div>
                  </div>
                ))}
                <div style={{ gridColumn: '1 / -1', background: '#FFFFFF', border: '1px solid rgba(6,18,44,0.08)', borderRadius: 10, padding: '0.9rem', boxShadow: '0 1px 4px rgba(6,18,44,0.05)' }}>
                  <div style={{ fontSize: '0.7rem', color: '#9CA3AF', marginBottom: '0.75rem', fontWeight: 600, letterSpacing: '0.06em' }}>RECENT ACTIVITY</div>
                  {[
                    { text: 'CITES permit extracted — Bengal Tiger TX-0091', color: '#2563eb' },
                    { text: 'Avian flu outbreak alert dispatched to 15 recipients', color: '#e11d48' },
                    { text: 'Transfer matched — Orangutan → Zoo KL', color: '#18B98A' },
                  ].map((a, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.35rem 0', borderBottom: i < 2 ? '1px solid rgba(6,18,44,0.06)' : 'none' }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: a.color, flexShrink: 0 }} />
                      <span style={{ fontSize: '0.73rem', color: '#6C757D' }}>{a.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div style={{ position: 'absolute', bottom: -40, left: '10%', right: '10%', height: 80, background: 'radial-gradient(ellipse, rgba(46,229,179,0.12), transparent)', filter: 'blur(20px)', pointerEvents: 'none' }} />
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{ padding: '5rem 2rem', borderTop: '1px solid rgba(6,18,44,0.08)', borderBottom: '1px solid rgba(6,18,44,0.08)', background: '#FFFFFF' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '2rem', textAlign: 'center' }}>
          {stats.map(s => (
            <div key={s.label}>
              <div style={{ fontSize: '2.8rem', fontWeight: 800, letterSpacing: '-0.04em', color: '#18B98A', lineHeight: 1 }}>
                <Counter to={s.to} suffix={s.suffix} />
              </div>
              <div style={{ fontSize: '0.85rem', color: '#6C757D', marginTop: '0.5rem' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ padding: '7rem 2rem', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <div className="label" style={{ marginBottom: '0.75rem' }}>Platform capabilities</div>
          <h2 className="headline" style={{ marginBottom: '1rem', color: '#06122C' }}>Six agents. One platform.<br /><span style={{ background: 'linear-gradient(135deg,#2EE5B3,#18B98A)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Zero manual work.</span></h2>
          <p style={{ fontSize: '1.05rem', color: '#6C757D', lineHeight: 1.7, maxWidth: 540, margin: '0 auto' }}>Every workflow you've been doing by hand — digitized, automated, and connected across your entire ecosystem.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {features.map(f => (
            <div key={f.label} className="feature-card">
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `${f.color}12`, border: `1px solid ${f.color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: f.color, marginBottom: '1.25rem' }}>
                {f.icon}
              </div>
              <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.5rem', color: '#06122C' }}>{f.label}</div>
              <p style={{ color: '#6C757D', fontSize: '0.875rem', lineHeight: 1.7 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── SOCIAL PROOF ── */}
      <section style={{ padding: '5rem 2rem', background: '#FFFFFF', borderTop: '1px solid rgba(6,18,44,0.08)', borderBottom: '1px solid rgba(6,18,44,0.08)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div className="label" style={{ marginBottom: '0.5rem' }}>What our customers say</div>
            <h2 className="headline" style={{ color: '#06122C' }}>The results speak for themselves.</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
            {testimonials.map(t => (
              <div key={t.name} className="card" style={{ padding: '1.75rem' }}>
                <div style={{ display: 'flex', gap: 2, marginBottom: '1rem' }}>
                  {[1,2,3,4,5].map(s => <Star key={s} size={13} fill="#d97706" color="#d97706" />)}
                </div>
                <p style={{ fontSize: '0.95rem', lineHeight: 1.7, color: '#06122C', marginBottom: '1.25rem', fontStyle: 'italic' }}>"{t.quote}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #2EE5B3, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#06122C', flexShrink: 0 }}>{t.avatar}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#06122C' }}>{t.name}</div>
                    <div style={{ fontSize: '0.78rem', color: '#6C757D' }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" style={{ padding: '7rem 2rem', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <div className="label" style={{ marginBottom: '0.75rem' }}>Pricing</div>
          <h2 className="headline" style={{ marginBottom: '1rem', color: '#06122C' }}>Simple, transparent pricing.</h2>
          <p style={{ fontSize: '1.05rem', color: '#6C757D', lineHeight: 1.7, maxWidth: 440, margin: '0 auto' }}>No hidden fees. No per-animal charges. Cancel any time.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', alignItems: 'start' }}>
          {pricing.map(p => (
            <div key={p.tier} className="pricing-card" style={{
              background: p.featured ? 'linear-gradient(160deg, rgba(46,229,179,0.06), #FFFFFF)' : '#FFFFFF',
              border: p.featured ? '1px solid rgba(46,229,179,0.35)' : '1px solid rgba(6,18,44,0.09)',
            }}>
              {p.featured && (
                <div style={{ position: 'absolute', top: -1, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg,#2EE5B3,#4AD2AB)', color: '#06122C', fontSize: '0.7rem', fontWeight: 700, padding: '0.25rem 1rem', borderRadius: '0 0 8px 8px', letterSpacing: '0.05em' }}>MOST POPULAR</div>
              )}
              <div style={{ marginTop: p.featured ? '1rem' : 0 }}>
                <div style={{ fontWeight: 700, marginBottom: '0.5rem', color: '#06122C' }}>{p.tier}</div>
                <div style={{ marginBottom: '1.5rem' }}>
                  {p.price !== null ? (
                    <><span style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.04em', color: '#06122C' }}>${p.price}</span><span style={{ color: '#6C757D', fontSize: '0.85rem' }}>{p.unit}</span></>
                  ) : (
                    <span style={{ fontSize: '1.6rem', fontWeight: 700, color: '#06122C' }}>Custom</span>
                  )}
                </div>
                <button
                  className={p.featured ? 'btn-primary' : 'btn-secondary'}
                  onClick={onEnterApp}
                  style={{ width: '100%', justifyContent: 'center', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  {p.cta} {p.featured && <ArrowRight size={15} />}
                </button>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {p.perks.map(k => (
                    <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.875rem', color: '#6C757D' }}>
                      <Check size={14} color="#18B98A" style={{ flexShrink: 0 }} /> {k}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section style={{ padding: '5rem 2rem', textAlign: 'center', background: '#06122C', position: 'relative', overflow: 'hidden' }}>
        <Blob cx="30%" cy="50%" r={250} color="rgba(46,229,179,0.08)" />
        <Blob cx="70%" cy="50%" r={200} color="rgba(37,99,235,0.07)" />
        <div style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#2EE5B3', marginBottom: '1rem', position: 'relative', zIndex: 1 }}>Ready to automate your ecosystem?</div>
        <h2 className="headline" style={{ marginBottom: '1rem', position: 'relative', zIndex: 1, color: '#FFFFFF' }}>Every day you wait is a<br /><span style={{ background: 'linear-gradient(135deg,#2EE5B3,#4AD2AB)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>permit processed by hand.</span></h2>
        <p style={{ fontSize: '1.05rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, maxWidth: 480, margin: '0 auto 2.5rem', position: 'relative', zIndex: 1 }}>Join 127 institutions that moved their animal health operations into the 21st century.</p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
          <button className="btn-cta" style={{ padding: '0.75rem 1.75rem', fontSize: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }} onClick={onEnterApp}>
            Get started now <ArrowRight size={16} />
          </button>
          <button onClick={onEnterApp} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, color: '#FFFFFF', padding: '0.75rem 1.75rem', fontSize: '1rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={16} /> See a live demo
          </button>
        </div>
        <p style={{ marginTop: '1.5rem', fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)', position: 'relative', zIndex: 1 }}>No credit card required · Setup in 5 minutes</p>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ padding: '2rem', borderTop: '1px solid rgba(6,18,44,0.08)', background: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: 22, height: 22, borderRadius: 5, background: 'linear-gradient(135deg,#2EE5B3,#4AD2AB)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity size={12} color="#06122C" />
          </div>
          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#06122C' }}>ArkFlow Connect</span>
          <span style={{ color: '#9CA3AF', fontSize: '0.8rem' }}>— GDG MyHack 2026 · Team saltAndPepperChips</span>
        </div>
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          {['Privacy','Terms','Docs','Status'].map(l => (
            <button key={l} style={{ background: 'none', border: 'none', color: '#6C757D', padding: '0.4rem 0.6rem', borderRadius: 6, cursor: 'pointer', fontSize: '0.8rem' }}>{l}</button>
          ))}
        </div>
      </footer>
    </div>
  );
};

export default Landing;
