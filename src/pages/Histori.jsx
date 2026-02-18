import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db } from '../firebase'

export default function Histori() {
  const [logs, setLogs] = useState([])
  const [type, setType] = useState('')
  const [project, setProject] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  // ================= PAGINATION =================
const [currentPage, setCurrentPage] = useState(1)
const itemsPerPage = 8

 useEffect(() => {
  const q = query(
    collection(db, 'activity_logs'),
    orderBy('createdAt', 'desc')
  )

  return onSnapshot(q, snap => {
      const realtimeLogs = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(
          l =>
            l.action === 'CREATE' ||
            l.action === 'UPDATE' ||
            l.action === 'DELETE' ||
            l.action === 'ARCHIVE' ||
            l.action === 'RESTORE'
        )

      setLogs(realtimeLogs)
    })
  }, [])

  useEffect(() => {
  setCurrentPage(1)
}, [type, project, fromDate, toDate])

  const projectOptions = [
    ...new Set(logs.map(l => l.projectName).filter(Boolean))
  ]

  const isFiltering = type || project || fromDate || toDate

  const displayedLogs = isFiltering
    ? logs.filter(l => {
        const logDate = l.createdAt?.toDate?.()
        if (type && l.action !== type) return false
        if (project && l.projectName !== project) return false

        if (fromDate) {
          const from = new Date(fromDate)
          from.setHours(0, 0, 0, 0)
          if (!logDate || logDate < from) return false
        }

        if (toDate) {
          const to = new Date(toDate)
          to.setHours(23, 59, 59, 999)
          if (!logDate || logDate > to) return false
        }

        return true
      })
    : logs

    const totalPages = Math.ceil(
  displayedLogs.length / itemsPerPage
)

const paginatedLogs = displayedLogs.slice(
  (currentPage - 1) * itemsPerPage,
  currentPage * itemsPerPage
)
  return (
    <div>
      <h2 style={{ marginBottom: 12 }}>Histori Aktivitas</h2>

      {/* FILTER */}
      <div style={filterBar}>
        <select
          value={type}
          onChange={e => setType(e.target.value)}
          style={input}
        >
          <option value="">Semua Aktivitas</option>
          <option value="CREATE">Create</option>
          <option value="UPDATE">Update</option>
          <option value="DELETE">Delete</option>
          <option value="ARCHIVE">Archive</option>
          <option value="RESTORE">Restore</option>
        </select>

        <select
          value={project}
          onChange={e => setProject(e.target.value)}
          style={input}
        >
          <option value="">Semua Proyek</option>
          {projectOptions.map(p => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={fromDate}
          onChange={e => setFromDate(e.target.value)}
          style={input}
        />

        <input
          type="date"
          value={toDate}
          onChange={e => setToDate(e.target.value)}
          style={input}
        />

        {isFiltering && (
          <button
            style={resetBtn}
            onClick={() => {
              setType('')
              setProject('')
              setFromDate('')
              setToDate('')
            }}
          >
            Reset
          </button>
        )}
      </div>

      {/* LIST */}
{displayedLogs.length === 0 ? (
  <div style={{ color: '#64748b', fontSize: 14 }}>
    Tidak ada histori pada filter ini
  </div>
) : (
  <>
    <div style={{ display: 'grid', gap: 12 }}>
      {paginatedLogs.map(l => (
        <div key={l.id} style={card}>
          <div style={cardHeader}>
            <span style={badge(l.action)}>{l.action}</span>
            <span style={date}>
              {l.createdAt?.toDate
                ? l.createdAt
                    .toDate()
                    .toLocaleString('id-ID')
                : '-'}
            </span>
          </div>

          <strong>{l.projectName}</strong>

          <div style={desc}>{l.description}</div>

          <div
            style={{
              fontSize: 12,
              color: '#64748b',
              marginTop: 4
            }}
          >
            Oleh: {l.userEmail || '-'}
          </div>
        </div>
      ))}
    </div>

    {totalPages > 1 && (
      <div
        style={{
          marginTop: 24,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap'
        }}
      >
        <button
          disabled={currentPage === 1}
          onClick={() =>
            setCurrentPage(p => Math.max(1, p - 1))
          }
          style={{
            padding: '4px 10px',
            borderRadius: 6,
            border: '1px solid #e5e7eb',
            background: '#f8fafc',
            cursor: 'pointer',
            opacity: currentPage === 1 ? 0.5 : 1
          }}
        >
          Prev
        </button>

        <span style={{ fontSize: 14 }}>
          Halaman {currentPage} dari {totalPages}
        </span>

        <button
          disabled={currentPage === totalPages}
          onClick={() =>
            setCurrentPage(p =>
              Math.min(totalPages, p + 1)
            )
          }
          style={{
            padding: '4px 10px',
            borderRadius: 6,
            border: '1px solid #e5e7eb',
            background: '#f8fafc',
            cursor: 'pointer',
            opacity: currentPage === totalPages ? 0.5 : 1
          }}
        >
          Next
        </button>
      </div>
    )}
  </>
)}
</div>
)
}

/* STYLE */

const filterBar = {
  display: 'flex',
  gap: 10,
  marginBottom: 20,
  flexWrap: 'wrap'
}

const input = {
  padding: 8,
  borderRadius: 8,
  border: '1px solid #e5e7eb',
  minWidth: 140
}

const resetBtn = {
  background: '#e5e7eb',
  border: 'none',
  padding: '8px 12px',
  borderRadius: 8,
  cursor: 'pointer',
  fontWeight: 600
}

const card = {
  background: '#fff',
  padding: 14,
  borderRadius: 14,
  boxShadow: '0 8px 20px rgba(0,0,0,0.05)'
}

const cardHeader = {
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: 6,
  fontSize: 12
}

const badge = action => ({
  padding: '2px 8px',
  borderRadius: 999,
  fontWeight: 700,
  color: '#fff',
  background:
    action === 'CREATE'
      ? '#16a34a'
      : action === 'UPDATE'
      ? '#2563eb'
      : action === 'DELETE'
      ? '#dc2626'
      : action === 'ARCHIVE'
      ? '#0f766e'
      : '#7c3aed'
})

const date = {
  color: '#64748b'
}

const desc = {
  fontSize: 13,
  color: '#475569',
  marginTop: 4
}
