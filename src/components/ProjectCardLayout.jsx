export default function ProjectCardLayout({
  p,
  role,
  expanded,
  setExpanded,
  drafts,
  editingKontrak,
  kontrakDraft,
  setEditingKontrak,
  setKontrakDraft,
  bukaTahapan,
  updateDraft,
  simpanTahapan,
  simpanKontrak,
  hitungStatusWaktu,
  calcProgress,
  isStepLocked,
  deleteDoc,
  doc,
  db
}) {
  const editing = expanded === p.id
  const workflow = editing ? drafts[p.id] : p.workflow
  const status = hitungStatusWaktu(p)

  return (
    <div style={{ background: '#fff', padding: 16, marginBottom: 16 }}>
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
        workflow.map((s, i) => {
          const locked = isStepLocked(workflow, i)
          const isDone = s.progress >= 100

          return (
            <div key={i} style={{ marginTop: 12 }}>
              <small>{s.label}</small>

              {/* SLIDER */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={s.progress}
                  disabled={locked || isDone}
                  onChange={e =>
                    updateDraft(p.id, i, e.target.value)
                  }
                  style={{ flex: 1 }}
                />

                {/* INPUT MANUAL */}
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="5"
                  value={s.progress}
                  disabled={locked || isDone}
                  onChange={e =>
                    updateDraft(p.id, i, e.target.value)
                  }
                  style={{ width: 70 }}
                />

                {/* CHECKBOX SELESAI */}
                <label style={{ fontSize: 12 }}>
                  <input
                    type="checkbox"
                    checked={isDone}
                    disabled={locked}
                    onChange={e =>
                      updateDraft(
                        p.id,
                        i,
                        e.target.checked ? 100 : 0
                      )
                    }
                  />{' '}
                  Tandai selesai
                </label>
              </div>
            </div>
          )
        })}

      {editing && (
        <button style={{ marginTop: 12 }} onClick={() => simpanTahapan(p)}>
          Simpan Progress
        </button>
      )}
    </div>
  )
}
