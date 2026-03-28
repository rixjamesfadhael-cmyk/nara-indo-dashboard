import { useEffect, useState } from 'react'
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc,
  doc, serverTimestamp, query, orderBy
} from 'firebase/firestore'
import { db } from '../firebase'
import { exportExcel, exportPDF } from '../services/project.export'
import { WORKFLOW_CONFIG } from '../services/workflow.config'
import { filterProjects } from '../utils/project.filter'
import {
  calcProgress, normalizeProject, buildWorkflow,
  hitungTanggalSelesai, isStepLocked
} from '../utils/project.utils'
import { hitungStatusWaktu } from '../utils/timeStatus'
import ProjectForm from '../components/ProjectForm'
import ProjectCard from '../components/ProjectCard'
import EmptyState from '../components/EmptyState'
import { logActivity } from '../services/activityLogger'

export default function Proyek({ role, focusProjectId, clearFocus, autoAddProject, clearAutoAdd }) {
  const [projects, setProjects] = useState([])
  const [adding, setAdding] = useState(false)
  const [expanded, setExpanded] = useState(null)
  const [drafts, setDrafts] = useState({})
  const [filterText, setFilterText] = useState('')
  const [onlyAttention, setOnlyAttention] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [highlightId, setHighlightId] = useState(null)
  const itemsPerPage = 10
  const [editingKontrak, setEditingKontrak] = useState(null)
  const [kontrakDraft, setKontrakDraft] = useState({ tanggalMulai: '', durasiHari: '' })

  const [form, setForm] = useState({
    name: '', nomorKontrak: '', instansi: '', lokasi: '',
    sumberDana: '', nilaiAnggaran: 0, tahunAnggaran: '',
    pic: '', tanggalMulai: '', durasiHari: '',
    division: '', subDivision: '', paymentStatus: 'Belum Bayar'
  })

  // Auto open add form from dashboard
  useEffect(() => {
    if (autoAddProject) {
      setAdding(true)
      if (clearAutoAdd) clearAutoAdd()
    }
  }, [autoAddProject])

  useEffect(() => {
    const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'))
    return onSnapshot(q, snap => {
      setProjects(snap.docs.map(d => normalizeProject({ id: d.id, ...d.data() })))
    })
  }, [])

  // Focus dari dashboard — scroll + highlight, tanpa buka edit
  useEffect(() => {
    if (focusProjectId && projects.length > 0) {
      const project = projects.find(p => p.id === focusProjectId)
      if (project) {
        // Pastikan project ada di halaman yang benar
        const idx = visibleProjects.findIndex(p => p.id === focusProjectId)
        if (idx !== -1) {
          const targetPage = Math.ceil((idx + 1) / itemsPerPage)
          setCurrentPage(targetPage)
        }

        // Set highlight, lalu clear setelah 3 detik
        setHighlightId(focusProjectId)
        setTimeout(() => setHighlightId(null), 3000)
      }
    }
  }, [focusProjectId, projects])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const focusId = params.get('focus')
    if (focusId && projects.length > 0) setExpanded(focusId)
  }, [projects])

  const simpanProyek = async () => {
    if (!form.name || !form.division) { alert('Nama proyek & divisi wajib diisi'); return }
    const workflow = buildWorkflow(form.division, form.subDivision)
    const tanggalSelesai = hitungTanggalSelesai(form.tanggalMulai, form.durasiHari)
    const docRef = await addDoc(collection(db, 'projects'), {
      ...form, pic: form.pic || '',
      nilaiAnggaran: Number(form.nilaiAnggaran),
      durasiHari: Number(form.durasiHari),
      tanggalSelesai, workflow,
      progress: calcProgress(workflow),
      createdAt: serverTimestamp()
    })
    await logActivity({ action: 'CREATE', projectId: docRef.id, projectName: form.name, description: 'Membuat proyek baru' })
    setForm({ name: '', nomorKontrak: '', instansi: '', lokasi: '', sumberDana: '', nilaiAnggaran: '', tahunAnggaran: '', tanggalMulai: '', durasiHari: '', division: '', subDivision: '', paymentStatus: 'Belum Bayar' })
    setAdding(false)
  }

  const bukaTahapan = p => {
    setExpanded(p.id)
    setDrafts({ ...drafts, [p.id]: JSON.parse(JSON.stringify(p.workflow)) })
  }

  const updateDraft = (pid, idx, value) => {
    const wf = [...drafts[pid]]
    wf[idx] = { ...wf[idx], progress: Number(value) }
    setDrafts({ ...drafts, [pid]: wf })
  }

  const simpanTahapan = async p => {
    const wf = drafts[p.id]
    await updateDoc(doc(db, 'projects', p.id), { workflow: wf, progress: calcProgress(wf) })
    await logActivity({ action: 'UPDATE', projectId: p.id, projectName: p.name, description: 'Memperbarui progress tahapan proyek' })
    setExpanded(null)
  }

  const simpanKontrak = async p => {
    const tanggalSelesai = hitungTanggalSelesai(kontrakDraft.tanggalMulai, kontrakDraft.durasiHari)
    await updateDoc(doc(db, 'projects', p.id), {
      name: kontrakDraft.name, nomorKontrak: kontrakDraft.nomorKontrak,
      instansi: kontrakDraft.instansi, lokasi: kontrakDraft.lokasi,
      sumberDana: kontrakDraft.sumberDana, nilaiAnggaran: Number(kontrakDraft.nilaiAnggaran),
      tahunAnggaran: kontrakDraft.tahunAnggaran, paymentStatus: kontrakDraft.paymentStatus,
      pic: kontrakDraft.pic || '', tanggalMulai: kontrakDraft.tanggalMulai,
      durasiHari: Number(kontrakDraft.durasiHari), tanggalSelesai
    })
    await logActivity({ action: 'UPDATE', projectId: p.id, projectName: kontrakDraft.name, description: 'Memperbarui data kontrak proyek' })
    setEditingKontrak(null)
  }

  const filteredProjects = filterProjects(projects, filterText, hitungStatusWaktu)
  const visibleProjects = filteredProjects
    .filter(p => p.archived !== true)
    .filter(p => {
      if (!onlyAttention) return true
      const status = hitungStatusWaktu(p)
      const progress = Number(p.progress) || 0
      return progress < 50 || status?.level === 'warning' || status?.level === 'danger'
    })

  const totalPages = Math.ceil(visibleProjects.length / itemsPerPage)
  const paginatedProjects = visibleProjects.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  useEffect(() => { setCurrentPage(1) }, [filterText, onlyAttention])

  const btnBase = {
    padding: '4px 10px', borderRadius: 6,
    border: '1px solid var(--border)',
    background: 'var(--bg-card-soft)',
    color: 'var(--text)', fontSize: 12,
    cursor: 'pointer', fontFamily: 'inherit'
  }

  return (
    <div>
      <h2 style={{ color: 'var(--text)' }}>Manajemen Proyek</h2>

      <div style={{ marginBottom: 12, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        <input
          placeholder="Cari proyek..."
          value={filterText}
          onChange={e => setFilterText(e.target.value)}
          style={{ padding: 6, minWidth: 220 }}
        />
        <button
          onClick={() => setOnlyAttention(v => !v)}
          style={{
            padding: '3px 10px', fontWeight: 700, borderRadius: 5,
            border: '1px solid #f59e0b',
            background: onlyAttention ? '#ff7c7c' : 'var(--bg-card-soft)',
            color: '#92400e', cursor: 'pointer'
          }}
        >Perlu Perhatian</button>
        <button style={btnBase} onClick={() => exportExcel(visibleProjects, filterText ? `Laporan Proyek Aktif – Filter: ${filterText}` : 'Laporan Proyek Aktif')}>Export Excel</button>
        <button style={btnBase} onClick={() => exportPDF(visibleProjects, filterText ? `Laporan Proyek Aktif – Filter: ${filterText}` : 'Laporan Proyek Aktif')}>Export PDF</button>
      </div>

      {role === 'admin' && (
        <button style={btnBase} onClick={() => setAdding(a => !a)}>
          {adding ? 'Batal Tambah Proyek' : '+ Tambah Proyek'}
        </button>
      )}

      {adding && (
        <ProjectForm
          adding={adding} form={form} setForm={setForm}
          simpanProyek={simpanProyek} WORKFLOW_CONFIG={WORKFLOW_CONFIG}
          hitungTanggalSelesai={hitungTanggalSelesai}
          onCancel={() => setAdding(false)}
        />
      )}

      <div className="project-grid" style={{ marginTop: 24, display: 'grid', gap: 20, alignItems: 'start' }}>
        {projects.length === 0 && (
          <EmptyState title="Belum ada proyek" description="Klik tombol '+ Tambah Proyek' untuk membuat proyek pertama Anda."
            actionLabel={role === 'admin' ? '+ Tambah Proyek' : undefined}
            onAction={role === 'admin' ? () => setAdding(true) : undefined} />
        )}
        {projects.length > 0 && visibleProjects.length === 0 && (
          <EmptyState title="Tidak ada proyek ditemukan" description="Coba ubah kata kunci pencarian atau nonaktifkan filter."
            actionLabel="Reset Filter" onAction={() => { setFilterText(''); setOnlyAttention(false) }} />
        )}
        {paginatedProjects.map(p => (
          <ProjectCard
            key={p.id} p={p} role={role}
            expanded={expanded} drafts={drafts}
            setExpanded={setExpanded} setDrafts={setDrafts}
            editingKontrak={editingKontrak} setEditingKontrak={setEditingKontrak}
            kontrakDraft={kontrakDraft} setKontrakDraft={setKontrakDraft}
            bukaTahapan={bukaTahapan} updateDraft={updateDraft}
            simpanTahapan={simpanTahapan} simpanKontrak={simpanKontrak}
            hitungStatusWaktu={hitungStatusWaktu} calcProgress={calcProgress}
            isStepLocked={isStepLocked} deleteDoc={deleteDoc} doc={doc} db={db}
            highlightId={highlightId}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12 }}>
          <button style={{ ...btnBase, opacity: currentPage === 1 ? 0.5 : 1 }}
            disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>Prev</button>
          <span style={{ fontSize: 14, color: 'var(--text)' }}>Halaman {currentPage} dari {totalPages}</span>
          <button style={{ ...btnBase, opacity: currentPage === totalPages ? 0.5 : 1 }}
            disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>Next</button>
        </div>
      )}
    </div>
  )
}