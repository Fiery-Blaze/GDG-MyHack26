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

/* ── Orbiting glow blob ── */
const Blob = ({ cx, cy, r, color }: { cx: string; cy: string; r: number; color: string }) => (
  <div style={{
    position: 'absolute', left: cx, top: cy, width: r * 2, height: r * 2,
    borderRadius: '50%', background: color,
    filter: `blur(${r * 0.8}px)`, transform: 'translate(-50%,-50%)',
    pointerEvents: 'none', zIndex: 0,
  }} />
);

const features = [
  { icon: <FileText size={22} />, color: '#4f8ef7', label: 'Document & Permit Agent', desc: 'Upload CITES permits or vet records. AI extracts every field in under 3 seconds — no manual data entry, ever.' },
  { icon: <Shuffle size={22} />, color: '#00dc82', label: 'Intelligent Transfer Matching', desc: 'Vector embeddings + LLM re-ranking finds the optimal zoo, vet, or shelter match from thousands of candidates.' },
  { icon: <Clock size={22} />, color: '#f5a623', label: 'SLA Prediction Engine', desc: 'Predicts transfer delays before they happen. Automated escalation at exactly the right moment.' },
  { icon: <Bell size={22} />, color: '#f04e6d', label: 'Multi-Channel Alert System', desc: 'Zoonotic outbreak? SLA breach? Regulatory change? Every stakeholder notified in <30 seconds.' },
  { icon: <Heart size={22} />, color: '#9b6ef3', label: 'Universal Health Passport', desc: 'One microchip scan reveals the complete health history across every zoo, clinic, and owner.' },
  { icon: <Cpu size={22} />, color: '#00dc82', label: 'AI Orchestrator', desc: 'Natural language commands routed to the right agent automatically. No training required.' },
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
    tier: 'Pro', price: 299, unit: '/mo per location', cta: 'Start 14-day trial', featured: true,
    perks: ['Unlimited animals', '5 locations', 'AI document extraction', 'SLA prediction', 'Transfer matching', 'Priority support', 'API access'],
  },
  {
    tier: 'Enterprise', price: null, unit: 'Custom pricing', cta: 'Book a demo', featured: false,
    perks: ['Unlimited everything', 'Custom integrations', 'ZIMS / VETport sync', 'SSO & audit logs', 'Dedicated CSM', 'SLA guarantee'],
  },
];

const Landing: React.FC<LandingProps> = ({ onEnterApp }) => {
  const [email, setEmail] = useState('');

  const handleTrial = () => {
    if (email.trim()) onEnterApp();
    else onEnterApp();
  };

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--text-1)', overflowX: 'hidden' }}>

      {/* ── NAV ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 2rem', height: 60,
        background: 'rgba(4,8,15,0.8)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: 'linear-gradient(135deg,#00dc82,#00b8f5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Activity size={15} color="#04080f" />
          </div>
          <span style={{ fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.02em' }}>ArkFlow</span>
          <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: 4, background: 'rgba(0,220,130,0.12)', color: 'var(--green)', border: '1px solid rgba(0,220,130,0.25)', fontWeight: 600 }}>BETA</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          {['Features', 'Pricing', 'Docs'].map(l => (
            <button key={l} className="btn btn-text" style={{ fontSize: '0.875rem' }}>{l}</button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button className="btn btn-ghost" onClick={onEnterApp} style={{ padding: '0.5rem 1.1rem', fontSize: '0.875rem' }}>Sign in</button>
          <button className="btn btn-cta" onClick={onEnterApp} style={{ padding: '0.5rem 1.2rem', fontSize: '0.875rem' }}>
            Get started free <ArrowRight size={14} />
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '120px 2rem 80px', textAlign: 'center', overflow: 'hidden' }}>
        <Blob cx="20%" cy="30%" r={280} color="rgba(0,220,130,0.07)" />
        <Blob cx="80%" cy="20%" r={220} color="rgba(79,142,247,0.06)" />
        <Blob cx="50%" cy="80%" r={300} color="rgba(155,110,243,0.05)" />
        <div className="grid-lines" style={{ position: 'absolute', inset: 0, opacity: 1 }} />

        {/* Social proof pill */}
        <div className="animate-up" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', padding: '0.4rem 1rem 0.4rem 0.6rem', borderRadius: 999, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-strong)', marginBottom: '2rem', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', gap: '-4px' }}>
            {['SC','AR','ET','MK'].map((init,i) => (
              <div key={i} style={{ width: 22, height: 22, borderRadius: '50%', background: `hsl(${i*60+140},60%,40%)`, border: '2px solid var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 700, marginLeft: i ? -6 : 0 }}>{init}</div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 1 }}>
            {[1,2,3,4,5].map(s => <Star key={s} size={11} fill="#f5a623" color="#f5a623" />)}
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-2)' }}>Trusted by <strong style={{ color: 'var(--text-1)' }}>127 zoos</strong> worldwide</span>
        </div>

        <h1 className="display animate-up delay-1" style={{ position: 'relative', zIndex: 1, marginBottom: '1.5rem', maxWidth: 780 }}>
          The animal health platform<br />
          <span className="g-green">your ecosystem runs on.</span>
        </h1>

        <p className="subheading animate-up delay-2" style={{ position: 'relative', zIndex: 1, fontSize: '1.1rem', marginBottom: '2.5rem', maxWidth: 560 }}>
          ArkFlow Connect automates transfers, permits, health records, and outbreak alerts across zoos, vets, and pet owners — all powered by AI agents.
        </p>

        <div className="animate-up delay-3" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', position: 'relative', zIndex: 1, marginBottom: '1.25rem' }}>
          <input
            className="input"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleTrial()}
            placeholder="work@zoo.org"
            style={{ width: 260, borderRadius: 10, background: 'rgba(9,15,28,0.9)' }}
          />
          <button className="btn btn-cta btn-cta-lg" onClick={handleTrial}>
            Start free trial <ArrowRight size={16} />
          </button>
        </div>

        <p className="animate-up delay-4" style={{ fontSize: '0.78rem', color: 'var(--text-3)', position: 'relative', zIndex: 1 }}>
          No credit card required · 14-day free trial · Cancel anytime
        </p>

        {/* App preview mockup */}
        <div className="animate-up delay-5" style={{ position: 'relative', zIndex: 1, marginTop: '4rem', width: '100%', maxWidth: 960 }}>
          <div style={{
            borderRadius: 20, overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.04), 0 40px 120px rgba(0,0,0,0.8), 0 0 80px rgba(0,220,130,0.08)',
          }}>
            {/* Fake window chrome */}
            <div style={{ background: 'rgba(9,15,28,0.98)', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border)' }}>
              {['#f04e6d','#f5a623','#00dc82'].map(c => <div key={c} style={{ width: 11, height: 11, borderRadius: '50%', background: c, opacity: 0.8 }} />)}
              <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 6, padding: '0.2rem 1.5rem', fontSize: '0.72rem', color: 'var(--text-3)' }}>app.arkflow.io/dashboard</div>
              </div>
            </div>
            {/* Fake dashboard preview */}
            <div style={{ background: 'var(--bg)', padding: '1.5rem', display: 'flex', gap: '1rem' }}>
              {/* Sidebar */}
              <div style={{ width: 180, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
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
                    background: item.active ? 'rgba(0,220,130,0.1)' : 'transparent',
                    color: item.active ? 'var(--green)' : 'var(--text-3)',
                  }}>{item.label}</div>
                ))}
              </div>
              {/* Main content */}
              <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                {[
                  { label: 'Active Transfers', val: '34', color: '#00dc82' },
                  { label: 'SLA Compliance', val: '94%', color: '#4f8ef7' },
                  { label: 'Active Alerts', val: '7', color: '#f5a623' },
                ].map(s => (
                  <div key={s.label} style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 10, padding: '0.9rem' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', marginBottom: '0.35rem' }}>{s.label}</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: s.color }}>{s.val}</div>
                  </div>
                ))}
                <div style={{ gridColumn: '1 / -1', background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 10, padding: '0.9rem' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', marginBottom: '0.75rem' }}>RECENT ACTIVITY</div>
                  {[
                    { text: 'CITES permit extracted — Bengal Tiger TX-0091', badge: '#4f8ef7' },
                    { text: 'Avian flu outbreak alert dispatched to 15 recipients', badge: '#f04e6d' },
                    { text: 'Transfer matched — Orangutan → Zoo KL', badge: '#00dc82' },
                  ].map((a, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.35rem 0', borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: a.badge, flexShrink: 0 }} />
                      <span style={{ fontSize: '0.73rem', color: 'var(--text-2)' }}>{a.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          {/* Glow under mockup */}
          <div style={{ position: 'absolute', bottom: -40, left: '10%', right: '10%', height: 80, background: 'radial-gradient(ellipse, rgba(0,220,130,0.15), transparent)', filter: 'blur(20px)', pointerEvents: 'none' }} />
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{ padding: '5rem 2rem', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'var(--surface-1)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '2rem', textAlign: 'center' }}>
          {stats.map(s => (
            <div key={s.label}>
              <div style={{ fontSize: '2.8rem', fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--green)', lineHeight: 1 }}>
                <Counter to={s.to} suffix={s.suffix} />
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-2)', marginTop: '0.5rem' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ padding: '7rem 2rem', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <div className="label" style={{ marginBottom: '0.75rem' }}>Platform capabilities</div>
          <h2 className="headline" style={{ marginBottom: '1rem' }}>Six agents. One platform.<br /><span className="g-green">Zero manual work.</span></h2>
          <p className="subheading" style={{ margin: '0 auto' }}>Every workflow you've been doing by hand — digitized, automated, and connected across your entire ecosystem.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {features.map(f => (
            <div key={f.label} className="feature-card">
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `${f.color}18`, border: `1px solid ${f.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: f.color, marginBottom: '1.25rem' }}>
                {f.icon}
              </div>
              <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.5rem' }}>{f.label}</div>
              <p style={{ color: 'var(--text-2)', fontSize: '0.875rem', lineHeight: 1.7 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── SOCIAL PROOF ── */}
      <section style={{ padding: '5rem 2rem', background: 'var(--surface-1)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div className="label" style={{ marginBottom: '0.5rem' }}>What our customers say</div>
            <h2 className="headline">The results speak for themselves.</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
            {testimonials.map(t => (
              <div key={t.name} className="card" style={{ padding: '1.75rem' }}>
                <div style={{ display: 'flex', gap: 2, marginBottom: '1rem' }}>
                  {[1,2,3,4,5].map(s => <Star key={s} size={13} fill="#f5a623" color="#f5a623" />)}
                </div>
                <p style={{ fontSize: '0.95rem', lineHeight: 1.7, color: 'var(--text-1)', marginBottom: '1.25rem', fontStyle: 'italic' }}>"{t.quote}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #00dc82, #4f8ef7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#04080f', flexShrink: 0 }}>{t.avatar}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{t.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-2)' }}>{t.role}</div>
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
          <h2 className="headline" style={{ marginBottom: '1rem' }}>Start free. Scale when ready.</h2>
          <p className="subheading" style={{ margin: '0 auto' }}>No hidden fees. No per-animal charges. Cancel any time.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', alignItems: 'start' }}>
          {pricing.map(p => (
            <div key={p.tier} className="pricing-card" style={{ background: p.featured ? 'linear-gradient(160deg,rgba(0,220,130,0.05),var(--surface-1))' : 'var(--surface-1)' }}>
              {p.featured && (
                <div style={{ position: 'absolute', top: -1, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg,#00dc82,#00b8f5)', color: '#04080f', fontSize: '0.7rem', fontWeight: 700, padding: '0.25rem 1rem', borderRadius: '0 0 8px 8px', letterSpacing: '0.05em' }}>MOST POPULAR</div>
              )}
              <div style={{ marginTop: p.featured ? '1rem' : 0 }}>
                <div style={{ fontWeight: 700, marginBottom: '0.5rem' }}>{p.tier}</div>
                <div style={{ marginBottom: '1.5rem' }}>
                  {p.price !== null ? (
                    <><span style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.04em' }}>${p.price}</span><span style={{ color: 'var(--text-2)', fontSize: '0.85rem' }}>{p.unit}</span></>
                  ) : (
                    <span style={{ fontSize: '1.6rem', fontWeight: 700 }}>Custom</span>
                  )}
                </div>
                <button className={`btn ${p.featured ? 'btn-cta' : 'btn-ghost'}`} onClick={onEnterApp} style={{ width: '100%', justifyContent: 'center', marginBottom: '1.5rem' }}>
                  {p.cta} {p.featured && <ArrowRight size={15} />}
                </button>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {p.perks.map(k => (
                    <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.875rem', color: 'var(--text-2)' }}>
                      <Check size={14} color="var(--green)" style={{ flexShrink: 0 }} /> {k}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section style={{ padding: '5rem 2rem', textAlign: 'center', background: 'var(--surface-1)', borderTop: '1px solid var(--border)', position: 'relative', overflow: 'hidden' }}>
        <Blob cx="30%" cy="50%" r={250} color="rgba(0,220,130,0.06)" />
        <Blob cx="70%" cy="50%" r={200} color="rgba(79,142,247,0.05)" />
        <div className="label" style={{ marginBottom: '1rem', position: 'relative', zIndex: 1 }}>Ready to automate your ecosystem?</div>
        <h2 className="headline" style={{ marginBottom: '1rem', position: 'relative', zIndex: 1 }}>Every day you wait is a<br /><span className="g-green">permit processed by hand.</span></h2>
        <p className="subheading" style={{ margin: '0 auto 2.5rem', position: 'relative', zIndex: 1 }}>Join 127 institutions that moved their animal health operations into the 21st century.</p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
          <button className="btn btn-cta btn-cta-lg" onClick={onEnterApp}>
            Start your free trial <ArrowRight size={16} />
          </button>
          <button className="btn btn-ghost btn-cta-lg" onClick={onEnterApp} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={16} /> See a live demo
          </button>
        </div>
        <p style={{ marginTop: '1.5rem', fontSize: '0.78rem', color: 'var(--text-3)', position: 'relative', zIndex: 1 }}>No credit card · Setup in 5 minutes · Cancel anytime</p>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ padding: '2rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: 22, height: 22, borderRadius: 5, background: 'linear-gradient(135deg,#00dc82,#00b8f5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity size={12} color="#04080f" />
          </div>
          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>ArkFlow Connect</span>
          <span style={{ color: 'var(--text-3)', fontSize: '0.8rem' }}>— GDG MyHack 2026 · Team saltAndPepperChips</span>
        </div>
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          {['Privacy','Terms','Docs','Status'].map(l => <button key={l} className="btn btn-text" style={{ fontSize: '0.8rem' }}>{l}</button>)}
        </div>
      </footer>
    </div>
  );
};

export default Landing;
