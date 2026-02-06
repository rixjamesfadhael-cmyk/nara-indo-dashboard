import { updateDoc } from 'firebase/firestore'
import { canArchiveProject } from '../utils/projectArchive'
import { useEffect, useRef } from 'react'

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
const workflow = editing
  ? drafts[p.id] || p.workflow || []
  : p.workflow || []
  const status = hitungStatusWaktu(p)
  const needAttention =
  (Number(p.progress) || 0) < 50 ||
  status?.level === 'warning' ||
  status?.level === 'danger'

const cardRef = useRef(null)

useEffect(() => {
  if (expanded === p.id && cardRef.current) {
    cardRef.current.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    })
  }
}, [expanded, p.id])

return (
  <div
  ref={cardRef}
    style={{
      background: '#fff',
      padding: 16,
      marginBottom: 16,
      borderRadius: 12,
      border:
        expanded === p.id
          ? '2px solid #2563eb'
          : '1px solid #e5e7eb',
      boxShadow:
        expanded === p.id
          ? '0 0 0 4px rgba(37,99,235,0.15)'
          : '0 4px 10px rgba(0,0,0,0.04)',
      transition: 'all 0.25s ease'
    }}
  >
      <div
  style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6
  }}
>
  <div
    style={{
      fontWeight: 700,
      fontSize: 16,
      color: '#0f172a'
    }}
  >
    {p.name}
  </div>

  {needAttention && (
    <span
      style={{
        fontSize: 11,
        fontWeight: 700,
        padding: '4px 8px',
        borderRadius: 999,
        background: '#fee2e2',
        color: '#b91c1c'
      }}
    >
      Perlu Perhatian
    </span>
  )}
</div>
      {p.nomorKontrak && (
        <div style={{ fontSize: 12, color: '#555' }}>
          No. Kontrak: <strong>{p.nomorKontrak}</strong>
        </div>
      )}

      <div>{p.instansi} — {p.lokasi}</div>
      <div>Kontrak: {p.tanggalMulai} → {p.tanggalSelesai}</div>
      <div
  style={{
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 16,
    marginTop: 1
  }}
>
  <span>Status Waktu:</span>

  <span
    style={{
      fontWeight: 600,
      color:
        status.level === 'danger'
          ? '#b91c1c'
          : status.level === 'warning'
          ? '#b45309'
          : '#15803d'
    }}
  >
    {status.label}
  </span>

  {status.info && (
    <span style={{ color: '#64748b' }}>
      ({status.info})
    </span>
  )}
</div>
      <div>Progress: {calcProgress(workflow)}%</div>

      <div style={{ marginTop: 4, marginBottom: 4, fontSize: 12 }}>
        Status Pembayaran:{' '}
        <strong>{p.paymentStatus || 'Belum Bayar'}</strong>
      </div>

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
                name: p.name || '',
                nomorKontrak: p.nomorKontrak || '',
                instansi: p.instansi || '',
                lokasi: p.lokasi || '',
                sumberDana: p.sumberDana || '',
                nilaiAnggaran: p.nilaiAnggaran || '',
                tahunAnggaran: p.tahunAnggaran || '',
                paymentStatus: p.paymentStatus || 'Belum Bayar',
                division: p.division || '',
                subDivision: p.subDivision || '',
                tanggalMulai: p.tanggalMulai || '',
                durasiHari: p.durasiHari || ''
              })
            }}
          >
            Edit Kontrak
          </button>

          {canArchiveProject(p) && (
  <button
    style={{ marginLeft: 8, background: '#fef3c7' }}
    onClick={async () => {
      if (!confirm('Arsipkan proyek ini?')) return

      await updateDoc(doc(db, 'projects', p.id), {
        archived: true,
        archivedAt: new Date()
      })
    }}
  >
    Arsipkan Proyek
  </button>
)}

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
        <div style={{ marginTop: 12, borderTop: '1px solid #eee', paddingTop: 12 }}>
          <div style={{ display: 'grid', gap: 8 }}>

            <input
              placeholder="Nama Proyek"
              value={kontrakDraft.name}
              onChange={e => setKontrakDraft({ ...kontrakDraft, name: e.target.value })}
            />

            <input
              placeholder="Nomor Kontrak"
              value={kontrakDraft.nomorKontrak}
              onChange={e =>
                setKontrakDraft({
                  ...kontrakDraft,
                  nomorKontrak: e.target.value.toUpperCase()
                })
              }
            />

            <input
              placeholder="Instansi"
              value={kontrakDraft.instansi}
              onChange={e => setKontrakDraft({ ...kontrakDraft, instansi: e.target.value })}
            />

            <input
              placeholder="Lokasi"
              value={kontrakDraft.lokasi}
              onChange={e => setKontrakDraft({ ...kontrakDraft, lokasi: e.target.value })}
            />

            <input
              placeholder="Sumber Dana"
              value={kontrakDraft.sumberDana}
              onChange={e => setKontrakDraft({ ...kontrakDraft, sumberDana: e.target.value })}
            />

            <input
              type="number"
              placeholder="Nilai Anggaran"
              value={kontrakDraft.nilaiAnggaran}
              onChange={e => setKontrakDraft({ ...kontrakDraft, nilaiAnggaran: e.target.value })}
            />

            <input
              placeholder="Tahun Anggaran"
              value={kontrakDraft.tahunAnggaran}
              onChange={e => setKontrakDraft({ ...kontrakDraft, tahunAnggaran: e.target.value })}
            />

            <select
              value={kontrakDraft.paymentStatus}
              onChange={e => setKontrakDraft({ ...kontrakDraft, paymentStatus: e.target.value })}
            >
              <option value="Belum Bayar">Belum Bayar</option>
              <option value="DP">DP</option>
              <option value="Lunas">Lunas</option>
            </select>

            {/* READ ONLY */}
            <input value={kontrakDraft.division} disabled />
            <input value={kontrakDraft.subDivision} disabled />

            <input
              type="date"
              value={kontrakDraft.tanggalMulai}
              onChange={e => setKontrakDraft({ ...kontrakDraft, tanggalMulai: e.target.value })}
            />

            <input
              type="number"
              value={kontrakDraft.durasiHari}
              onChange={e => setKontrakDraft({ ...kontrakDraft, durasiHari: e.target.value })}
            />

          </div>

          <button style={{ marginTop: 8 }} onClick={() => simpanKontrak(p)}>
            Simpan Kontrak
          </button>
        </div>
      )}

      {editing &&
        workflow.map((s, i) => {
          const locked = isStepLocked(workflow, i)
          const isDone = s.progress >= 100

          return (
            <div
              key={i}
              style={{
                marginTop: 12,
                paddingLeft: 10,
                borderLeft: editing ? '3px solid #3b82f6' : '3px solid transparent',
                opacity: locked ? 0.5 : 1,
                cursor: locked ? 'not-allowed' : 'default'
              }}
            >
              <small style={{ display: 'block', marginBottom: 6 }}>
                {s.label}
              </small>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={s.progress}
                  disabled={locked || isDone}
                  onChange={e => updateDraft(p.id, i, e.target.value)}
                  style={{ flex: 1 }}
                />

                <input
                  type="number"
                  min="0"
                  max="100"
                  step="5"
                  value={s.progress}
                  disabled={locked || isDone}
                  onChange={e => updateDraft(p.id, i, e.target.value)}
                  style={{ width: 70 }}
                />

                <label style={{ fontSize: 12 }}>
                  <input
                    type="checkbox"
                    checked={isDone}
                    disabled={locked}
                    onChange={e =>
                      updateDraft(p.id, i, e.target.checked ? 100 : 0)
                    }
                  /> Tandai selesai
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
