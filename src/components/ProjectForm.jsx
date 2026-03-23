import { formatNumber, parseNumber } from '../utils/currency'

export default function ProjectForm({
  adding, form, setForm, simpanProyek,
  WORKFLOW_CONFIG, hitungTanggalSelesai
}) {
  if (!adding) return null

  const inputStyle = {
    width: '100%',
    padding: '8px 10px',
    borderRadius: 8,
    border: '1px solid var(--border)',
    background: 'var(--bg-input)',
    color: 'var(--text)',
    fontSize: 13,
    fontFamily: 'inherit'
  }

  const btnBase = {
    padding: '6px 14px', borderRadius: 8,
    border: '1px solid var(--border)',
    background: 'var(--bg-card-soft)',
    color: 'var(--text)', fontSize: 13,
    cursor: 'pointer', fontFamily: 'inherit'
  }

  return (
    <div style={{
      marginTop: 16, padding: 16, borderRadius: 12,
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      boxShadow: 'var(--shadow)'
    }}>
      <h3 style={{ margin: '0 0 12px', color: 'var(--text)' }}>Tambah Proyek</h3>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>

        <input style={{ ...inputStyle, gridColumn: '1 / -1' }}
          placeholder="Nama Proyek"
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })} />

        <input style={inputStyle}
          placeholder="No. Kontrak"
          value={form.nomorKontrak || ''}
          onChange={e => setForm({ ...form, nomorKontrak: e.target.value.toUpperCase() })} />

        <input style={inputStyle}
          placeholder="Instansi"
          value={form.instansi}
          onChange={e => setForm({ ...form, instansi: e.target.value })} />

        <input style={inputStyle}
          placeholder="Lokasi"
          value={form.lokasi}
          onChange={e => setForm({ ...form, lokasi: e.target.value })} />

        <input style={inputStyle}
          placeholder="Sumber Dana"
          value={form.sumberDana}
          onChange={e => setForm({ ...form, sumberDana: e.target.value })} />

        <input style={inputStyle}
          placeholder="PIC (Person In Charge)"
          value={form.pic || ''}
          onChange={e => setForm({ ...form, pic: e.target.value })} />

        <input style={inputStyle}
          type="text" inputMode="numeric"
          placeholder="Nilai Anggaran"
          value={formatNumber(form.nilaiAnggaran)}
          onChange={e => setForm({ ...form, nilaiAnggaran: parseNumber(e.target.value) })} />

        <input style={inputStyle}
          type="number"
          placeholder="Tahun Anggaran"
          value={form.tahunAnggaran}
          onChange={e => setForm({ ...form, tahunAnggaran: e.target.value })} />

        <input style={inputStyle}
          type="date"
          placeholder="Tanggal Mulai"
          value={form.tanggalMulai}
          onChange={e => setForm({ ...form, tanggalMulai: e.target.value })} />

        <input style={inputStyle}
          type="number"
          placeholder="Durasi (hari)"
          value={form.durasiHari}
          onChange={e => setForm({ ...form, durasiHari: e.target.value })} />

        {form.tanggalMulai && form.durasiHari && (
          <div style={{ gridColumn: '1 / -1', fontSize: 12, color: 'var(--text-muted)' }}>
            Tanggal Selesai:{' '}
            <strong style={{ color: 'var(--text)' }}>
              {hitungTanggalSelesai(form.tanggalMulai, form.durasiHari)}
            </strong>
          </div>
        )}

        <select style={inputStyle}
          value={form.division}
          onChange={e => setForm({ ...form, division: e.target.value, subDivision: '' })}>
          <option value="">-- Pilih Divisi --</option>
          {Object.entries(WORKFLOW_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>

        {form.division && WORKFLOW_CONFIG[form.division]?.subs && (
          <select style={inputStyle}
            value={form.subDivision}
            onChange={e => setForm({ ...form, subDivision: e.target.value })}>
            <option value="">-- Pilih Sub Divisi --</option>
            {Object.entries(WORKFLOW_CONFIG[form.division].subs).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        )}

        <select style={inputStyle}
          value={form.paymentStatus || 'Belum Bayar'}
          onChange={e => setForm({ ...form, paymentStatus: e.target.value })}>
          <option value="Belum Bayar">Belum Bayar</option>
          <option value="DP">DP</option>
          <option value="Termin 1">Termin 1</option>
          <option value="Termin 2">Termin 2</option>
          <option value="Termin 3">Termin 3</option>
          <option value="Pelunasan">Pelunasan</option>
        </select>

      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
        <button
          style={{ ...btnBase, background: '#2563eb', color: '#fff', border: '1px solid #2563eb' }}
          onClick={simpanProyek}
        >Simpan Proyek</button>
      </div>
    </div>
  )
}