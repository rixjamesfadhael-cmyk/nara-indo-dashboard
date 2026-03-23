import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db } from '../firebase'

export default function Histori() {
  const [logs, setLogs] = useState([])
  const [type, setType] = useState('')
  const [project, setProject] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  useEffect(() => {
    const q = query(collection(db, 'activity_logs'), orderBy('createdAt', 'desc'))
    return onSnapshot(q, snap => {
      setLogs(
        snap.docs.map(d => ({ id: d.id, ...d.data() }))
          .filter(l => ['CREATE','UPDATE','DELETE','ARCHIVE','RESTORE'].includes(l.action))
      )
    })
  }, [])

  useEffect(() => { setCurrentPage(1) }, [type, project, fromDate, toDate])

  const projectOptions = [...new Set(logs.map(l => l.projectName).filter(Boolean))]
  const isFiltering = type || project || fromDate || toDate

  const displayedLogs = isFiltering
    ? logs.filter(l => {
        const logDate = l.createdAt?.toDate?.()
        if (type && l.action !== type) return false
        if (project && l.projectName !== project) return false
        if (fromDate) { const f = new Date(fromDate); f.setHours(0,0,0,0); if (!logDate || logDate < f) return false }
        if (toDate) { const t = new Date(toDate); t.setHours(23,59,59,999); if (!logDate || logDate > t) return false }
        return true
      })
    : logs

  const totalPages = Math.ceil(displayedLogs.length / itemsPerPage)
  const paginatedLogs = displayedLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const inputStyle = {
    padding: 8, borderRadius: 8,
    border: '1px solid var(--border)',
    background: 'var(--bg-input)',
    color: 'var(--text)', minWidth: 140
  }

  const btnBase = {
    padding: '4px 10px', borderRadius: 6,
    border: '1px solid var(--border)',
    background: 'var(--bg-card-soft)',
    color: 'var(--text)', fontSize: 12, cursor: 'pointer'
  }

  const badgeColor = action =>
    action === 'CREATE' ? '#16a34a'
    : action === 'UPDATE' ? '#2563eb'
    : action === 'DELETE' ? '#dc2626'
    : action === 'ARCHIVE' ? '#0f766e'
    : '#7c3aed'

  return (
    <div>
      <h2 style={{ marginBottom: 12, color: 'var(--text)' }}>Histori Aktivitas</h2>

      {/* FILTER */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <select value={type} onChange={e => setType(e.target.value)} style={inputStyle}>
          <option value="">Semua Aktivitas</option>
          <option value="CREATE">Create</option>
          <option value="UPDATE">Update</option>
          <option value="DELETE">Delete</option>
          <option value="ARCHIVE">Archive</option>
          <option value="RESTORE">Restore</option>
        </select>

        <select value={project} onChange={e => setProject(e.target.value)} style={inputStyle}>
          <option value="">Semua Proyek</option>
          {projectOptions.map(p => <option key={p} value={p}>{p}</option>)}
        </select>

        <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} style={inputStyle} />
        <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} style={inputStyle} />

        {isFiltering && (
          <button
            style={{ ...btnBase, fontWeight: 600 }}
            onClick={() => { setType(''); setProject(''); setFromDate(''); setToDate('') }}
          >Reset</button>
        )}
      </div>

      {/* LIST */}
      {displayedLogs.length === 0 ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Tidak ada histori pada filter ini</div>
      ) : (
        <>
          <div style={{ display: 'grid', gap: 12 }}>
            {paginatedLogs.map(l => (
              <div key={l.id} style={{
                background: 'var(--bg-card)', padding: 14, borderRadius: 14,
                boxShadow: 'var(--shadow)', border: '1px solid var(--border)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
                  <span style={{ padding: '2px 8px', borderRadius: 999, fontWeight: 700, color: '#fff', background: badgeColor(l.action) }}>
                    {l.action}
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>
                    {l.createdAt?.toDate ? l.createdAt.toDate().toLocaleString('id-ID') : '-'}
                  </span>
                </div>
                <strong style={{ color: 'var(--text)' }}>{l.projectName}</strong>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{l.description}</div>
                <div style={{ fontSize: 12, color: 'var(--text-soft)', marginTop: 4 }}>Oleh: {l.userEmail || '-'}</div>
              </div>
            ))}
          </div>

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                style={{ ...btnBase, opacity: currentPage === 1 ? 0.5 : 1 }}>Prev</button>
              <span style={{ fontSize: 14, color: 'var(--text)' }}>Halaman {currentPage} dari {totalPages}</span>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                style={{ ...btnBase, opacity: currentPage === totalPages ? 0.5 : 1 }}>Next</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}