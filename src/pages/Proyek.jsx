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

export default function Proyek({ role }) {
  const [projects, setProjects] = useState([])
  const [editing, setEditing] = useState(null)
  const [adding, setAdding] = useState(false)

  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('SEMUA')

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

  const logActivity = async (action, projectName, description) => {
    await addDoc(collection(db, 'activity_logs'), {
      action,
      projectName,
      description,
      createdAt: serverTimestamp()
    })
  }

  const filteredProjects = projects.filter(p => {
    const matchName = p.name
      ?.toLowerCase()
      .includes(search.toLowerCase())

    const matchStatus =
      filterStatus === 'SEMUA'
        ? true
        : p.status === filterStatus

    return matchName && matchStatus
  })

  const hapus = async id => {
    const p = projects.find(x => x.id === id)
    if (!confirm('Hapus proyek ini?')) return

    await deleteDoc(doc(db, 'projects', id))
    await logActivity('DELETE', p?.name || '-', 'Proyek dihapus')
  }

  const simpanEdit = async () => {
    const { id, name, budget, progress, status } = editing
    const progressValue = Number(progress)

    await updateDoc(doc(db, 'projects', id), {
      name,
      budget: Number(budget),
      progress: progressValue,
      status
    })

    if (progressValue === 100) {
      const reason = prompt('Alasan memindahkan proyek ke arsip?')
      if (reason) {
        await addDoc(collection(db, 'arsip_proyek'), {
          name,
          budget: Number(budget),
          progress: 100,
          status: 'Selesai'
        })

        await deleteDoc(doc(db, 'projects', id))

        await logActivity(
          'ARCHIVE',
          name,
          `Dipindahkan ke arsip. Alasan: ${reason}`
        )
      }
    } else {
      await logActivity('UPDATE', name, 'Proyek diperbarui')
    }

    setEditing(null)
  }

  const simpanTambah = async () => {
    if (!form.name) return alert('Nama proyek wajib diisi')

    await addDoc(collection(db, 'projects'), {
      name: form.name,
      budget: Number(form.budget),
      progress: Number(form.progress),
      status: form.status
    })

    await logActivity(
      'CREATE',
      form.name,
      'Proyek ditambahkan'
    )

    setForm({
      name: '',
      budget: '',
      progress: 0,
      status: 'Aktif'
    })
    setAdding(false)
  }

  const exportRows = filteredProjects.map((p, i) => ({
    No: i + 1,
    Nama: p.name,
    Nilai: p.budget,
    Progress: `${p.progress || 0}%`,
    Status: p.status || 'Aktif'
  }))

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(exportRows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Proyek')
    XLSX.writeFile(wb, 'daftar-proyek.xlsx')
  }

  const exportPDF = () => {
    const pdf = new jsPDF()
    pdf.setFontSize(14)
    pdf.text('Daftar Proyek', 14, 15)

    autoTable(pdf, {
      startY: 22,
      head: [['No', 'Nama Proyek', 'Nilai Kontrak', 'Progress', 'Status']],
      body: exportRows.map(r => [
        r.No,
        r.Nama,
        rupiah(r.Nilai),
        r.Progress,
        r.Status
      ])
    })

    pdf.save('daftar-proyek.pdf')
  }

  return (
    <>
      <div style={header}>
        <h2>Daftar Proyek</h2>

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
            <option value="Aktif">Aktif</option>
            <option value="Selesai">Selesai</option>
          </select>

          <button style={exportBtn} onClick={exportExcel}>Excel</button>
          <button style={exportPdfBtn} onClick={exportPDF}>PDF</button>

          {role === 'admin' && (
            <button style={addBtn} onClick={() => setAdding(true)}>
              + Tambah
            </button>
          )}
        </div>
      </div>

      <div style={wrap}>
        {filteredProjects.map(p => (
          <div key={p.id} style={card}>
            <div style={head}>
              <h3 style={title}>{p.name}</h3>
              <span style={badge(p.status)}>{p.status}</span>
            </div>

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
                style={{
                  ...progressBar,
                  width: `${p.progress || 0}%`
                }}
              />
            </div>

            {role === 'admin' && (
              <div style={actions}>
                <button style={edit} onClick={() => setEditing(p)}>
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

      {editing && (
        <div style={overlay}>
          <div style={modal}>
            <h3>Edit Proyek</h3>

            <input
              value={editing.name}
              onChange={e =>
                setEditing({ ...editing, name: e.target.value })
              }
            />
            <input
              type="number"
              value={editing.budget}
              onChange={e =>
                setEditing({ ...editing, budget: e.target.value })
              }
            />
            <input
              type="number"
              value={editing.progress}
              onChange={e =>
                setEditing({
                  ...editing,
                  progress: Number(e.target.value)
                })
              }
            />
            <select
              value={editing.status}
              onChange={e =>
                setEditing({ ...editing, status: e.target.value })
              }
            >
              <option>Aktif</option>
              <option>Selesai</option>
            </select>

            <div style={modalActions}>
              <button onClick={() => setEditing(null)}>Batal</button>
              <button style={save} onClick={simpanEdit}>
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {adding && (
        <div style={overlay}>
          <div style={modal}>
            <h3>Tambah Proyek</h3>

            <input
              value={form.name}
              onChange={e =>
                setForm({ ...form, name: e.target.value })
              }
            />
            <input
              type="number"
              value={form.budget}
              onChange={e =>
                setForm({ ...form, budget: e.target.value })
              }
            />
            <input
              type="number"
              value={form.progress}
              onChange={e =>
                setForm({ ...form, progress: e.target.value })
              }
            />
            <select
              value={form.status}
              onChange={e =>
                setForm({ ...form, status: e.target.value })
              }
            >
              <option>Aktif</option>
              <option>Selesai</option>
            </select>

            <div style={modalActions}>
              <button onClick={() => setAdding(false)}>Batal</button>
              <button style={save} onClick={simpanTambah}>
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

/* STYLE — TIDAK DIUBAH */

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
  borderRadius: 8,
  cursor: 'pointer',
  fontWeight: 700
}

const exportPdfBtn = {
  background: '#dc2626',
  color: '#fff',
  border: 'none',
  padding: '8px 14px',
  borderRadius: 8,
  cursor: 'pointer',
  fontWeight: 700
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
