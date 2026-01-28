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

/* ================= CONFIG ================= */

const WORKFLOW_CONFIG = {
  konsultan: {
    label: 'Konsultan',
    subs: {
      perencanaan: {
        label: 'Perencanaan',
        steps: [
          'Survei & Pengumpulan Data',
          'Penyusunan KAK',
          'DED / Gambar Teknis',
          'RAB & Spesifikasi Teknis'
        ]
      },
      pengawasan: {
        label: 'Pengawasan',
        steps: [
          'Persiapan Pengawasan',
          'Pengawasan Pelaksanaan',
          'Pelaporan & Evaluasi',
          'Pengendalian & Koordinasi',
          'Serah Terima & Akhir Kontrak'
        ]
      }
    }
  },
  konstruksi: {
    label: 'Konstruksi',
    steps: [
      'Persiapan Pekerjaan',
      'Pelaksanaan Pekerjaan',
      'Pengendalian Proyek',
      'Penyelesaian Pekerjaan',
      'Serah Terima Pekerjaan'
    ]
  },
  pengadaan: {
    label: 'Pengadaan',
    subs: {
      barang: {
        label: 'Barang',
        steps: [
          'Perencanaan Pengadaan',
          'Pemilihan Penyedia',
          'Kontrak',
          'Pelaksanaan Pengadaan',
          'Serah Terima Barang'
        ]
      },
      jasa: {
        label: 'Jasa',
        steps: [
          'Perencanaan Pengadaan',
          'Pemilihan Penyedia',
          'Kontrak',
          'Pelaksanaan Jasa',
          'Serah Terima Jasa'
        ]
      }
    }
  }
}

/* ================= HELPERS ================= */

const safeWorkflow = wf => (Array.isArray(wf) ? wf : [])

const calcProgress = wf => {
  const workflow = safeWorkflow(wf)
  if (workflow.length === 0) return 0
  return Math.round(
    workflow.reduce((a, b) => a + (Number(b.progress) || 0), 0) /
      workflow.length
  )
}

const normalizeProject = p => ({
  ...p,
  workflow: safeWorkflow(p.workflow),
  paymentStatus: p.paymentStatus || 'Belum Bayar'
})

const buildWorkflow = (division, subDivision) => {
  const cfg = WORKFLOW_CONFIG[division]
  if (!cfg) return []

  const steps = cfg.subs
    ? cfg.subs[subDivision]?.steps || []
    : cfg.steps

  return steps.map(s => ({ label: s, progress: 0 }))
}

const hitungTanggalSelesai = (mulai, durasi) => {
  if (!mulai || !durasi) return ''
  const d = new Date(mulai)
  d.setDate(d.getDate() + Number(durasi))
  return d.toISOString().slice(0, 10)
}

/* ===== STATUS WAKTU ===== */

const hitungStatusWaktu = p => {
  if (!p.tanggalSelesai || !p.durasiHari) {
    return { label: '-', info: '' }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const end = new Date(p.tanggalSelesai)
  end.setHours(0, 0, 0, 0)

  const sisaHari = Math.ceil(
    (end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  )

  if (calcProgress(p.workflow) >= 100) {
    return { label: '✅ Selesai', info: '' }
  }

  const batasKritis = Math.ceil(p.durasiHari * 0.2)

  if (sisaHari > batasKritis) {
    return { label: '🟢 Aman', info: `Sisa ${sisaHari} hari` }
  }

  if (sisaHari > 0) {
    return { label: '🟡 Kritis', info: `Sisa ${sisaHari} hari` }
  }

  return {
    label: '🔴 Terlambat',
    info: `Terlambat ${Math.abs(sisaHari)} hari`
  }
}

/* ===== LOCK TAHAPAN ===== */

const isStepLocked = (workflow, index) => {
  if (index === 0) return false
  return Number(workflow[index - 1]?.progress || 0) < 100
}

/* ================= COMPONENT ================= */

export default function Proyek({ role }) {
  const [projects, setProjects] = useState([])
  const [adding, setAdding] = useState(false)
  const [expanded, setExpanded] = useState(null)
  const [drafts, setDrafts] = useState({})

  /* === EDIT KONTRAK (FITUR BARU) === */
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

  /* ================= LOAD ================= */

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
    const rows = projects.map((p, i) => ({
      No: i + 1,
      Nama: p.name,
      Instansi: p.instansi,
      Lokasi: p.lokasi,
      SumberDana: p.sumberDana,
      NilaiAnggaran: p.nilaiAnggaran,
      TahunAnggaran: p.tahunAnggaran,
      Progress: `${calcProgress(p.workflow)}%`
    }))

    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Proyek')
    XLSX.writeFile(wb, 'daftar-proyek.xlsx')
  }

  const exportPDF = () => {
    const pdf = new jsPDF()
    pdf.text('Daftar Proyek', 14, 15)

    autoTable(pdf, {
      startY: 20,
      head: [['No', 'Nama', 'Instansi', 'Lokasi', 'Nilai', 'Progress']],
      body: projects.map((p, i) => [
        i + 1,
        p.name,
        p.instansi,
        p.lokasi,
        p.nilaiAnggaran,
        `${calcProgress(p.workflow)}%`
      ])
    })

    pdf.save('daftar-proyek.pdf')
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

  /* ================= EDIT TAHAPAN ================= */

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

  /* === SIMPAN KONTRAK === */

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
