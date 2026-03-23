import { useEffect, useState } from 'react'
import {
  collection, onSnapshot, updateDoc, doc
} from 'firebase/firestore'
import { db } from '../firebase'
import EmptyState from '../components/EmptyState'
import { exportExcel, exportPDF } from '../services/project.export'
import {
  isArchivedProject,
  canEditFinalStepInArchive,
  shouldUnarchiveProject
} from '../utils/projectArchive'

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
    color: 'var(--text)', fontSize: 12, cursor: 'pointer'
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
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
        {paginatedArchives.map(a => (
          <div key={a.id} style={{
            background: 'var(--bg-card)', borderRadius: 16, padding: 20,
            boxShadow: 'var(--shadow)', border: '1px solid var(--border)',
            display: 'flex', flexDirection: 'column', gap: 12
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>{a.name}</h3>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: 14 }}>
              <div><small>Nilai</small><br /><strong style={{ color: 'var(--text)' }}>{rupiah(a.nilaiAnggaran)}</strong></div>
              <div><small>Progress</small><br /><strong style={{ color: 'var(--text)' }}>{a.progress || 0}%</strong></div>
            </div>
            <div style={{ height: 8, background: 'var(--border)', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${a.progress || 0}%`, background: '#16a34a', transition: 'width 0.3s ease' }} />
            </div>
            {role === 'admin' && (
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button
                  style={{ flex: 1, padding: 8, borderRadius: 8, border: '1px solid #bbf7d0', background: '#dcfce7', color: '#166534', cursor: 'pointer', fontWeight: 600 }}
                  onClick={() => setEditingWorkflow({ project: a, workflow: JSON.parse(JSON.stringify(a.workflow)) })}
                >
                  Edit Tahapan Akhir
                </button>
              </div>
            )}
          </div>
        ))}
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

      {/* MODAL */}
      {editingWorkflow && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: 20, borderRadius: 16, width: 320, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h3 style={{ margin: 0, color: 'var(--text)' }}>Edit Tahapan Terakhir</h3>
            {editingWorkflow.workflow.map((step, idx) => {
              const canEdit = canEditFinalStepInArchive(editingWorkflow.workflow, idx)
              return (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <small style={{ color: 'var(--text-muted)' }}>{step.label}</small>
                  <input type="range" min="0" max="100" step="5" style={{ width: '100%' }}
                    value={step.progress} disabled={!canEdit}
                    onChange={e => {
                      const wf = [...editingWorkflow.workflow]
                      wf[idx] = { ...wf[idx], progress: Number(e.target.value) }
                      setEditingWorkflow({ ...editingWorkflow, workflow: wf })
                    }} />
                  <input type="number" style={{ width: '100%' }}
                    value={step.progress} disabled={!canEdit}
                    onChange={e => {
                      const wf = [...editingWorkflow.workflow]
                      wf[idx] = { ...wf[idx], progress: Number(e.target.value) }
                      setEditingWorkflow({ ...editingWorkflow, workflow: wf })
                    }} />
                </div>
              )
            })}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
              <button style={btnBase} onClick={() => setEditingWorkflow(null)}>Batal</button>
              <button
                style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer' }}
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