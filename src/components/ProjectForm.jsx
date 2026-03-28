import { formatNumber, parseNumber } from '../utils/currency'

function terbilang(n) {
  const satuan = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan',
    'sepuluh', 'sebelas', 'dua belas', 'tiga belas', 'empat belas', 'lima belas', 'enam belas',
    'tujuh belas', 'delapan belas', 'sembilan belas']
  const puluhan = ['', '', 'dua puluh', 'tiga puluh', 'empat puluh', 'lima puluh',
    'enam puluh', 'tujuh puluh', 'delapan puluh', 'sembilan puluh']

  if (!n || n === 0) return ''
  n = Math.floor(Number(n))
  if (isNaN(n) || n <= 0) return ''

  const convert = (num) => {
    if (num < 20) return satuan[num]
    if (num < 100) return puluhan[Math.floor(num / 10)] + (num % 10 !== 0 ? ' ' + satuan[num % 10] : '')
    if (num < 1000) {
      const s = Math.floor(num / 100)
      const r = num % 100
      return (s === 1 ? 'seratus' : satuan[s] + ' ratus') + (r !== 0 ? ' ' + convert(r) : '')
    }
    if (num < 1000000) {
      const s = Math.floor(num / 1000)
      const r = num % 1000
      return (s === 1 ? 'seribu' : convert(s) + ' ribu') + (r !== 0 ? ' ' + convert(r) : '')
    }
    if (num < 1000000000) {
      const s = Math.floor(num / 1000000)
      const r = num % 1000000
      return convert(s) + ' juta' + (r !== 0 ? ' ' + convert(r) : '')
    }
    if (num < 1000000000000) {
      const s = Math.floor(num / 1000000000)
      const r = num % 1000000000
      return convert(s) + ' miliar' + (r !== 0 ? ' ' + convert(r) : '')
    }
    const s = Math.floor(num / 1000000000000)
    const r = num % 1000000000000
    return convert(s) + ' triliun' + (r !== 0 ? ' ' + convert(r) : '')
  }

  const result = convert(n)
  return result.charAt(0).toUpperCase() + result.slice(1) + ' rupiah'
}

export default function ProjectForm({
  adding, form, setForm, simpanProyek, onCancel,
  WORKFLOW_CONFIG, hitungTanggalSelesai
}) {
  if (!adding) return null

  const keteranganAnggaran = terbilang(form.nilaiAnggaran)

  return (
    <>
      {/* Overlay — hanya visual, pointer-events: none di CSS */}
      <div className="modal-overlay" />

      {/* Wrapper klik luar untuk tutup */}
      <div
        onClick={onCancel}
        style={{
          position: 'fixed', inset: 0,
          zIndex: 9998,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
      {/* Modal — stopPropagation agar klik di dalam tidak tutup */}
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ position: 'relative', margin: 'auto' }}>

        {/* Header */}
        <div className="modal-header">
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
              Tambah Proyek
            </h3>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              Isi data proyek baru
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onCancel}>✕</button>
        </div>

        {/* Form */}
        <div className="modal-grid">

          <input
            className="span-full"
            placeholder="Nama Proyek *"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
          />

          <input
            placeholder="No. Kontrak"
            value={form.nomorKontrak || ''}
            onChange={e => setForm({ ...form, nomorKontrak: e.target.value.toUpperCase() })}
          />

          <input
            placeholder="Instansi"
            value={form.instansi}
            onChange={e => setForm({ ...form, instansi: e.target.value })}
          />

          <input
            placeholder="Lokasi"
            value={form.lokasi}
            onChange={e => setForm({ ...form, lokasi: e.target.value })}
          />

          <input
            placeholder="Sumber Dana"
            value={form.sumberDana}
            onChange={e => setForm({ ...form, sumberDana: e.target.value })}
          />

          <input
            placeholder="PIC (Person In Charge)"
            value={form.pic || ''}
            onChange={e => setForm({ ...form, pic: e.target.value })}
          />

          {/* Nilai Anggaran dengan tooltip terbilang */}
          <div className="anggaran-wrap" style={{ position: 'relative' }}>
            <input
              style={{ paddingRight: 32 }}
              type="text"
              inputMode="numeric"
              placeholder="Nilai Anggaran (Rp)"
              value={formatNumber(form.nilaiAnggaran)}
              onChange={e => setForm({ ...form, nilaiAnggaran: parseNumber(e.target.value) })}
            />
            <span style={{
              position: 'absolute', right: 10, top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 11, fontWeight: 700, color: 'var(--text-soft)',
              pointerEvents: 'none', userSelect: 'none',
            }}>Rp</span>
            {keteranganAnggaran && (
              <div className="anggaran-tooltip">💰 {keteranganAnggaran}</div>
            )}
          </div>

          <input
            type="number"
            placeholder="Tahun Anggaran"
            value={form.tahunAnggaran}
            onChange={e => setForm({ ...form, tahunAnggaran: e.target.value })}
          />

          <input
            type="date"
            value={form.tanggalMulai}
            onChange={e => setForm({ ...form, tanggalMulai: e.target.value })}
          />

          <input
            type="number"
            placeholder="Durasi (hari)"
            value={form.durasiHari}
            onChange={e => setForm({ ...form, durasiHari: e.target.value })}
          />

          {form.tanggalMulai && form.durasiHari && (
            <div className="span-full" style={{ fontSize: 12, color: 'var(--text-muted)', padding: '2px 2px' }}>
              📅 Selesai: <strong style={{ color: 'var(--text)' }}>
                {hitungTanggalSelesai(form.tanggalMulai, form.durasiHari)}
              </strong>
            </div>
          )}

          <select
            value={form.division}
            onChange={e => setForm({ ...form, division: e.target.value, subDivision: '' })}
          >
            <option value="">-- Pilih Divisi --</option>
            {Object.entries(WORKFLOW_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>

          {form.division && WORKFLOW_CONFIG[form.division]?.subs ? (
            <select
              value={form.subDivision}
              onChange={e => setForm({ ...form, subDivision: e.target.value })}
            >
              <option value="">-- Pilih Sub Divisi --</option>
              {Object.entries(WORKFLOW_CONFIG[form.division].subs).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          ) : <div />}

          <select
            value={form.paymentStatus || 'Belum Bayar'}
            onChange={e => setForm({ ...form, paymentStatus: e.target.value })}
          >
            <option value="Belum Bayar">Belum Bayar</option>
            <option value="DP">DP</option>
            <option value="Termin 1">Termin 1</option>
            <option value="Termin 2">Termin 2</option>
            <option value="Termin 3">Termin 3</option>
            <option value="Pelunasan">Pelunasan</option>
          </select>

        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '9px 18px', borderRadius: 10,
              border: '1px solid var(--border)',
              background: 'var(--bg-card-soft)',
              color: 'var(--text)', fontSize: 13,
              cursor: 'pointer', fontFamily: 'inherit'
            }}
          >Batal</button>
          <button
            type="button"
            onClick={simpanProyek}
            style={{
              padding: '9px 24px', borderRadius: 10,
              border: 'none',
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              color: '#fff', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: '0 4px 14px rgba(59,130,246,0.4)'
            }}
          >Simpan Proyek</button>
        </div>

      </div>
      </div>
    </>
  )
}