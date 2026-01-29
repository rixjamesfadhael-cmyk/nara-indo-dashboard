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

import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
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

  /* ================= EXPORT ================= */

  const exportExcel = () => {
    const rows = projects.map((p, i) => {
      const workflowText = safeWorkflow(p.workflow)
        .map(s => `${s.label}: ${s.progress}%`)
        .join(' | ')

      return {
        No: i + 1,
        NamaProyek: p.name,
        Instansi: p.instansi,
        Lokasi: p.lokasi,
        SumberDana: p.sumberDana,
        NilaiAnggaran: p.nilaiAnggaran,
        TahunAnggaran: p.tahunAnggaran,
        Divisi: p.division,
        SubDivisi: p.subDivision || '-',
        TanggalMulai: p.tanggalMulai,
        DurasiHari: p.durasiHari,
        TanggalSelesai: p.tanggalSelesai,
        StatusWaktu: hitungStatusWaktu(p).label,
        ProgressTotal: `${calcProgress(p.workflow)}%`,
        DetailTahapan: workflowText
      }
    })

    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Proyek')
    XLSX.writeFile(wb, 'daftar-proyek-lengkap.xlsx')
  }

  const exportPDF = () => {
    const pdf = new jsPDF()

    projects.forEach((p, idx) => {
      if (idx > 0) pdf.addPage()

      autoTable(pdf, {
        startY: 14,
        theme: 'grid',
        head: [['Informasi', 'Detail']],
        body: [
          ['Nama Proyek', p.name],
          ['Instansi', p.instansi],
          ['Lokasi', p.lokasi],
          ['Sumber Dana', p.sumberDana],
          ['Nilai Anggaran', p.nilaiAnggaran],
          ['Tahun Anggaran', p.tahunAnggaran],
          ['Divisi', p.division],
          ['Sub Divisi', p.subDivision || '-'],
          ['Tanggal Mulai', p.tanggalMulai],
          ['Durasi (Hari)', p.durasiHari],
          ['Tanggal Selesai', p.tanggalSelesai],
          ['Status Waktu', statusWaktuText(p)],
          ['Progress Total', `${calcProgress(p.workflow)}%`]
        ]
      })

      autoTable(pdf, {
        startY: pdf.lastAutoTable.finalY + 10,
        theme: 'grid',
        head: [['Tahapan', 'Progress']],
        body: safeWorkflow(p.workflow).map(s => [
          s.label,
          `${s.progress}%`
        ])
      })
    })

    pdf.save('daftar-proyek-lengkap.pdf')
  }

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
        <button onClick={exportExcel}>Export Excel</button>
        <button onClick={exportPDF} style={{ marginLeft: 8 }}>
          Export PDF
        </button>
      </div>

      {role === 'admin' && (
        <button onClick={() => setAdding(a => !a)}>
          {adding ? 'Batal Tambah Proyek' : '+ Tambah Proyek'}
        </button>
      )}

      {adding && (
        <div style={{ marginTop: 16, background: '#fff', padding: 16 }}>
          <h3>Tambah Proyek</h3>

          <input placeholder="Nama Proyek" value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })} />

          <input placeholder="Instansi" value={form.instansi}
            onChange={e => setForm({ ...form, instansi: e.target.value })} />

          <input placeholder="Lokasi" value={form.lokasi}
            onChange={e => setForm({ ...form, lokasi: e.target.value })} />

          <input placeholder="Sumber Dana" value={form.sumberDana}
            onChange={e => setForm({ ...form, sumberDana: e.target.value })} />

          <input type="number" placeholder="Nilai Anggaran" value={form.nilaiAnggaran}
            onChange={e => setForm({ ...form, nilaiAnggaran: e.target.value })} />

          <input type="number" placeholder="Tahun Anggaran" value={form.tahunAnggaran}
            onChange={e => setForm({ ...form, tahunAnggaran: e.target.value })} />

          <input type="date" value={form.tanggalMulai}
            onChange={e => setForm({ ...form, tanggalMulai: e.target.value })} />

          <input type="number" placeholder="Durasi (hari)" value={form.durasiHari}
            onChange={e => setForm({ ...form, durasiHari: e.target.value })} />

          {form.tanggalMulai && form.durasiHari && (
            <div>
              Tanggal Selesai:{' '}
              <strong>
                {hitungTanggalSelesai(form.tanggalMulai, form.durasiHari)}
              </strong>
            </div>
          )}

          <select value={form.division}
            onChange={e =>
              setForm({ ...form, division: e.target.value, subDivision: '' })
            }
          >
            <option value="">-- Pilih Divisi --</option>
            {Object.entries(WORKFLOW_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>

          {form.division && WORKFLOW_CONFIG[form.division].subs && (
            <select value={form.subDivision}
              onChange={e =>
                setForm({ ...form, subDivision: e.target.value })
              }
            >
              <option value="">-- Pilih Sub --</option>
              {Object.entries(WORKFLOW_CONFIG[form.division].subs).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          )}

          <button onClick={simpanProyek}>Simpan</button>
        </div>
      )}

      <div style={{ marginTop: 24 }}>
        {projects.map(p => {
          const editing = expanded === p.id
          const workflow = editing ? drafts[p.id] : p.workflow
          const status = hitungStatusWaktu(p)

          return (
            <div key={p.id} style={{ background: '#fff', padding: 16, marginBottom: 16 }}>
              <strong>{p.name}</strong>
              <div>{p.instansi} — {p.lokasi}</div>
              <div>Kontrak: {p.tanggalMulai} → {p.tanggalSelesai}</div>
              <div>Status Waktu: <strong>{status.label}</strong></div>
              {status.info && <div>{status.info}</div>}
              <div>Progress: {calcProgress(workflow)}%</div>

              {role === 'admin' && (
                <>
                  <button onClick={() => editing ? setExpanded(null) : bukaTahapan(p)}>
                    {editing ? 'Tutup Tahapan' : 'Update Tahapan'}
                  </button>

                  <button
                    style={{ marginLeft: 8 }}
                    onClick={() => {
                      setEditingKontrak(p.id)
                      setKontrakDraft({
                        tanggalMulai: p.tanggalMulai,
                        durasiHari: p.durasiHari
                      })
                    }}
                  >
                    Edit Kontrak
                  </button>

                  <button
                    style={{ marginLeft: 8 }}
                    onClick={() =>
                      confirm('Hapus proyek ini?') &&
                      deleteDoc(doc(db, 'projects', p.id))
                    }
                  >
                    Hapus
                  </button>
                </>
              )}

              {editingKontrak === p.id && (
                <div style={{ marginTop: 12 }}>
                  <input
                    type="date"
                    value={kontrakDraft.tanggalMulai}
                    onChange={e =>
                      setKontrakDraft({
                        ...kontrakDraft,
                        tanggalMulai: e.target.value
                      })
                    }
                  />
                  <input
                    type="number"
                    value={kontrakDraft.durasiHari}
                    onChange={e =>
                      setKontrakDraft({
                        ...kontrakDraft,
                        durasiHari: e.target.value
                      })
                    }
                  />
                  <button onClick={() => simpanKontrak(p)}>
                    Simpan Kontrak
                  </button>
                </div>
              )}

              {editing &&
                workflow.map((s, i) => (
                  <div key={i}>
                    <small>{s.label}</small>
                    <input
                      type="number"
                      value={s.progress}
                      disabled={isStepLocked(workflow, i)}
                      onChange={e =>
                        updateDraft(p.id, i, e.target.value)
                      }
                    />
                  </div>
                ))}

              {editing && (
                <button onClick={() => simpanTahapan(p)}>
                  Simpan Progress
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
