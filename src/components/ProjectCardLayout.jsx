import { updateDoc } from 'firebase/firestore'
import { canArchiveProject } from '../utils/projectArchive'
import { useEffect, useRef, useState } from 'react'
import { logActivity } from '../services/activityLogger'
import { formatRupiah, formatNumber, parseNumber } from '../utils/currency'
import {
  PAYMENT_STATUS,
  DEFAULT_PAYMENT_STATUS
} from '../services/payment.config'

export default function ProjectCardLayout({
  p, role, expanded, setExpanded, drafts,
  editingKontrak, kontrakDraft, setEditingKontrak, setKontrakDraft,
  bukaTahapan, updateDraft, simpanTahapan, simpanKontrak,
  hitungStatusWaktu, calcProgress, isStepLocked,
  deleteDoc, doc, db
}) {
  const editing = expanded === p.id && editingKontrak !== p.id
  const [showDetail, setShowDetail] = useState(false)
  const workflow = editing ? drafts[p.id] || p.workflow || [] : p.workflow || []
  const status = hitungStatusWaktu(p)
  const cardRef = useRef(null)

  const deadlineBorderColor =
    status.level === 'danger' ? '#ef4444'
    : status.level === 'warning' ? '#f59e0b'
    : status.level === 'done' ? '#60a5fa'
    : '#22c55e'

  const needAttention =
    (Number(p.progress) || 0) < 50 ||
    status?.level === 'warning' ||
    status?.level === 'danger'

  const statusClass =
    status.level === 'danger' ? 'status-danger'
    : status.level === 'warning' ? 'status-warning'
    : status.level === 'done' ? 'status-done'
    : 'status-safe'

  useEffect(() => {
    if (expanded === p.id && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [expanded, p.id])

  const btnBase = {
    padding: '4px 10px',
    borderRadius: 6,
    border: '1px solid var(--border)',
    background: 'var(--bg-card-soft)',
    color: 'var(--text)',
    fontSize: 12,
    cursor: 'pointer',
    fontFamily: 'inherit'
  }

  return (
    <div
      ref={cardRef}
      style={{
        background: 'var(--bg-card)',
        padding: 16,
        marginBottom: 16,
        borderRadius: 12,
        border: expanded === p.id ? '1px solid #2563eb' : '1px solid var(--border)',
        boxShadow: `inset 4px 0 0 0 ${deadlineBorderColor}, ${
          expanded === p.id ? '0 6px 18px rgba(0,0,0,0.12)' : '0 1px 3px rgba(0,0,0,0.04)'
        }`,
        transition: 'all 0.2s ease'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>{p.name}</div>
        {needAttention && (
          <span style={{ fontSize: 11, fontWeight: 500, padding: '3px 8px', borderRadius: 999, background: '#fef2f2', color: '#7f1d1d' }}>
            Perlu Perhatian
          </span>
        )}
      </div>

      {p.nomorKontrak && (
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          No. Kontrak: <strong style={{ color: 'var(--text)' }}>{p.nomorKontrak}</strong>
        </div>
      )}

      {p.pic && (
        <div style={{ fontSize: 12, marginTop: 2, color: 'var(--text-muted)' }}>
          PIC: <strong style={{ color: 'var(--text)' }}>{p.pic}</strong>
        </div>
      )}

      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{p.instansi} — {p.lokasi}</div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Kontrak: {p.tanggalMulai} → {p.tanggalSelesai}</div>

      {/* Status waktu */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginTop: 4 }}>
        <span style={{ color: 'var(--text-muted)' }}>Status Waktu:</span>
        <span className={statusClass}>{status.label}</span>
        {status.info && <span style={{ color: 'var(--text-muted)' }}>({status.info})</span>}
      </div>

      <div style={{ fontSize: 13, color: 'var(--text)', marginTop: 2, fontWeight: 600 }}>
        Progress: {calcProgress(workflow)}%
      </div>

      {/* Toggle detail */}
      <button
        style={{ marginTop: 6, fontSize: 12, color: '#3b82f6', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
        onClick={() => setShowDetail(v => !v)}
      >
        {showDetail ? 'Sembunyikan Detail ▲' : 'Lihat Detail ▼'}
      </button>

      {showDetail && (
        <div style={{
          marginTop: 8, padding: 10, borderRadius: 8,
          background: 'var(--bg-card-soft)', border: '1px solid var(--border)',
          fontSize: 12, color: 'var(--text)', display: 'grid', gap: 4
        }}>
          <div><strong>Sumber Dana:</strong> {p.sumberDana || '-'}</div>
          <div><strong>Nilai Anggaran:</strong> {p.nilaiAnggaran ? formatRupiah(p.nilaiAnggaran) : '-'}</div>
          <div><strong>Tahun Anggaran:</strong> {p.tahunAnggaran || '-'}</div>
          <div><strong>PIC:</strong> {p.pic || '-'}</div>
          <div><strong>Divisi:</strong> {p.division || '-'}</div>
          <div><strong>Sub Divisi:</strong> {p.subDivision || '-'}</div>
        </div>
      )}

      <div style={{ marginTop: 6, marginBottom: 8, fontSize: 12, color: 'var(--text-muted)' }}>
        Status Pembayaran: <strong style={{ color: 'var(--text)' }}>{p.paymentStatus || DEFAULT_PAYMENT_STATUS}</strong>
      </div>

      {/* Action buttons */}
      {role === 'admin' && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <button style={btnBase} onClick={() => editing ? setExpanded(null) : bukaTahapan(p)}>
            {editing ? 'Tutup Tahapan' : 'Update Tahapan'}
          </button>

          <button
            style={btnBase}
            onClick={() => {
              if (editingKontrak === p.id) {
                setEditingKontrak(null)
                setExpanded(null)
                return
              }
              setExpanded(p.id)
              setEditingKontrak(p.id)
              setKontrakDraft({
                name: p.name || '',
                nomorKontrak: p.nomorKontrak || '',
                instansi: p.instansi || '',
                lokasi: p.lokasi || '',
                sumberDana: p.sumberDana || '',
                nilaiAnggaran: p.nilaiAnggaran || '',
                tahunAnggaran: p.tahunAnggaran || '',
                paymentStatus: p.paymentStatus || DEFAULT_PAYMENT_STATUS,
                pic: p.pic || '',
                division: p.division || '',
                subDivision: p.subDivision || '',
                tanggalMulai: p.tanggalMulai || '',
                durasiHari: p.durasiHari || ''
              })
            }}
          >
            {editingKontrak === p.id ? 'Tutup Kontrak' : 'Edit Kontrak'}
          </button>

          {canArchiveProject(p) && (
            <button
              style={{ ...btnBase, background: '#fef9c3', color: '#92400e', border: '1px solid #fde68a' }}
              onClick={async () => {
                if (!confirm('Arsipkan proyek ini?')) return
                await updateDoc(doc(db, 'projects', p.id), { archived: true, archivedAt: new Date() })
                await logActivity({ action: 'ARCHIVE', projectId: p.id, projectName: p.name, description: 'Mengarsipkan proyek' })
              }}
            >
              Arsipkan Proyek
            </button>
          )}

          <button
            className="btn-danger"
            onClick={async () => {
              if (!confirm('Hapus proyek ini?')) return
              await logActivity({ action: 'DELETE', projectId: p.id, projectName: p.name, description: 'Menghapus proyek' })
              await deleteDoc(doc(db, 'projects', p.id))
            }}
          >
            Hapus
          </button>
        </div>
      )}

      {/* Edit kontrak form */}
      {editingKontrak === p.id && (
        <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
          <div style={{ display: 'grid', gap: 8 }}>
            <input placeholder="Nama Proyek" value={kontrakDraft.name}
              onChange={e => setKontrakDraft({ ...kontrakDraft, name: e.target.value })} />
            <input placeholder="Nomor Kontrak" value={kontrakDraft.nomorKontrak}
              onChange={e => setKontrakDraft({ ...kontrakDraft, nomorKontrak: e.target.value.toUpperCase() })} />
            <input placeholder="Instansi" value={kontrakDraft.instansi}
              onChange={e => setKontrakDraft({ ...kontrakDraft, instansi: e.target.value })} />
            <input placeholder="Lokasi" value={kontrakDraft.lokasi}
              onChange={e => setKontrakDraft({ ...kontrakDraft, lokasi: e.target.value })} />
            <input placeholder="Sumber Dana" value={kontrakDraft.sumberDana}
              onChange={e => setKontrakDraft({ ...kontrakDraft, sumberDana: e.target.value })} />
            <input placeholder="PIC (Person In Charge)" value={kontrakDraft.pic}
              onChange={e => setKontrakDraft({ ...kontrakDraft, pic: e.target.value })} />
            <input type="text" inputMode="numeric" placeholder="Nilai Anggaran"
              value={formatNumber(kontrakDraft.nilaiAnggaran)}
              onChange={e => setKontrakDraft({ ...kontrakDraft, nilaiAnggaran: parseNumber(e.target.value) })} />
            <input placeholder="Tahun Anggaran" value={kontrakDraft.tahunAnggaran}
              onChange={e => setKontrakDraft({ ...kontrakDraft, tahunAnggaran: e.target.value })} />
            <select value={kontrakDraft.paymentStatus}
              onChange={e => setKontrakDraft({ ...kontrakDraft, paymentStatus: e.target.value })}>
              {PAYMENT_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <input value={kontrakDraft.division} disabled />
            <input value={kontrakDraft.subDivision} disabled />
            <input type="date" value={kontrakDraft.tanggalMulai}
              onChange={e => setKontrakDraft({ ...kontrakDraft, tanggalMulai: e.target.value })} />
            <input type="number" value={kontrakDraft.durasiHari}
              onChange={e => setKontrakDraft({ ...kontrakDraft, durasiHari: e.target.value })} />
          </div>
          <button
            style={{ ...btnBase, marginTop: 8, background: '#2563eb', color: '#fff', border: '1px solid #2563eb' }}
            onClick={async () => { await simpanKontrak(p); setEditingKontrak(null); setExpanded(null) }}
          >
            Simpan Kontrak
          </button>
        </div>
      )}

      {/* Workflow steps */}
      {editing && workflow.map((s, i) => {
        const locked = isStepLocked(workflow, i)
        const isDone = s.progress >= 100
        return (
          <div key={i} style={{
            marginTop: 12, paddingLeft: 10,
            borderLeft: '3px solid #3b82f6',
            opacity: locked ? 0.5 : 1,
            cursor: locked ? 'not-allowed' : 'default'
          }}>
            <small style={{ display: 'block', marginBottom: 6, color: 'var(--text-muted)' }}>{s.label}</small>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="range" min="0" max="100" step="5"
                value={s.progress} disabled={locked || isDone}
                onChange={e => updateDraft(p.id, i, e.target.value)}
                style={{ flex: 1 }} />
              <input type="number" min="0" max="100" step="5"
                value={s.progress} disabled={locked || isDone}
                onChange={e => updateDraft(p.id, i, e.target.value)}
                style={{ width: 70 }} />
              <label style={{ fontSize: 12, color: 'var(--text)' }}>
                <input type="checkbox" checked={isDone} disabled={locked}
                  onChange={e => updateDraft(p.id, i, e.target.checked ? 100 : 0)} />
                {' '}Tandai selesai
              </label>
            </div>
          </div>
        )
      })}

      {editing && (
        <button
          style={{ ...btnBase, marginTop: 12, background: '#2563eb', color: '#fff', border: '1px solid #2563eb' }}
          onClick={() => simpanTahapan(p)}
        >
          Simpan Progress
        </button>
      )}
    </div>
  )
}