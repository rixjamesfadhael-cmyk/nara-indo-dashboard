import { useEffect, useState } from 'react'
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp
} from 'firebase/firestore'
import { db } from '../firebase'

const rupiah = n =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(n || 0)

export default function Arsip({ role }) {
  const [archives, setArchives] = useState([])
  const [editing, setEditing] = useState(null)

  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('SEMUA')

  /* ===== FETCH ARSIP ===== */
  useEffect(() => {
    return onSnapshot(collection(db, 'arsip_proyek'), snap => {
      setArchives(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
  }, [])

  /* ===== HISTORI LOGGER ===== */
  const logActivity = async (action, projectName, description) => {
    await addDoc(collection(db, 'activity_logs'), {
      action,
      projectName,
      description,
      createdAt: serverTimestamp()
    })
  }

  /* ===== FILTER ===== */
  const filteredArchives = archives.filter(a => {
    const matchName = a.name
      ?.toLowerCase()
      .includes(search.toLowerCase())

    const matchStatus =
      filterStatus === 'SEMUA'
        ? true
        : a.status === filterStatus

    return matchName && matchStatus
  })

  /* ===== RESTORE ===== */
  const simpanRestore = async () => {
    const { id, name, budget, progress } = editing

    if (Number(progress) >= 100) {
      alert('Progress harus di bawah 100 untuk dikembalikan')
      return
    }

    await addDoc(collection(db, 'projects'), {
      name,
      budget: Number(budget),
      progress: Number(progress),
      status: 'Aktif'
    })

    await deleteDoc(doc(db, 'arsip_proyek', id))

    await logActivity(
      'RESTORE',
      name,
      `Dikembalikan ke proyek aktif. Progress: ${progress}%`
    )

    setEditing(null)
  }

  return (
    <>
      {/* HEADER */}
      <div style={header}>
        <h2>Arsip Proyek</h2>

        <div style={{ display: 'flex', gap: 8 }}>
          <input
            placeholder="Cari proyek..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={searchInput}
          />

          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            style={select}
          >
            <option value="SEMUA">Semua</option>
            <option value="Selesai">Selesai</option>
          </select>
        </div>
      </div>

      {/* LIST */}
      <div style={wrap}>
        {filteredArchives.map(a => (
          <div key={a.id} style={card}>
            <div style={head}>
              <h3 style={title}>{a.name}</h3>
              <span style={badge(a.status)}>{a.status}</span>
            </div>

            <div style={row}>
              <div>
                <small>Nilai</small>
                <strong>{rupiah(a.budget)}</strong>
              </div>
              <div>
                <small>Progress</small>
                <strong>{a.progress || 0}%</strong>
              </div>
            </div>

            <div style={progressWrap}>
              <div
                style={{
                  ...progressBar,
                  width: `${a.progress || 0}%`
                }}
              />
            </div>

            {role === 'admin' && (
              <div style={actions}>
                <button style={edit} onClick={() => setEditing(a)}>
                  Edit
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* MODAL EDIT / RESTORE */}
      {editing && (
        <div style={overlay}>
          <div style={modal}>
            <h3>Edit Arsip</h3>

            <input value={editing.name} disabled />
            <input value={editing.budget} disabled />

            <input
              type="number"
              value={editing.progress}
              onChange={e =>
                setEditing({ ...editing, progress: e.target.value })
              }
            />

            <div style={modalActions}>
              <button onClick={() => setEditing(null)}>Batal</button>
              <button style={save} onClick={simpanRestore}>
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

/* ===== STYLE (MENIRU PROYEK, UTUH) ===== */

const header = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 20
}

const searchInput = {
  padding: 8,
  borderRadius: 8,
  border: '1px solid #e5e7eb'
}

const select = {
  padding: 8,
  borderRadius: 8,
  border: '1px solid #e5e7eb'
}

const wrap = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  gap: 20
}

const card = {
  background: '#fff',
  borderRadius: 16,
  padding: 20,
  boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
  display: 'flex',
  flexDirection: 'column',
  gap: 12
}

const head = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
}

const title = {
  margin: 0,
  fontSize: 18,
  fontWeight: 700
}

const badge = status => ({
  padding: '4px 10px',
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 700,
  color: '#fff',
  background: '#16a34a'
})

const row = {
  display: 'flex',
  justifyContent: 'space-between',
  color: '#475569',
  fontSize: 14
}

const progressWrap = {
  height: 8,
  background: '#e5e7eb',
  borderRadius: 999,
  overflow: 'hidden'
}

const progressBar = {
  height: '100%',
  background: '#16a34a',
  transition: 'width 0.3s ease'
}

const actions = {
  display: 'flex',
  gap: 8,
  marginTop: 8
}

const edit = {
  flex: 1,
  padding: 8,
  borderRadius: 8,
  border: '1px solid #bbf7d0',
  background: '#dcfce7',
  cursor: 'pointer',
  fontWeight: 600
}

const overlay = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.4)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000
}

const modal = {
  background: '#fff',
  padding: 20,
  borderRadius: 16,
  width: 320,
  display: 'flex',
  flexDirection: 'column',
  gap: 8
}

const modalActions = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 8,
  marginTop: 12
}

const save = {
  background: '#16a34a',
  color: '#fff',
  border: 'none',
  padding: '6px 12px',
  borderRadius: 6,
  cursor: 'pointer'
}
