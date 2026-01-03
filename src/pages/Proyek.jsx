import { useEffect, useState } from 'react'
import {
  collection,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc
} from 'firebase/firestore'
import { db } from '../firebase'

const rupiah = n =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(n || 0)

export default function Proyek({ role }) {
  const [projects, setProjects] = useState([])
  const [editing, setEditing] = useState(null)

  useEffect(() => {
    const ref = collection(db, 'projects')
    return onSnapshot(ref, snap => {
      setProjects(
        snap.docs.map(d => ({ id: d.id, ...d.data() }))
      )
    })
  }, [])

  const hapus = async id => {
    if (!confirm('Hapus proyek ini?')) return
    await deleteDoc(doc(db, 'projects', id))
  }

  const simpan = async () => {
    const { id, name, budget, progress, status } = editing
    await updateDoc(doc(db, 'projects', id), {
      name,
      budget: Number(budget),
      progress: Number(progress),
      status
    })
    setEditing(null)
  }

  return (
    <>
      <div style={wrap}>
        {projects.map(p => (
          <div key={p.id} style={card}>
            <div style={head}>
              <h3 style={title}>{p.name}</h3>
              <span style={badge(p.status)}>
                {p.status || 'Aktif'}
              </span>
            </div>

            <div style={row}>
              <div>
                <small>Nilai Kontrak</small>
                <strong>{rupiah(p.budget)}</strong>
              </div>
              <div>
                <small>Progress</small>
                <strong>{p.progress || 0}%</strong>
              </div>
            </div>

            <div style={progressWrap}>
              <div
                style={{
                  ...progressBar,
                  width: `${p.progress || 0}%`
                }}
              />
            </div>

            {role === 'admin' && (
              <div style={actions}>
                <button
                  style={edit}
                  onClick={() => setEditing(p)}
                >
                  Edit
                </button>
                <button
                  style={hapusBtn}
                  onClick={() => hapus(p.id)}
                >
                  Hapus
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ===== MODAL EDIT ===== */}
      {editing && (
        <div style={overlay}>
          <div style={modal}>
            <h3>Edit Proyek</h3>

            <label>Nama Proyek</label>
            <input
              value={editing.name}
              onChange={e =>
                setEditing({
                  ...editing,
                  name: e.target.value
                })
              }
            />

            <label>Nilai Kontrak</label>
            <input
              type="number"
              value={editing.budget}
              onChange={e =>
                setEditing({
                  ...editing,
                  budget: e.target.value
                })
              }
            />

            <label>Progress (%)</label>
            <input
              type="number"
              value={editing.progress}
              onChange={e =>
                setEditing({
                  ...editing,
                  progress: e.target.value
                })
              }
            />

            <label>Status</label>
            <select
              value={editing.status}
              onChange={e =>
                setEditing({
                  ...editing,
                  status: e.target.value
                })
              }
            >
              <option>Aktif</option>
              <option>Selesai</option>
            </select>

            <div style={modalActions}>
              <button onClick={() => setEditing(null)}>
                Batal
              </button>
              <button style={save} onClick={simpan}>
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

/* ===== STYLE ===== */

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
  background:
    status === 'Selesai' ? '#16a34a' : '#2563eb'
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
  background: '#2563eb',
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
  border: '1px solid #c7d2fe',
  background: '#eef2ff',
  cursor: 'pointer',
  fontWeight: 600
}

const hapusBtn = {
  flex: 1,
  padding: 8,
  borderRadius: 8,
  border: '1px solid #fecaca',
  background: '#fee2e2',
  cursor: 'pointer',
  fontWeight: 600,
  color: '#b91c1c'
}

/* ===== MODAL ===== */

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
  background: '#2563eb',
  color: '#fff',
  border: 'none',
  padding: '6px 12px',
  borderRadius: 6,
  cursor: 'pointer'
}
