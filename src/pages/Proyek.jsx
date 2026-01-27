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
          'Laporan Mingguan',
          'Laporan Bulanan',
          'Laporan Akhir'
        ]
      }
    }
  },
  konstruksi: {
    label: 'Konstruksi',
    steps: [
      'Persiapan',
      'Pelaksanaan',
      'Pemeliharaan',
      'Serah Terima'
    ]
  },
  pengadaan: {
    label: 'Pengadaan',
    subs: {
      barang: {
        label: 'Barang',
        steps: [
          'Perencanaan',
          'Pemilihan Penyedia',
          'Kontrak',
          'Serah Terima'
        ]
      },
      jasa: {
        label: 'Jasa',
        steps: [
          'Perencanaan',
          'Pemilihan Penyedia',
          'Pelaksanaan',
          'Serah Terima'
        ]
      }
    }
  }
}

const PAYMENT_STATUS = [
  'Belum Bayar',
  'DP',
  'Termin 1',
  'Termin 2',
  'Termin 3',
  'Pelunasan'
]

/* ================= SAFE HELPERS ================= */

// ⛔ AMAN walau workflow undefined / salah format
const safeWorkflow = wf =>
  Array.isArray(wf) ? wf : []

const calcProgress = wf => {
  const workflow = safeWorkflow(wf)
  if (workflow.length === 0) return 0
  return Math.round(
    workflow.reduce((a, b) => a + (Number(b.progress) || 0), 0) /
      workflow.length
  )
}

// ⛔ NORMALISASI DATA LAMA
const normalizeProject = p => ({
  ...p,
  workflow: safeWorkflow(p.workflow),
  paymentStatus: p.paymentStatus || 'Belum Bayar'
})

/* ================= COMPONENT ================= */

export default function Proyek({ role }) {
  const [projects, setProjects] = useState([])
  const [adding, setAdding] = useState(false)
  const [expanded, setExpanded] = useState(null)
  const [drafts, setDrafts] = useState({})

  const [form, setForm] = useState({
    name: '',
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

  /* ================= WORKFLOW BUILDER ================= */

  const buildWorkflow = (div, sub) => {
    const cfg = WORKFLOW_CONFIG[div]
    if (!cfg) return []

    const steps = cfg.subs
      ? cfg.subs[sub]?.steps || []
      : cfg.steps

    return steps.map(s => ({
      label: s,
      progress: 0
    }))
  }

  /* ================= CREATE ================= */

  const simpanProyek = async () => {
    if (!form.name || !form.division) {
      alert('Nama proyek & divisi wajib diisi')
      return
    }

    const workflow = buildWorkflow(
      form.division,
      form.subDivision
    )

    await addDoc(collection(db, 'projects'), {
      ...form,
      workflow,
      progress: calcProgress(workflow),
      createdAt: serverTimestamp()
    })

    setForm({
      name: '',
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

  /* ================= RENDER ================= */

  return (
    <div>
      <h2>Manajemen Proyek</h2>

      {role === 'admin' && (
        <button onClick={() => setAdding(a => !a)}>
          {adding ? 'Batal Tambah Proyek' : '+ Tambah Proyek'}
        </button>
      )}

      {adding && (
        <div style={{ marginTop: 16, background: '#fff', padding: 16 }}>
          <h3>Tambah Proyek</h3>

          <input
            placeholder="Nama Proyek"
            value={form.name}
            onChange={e =>
              setForm({ ...form, name: e.target.value })
            }
          />

          <select
            value={form.division}
            onChange={e =>
              setForm({
                ...form,
                division: e.target.value,
                subDivision: ''
              })
            }
          >
            <option value="">-- Pilih Divisi --</option>
            {Object.entries(WORKFLOW_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>

          {form.division &&
            WORKFLOW_CONFIG[form.division].subs && (
              <select
                value={form.subDivision}
                onChange={e =>
                  setForm({
                    ...form,
                    subDivision: e.target.value
                  })
                }
              >
                <option value="">-- Pilih Sub --</option>
                {Object.entries(
                  WORKFLOW_CONFIG[form.division].subs
                ).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            )}

          <select
            value={form.paymentStatus}
            onChange={e =>
              setForm({
                ...form,
                paymentStatus: e.target.value
              })
            }
          >
            {PAYMENT_STATUS.map(s => (
              <option key={s}>{s}</option>
            ))}
          </select>

          <button onClick={simpanProyek}>Simpan</button>
        </div>
      )}

      <div style={{ marginTop: 24 }}>
        {projects.map(p => {
          const editing = expanded === p.id
          const workflow = editing
            ? drafts[p.id]
            : p.workflow

          return (
            <div
              key={p.id}
              style={{
                background: '#fff',
                padding: 16,
                marginBottom: 16
              }}
            >
              <strong>{p.name}</strong>
              <div>Status Pembayaran: {p.paymentStatus}</div>
              <div>Progress Total: {calcProgress(workflow)}%</div>

              {role === 'admin' && (
                <>
                  <button
                    onClick={() =>
                      editing
                        ? setExpanded(null)
                        : bukaTahapan(p)
                    }
                  >
                    {editing
                      ? 'Tutup Tahapan'
                      : 'Update Tahapan'}
                  </button>

                  <button
                    onClick={() =>
                      deleteDoc(doc(db, 'projects', p.id))
                    }
                  >
                    Hapus
                  </button>
                </>
              )}

              {editing &&
                workflow.map((s, i) => (
                  <div key={i}>
                    <small>{s.label}</small>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={s.progress}
                      onChange={e =>
                        updateDraft(p.id, i, e.target.value)
                      }
                    />
                  </div>
                ))}

              {editing && role === 'admin' && (
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
