import { updateDoc } from 'firebase/firestore'
import { canArchiveProject } from '../utils/projectArchive'
import { useEffect, useRef, useState } from 'react'
import { logActivity } from '../services/activityLogger'
import { formatRupiah, formatNumber, parseNumber } from '../utils/currency'
import {
  PAYMENT_STATUS,
  DEFAULT_PAYMENT_STATUS
} from '../services/payment.config'

const DIVISION_CHIP = {
  Konsultan:  { bg: '#dbeafe', color: '#1d4ed8' },
  Konstruksi: { bg: '#dcfce7', color: '#166534' },
  Pengadaan:  { bg: '#ffedd5', color: '#9a3412' },
}

export default function ProjectCardLayout({
  p, role, expanded, setExpanded, drafts, highlightId,
  editingKontrak, kontrakDraft, setEditingKontrak, setKontrakDraft,
  bukaTahapan, updateDraft, simpanTahapan, simpanKontrak,
  hitungStatusWaktu, calcProgress, isStepLocked,
  deleteDoc, doc, db
}) {
  const editing = expanded === p.id && editingKontrak !== p.id
  const isHighlighted = highlightId === p.id
  const [showDetail, setShowDetail] = useState(false)
  const workflow = editing ? drafts[p.id] || p.workflow || [] : p.workflow || []
  const status = hitungStatusWaktu(p)
  const cardRef = useRef(null)
  const progress = calcProgress(workflow)

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

  const divisionChip = DIVISION_CHIP[p.division] || { bg: '#e5e7eb', color: '#374151' }

  useEffect(() => {
    if (expanded === p.id && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [expanded, p.id])

  useEffect(() => {
    if (isHighlighted && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [isHighlighted])

  const btnBase = {
    padding: '4px 10px', borderRadius: 6,
    border: '1px solid var(--border)',
    background: 'var(--bg-card-soft)',
    color: 'var(--text)', fontSize: 12,
    cursor: 'pointer', fontFamily: 'inherit'
  }

  return (
    <div
      ref={cardRef}
      className={isHighlighted ? 'card-highlight' : undefined}
      style={{
        background: 'var(--bg-card)',
        padding: 16, marginBottom: 16, borderRadius: 12,
        border: expanded === p.id ? '1px solid #2563eb' : '1px solid var(--border)',
        boxShadow: `inset 4px 0 0 0 ${deadlineBorderColor}, ${
          expanded === p.id ? '0 6px 18px rgba(0,0,0,0.12)' : '0 1px 3px rgba(0,0,0,0.04)'
        }`,
        transition: 'all 0.2s ease'
      }}
    >
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8, gap: 8 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)', marginBottom: 4 }}>{p.name}</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {p.division && (
              <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: divisionChip.bg, color: divisionChip.color }}>
                {p.division}
              </span>
            )}
            {p.subDivision && (
              <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: 'var(--bg-card-soft)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                {p.subDivision}
              </span>
            )}
          </div>
        </div>
        {needAttention && (
          <span style={{ fontSize: 11, fontWeight: 500, padding: '3px 8px', borderRadius: 999, background: '#fef2f2', color: '#7f1d1d', flexShrink: 0 }}>
            Perlu Perhatian
          </span>
        )}
      </div>

      {/* ── Info grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 12px', fontSize: 12, marginBottom: 8 }}>
        {p.nomorKontrak && (
          <div style={{ color: 'var(--text-muted)' }}>
            No. Kontrak: <strong style={{ color: 'var(--text)' }}>{p.nomorKontrak}</strong>
          </div>
        )}
        {p.pic && (
          <div style={{ color: 'var(--text-muted)' }}>
            PIC: <strong style={{ color: 'var(--text)' }}>{p.pic}</strong>
          </div>
        )}
        {p.instansi && (
          <div style={{ color: 'var(--text-muted)' }}>
            Instansi: <strong style={{ color: 'var(--text)' }}>{p.instansi}</strong>
          </div>
        )}
        {p.lokasi && (
          <div style={{ color: 'var(--text-muted)' }}>
            Lokasi: <strong style={{ color: 'var(--text)' }}>{p.lokasi}</strong>
          </div>
        )}
        <div style={{ color: 'var(--text-muted)', gridColumn: '1 / -1' }}>
          Kontrak: <strong style={{ color: 'var(--text)' }}>{p.tanggalMulai} → {p.tanggalSelesai}</strong>
        </div>
      </div>

      {/* ── Status waktu ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 8 }}>
        <span style={{ color: 'var(--text-muted)' }}>Status Waktu:</span>
        <span className={statusClass}>{status.label}</span>
        {status.info && <span style={{ color: 'var(--text-muted)' }}>({status.info})</span>}
      </div>

      {/* ── Progress bar ── */}
      <div style={{ marginBottom: 4 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
          <span>Progress</span>
          <strong style={{ color: 'var(--text)' }}>{progress}%</strong>
        </div>
        <div style={{ height: 6, background: 'var(--border)', borderRadius: 999, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${progress}%`,
            background: progress === 100 ? '#22c55e' : progress >= 50 ? '#3b82f6' : '#f59e0b',
            borderRadius: 999, transition: 'width 0.4s ease'
          }} />
        </div>
      </div>

      {/* ── Status pembayaran + toggle detail ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          Pembayaran: <strong style={{ color: 'var(--text)' }}>{p.paymentStatus || DEFAULT_PAYMENT_STATUS}</strong>
        </div>
        <button
          style={{ fontSize: 12, color: '#3b82f6', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
          onClick={() => setShowDetail(v => !v)}
        >
          {showDetail ? 'Sembunyikan ▲' : 'Lihat Detail ▼'}
        </button>
      </div>

      {/* ── Detail panel ── */}
      {showDetail && (
        <div style={{
          marginTop: 8, padding: 10, borderRadius: 8,
          background: 'var(--bg-card-soft)', border: '1px solid var(--border)',
          fontSize: 12, color: 'var(--text)',
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px'
        }}>
          <div><strong>Sumber Dana:</strong> {p.sumberDana || '-'}</div>
          <div><strong>Tahun Anggaran:</strong> {p.tahunAnggaran || '-'}</div>
          <div style={{ gridColumn: '1 / -1' }}>
            <strong>Nilai Anggaran:</strong> {p.nilaiAnggaran ? formatRupiah(p.nilaiAnggaran) : '-'}
          </div>
        </div>
      )}

      {/* ── Action buttons ── */}
      {role === 'admin' && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
          <button style={btnBase} onClick={() => editing ? setExpanded(null) : bukaTahapan(p)}>
            {editing ? 'Tutup Tahapan' : 'Update Tahapan'}
          </button>

          <button
            style={btnBase}
            onClick={() => {
              if (editingKontrak === p.id) {
                setEditingKontrak(null); setExpanded(null); return
              }
              setExpanded(p.id)
              setEditingKontrak(p.id)
              setKontrakDraft({
                name: p.name || '', nomorKontrak: p.nomorKontrak || '',
                instansi: p.instansi || '', lokasi: p.lokasi || '',
                sumberDana: p.sumberDana || '', nilaiAnggaran: p.nilaiAnggaran || '',
                tahunAnggaran: p.tahunAnggaran || '', paymentStatus: p.paymentStatus || DEFAULT_PAYMENT_STATUS,
                pic: p.pic || '', division: p.division || '', subDivision: p.subDivision || '',
                tanggalMulai: p.tanggalMulai || '', durasiHari: p.durasiHari || ''
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
            >Arsipkan Proyek</button>
          )}

          <button
            className="btn-danger"
            onClick={async () => {
              if (!confirm('Hapus proyek ini?')) return
              await logActivity({ action: 'DELETE', projectId: p.id, projectName: p.name, description: 'Menghapus proyek' })
              await deleteDoc(doc(db, 'projects', p.id))
            }}
          >Hapus</button>
        </div>
      )}

      {/* ── Edit kontrak form ── */}
      {editingKontrak === p.id && (
        <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <input style={{ gridColumn: '1 / -1' }}
              placeholder={!kontrakDraft.name ? 'Nama Proyek' : undefined}
              value={kontrakDraft.name}
              onChange={e => setKontrakDraft({ ...kontrakDraft, name: e.target.value })} />
            <input
              placeholder={!kontrakDraft.nomorKontrak ? 'Nomor Kontrak' : undefined}
              value={kontrakDraft.nomorKontrak}
              onChange={e => setKontrakDraft({ ...kontrakDraft, nomorKontrak: e.target.value.toUpperCase() })} />
            <input
              placeholder={!kontrakDraft.instansi ? 'Instansi' : undefined}
              value={kontrakDraft.instansi}
              onChange={e => setKontrakDraft({ ...kontrakDraft, instansi: e.target.value })} />
            <input
              placeholder={!kontrakDraft.lokasi ? 'Lokasi' : undefined}
              value={kontrakDraft.lokasi}
              onChange={e => setKontrakDraft({ ...kontrakDraft, lokasi: e.target.value })} />
            <input
              placeholder={!kontrakDraft.sumberDana ? 'Sumber Dana' : undefined}
              value={kontrakDraft.sumberDana}
              onChange={e => setKontrakDraft({ ...kontrakDraft, sumberDana: e.target.value })} />
            <input
              placeholder={!kontrakDraft.pic ? 'PIC (Person In Charge)' : undefined}
              value={kontrakDraft.pic}
              onChange={e => setKontrakDraft({ ...kontrakDraft, pic: e.target.value })} />
            <input type="text" inputMode="numeric"
              placeholder={!kontrakDraft.nilaiAnggaran ? 'Nilai Anggaran' : undefined}
              value={formatNumber(kontrakDraft.nilaiAnggaran)}
              onChange={e => setKontrakDraft({ ...kontrakDraft, nilaiAnggaran: parseNumber(e.target.value) })} />
            <input
              placeholder={!kontrakDraft.tahunAnggaran ? 'Tahun Anggaran' : undefined}
              value={kontrakDraft.tahunAnggaran}
              onChange={e => setKontrakDraft({ ...kontrakDraft, tahunAnggaran: e.target.value })} />
            <select style={{ gridColumn: '1 / -1' }}
              value={kontrakDraft.paymentStatus}
              onChange={e => setKontrakDraft({ ...kontrakDraft, paymentStatus: e.target.value })}>
              {PAYMENT_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <input value={kontrakDraft.division} disabled placeholder="Divisi" />
            <input value={kontrakDraft.subDivision} disabled placeholder="Sub Divisi" />
            <input type="date"
              value={kontrakDraft.tanggalMulai}
              onChange={e => setKontrakDraft({ ...kontrakDraft, tanggalMulai: e.target.value })} />
            <input type="number"
              placeholder={!kontrakDraft.durasiHari ? 'Durasi (hari)' : undefined}
              value={kontrakDraft.durasiHari}
              onChange={e => setKontrakDraft({ ...kontrakDraft, durasiHari: e.target.value })} />
          </div>
          <button
            style={{ ...btnBase, marginTop: 8, background: '#2563eb', color: '#fff', border: '1px solid #2563eb' }}
            onClick={async () => { await simpanKontrak(p); setEditingKontrak(null); setExpanded(null) }}
          >Simpan Kontrak</button>
        </div>
      )}

      {/* ── Workflow steps ── */}
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
        >Simpan Progress</button>
      )}
    </div>
  )
}