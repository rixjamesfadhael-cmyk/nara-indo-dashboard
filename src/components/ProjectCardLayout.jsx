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
}