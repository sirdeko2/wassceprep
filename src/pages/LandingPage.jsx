import Navbar from '@/components/layout/Navbar'
import { Link, useNavigate } from 'react-router-dom'

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div style={{ background: 'var(--white)' }}>
      <Navbar />

      {/* HERO */}
      <section style={{
        background: 'linear-gradient(135deg, var(--blue) 0%, var(--blue-mid) 60%, #0d3580 100%)',
        padding: '80px 24px 100px', textAlign: 'center', position: 'relative', overflow: 'hidden'
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
          color: 'rgba(255,255,255,0.9)', padding: '6px 14px', borderRadius: 100,
          fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 24
        }}>
          🇱🇷 <span style={{ color: 'var(--gold)' }}>Made for Liberia</span> — WAEC Aligned
        </div>

        <h1 style={{
          fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(48px, 8vw, 88px)',
          color: 'white', lineHeight: 0.95, letterSpacing: 2, marginBottom: 8
        }}>
          PASS YOUR <span style={{ color: 'var(--gold)' }}>WASSCE</span>
        </h1>

        <p style={{
          fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(18px, 3vw, 26px)',
          color: 'rgba(255,255,255,0.75)', marginBottom: 16, fontStyle: 'italic'
        }}>
          Free exam prep for every Liberian student
        </p>

        <p style={{
          fontSize: 15, color: 'rgba(255,255,255,0.6)', marginBottom: 40,
          maxWidth: 480, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6
        }}>
          Practice past questions, take timed mock exams, and get instant help from an AI tutor — all completely free.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/register" style={{
            background: 'var(--red)', color: 'white', padding: '14px 32px',
            borderRadius: 10, fontSize: 15, fontWeight: 700, textDecoration: 'none',
            transition: 'all 0.2s', display: 'inline-block'
          }}>Start Studying Free</Link>
          <Link to="/subjects" style={{
            background: 'rgba(255,255,255,0.1)', color: 'white', padding: '14px 32px',
            borderRadius: 10, fontSize: 15, fontWeight: 600, textDecoration: 'none',
            border: '1px solid rgba(255,255,255,0.3)', display: 'inline-block'
          }}>Browse Subjects</Link>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 40, marginTop: 56, flexWrap: 'wrap' }}>
          {[['8', 'Subjects'], ['500+', 'Questions'], ['100%', 'Free'], ['AI', 'Powered Tutor']].map(([num, label]) => (
            <div key={label} style={{ textAlign: 'center', color: 'white' }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 40, color: 'var(--gold)', lineHeight: 1 }}>{num}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ padding: '80px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--red)', marginBottom: 12 }}>
          Why WASSCEPrep
        </div>
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(28px, 4vw, 42px)', color: 'var(--blue)', marginBottom: 12 }}>
          Everything you need to pass first time
        </h2>
        <p style={{ fontSize: 16, color: 'var(--gray-600)', maxWidth: 520, lineHeight: 1.7, marginBottom: 48 }}>
          Built specifically for Liberian students — with real WAEC past questions, local curriculum content, and tools that work even on slow connections.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
          {[
            { icon: '📝', color: 'var(--blue-light)', title: 'Mock & Practice Exams', desc: 'Real WASSCE questions from previous years with instant answer feedback and detailed explanations so you understand, not just memorize.', link: '/subjects' },
            { icon: '⏱️', color: 'var(--red-light)', title: 'Timed Mock Exams', desc: 'Simulate the real exam experience with countdown timers. Build speed and confidence before the actual exam day arrives.', link: '/subjects' },
            { icon: '🤖', color: 'var(--green-light)', title: 'AI Tutor', desc: 'Ask any question about any subject and get clear, simple explanations instantly — like having a personal teacher available 24/7.', link: '/tutor' },
            { icon: '📊', color: 'var(--orange-light)', title: 'Progress Tracking', desc: 'See your scores, identify weak areas, and track improvement over time. Know exactly where to focus your study sessions.', link: '/register' },
          ].map(f => (
            <div key={f.title} onClick={() => navigate(f.link)} style={{
              background: 'white', borderRadius: 20, padding: 28,
              border: '1px solid var(--gray-200)', cursor: 'pointer', transition: 'all 0.25s'
            }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = 'transparent' }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'var(--gray-200)' }}
            >
              <div style={{ width: 48, height: 48, borderRadius: 12, background: f.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 16 }}>{f.icon}</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--blue)', marginBottom: 8 }}>{f.title}</div>
              <div style={{ fontSize: 14, color: 'var(--gray-600)', lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* SUBJECTS STRIP */}
      <section style={{ background: 'var(--blue)', padding: '60px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 12 }}>Subjects Covered</div>
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(24px, 4vw, 36px)', color: 'white', marginBottom: 36 }}>
          All 8 core WASSCE subjects
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', maxWidth: 800, margin: '0 auto' }}>
          {[
            ['📖', 'English Language'], ['🔢', 'Mathematics'], ['🧬', 'Biology'],
            ['⚗️', 'Chemistry'], ['⚡', 'Physics'], ['📈', 'Economics'],
            ['🌍', 'Geography'], ['📚', 'Literature']
          ].map(([icon, name]) => (
            <Link key={name} to="/subjects" style={{
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
              color: 'white', padding: '10px 20px', borderRadius: 100, fontSize: 14,
              fontWeight: 500, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8,
              transition: 'all 0.2s'
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--red)'; e.currentTarget.style.borderColor = 'var(--red)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)' }}
            >
              {icon} {name}
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{
        background: 'linear-gradient(135deg, var(--red) 0%, var(--red-dark) 100%)',
        padding: '80px 24px', textAlign: 'center'
      }}>
        <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(36px, 5vw, 60px)', color: 'white', letterSpacing: 2, marginBottom: 16 }}>
          START STUDYING TODAY
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16, marginBottom: 32 }}>
          Join thousands of Liberian students preparing for the WASSCE. It is free, always.
        </p>
        <Link to="/register" style={{
          background: 'white', color: 'var(--red)', padding: '14px 36px',
          borderRadius: 10, fontSize: 15, fontWeight: 700, textDecoration: 'none', display: 'inline-block'
        }}>Create Free Account</Link>
      </section>

      {/* FOOTER */}
      <footer style={{ background: 'var(--gray-800)', color: 'rgba(255,255,255,0.5)', textAlign: 'center', padding: 24, fontSize: 13 }}>
        <p>© 2026 <span style={{ color: 'var(--gold)' }}>WASSCEPrep</span> — Free WASSCE prep for every Liberian student 🇱🇷</p>
      </footer>
    </div>
  )
}

