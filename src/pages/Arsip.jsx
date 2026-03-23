import { useEffect, useState } from 'react'
import {
  collection, onSnapshot, updateDoc, doc
} from 'firebase/firestore'
import { db } from '../firebase'
import EmptyState from '../components/EmptyState'
import { exportExcel, exportPDF } from '../services/project.export'
import { formatRupiah } from '../utils/currency'
import {
  isArchivedProject,
  canEditFinalStepInArchive,
  shouldUnarchiveProject
} from '../utils/projectArchive'

const DIVISION_CHIP = {
  Konsultan:  { bg: '#dbeafe', color: '#1d4ed8' },
  Konstruksi: { bg: '#dcfce7', color: '#166534' },
  Pengadaan:  { bg: '#ffedd5', color: '#9a3412' },
}

const SUB_DIVISION_CHIP = {
  Perencanaan: { bg: '#e0f2fe', color: '#075985' },
  Pengawasan:  { bg: '#dbeafe', color: '#1e40af' },
  Jalan:       { bg: '#dcfce7', color: '#166534' },
  Jembatan:    { bg: '#ede9fe', color: '#5b21b6' },
  Bangunan:    { bg: '#fee2e2', color: '#991b1b' },
  Drainase:    { bg: '#fef3c7', color: '#92400e' },
  Barang:      { bg: '#e0e7ff', color: '#3730a3' },
  Jasa:        { bg: '#fce7f3', color: '#9d174d' },
}

const PAYMENT_CHIP = (status) => {
  if (status === 'Pelunasan') return { bg: '#dcfce7', color: '#166534' }
  if (status === 'DP' || status?.startsWith('Termin')) return { bg: '#dbeafe', color: '#1d4ed8' }
  return { bg: '#fef3c7', color: '#92400e' }
}

const chip = (bg, color) => ({
  fontSize: 11, fontWeight: 600,
  padding: '2px 8px', borderRadius: 999,
  background: bg, color: color,
  display: 'inline-block'
})

const rupiah = n =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', maximumFractionDigits: 0
  }).format(n || 0)

export default function Arsip({ role }) {
  const [archives, setArchives] = useState([])
  const [editingWorkflow, setEditingWorkflow] = useState(null)
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 6

  useEffect(() => {
    return onSnapshot(collection(db, 'projects'), snap => {
      setArchives(
        snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(p => isArchivedProject(p))
      )
    })
  }, [])

  useEffect(() => { setCurrentPage(1) }, [search])

  const filteredArchives = archives.filter(a =>
    a.name?.toLowerCase().includes(search.toLowerCase())
  )
  const totalPages = Math.ceil(filteredArchives.length / itemsPerPage)
  const paginatedArchives = filteredArchives.slice(
    (currentPage - 1) * itemsPerPage, currentPage * itemsPerPage
  )

  const btnBase = {
    padding: '4px 10px', borderRadius: 6,
    border: '1px solid var(--border)',
    background: 'var(--bg-card-soft)',
    color: 'var(--text)', fontSize: 12,
    cursor: 'pointer', fontFamily: 'inherit'
  }

  return (
    <>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <h2 style={{ margin: 0, color: 'var(--text)' }}>Arsip Proyek</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            placeholder="Cari proyek..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ padding: 8, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text)', width: '100%', maxWidth: 320 }}
          />
          <button style={btnBase} onClick={() => exportExcel(filteredArchives, search ? `Arsip – Filter: ${search}` : 'Laporan Proyek Selesai (Arsip)')}>Export Excel</button>
          <button style={btnBase} onClick={() => exportPDF(filteredArchives, search ? `Arsip – Filter: ${search}` : 'Laporan Proyek Selesai (Arsip)')}>Export PDF</button>
        </div>
      </div>

      {/* GRID */}
      <div className="project-grid" style={{ display: 'grid', gap: 20, alignItems: 'start' }}>
        {archives.length === 0 && (
          <div style={{ gridColumn: '1 / -1' }}>
            <EmptyState title="Belum ada proyek diarsipkan" description="Proyek yang selesai atau diarsipkan akan muncul di sini." />
          </div>
        )}
        {archives.length > 0 && filteredArchives.length === 0 && (
          <div style={{ gridColumn: '1 / -1' }}>
            <EmptyState title="Tidak ditemukan di arsip" description="Coba ubah kata kunci pencarian." actionLabel="Reset Pencarian" onAction={() => setSearch('')} />
          </div>
        )}

        {paginatedArchives.map(a => {
          const progress = a.progress || 0
          const divisionChip = DIVISION_CHIP[a.division] || { bg: '#e5e7eb', color: '#374151' }
          const subDivisionChip = SUB_DIVISION_CHIP[a.subDivision] || { bg: '#e5e7eb', color: '#374151' }
          const paymentChip = PAYMENT_CHIP(a.paymentStatus)

          return (
            <div key={a.id} style={{
              background: 'var(--bg-card)', padding: 16, borderRadius: 12,
              border: '1px solid var(--border)',
              boxShadow: 'inset 4px 0 0 0 #60a5fa, 0 1px 3px rgba(0,0,0,0.04)',
              transition: 'all 0.2s ease'
            }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8, gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)', marginBottom: 6 }}>{a.name}</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    {a.division && <span style={chip(divisionChip.bg, divisionChip.color)}>{a.division}</span>}
                    {a.subDivision && <span style={chip(subDivisionChip.bg, subDivisionChip.color)}>{a.subDivision}</span>}
                    {a.pic && <span style={chip('#e5e7eb', '#374151')}>PIC: {a.pic}</span>}
                    <span style={chip(paymentChip.bg, paymentChip.color)}>{a.paymentStatus || 'Belum Bayar'}</span>
                  </div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 999, background: '#dbeafe', color: '#1d4ed8', flexShrink: 0 }}>
                  Selesai
                </span>
              </div>

              {/* Info grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 12px', fontSize: 12, marginBottom: 8 }}>
                {a.nomorKontrak && (
                  <div style={{ color: 'var(--text-muted)' }}>
                    No. Kontrak: <strong style={{ color: 'var(--text)' }}>{a.nomorKontrak}</strong>
                  </div>
                )}
                {a.instansi && (
                  <div style={{ color: 'var(--text-muted)' }}>
                    Instansi: <strong style={{ color: 'var(--text)' }}>{a.instansi}</strong>
                  </div>
                )}
                {a.lokasi && (
                  <div style={{ color: 'var(--text-muted)' }}>
                    Lokasi: <strong style={{ color: 'var(--text)' }}>{a.lokasi}</strong>
                  </div>
                )}
                {a.nilaiAnggaran && (
                  <div style={{ color: 'var(--text-muted)' }}>
                    Nilai: <strong style={{ color: 'var(--text)' }}>{rupiah(a.nilaiAnggaran)}</strong>
                  </div>
                )}
                {(a.tanggalMulai || a.tanggalSelesai) && (
                  <div style={{ color: 'var(--text-muted)', gridColumn: '1 / -1' }}>
                    Kontrak: <strong style={{ color: 'var(--text)' }}>{a.tanggalMulai} → {a.tanggalSelesai}</strong>
                  </div>
                )}
              </div>

              {/* Progress bar */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                  <span>Progress</span>
                  <strong style={{ color: 'var(--text)' }}>{progress}%</strong>
                </div>
                <div style={{ height: 6, background: 'var(--border)', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${progress}%`, background: '#22c55e', borderRadius: 999, transition: 'width 0.4s ease' }} />
                </div>
              </div>

              {/* Action */}
              {role === 'admin' && (
                <button
                  style={{ ...btnBase, width: '100%', padding: 8 }}
                  onClick={() => setEditingWorkflow({ project: a, workflow: JSON.parse(JSON.stringify(a.workflow)) })}
                >
                  Edit Tahapan Akhir
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12 }}>
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            style={{ ...btnBase, opacity: currentPage === 1 ? 0.5 : 1 }}>Prev</button>
          <span style={{ fontSize: 14, color: 'var(--text)' }}>Halaman {currentPage} dari {totalPages}</span>
          <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            style={{ ...btnBase, opacity: currentPage === totalPages ? 0.5 : 1 }}>Next</button>
        </div>
      )}

      {/* MODAL EDIT TAHAPAN */}
      {editingWorkflow && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) setEditingWorkflow(null) }}
        >
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 16, width: '100%', maxWidth: 400,
            display: 'flex', flexDirection: 'column',
            maxHeight: '80vh', overflow: 'hidden'
          }}>
            {/* Modal header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, color: 'var(--text)' }}>Edit Tahapan Akhir</h3>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{editingWorkflow.project.name}</div>
              </div>
              <button
                onClick={() => setEditingWorkflow(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 18, lineHeight: 1 }}
              >✕</button>
            </div>

            {/* Modal body — scrollable */}
            <div style={{ padding: '16px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {editingWorkflow.workflow.map((step, idx) => {
                const canEdit = canEditFinalStepInArchive(editingWorkflow.workflow, idx)
                return (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <small style={{ color: canEdit ? 'var(--text)' : 'var(--text-muted)', fontWeight: canEdit ? 600 : 400 }}>
                        {step.label}
                      </small>
                      <small style={{ color: 'var(--text-muted)', fontSize: 11 }}>{step.progress}%</small>
                    </div>
                    <input
                      type="range" min="0" max="100" step="5"
                      style={{ width: '100%', opacity: canEdit ? 1 : 0.4 }}
                      value={step.progress} disabled={!canEdit}
                      onChange={e => {
                        const wf = [...editingWorkflow.workflow]
                        wf[idx] = { ...wf[idx], progress: Number(e.target.value) }
                        setEditingWorkflow({ ...editingWorkflow, workflow: wf })
                      }}
                    />
                  </div>
                )
              })}
            </div>

            {/* Modal footer */}
            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button style={btnBase} onClick={() => setEditingWorkflow(null)}>Batal</button>
              <button
                style={{ ...btnBase, background: '#2563eb', color: '#fff', border: '1px solid #2563eb' }}
                onClick={async () => {
                  const { project, workflow } = editingWorkflow
                  const updates = {
                    workflow,
                    progress: Math.round(workflow.reduce((a, b) => a + b.progress, 0) / workflow.length)
                  }
                  if (shouldUnarchiveProject(workflow)) updates.archived = false
                  await updateDoc(doc(db, 'projects', project.id), updates)
                  setEditingWorkflow(null)
                }}
              >Simpan</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}