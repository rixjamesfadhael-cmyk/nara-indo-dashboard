import { useEffect, useState } from 'react'
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp
} from 'firebase/firestore'
import { db } from '../firebase'

export default function Proyek({ role }) {
  const [projects, setProjects] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)

  const [form, setForm] = useState({
    name: '',
    budget: '',
    progress: 0,
    status: 'Aktif'
  })

  useEffect(() => {
    return onSnapshot(collection(db, 'projects'), snap => {
      setProjects(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
  }, [])

  /* ================= LOG HELPER ================= */
  const logActivity = async (type, projectName, message) => {
    await addDoc(collection(db, 'activity_logs'), {
      type,
      projectName,
      message,
      createdAt: serverTimestamp()
    })
  }

  /* ================= CRUD ================= */
  const openAdd = () => {
    setEditing(null)
    setForm({ name: '', budget: '', progress: 0, status: 'Aktif' })
    setShowForm(true)
  }

  const openEdit = p => {
    setEditing(p.id)
    setForm({
      name: p.name,
      budget: p.budget,
      progress: p.progress,
      status: p.status
    })
    setShowForm(true)
  }

  const simpan = async () => {
    if (!form.name) return alert('Nama proyek wajib diisi')

    const payload = {
      ...form,
      budget: Number(form.budget),
      progress: Number(form.progress),
      updatedAt: serverTimestamp()
    }

    if (editing) {
      await updateDoc(doc(db, 'projects', editing), payload)
      await logActivity(
        'UPDATE',
        form.name,
        'Proyek diperbarui'
      )
    } else {
      await addDoc(collection(db, 'projects'), {
        ...payload,
        createdAt: serverTimestamp()
      })
      await logActivity(
        'CREATE',
        form.name,
        'Proyek ditambahkan'
      )
    }

    setShowForm(false)
    setEditing(null)
  }

  const hapus = async p => {
    if (!confirm('Hapus proyek ini?')) return

    await deleteDoc(doc(db, 'projects', p.id))
    await logActivity(
      'DELETE',
      p.name,
      'Proyek dihapus'
    )
  }

  return (
    <div>
      {/* HEADER */}
      <div style={header}>
        <h2>Daftar Proyek</h2>

        {role === 'admin' && (
          <button style={addBtn} onClick={openAdd}>
            + Tambah Proyek
          </button>
        )}
      </div>

      {/* LIST */}
      <div style={grid}>
        {projects.map(p => (
          <div key={p.id} style={card}>
            <strong>{p.name}</strong>

            <div style={{ fontSize: 13, marginTop: 4 }}>
              Nilai: Rp {Number(p.budget || 0).toLocaleString('id-ID')}
            </div>

            {/* PROGRESS */}
            <div style={{ marginTop: 8 }}>
              <div style={progressHeader}>
                <span>Progress</span>
                <span>{p.progress}%</span>
              </div>
              <div style={progressTrack}>
                <div
                  style={{
                    ...progressFill,
                    width: `${p.progress}%`
                  }}
                />
              </div>
            </div>

            <div style={{ fontSize: 12, marginTop: 6 }}>
              Status: {p.status}
            </div>

            {role === 'admin' && (
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button style={editBtn} onClick={() => openEdit(p)}>
                  Edit
                </button>
                <button style={deleteBtn} onClick={() => hapus(p)}>
                  Hapus
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* MODAL */}
      {showForm && (
        <div style={overlay}>
          <div style={modal}>
            <h3>{editing ? 'Edit Proyek' : 'Tambah Proyek'}</h3>

            <input
              placeholder="Nama Proyek"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
            />

            <input
              type="number"
              placeholder="Nilai Kontrak"
              value={form.budget}
              onChange={e => setForm({ ...form, budget: e.target.value })}
            />

            <input
              type="number"
              placeholder="Progress (%)"
              value={form.progress}
              onChange={e => setForm({ ...form, progress: e.target.value })}
            />

            <select
              value={form.status}
              onChange={e => setForm({ ...form, status: e.target.value })}
            >
              <option>Aktif</option>
              <option>Selesai</option>
            </select>

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowForm(false)}>Batal</button>
              <button style={addBtn} onClick={simpan}>
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ===== STYLE (TIDAK DIUBAH) ===== */
const header = {
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: 20
}

const addBtn = {
  background: '#2563eb',
  color: '#fff',
  border: 'none',
  padding: '8px 14px',
  borderRadius: 8,
  cursor: 'pointer'
}

const grid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))',
  gap: 20
}

const card = {
  background: '#fff',
  padding: 16,
  borderRadius: 14,
  boxShadow: '0 8px 20px rgba(0,0,0,0.06)'
}

const progressHeader = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: 12,
  marginBottom: 4
}

const progressTrack = {
  width: '100%',
  height: 8,
  background: '#e5e7eb',
  borderRadius: 999
}

const progressFill = {
  height: '100%',
  background: '#2563eb',
  borderRadius: 999,
  transition: 'width 0.3s ease'
}

const editBtn = {
  background: '#e0e7ff',
  color: '#1d4ed8',
  border: 'none',
  padding: '6px 10px',
  borderRadius: 6,
  cursor: 'pointer'
}

const deleteBtn = {
  background: '#fee2e2',
  color: '#b91c1c',
  border: 'none',
  padding: '6px 10px',
  borderRadius: 6,
  cursor: 'pointer'
}

const overlay = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.4)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 50
}

const modal = {
  background: '#fff',
  padding: 20,
  borderRadius: 14,
  width: 320,
  display: 'flex',
  flexDirection: 'column',
  gap: 10
}
