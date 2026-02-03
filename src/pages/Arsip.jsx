import { useEffect, useState } from 'react'
import {
  collection,
  onSnapshot,
  updateDoc,
  doc,
  addDoc,
  serverTimestamp
} from 'firebase/firestore'
import { db } from '../firebase'
import {
  isArchivedProject,
  canEditFinalStepInArchive,
  shouldUnarchiveProject
} from '../utils/projectArchive'

const rupiah = n =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(n || 0)

export default function Arsip({ role }) {
  const [archives, setArchives] = useState([])
  const [editingWorkflow, setEditingWorkflow] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    return onSnapshot(collection(db, 'projects'), snap => {
      setArchives(
        snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(p => isArchivedProject(p))
      )
    })
  }, [])

  const filteredArchives = archives.filter(a =>
    a.name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      {/* HEADER */}
      <div style={header}>
        <h2>Arsip Proyek</h2>

        <input
          placeholder="Cari proyek..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={searchInput}
        />
      </div>

      {/* LIST ARSIP */}
      <div style={wrap}>
        {filteredArchives.map(a => (
          <div key={a.id} style={card}>
            <div style={head}>
              <h3 style={title}>{a.name}</h3>
            </div>

            <div style={row}>
              <div>
                <small>Nilai</small>
                <strong>{rupiah(a.nilaiAnggaran)}</strong>
              </div>
              <div>
                <small>Progress</small>
                <strong>{a.progress || 0}%</strong>
              </div>
            </div>

            <div style={progressWrap}>
              <div
                style={{
                  ...progressBar,
                  width: `${a.progress || 0}%`
                }}
              />
            </div>

            {role === 'admin' && (
              <div style={actions}>
                <button
                  style={edit}
                  onClick={() =>
                    setEditingWorkflow({
                      project: a,
                      workflow: JSON.parse(JSON.stringify(a.workflow))
                    })
                  }
                >
                  Edit Tahapan Akhir
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* MODAL EDIT TAHAPAN TERAKHIR */}
      {editingWorkflow && (
        <div style={overlay}>
          <div style={modal}>
            <h3>Edit Tahapan Terakhir</h3>

            {editingWorkflow.workflow.map((step, idx) => {
              const canEdit = canEditFinalStepInArchive(
                editingWorkflow.workflow,
                idx
              )

              return (
                <div key={idx}>
                  <small>{step.label}</small>

                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={step.progress}
                    disabled={!canEdit}
                    onChange={e => {
                      const wf = [...editingWorkflow.workflow]
                      wf[idx] = {
                        ...wf[idx],
                        progress: Number(e.target.value)
                      }
                      setEditingWorkflow({
                        ...editingWorkflow,
                        workflow: wf
                      })
                    }}
                  />

                  <input
                    type="number"
                    value={step.progress}
                    disabled={!canEdit}
                    onChange={e => {
                      const wf = [...editingWorkflow.workflow]
                      wf[idx] = {
                        ...wf[idx],
                        progress: Number(e.target.value)
                      }
                      setEditingWorkflow({
                        ...editingWorkflow,
                        workflow: wf
                      })
                    }}
                  />
                </div>
              )
            })}

            <div style={modalActions}>
              <button onClick={() => setEditingWorkflow(null)}>
                Batal
              </button>

              <button
                style={save}
                onClick={async () => {
                  const { project, workflow } = editingWorkflow

                  const updates = {
                    workflow,
                    progress: Math.round(
                      workflow.reduce((a, b) => a + b.progress, 0) /
                        workflow.length
                    )
                  }

                  if (shouldUnarchiveProject(workflow)) {
                    updates.archived = false
                  }

                  await updateDoc(
                    doc(db, 'projects', project.id),
                    updates
                  )

                  setEditingWorkflow(null)
                }}
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

/* ================= STYLES ================= */

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
  background: '#16a34a',
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
  border: '1px solid #bbf7d0',
  background: '#dcfce7',
  cursor: 'pointer',
  fontWeight: 600
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
  background: '#16a34a',
  color: '#fff',
  border: 'none',
  padding: '6px 12px',
  borderRadius: 6,
  cursor: 'pointer'
}
