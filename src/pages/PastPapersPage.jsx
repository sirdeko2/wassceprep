import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '@/components/layout/Navbar'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { SUBJECTS } from '@/data/subjects'

const YEARS = Array.from({ length: 12 }, (_, i) => 2024 - i)
const PAPERS = ['All Papers', 'Paper 1', 'Paper 2', 'Paper 3']

export default function PastPapersPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [papers, setPapers]         = useState([])
  const [loading, setLoading]       = useState(true)
  const [filterSubject, setFilter]  = useState('All Subjects')
  const [filterYear, setFilterYear] = useState('All Years')
  const [filterPaper, setFilterPP]  = useState('All Papers')
  const [search, setSearch]         = useState('')
  const [viewing, setViewing]       = useState(null)

  useEffect(() => {
    fetchPapers()
  }, [])

  async function fetchPapers() {
    setLoading(true)
    const { data } = await supabase
      .from('past_papers')
      .select('*')
      .eq('visibility', 'published')
      .order('year', { ascending: false })
    setPapers(data || [])
    setLoading(false)
  }

  const filtered = papers.filter(p => {
    if (filterSubject !== 'All Subjects' && p.subject !== filterSubject) return false
    if (filterYear !== 'All Years' && String(p.year) !== String(filterYear)) return false
    if (filterPaper !== 'All Papers' && `Paper ${p.paper_number}` !== filterPaper) return false
    if (search && !p.title?.toLowerCase().includes(search.toLowerCase()) &&
        !p.subject?.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const s = {
    page: { minHeight: '100vh', background: 'var(--off-white)' },
    layout: { maxWidth: 1100, margin: '0 auto', padding: '40px 24px' },
    title: { fontFamily: "'DM Serif Display', serif", fontSize: 32, color: 'var(--blue)', marginBottom: 8 },
    sub: { fontSize: 15, color: 'var(--gray-400)', marginBottom: 32 },
    filters: { display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 28, alignItems: 'center' },
    input: { padding: '10px 14px', border: '1.5px solid var(--gray-200)', borderRadius: 10, fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: 'none', background: 'white', minWidth: 220 },
    select: { padding: '10px 14px', border: '1.5px solid var(--gray-200)', borderRadius: 10, fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: 'none', background: 'white', cursor: 'pointer' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 },
    card: { background: 'white', borderRadius: 16, padding: 24, border: '1px solid var(--gray-200)', transition: 'all 0.2s' },
    cardTop: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 },
    subjectBadge: { padding: '4px 12px', borderRadius: 100, fontSize: 12, fontWeight: 700 },
    yearBadge: { background: 'var(--blue-light)', color: 'var(--blue)', padding: '4px 12px', borderRadius: 100, fontSize: 12, fontWeight: 600 },
    paperBadge: { background: 'var(--red-light)', color: 'var(--red)', padding: '4px 10px', borderRadius: 100, fontSize: 11, fontWeight: 600 },
    cardTitle: { fontSize: 15, fontWeight: 700, color: 'var(--blue)', marginBottom: 6 },
    cardMeta: { fontSize: 12, color: 'var(--gray-400)', marginBottom: 16 },
    btnRow: { display: 'flex', gap: 8 },
    btnView: { background: 'var(--blue)', color: 'white', border: 'none', padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", flex: 1 },
    btnDownload: { background: 'var(--off-white)', color: 'var(--gray-600)', border: '1.5px solid var(--gray-200)', padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
    emptyBox: { background: 'white', borderRadius: 16, padding: 60, textAlign: 'center', border: '1px solid var(--gray-200)' },
    modal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', flexDirection: 'column', zIndex: 500 },
    modalHeader: { background: 'var(--blue)', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    modalTitle: { color: 'white', fontWeight: 700, fontSize: 16 },
    modalClose: { background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontFamily: "'DM Sans', sans-serif" },
    iframe: { flex: 1, border: 'none', background: '#525659' },
    infoBox: { background: 'linear-gradient(135deg, var(--blue) 0%, var(--blue-mid) 100%)', borderRadius: 16, padding: '24px 28px', marginBottom: 28, color: 'white', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' },
  }

  const subjectInfo = (name) => SUBJECTS.find(s => s.name === name)

  return (
    <div style={s.page}>
      <Navbar />

      {viewing && (
        <div style={s.modal}>
          <div style={s.modalHeader}>
            <span style={s.modalTitle}>{viewing.title}</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <a href={viewing.file_url} download target="_blank" rel="noreferrer"
                style={{ ...s.modalClose, textDecoration: 'none' }}>⬇ Download</a>
              <button style={s.modalClose} onClick={() => setViewing(null)}>✕ Close</button>
            </div>
          </div>
          <iframe src={viewing.file_url} style={s.iframe} title={viewing.title} />
        </div>
      )}

      <div style={s.layout}>
        <h1 style={s.title}>Past Papers</h1>
        <p style={s.sub}>Access official WASSCE past exam question papers. Filter by subject, year, and paper number.</p>

        <div style={s.infoBox}>
          <div style={{ fontSize: 36 }}>📄</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 4 }}>WASSCE Past Question Papers Archive</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>
              Download or view papers directly in your browser. Papers are read-only.
              {!user && <span> <Link to="/register" style={{ color: 'var(--gold)', fontWeight: 700 }}>Create a free account</Link> to track which papers you have studied.</span>}
            </div>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'center' }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, color: 'var(--gold)' }}>{papers.length}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 1 }}>Papers Available</div>
          </div>
        </div>

        <div style={s.filters}>
          <input
            style={s.input}
            placeholder="Search papers..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select style={s.select} value={filterSubject} onChange={e => setFilter(e.target.value)}>
            <option>All Subjects</option>
            {SUBJECTS.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
          </select>
          <select style={s.select} value={filterYear} onChange={e => setFilterYear(e.target.value)}>
            <option>All Years</option>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select style={s.select} value={filterPaper} onChange={e => setFilterPP(e.target.value)}>
            {PAPERS.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>

        {loading ? (
          <div style={s.emptyBox}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
            <div style={{ color: 'var(--gray-400)' }}>Loading papers...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={s.emptyBox}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>📂</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--blue)', marginBottom: 8 }}>
              {papers.length === 0 ? 'No papers uploaded yet' : 'No papers match your filters'}
            </div>
            <div style={{ color: 'var(--gray-400)', fontSize: 14, maxWidth: 400, margin: '0 auto' }}>
              {papers.length === 0
                ? 'Past papers will appear here once the admin uploads them. Check back soon.'
                : 'Try adjusting your filters or search term.'}
            </div>
          </div>
        ) : (
          <div style={s.grid}>
            {filtered.map(paper => {
              const subj = subjectInfo(paper.subject)
              return (
                <div key={paper.id} style={s.card}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none' }}
                >
                  <div style={s.cardTop}>
                    <span style={{ fontSize: 22 }}>{subj?.icon || '📄'}</span>
                    <span style={{ ...s.subjectBadge, background: subj?.bgColor || 'var(--blue-light)', color: subj?.color || 'var(--blue)' }}>
                      {paper.subject}
                    </span>
                    <span style={s.yearBadge}>{paper.year}</span>
                    <span style={s.paperBadge}>Paper {paper.paper_number}</span>
                  </div>
                  <div style={s.cardTitle}>{paper.title || `${paper.subject} ${paper.year} — Paper ${paper.paper_number}`}</div>
                  {paper.region_tag && (
                    <div style={s.cardMeta}>🌍 {paper.region_tag} &nbsp;•&nbsp; 📅 Uploaded {new Date(paper.created_at).toLocaleDateString()}</div>
                  )}
                  <div style={s.btnRow}>
                    {paper.file_url ? (
                      <>
                        <button style={s.btnView} onClick={() => setViewing(paper)}>
                          👁 View Paper
                        </button>
                        <a href={paper.file_url} download target="_blank" rel="noreferrer"
                          style={{ ...s.btnDownload, textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                          ⬇
                        </a>
                      </>
                    ) : (
                      <button style={{ ...s.btnView, background: 'var(--gray-400)', cursor: 'default' }} disabled>
                        PDF Coming Soon
                      </button>
                    )}
                    {/* Spec 4.3: link to practice mode if Paper 1 (digitised MCQ), else show PDF-only note */}
                    {paper.paper_number === 1 ? (
                      <button
                        style={{ ...s.btnView, background: 'var(--green)', color: 'white', fontSize: 11 }}
                        onClick={() => {
                          const subj = SUBJECTS.find(s => s.name === paper.subject)
                          if (subj) navigate(`/quiz/${subj.id}?mode=practice`)
                        }}
                      >
                        📝 Attempt in Practice Mode
                      </button>
                    ) : (
                      <span style={{ fontSize: 11, color: 'var(--gray-400)', alignSelf: 'center' }}>
                        View PDF Only
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
