import { useEffect, useState } from 'react'
import {
  collection,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp
} from 'firebase/firestore'
import { db } from '../firebase'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const rupiah = n =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(n || 0)

/**
 * TEMPLATE STAGE DEFAULT
 * dipakai untuk:
 * - proyek baru
 * - proyek lama yg belum punya category / stages
 */
const STAGE_TEMPLATE = {
  konsultan: {
    perencanaan: { name: 'Perencanaan', progress: 0 },
    pengawasan: { name: 'Pengawasan', progress: 0 }
  },
  konstruksi: {
    pelaksanaan: { name: 'Pelaksanaan', progress: 0 }
  },
  pengadaan: {
    persiapan: { name: 'Persiapan Pengadaan', progress: 0 },
    proses: { name: 'Proses Pengadaan', progress: 0 },
    serahterima: { name: 'Serah Terima', progress: 0 }
  }
}

/**
 * HELPER AMAN:
 * memastikan project lama tidak kosong saat edit
 * TIDAK MENYENTUH DATABASE
 */
const normalizeProjectForEdit = project => {
  const category = project.category || 'konsultan'
  const stages =
    project.stages && Object.keys(project.stages).length > 0
      ? project.stages
      : STAGE_TEMPLATE[category]

  return {
    ...project,
    category,
    stages,
    paymentStatus: project.paymentStatus || 'Belum Bayar',
    status: project.status || 'AKTIF'
  }
}

export default function Proyek({ role }) {
  const [projects, setProjects] = useState([])
  const [editing, setEditing] = useState(null)
  const [adding, setAdding] = useState(false)
  const [search, setSearch] = useState('')

  const [form, setForm] = useState({
    name: '',
    budget: '',
    progress: 0,
    category: 'konsultan',
    stages: STAGE_TEMPLATE.konsultan,
    paymentStatus: 'Belum Bayar'
  })

  useEffect(() => {
    return onSnapshot(collection(db, 'projects'), snap => {
      setProjects(
        snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(p => p.status !== 'ARSIP')
      )
    })
  }, [])

  const logActivity = async (action, projectName, description) => {
    await addDoc(collection(db, 'activity_logs'), {
      action,
      projectName,
      description,
      createdAt: serverTimestamp()
    })
  }

  const filteredProjects = projects.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase())
  )

  const hapus = async id => {
    const p = projects.find(x => x.id === id)
    if (!confirm('Hapus proyek ini?')) return
    await deleteDoc(doc(db, 'projects', id))
    await logActivity('DELETE', p?.name || '-', 'Proyek dihapus')
  }

  const hitungGlobalProgress = stages => {
    if (!stages) return 0
    const vals = Object.values(stages).map(s => Number(s.progress) || 0)
    if (!vals.length) return 0
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
  }

  const simpanEdit = async () => {
    const { id, name, budget, stages, paymentStatus } = editing
    const globalProgress = hitungGlobalProgress(stages)

    let status = editing.status || 'AKTIF'
    if (globalProgress === 100 && paymentStatus === 'Pelunasan') {
      const ok = confirm(
        'Semua tahap selesai dan pembayaran lunas.\nArsipkan proyek?'
      )
      if (ok) status = 'ARSIP'
    }
    if (status === 'ARSIP' && globalProgress < 100) status = 'AKTIF'

    await updateDoc(doc(db, 'projects', id), {
      name,
      budget: Number(budget),
      category: editing.category,
      stages,
      progress: globalProgress,
      paymentStatus,
      status
    })

    await logActivity('UPDATE', name, 'Proyek diperbarui')
    setEditing(null)
  }

  const simpanTambah = async () => {
    if (!form.name) return alert('Nama proyek wajib diisi')

    const globalProgress = hitungGlobalProgress(form.stages)

    await addDoc(collection(db, 'projects'), {
      name: form.name,
      budget: Number(form.budget),
      category: form.category,
      stages: form.stages,
      progress: globalProgress,
      paymentStatus: form.paymentStatus,
      status: 'AKTIF',
      createdAt: serverTimestamp()
    })

    await logActivity('CREATE', form.name, 'Proyek ditambahkan')

    setForm({
      name: '',
      budget: '',
      progress: 0,
      category: 'konsultan',
      stages: STAGE_TEMPLATE.konsultan,
      paymentStatus: 'Belum Bayar'
    })
    setAdding(false)
  }

  return (
    <>
      {/* === HEADER TETAP === */}
      <div style={header}>
        <h2>Daftar Proyek</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            placeholder="Cari proyek..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={searchInput}
          />
          <button style={exportBtn}>Excel</button>
          <button style={exportPdfBtn}>PDF</button>
          {role === 'admin' && (
            <button style={addBtn} onClick={() => setAdding(true)}>
              + Tambah
            </button>
          )}
        </div>
      </div>

      {/* === LIST PROYEK TETAP === */}
      <div style={wrap}>
        {filteredProjects.map(p => (
          <div key={p.id} style={card}>
            <h3 style={title}>{p.name}</h3>
            <div style={row}>
              <div>
                <small>Nilai</small>
                <strong>{rupiah(p.budget)}</strong>
              </div>
              <div>
                <small>Progress</small>
                <strong>{p.progress || 0}%</strong>
              </div>
            </div>
            <div style={progressWrap}>
              <div
                style={{ ...progressBar, width: `${p.progress || 0}%` }}
              />
            </div>
            {role === 'admin' && (
              <div style={actions}>
                <button
                  style={edit}
                  onClick={() =>
                    setEditing(normalizeProjectForEdit(p))
                  }
                >
                  Edit
                </button>
                <button style={hapusBtn} onClick={() => hapus(p.id)}>
                  Hapus
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* === MODAL (EDIT / TAMBAH) === */}
      {(editing || adding) && (
        <div style={overlay}>
          <div style={modal}>
            <h3>{editing ? 'Edit Proyek' : 'Tambah Proyek'}</h3>

            <strong>Informasi Umum</strong>
            <input
              placeholder="Nama Proyek"
              value={(editing || form).name}
              onChange={e =>
                editing
                  ? setEditing({ ...editing, name: e.target.value })
                  : setForm({ ...form, name: e.target.value })
              }
            />
            <input
              type="number"
              placeholder="Nilai Kontrak"
              value={(editing || form).budget}
              onChange={e =>
                editing
                  ? setEditing({ ...editing, budget: e.target.value })
                  : setForm({ ...form, budget: e.target.value })
              }
            />

            <hr />

            <strong>Kategori & Tahapan</strong>
            <select
              value={(editing || form).category}
              onChange={e => {
                const cat = e.target.value
                editing
                  ? setEditing({
                      ...editing,
                      category: cat,
                      stages: STAGE_TEMPLATE[cat]
                    })
                  : setForm({
                      ...form,
                      category: cat,
                      stages: STAGE_TEMPLATE[cat]
                    })
              }}
            >
              <option value="konsultan">Konsultan</option>
              <option value="konstruksi">Konstruksi</option>
              <option value="pengadaan">Pengadaan</option>
            </select>

            {Object.entries((editing || form).stages).map(([k, v]) => (
              <div key={k}>
                <small>{v.name}</small>
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="Progress tahap (0–100)"
                  value={v.progress}
                  onChange={e => {
                    const val = Number(e.target.value)
                    const target = editing || form
                    const updated = {
                      ...target.stages,
                      [k]: { ...v, progress: val }
                    }
                    editing
                      ? setEditing({ ...editing, stages: updated })
                      : setForm({ ...form, stages: updated })
                  }}
                />
              </div>
            ))}

            <hr />

            <strong>Status Pembayaran</strong>
            <select
              value={(editing || form).paymentStatus}
              onChange={e =>
                editing
                  ? setEditing({
                      ...editing,
                      paymentStatus: e.target.value
                    })
                  : setForm({
                      ...form,
                      paymentStatus: e.target.value
                    })
              }
            >
              <option>Belum Bayar</option>
              <option>DP</option>
              <option>Termin 1</option>
              <option>Termin 2</option>
              <option>Termin 3</option>
              <option>Pelunasan</option>
            </select>

            <div style={modalActions}>
              <button
                onClick={() =>
                  editing ? setEditing(null) : setAdding(false)
                }
              >
                Batal
              </button>
              <button style={save} onClick={editing ? simpanEdit : simpanTambah}>
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

/* === STYLE (TIDAK DIUBAH) === */
const header = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 20
}
const searchInput = { padding: 8, borderRadius: 8, border: '1px solid #e5e7eb' }
const addBtn = {
  background: '#2563eb',
  color: '#fff',
  border: 'none',
  padding: '8px 14px',
  borderRadius: 8,
  cursor: 'pointer',
  fontWeight: 700
}
const exportBtn = {
  background: '#16a34a',
  color: '#fff',
  border: 'none',
  padding: '8px 14px',
  borderRadius: 8
}
const exportPdfBtn = {
  background: '#dc2626',
  color: '#fff',
  border: 'none',
  padding: '8px 14px',
  borderRadius: 8
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
  boxShadow: '0 10px 25px rgba(0,0,0,0.05)'
}
const title = { margin: 0, fontSize: 18, fontWeight: 700 }
const row = { display: 'flex', justifyContent: 'space-between' }
const progressWrap = { height: 8, background: '#e5e7eb', borderRadius: 999 }
const progressBar = { height: '100%', background: '#2563eb' }
const actions = { display: 'flex', gap: 8 }
const edit = { flex: 1 }
const hapusBtn = { flex: 1 }
const overlay = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.4)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}
const modal = {
  background: '#fff',
  padding: 20,
  borderRadius: 16,
  width: 360
}
const modalActions = { display: 'flex', justifyContent: 'flex-end', gap: 8 }
const save = { background: '#2563eb', color: '#fff' }
