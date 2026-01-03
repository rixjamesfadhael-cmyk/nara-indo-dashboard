import { useEffect, useState } from 'react'
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from '../firebase'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function Proyek() {
  const [projects, setProjects] = useState([])
  const [editing, setEditing] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('SEMUA')

  useEffect(() => {
    const ref = collection(db, 'projects')
    const unsub = onSnapshot(ref, snap => {
      setProjects(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [])

  /* ================= CRUD ================= */

  const simpan = async () => {
    await updateDoc(doc(db, 'projects', editing.id), {
      name: editing.name,
      client: editing.client,
      status: editing.status,
      progress: Number(editing.progress)
    })
    setEditing(null)
  }

  const hapus = async (id) => {
    if (!confirm('Hapus proyek?')) return
    await deleteDoc(doc(db, 'projects', id))
  }

  /* ================= FILTER ================= */

  const filtered = projects.filter(p => {
    const textMatch =
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.client?.toLowerCase().includes(search.toLowerCase())

    const statusMatch =
      statusFilter === 'SEMUA' || p.status === statusFilter

    return textMatch && statusMatch
  })

  /* ================= EXPORT EXCEL ================= */

  const exportExcel = () => {
    const data = filtered.map(p => ({
      'Nama Proyek': p.name,
      'Klien': p.client,
      'Status': p.status,
      'Progress (%)': p.progress || 0
    }))

    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Proyek')

    XLSX.writeFile(workbook, 'data-proyek.xlsx')
  }

  /* ================= EXPORT PDF ================= */

  const exportPDF = () => {
    const doc = new jsPDF()

    doc.setFontSize(14)
    doc.text('Laporan Proyek', 14, 15)

    doc.setFontSize(10)
    doc.text(
      `Filter: ${statusFilter} | Pencarian: ${search || '-'}`,
      14,
      22
    )

    autoTable(doc, {
      startY: 28,
      head: [['Nama Proyek', 'Klien', 'Status', 'Progress (%)']],
      body: filtered.map(p => [
        p.name,
        p.client,
        p.status,
        `${p.progress || 0}%`
      ])
    })

    doc.save('laporan-proyek.pdf')
  }

  return (
    <div>
      {/* TOOLBAR */}
      <div style={toolbar}>
        <input
          placeholder="Cari proyek / klien..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={input}
        />

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={input}
        >
          <option value="SEMUA">Semua Status</option>
          <option value="Aktif">Aktif</option>
          <option value="Selesai">Selesai</option>
        </select>

        <button onClick={exportExcel} style={excelBtn}>
          Export Excel
        </button>

        <button onClick={exportPDF} style={pdfBtn}>
          Export PDF
        </button>
      </div>

      {/* LIST */}
      <div style={grid}>
        {filtered.map(p => (
          <div key={p.id} style={card}>
            <div style={row}>
              <strong>{p.name}</strong>
              <div>
                <button onClick={() => setEditing(p)}>Edit</button>{' '}
                <button style={{ color: 'red' }} onClick={() => hapus(p.id)}>
                  Hapus
                </button>
              </div>
            </div>

            <p>Klien: {p.client}</p>
            <p>Status: {p.status}</p>

            <div style={progressBar}>
              <div style={{ ...progressFill, width: `${p.progress || 0}%` }} />
            </div>
            <small>{p.progress || 0}%</small>
          </div>
        ))}
      </div>

      {/* MODAL EDIT */}
      {editing && (
        <div style={overlay}>
          <div style={modal}>
            <h3>Edit Proyek</h3>

            <input
              value={editing.name}
              onChange={e => setEditing({ ...editing, name: e.target.value })}
            />
            <input
              value={editing.client}
              onChange={e => setEditing({ ...editing, client: e.target.value })}
            />
            <select
              value={editing.status}
              onChange={e => setEditing({ ...editing, status: e.target.value })}
            >
              <option value="Aktif">Aktif</option>
              <option value="Selesai">Selesai</option>
            </select>
            <input
              type="number"
              min="0"
              max="100"
              value={editing.progress || 0}
              onChange={e => setEditing({ ...editing, progress: e.target.value })}
            />

            <div>
              <button onClick={simpan}>Simpan</button>{' '}
              <button onClick={() => setEditing(null)}>Batal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ================= STYLE ================= */

const toolbar = {
  display: 'flex',
  gap: 12,
  marginBottom: 16,
  flexWrap: 'wrap'
}

const input = {
  padding: 8,
  borderRadius: 6,
  border: '1px solid #e5e7eb',
  fontSize: 14
}

const excelBtn = {
  padding: '8px 12px',
  background: '#16a34a',
  color: '#fff',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer'
}

const pdfBtn = {
  padding: '8px 12px',
  background: '#dc2626',
  color: '#fff',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer'
}

const grid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
  gap: 16
}

const card = {
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: 10,
  padding: 16
}

const row = {
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: 8
}

const progressBar = {
  height: 8,
  background: '#e5e7eb',
  borderRadius: 6,
  overflow: 'hidden'
}

const progressFill = {
  height: '100%',
  background: '#2563eb'
}

const overlay = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.3)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center'
}

const modal = {
  background: '#fff',
  padding: 20,
  borderRadius: 10,
  width: 300,
  display: 'grid',
  gap: 8
}
