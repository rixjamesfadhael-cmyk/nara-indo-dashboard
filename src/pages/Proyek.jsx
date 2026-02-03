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

/* ================= COMPONENT ================= */

export default function Proyek({ role }) {
  const [projects, setProjects] = useState([])
  const [adding, setAdding] = useState(false)
  const [expanded, setExpanded] = useState(null)
  const [drafts, setDrafts] = useState({})

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
    nilaiAnggaran: '',
    tahunAnggaran: '',
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
    tanggalMulai: kontrakDraft.tanggalMulai,
    durasiHari: Number(kontrakDraft.durasiHari),
    tanggalSelesai
  })

  setEditingKontrak(null)
}

    /* ================= RENDER ================= */

  return (
    <div>
      <h2>Manajemen Proyek</h2>

      <div style={{ marginBottom: 12 }}>
        <button onClick={() => exportExcel(projects)}>
          Export Excel
        </button>

        <button
          onClick={() => exportPDF(projects)}
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
        {projects.map(p => (
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
