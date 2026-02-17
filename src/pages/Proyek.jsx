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
import { exportExcel, exportPDF } from '../services/project.export'
import { WORKFLOW_CONFIG } from '../services/workflow.config'
import { filterProjects } from '../utils/project.filter'
import {
  safeWorkflow,
  calcProgress,
  normalizeProject,
  buildWorkflow,
  hitungTanggalSelesai,
  isStepLocked
} from '../utils/project.utils'
import {
  hitungStatusWaktu,
  statusWaktuText
} from '../utils/timeStatus'
import ProjectForm from '../components/ProjectForm'
import ProjectCard from '../components/ProjectCard'
import EmptyState from '../components/EmptyState'

/* ================= COMPONENT ================= */

export default function Proyek({ role, focusProjectId, clearFocus }) {
  const [projects, setProjects] = useState([])
  const [adding, setAdding] = useState(false)
  const [expanded, setExpanded] = useState(null)
  const [drafts, setDrafts] = useState({})
  const activeProjects = projects.filter(
  p => p.archived !== true
)
  const [filterText, setFilterText] = useState('')
  const [onlyAttention, setOnlyAttention] = useState(false)
  const [editingKontrak, setEditingKontrak] = useState(null)
  const [kontrakDraft, setKontrakDraft] = useState({
    tanggalMulai: '',
    durasiHari: ''
  })

  const [form, setForm] = useState({
    name: '',
    nomorKontrak: '',
    instansi: '',
    lokasi: '',
    sumberDana: '',
    nilaiAnggaran: 0,
    tahunAnggaran: '',
    pic: '',
    tanggalMulai: '',
    durasiHari: '',
    division: '',
    subDivision: '',
    paymentStatus: 'Belum Bayar'
  })

  useEffect(() => {
    return onSnapshot(collection(db, 'projects'), snap => {
      setProjects(
        snap.docs.map(d =>
          normalizeProject({ id: d.id, ...d.data() })
        )
      )
    })
  }, [])

  useEffect(() => {
  if (focusProjectId && projects.length > 0) {
    const project = projects.find(p => p.id === focusProjectId)

    if (project) {
      // 🔥 reset dulu
      setExpanded(null)

      // 🔥 baru set lagi (paksa React render ulang)
      setTimeout(() => {
        setExpanded(project.id)
        setDrafts(d => ({
          ...d,
          [project.id]: JSON.parse(JSON.stringify(project.workflow))
        }))
      }, 0)
    }
  }
}, [focusProjectId, projects])

  useEffect(() => {
  const params = new URLSearchParams(window.location.search)
  const focusId = params.get('focus')

  if (focusId && projects.length > 0) {
    setExpanded(focusId)
  }
}, [projects])

  /* ================= CREATE ================= */

  const simpanProyek = async () => {
    if (!form.name || !form.division) {
      alert('Nama proyek & divisi wajib diisi')
      return
    }

    const workflow = buildWorkflow(form.division, form.subDivision)
    const tanggalSelesai = hitungTanggalSelesai(
      form.tanggalMulai,
      form.durasiHari
    )

    await addDoc(collection(db, 'projects'), {
      ...form,
      pic: form.pic || '',
      nilaiAnggaran: Number(form.nilaiAnggaran),
      durasiHari: Number(form.durasiHari),
      tanggalSelesai,
      workflow,
      progress: calcProgress(workflow),
      createdAt: serverTimestamp()
    })

    setForm({
      name: '',
      nomorKontrak: '',
      instansi: '',
      lokasi: '',
      sumberDana: '',
      nilaiAnggaran: '',
      tahunAnggaran: '',
      tanggalMulai: '',
      durasiHari: '',
      division: '',
      subDivision: '',
      paymentStatus: 'Belum Bayar'
    })
    setAdding(false)
  }

  /* ================= EDIT TAHAPAN & KONTRAK ================= */

  const bukaTahapan = p => {
    setExpanded(p.id)
    setDrafts({
      ...drafts,
      [p.id]: JSON.parse(JSON.stringify(p.workflow))
    })
  }

  const updateDraft = (pid, idx, value) => {
    const wf = [...drafts[pid]]
    wf[idx] = { ...wf[idx], progress: Number(value) }
    setDrafts({ ...drafts, [pid]: wf })
  }

  const simpanTahapan = async p => {
    const wf = drafts[p.id]
    await updateDoc(doc(db, 'projects', p.id), {
      workflow: wf,
      progress: calcProgress(wf)
    })
    setExpanded(null)
  }

const simpanKontrak = async p => {
  const tanggalSelesai = hitungTanggalSelesai(
    kontrakDraft.tanggalMulai,
    kontrakDraft.durasiHari
  )

  await updateDoc(doc(db, 'projects', p.id), {
    name: kontrakDraft.name,
    nomorKontrak: kontrakDraft.nomorKontrak,
    instansi: kontrakDraft.instansi,
    lokasi: kontrakDraft.lokasi,
    sumberDana: kontrakDraft.sumberDana,
    nilaiAnggaran: Number(kontrakDraft.nilaiAnggaran),
    tahunAnggaran: kontrakDraft.tahunAnggaran,
    paymentStatus: kontrakDraft.paymentStatus,
    pic: kontrakDraft.pic || '',
    tanggalMulai: kontrakDraft.tanggalMulai,
    durasiHari: Number(kontrakDraft.durasiHari),
    tanggalSelesai
  })

  setEditingKontrak(null)
}
  const filteredProjects = filterProjects(
    projects,
    filterText,
    hitungStatusWaktu
  )
 const visibleProjects = filteredProjects
  .filter(p => p.archived !== true)
  .filter(p => {
    if (!onlyAttention) return true

    const status = hitungStatusWaktu(p)
    const progress = Number(p.progress) || 0

    return (
      progress < 50 ||
      status?.level === 'warning' ||
      status?.level === 'danger'
    )
  })

    /* ================= RENDER ================= */

  return (
    <div>
      <h2>Manajemen Proyek</h2>

            <div style={{ marginBottom: 12 }}>
        <input
          placeholder="Cari proyek..."
          value={filterText}
          onChange={e => setFilterText(e.target.value)}
          style={{
            padding: 6,
            marginRight: 8,
            minWidth: 220
          }}
        />

        <button
  onClick={() => setOnlyAttention(v => !v)}
  style={{
    marginLeft: 7,
    marginRight:7,
    padding: '3px 10px',
    fontWeight: 700,
    borderRadius: 5,
    border: '1px solid #f59e0b',
    background: onlyAttention ? '#ff7c7c' : '#fff',
    color: '#92400e',
    cursor: 'pointer'
  }}
>
  Perlu Perhatian
</button>

        <button
  onClick={() => {
    const title = filterText
      ? `Laporan Proyek Aktif – Filter: ${filterText}`
      : 'Laporan Proyek Aktif'

    exportExcel(visibleProjects, title)
  }}
>
  Export Excel
</button>

<button
  onClick={() => {
    const title = filterText
      ? `Laporan Proyek Aktif – Filter: ${filterText}`
      : 'Laporan Proyek Aktif'

    exportPDF(visibleProjects, title)
  }}
  style={{ marginLeft: 8 }}
>
  Export PDF
</button>
      </div>

      {role === 'admin' && (
        <button onClick={() => setAdding(a => !a)}>
          {adding ? 'Batal Tambah Proyek' : '+ Tambah Proyek'}
        </button>
      )}

      {adding && (
        <ProjectForm
          adding={adding}
          form={form}
          setForm={setForm}
          simpanProyek={simpanProyek}
          WORKFLOW_CONFIG={WORKFLOW_CONFIG}
          hitungTanggalSelesai={hitungTanggalSelesai}
        />
      )}

      <div style={{ marginTop: 24 }}>
  {projects.length === 0 && (
    <EmptyState
      title="Belum ada proyek"
      description="Klik tombol '+ Tambah Proyek' untuk membuat proyek pertama Anda."
      actionLabel={role === 'admin' ? '+ Tambah Proyek' : undefined}
      onAction={role === 'admin' ? () => setAdding(true) : undefined}
    />
  )}

  {projects.length > 0 && visibleProjects.length === 0 && (
    <EmptyState
      title="Tidak ada proyek ditemukan"
      description="Coba ubah kata kunci pencarian atau nonaktifkan filter."
      actionLabel="Reset Filter"
      onAction={() => {
        setFilterText('')
        setOnlyAttention(false)
      }}
    />
  )}

  {visibleProjects.map(p => (
    <ProjectCard
      key={p.id}
      p={p}
      role={role}
      expanded={expanded}
      drafts={drafts}
      setExpanded={setExpanded}
      setDrafts={setDrafts}
      editingKontrak={editingKontrak}
      setEditingKontrak={setEditingKontrak}
      kontrakDraft={kontrakDraft}
      setKontrakDraft={setKontrakDraft}
      bukaTahapan={bukaTahapan}
      updateDraft={updateDraft}
      simpanTahapan={simpanTahapan}
      simpanKontrak={simpanKontrak}
      hitungStatusWaktu={hitungStatusWaktu}
      calcProgress={calcProgress}
      isStepLocked={isStepLocked}
      deleteDoc={deleteDoc}
      doc={doc}
      db={db}
    />
  ))}
</div>
    </div>
  )
}
