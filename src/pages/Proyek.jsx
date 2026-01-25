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

/* ================= UTIL ================= */
const rupiah = n =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(n || 0)

/* ================= WORKFLOW RESMI ================= */
const WORKFLOW_KONSULTAN = {
  perencanaan: [
    { key: 'survey', label: 'Survei & Pengumpulan Data' },
    { key: 'kak', label: 'Penyusunan KAK' },
    { key: 'ded', label: 'DED / Gambar Teknis' },
    { key: 'rab', label: 'RAB & Spesifikasi Teknis' }
  ],
  pengawasan: [
    { key: 'lap_mingguan', label: 'Laporan Mingguan' },
    { key: 'lap_bulanan', label: 'Laporan Bulanan' },
    { key: 'lap_akhir', label: 'Laporan Akhir' }
  ]
}

/* ================= COMPONENT ================= */
export default function Proyek({ role }) {
  const [projects, setProjects] = useState([])
  const [editing, setEditing] = useState(null)
  const [adding, setAdding] = useState(false)
  const [search, setSearch] = useState('')

  const emptyForm = {
    name: '',
    instansi: '',
    lokasi: '',
    budget: '',
    category: 'konsultan',
    subType: '',
    workflow: {},
    paymentStatus: 'Belum Bayar',
    progress: 0
  }

  const [form, setForm] = useState(emptyForm)

  /* ================= LOAD DATA ================= */
  useEffect(() => {
    return onSnapshot(collection(db, 'projects'), snap => {
      setProjects(
        snap.docs.map(d => ({ id: d.id, ...d.data() }))
      )
    })
  }, [])

  /* ================= HELPERS ================= */
  const logActivity = async (action, projectName) => {
    await addDoc(collection(db, 'activity_logs'), {
      action,
      projectName,
      createdAt: serverTimestamp()
    })
  }

  const hapus = async id => {
    const p = projects.find(x => x.id === id)
    if (!confirm('Hapus proyek ini?')) return
    await deleteDoc(doc(db, 'projects', id))
    await logActivity('DELETE', p?.name || '-')
  }

  const hitungProgressWorkflow = (subType, workflow) => {
    if (!subType) return 0
    const steps = WORKFLOW_KONSULTAN[subType]
    const vals = steps.map(s => Number(workflow?.[s.key] || 0))
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
  }

  /* ================= SAVE ================= */
  const simpanTambah = async () => {
    if (!form.name) return alert('Nama proyek wajib diisi')
    if (form.category === 'konsultan' && !form.subType)
      return alert('Pilih jenis konsultan')

    const progress =
      form.category === 'konsultan'
        ? hitungProgressWorkflow(form.subType, form.workflow)
        : Number(form.progress || 0)

    await addDoc(collection(db, 'projects'), {
      ...form,
      budget: Number(form.budget),
      progress,
      status: 'AKTIF',
      createdAt: serverTimestamp()
    })

    await logActivity('CREATE', form.name)
    setForm(emptyForm)
    setAdding(false)
  }

  const simpanEdit = async () => {
    const progress =
      editing.category === 'konsultan'
        ? hitungProgressWorkflow(editing.subType, editing.workflow)
        : Number(editing.progress || 0)

    await updateDoc(doc(db, 'projects', editing.id), {
      ...editing,
      budget: Number(editing.budget),
      progress
    })

    await logActivity('UPDATE', editing.name)
    setEditing(null)
  }

  /* ================= EXPORT ================= */
  const exportRows = projects.map((p, i) => ({
    No: i + 1,
    Nama: p.name,
    Nilai: p.budget,
    Progress: `${p.progress || 0}%`
  }))

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(exportRows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Proyek')
    XLSX.writeFile(wb, 'daftar-proyek.xlsx')
  }

  const exportPDF = () => {
    const pdf = new jsPDF()
    pdf.text('Daftar Proyek', 14, 15)
    autoTable(pdf, {
      startY: 20,
      head: [['No', 'Nama', 'Nilai', 'Progress']],
      body: exportRows.map(r => [
        r.No,
        r.Nama,
        rupiah(r.Nilai),
        r.Progress
      ])
    })
    pdf.save('daftar-proyek.pdf')
  }

  const active = editing || form

  /* ================= RENDER ================= */
  return (
    <>
      {/* HEADER */}
      <div style={header}>
        <h2>Daftar Proyek</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            placeholder="Cari proyek..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={searchInput}
          />
          <button style={exportBtn} onClick={exportExcel}>Excel</button>
          <button style={exportPdfBtn} onClick={exportPDF}>PDF</button>
          {role === 'admin' && (
            <button style={addBtn} onClick={() => setAdding(true)}>
              + Tambah
            </button>
          )}
        </div>
      </div>

      {/* LIST */}
      <div style={wrap}>
        {projects
          .filter(p =>
            p.name?.toLowerCase().includes(search.toLowerCase())
          )
          .map(p => (
            <div key={p.id} style={card}>
              <h3>{p.name}</h3>
              <strong>{rupiah(p.budget)}</strong>
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
                  <button onClick={() => setEditing(p)}>Edit</button>
                  <button onClick={() => hapus(p.id)}>Hapus</button>
                </div>
              )}
            </div>
          ))}
      </div>

      {/* MODAL */}
      {(adding || editing) && (
        <div style={overlay}>
          <div style={modal}>
            <h3>{editing ? 'Edit Proyek' : 'Tambah Proyek'}</h3>

            <input
              placeholder="Nama Proyek"
              value={active.name}
              onChange={e =>
                editing
                  ? setEditing({ ...editing, name: e.target.value })
                  : setForm({ ...form, name: e.target.value })
              }
            />
            <input
              placeholder="Instansi"
              value={active.instansi || ''}
              onChange={e =>
                editing
                  ? setEditing({ ...editing, instansi: e.target.value })
                  : setForm({ ...form, instansi: e.target.value })
              }
            />
            <input
              placeholder="Lokasi"
              value={active.lokasi || ''}
              onChange={e =>
                editing
                  ? setEditing({ ...editing, lokasi: e.target.value })
                  : setForm({ ...form, lokasi: e.target.value })
              }
            />
            <input
              type="number"
              placeholder="Nilai Kontrak"
              value={active.budget}
              onChange={e =>
                editing
                  ? setEditing({ ...editing, budget: e.target.value })
                  : setForm({ ...form, budget: e.target.value })
              }
            />

            {/* KATEGORI */}
            <select
              value={active.category}
              onChange={e => {
                const cat = e.target.value
                const base = {
                  category: cat,
                  subType: '',
                  workflow: {}
                }
                editing
                  ? setEditing({ ...editing, ...base })
                  : setForm({ ...form, ...base })
              }}
            >
              <option value="konsultan">Konsultan</option>
            </select>

            {/* SUB KONSULTAN */}
            <select
              value={active.subType}
              onChange={e => {
                const val = e.target.value
                editing
                  ? setEditing({ ...editing, subType: val, workflow: {} })
                  : setForm({ ...form, subType: val, workflow: {} })
              }}
            >
              <option value="">-- Pilih Jenis Konsultan --</option>
              <option value="perencanaan">Perencanaan</option>
              <option value="pengawasan">Pengawasan</option>
            </select>

            {/* WORKFLOW BERTAHAP */}
            {active.subType &&
              WORKFLOW_KONSULTAN[active.subType].map((s, i) => {
                const prev =
                  i === 0
                    ? true
                    : Number(active.workflow?.[
                        WORKFLOW_KONSULTAN[active.subType][i - 1].key
                      ]) === 100

                if (!prev) return null

                return (
                  <div key={s.key}>
                    <small>{s.label}</small>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={active.workflow?.[s.key] || 0}
                      onChange={e => {
                        const val = Number(e.target.value)
                        const wf = { ...active.workflow, [s.key]: val }
                        editing
                          ? setEditing({ ...editing, workflow: wf })
                          : setForm({ ...form, workflow: wf })
                      }}
                    />
                  </div>
                )
              })}

            <select
              value={active.paymentStatus}
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
              <option>Pelunasan</option>
            </select>

            <div style={modalActions}>
              <button onClick={() => (editing ? setEditing(null) : setAdding(false))}>
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

/* ================= STYLE ================= */
const header = { display: 'flex', justifyContent: 'space-between' }
const searchInput = { padding: 8 }
const addBtn = { background: '#2563eb', color: '#fff' }
const exportBtn = { background: '#16a34a', color: '#fff' }
const exportPdfBtn = { background: '#dc2626', color: '#fff' }
const wrap = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px,1fr))', gap: 20 }
const card = { background: '#fff', padding: 16, borderRadius: 12 }
const progressWrap = { height: 8, background: '#e5e7eb', borderRadius: 999 }
const progressBar = { height: '100%', background: '#2563eb' }
const actions = { display: 'flex', gap: 8 }
const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }
const modal = { background: '#fff', padding: 20, borderRadius: 16, width: 420 }
const modalActions = { display: 'flex', justifyContent: 'flex-end', gap: 8 }
const save = { background: '#2563eb', color: '#fff' }
