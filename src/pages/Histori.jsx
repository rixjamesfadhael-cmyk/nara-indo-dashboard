import { useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'

export default function Histori() {
  const [logs, setLogs] = useState([])

  const [type, setType] = useState('')
  const [project, setProject] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  useEffect(() => {
    return onSnapshot(collection(db, 'activity_logs'), snap => {
      const realtimeLogs = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(l =>
          l.action === 'CREATE' ||
          l.action === 'UPDATE' ||
          l.action === 'DELETE'
        )

      setLogs(realtimeLogs)
    })
  }, [])

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
        <div style={{ display: 'grid', gap: 12 }}>
          {displayedLogs.map(l => (
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
            </div>
          ))}
        </div>
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
      : '#dc2626'
})

const date = {
  color: '#64748b'
}

const desc = {
  fontSize: 13,
  color: '#475569',
  marginTop: 4
}
