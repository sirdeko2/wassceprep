import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div style={{ textAlign: 'center', padding: 80 }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>📚</div>
      <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 48, color: 'var(--blue)' }}>
        PAGE NOT FOUND
      </h1>
      <p style={{ color: 'var(--gray-400)', marginBottom: 24 }}>
        That page does not exist. Let us get you back on track.
      </p>
      <Link to="/" style={{
        background: 'var(--blue)', color: 'white', padding: '12px 28px',
        borderRadius: 10, textDecoration: 'none', fontWeight: 700
      }}>
        Go Home
      </Link>
    </div>
  )
}
