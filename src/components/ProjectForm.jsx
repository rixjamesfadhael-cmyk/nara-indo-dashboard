export default function ProjectForm({
  adding,
  form,
  setForm,
  simpanProyek,
  WORKFLOW_CONFIG,
  hitungTanggalSelesai
}) {
  if (!adding) return null

  return (
    <div style={{ marginTop: 16, background: '#fff', padding: 16 }}>
      <h3>Tambah Proyek</h3>

      <input
        placeholder="Nama Proyek"
        value={form.name}
        onChange={e => setForm({ ...form, name: e.target.value })}
      />
      <input
  placeholder="No. Kontrak"
  value={form.nomorKontrak || ''}
  onChange={e =>
    setForm({
      ...form,
      nomorKontrak: e.target.value.toUpperCase()
    })
  }
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
        type="number"
        placeholder="Nilai Anggaran"
        value={form.nilaiAnggaran}
        onChange={e => setForm({ ...form, nilaiAnggaran: e.target.value })}
      />

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
        <div>
          Tanggal Selesai:{' '}
          <strong>
            {hitungTanggalSelesai(form.tanggalMulai, form.durasiHari)}
          </strong>
        </div>
      )}

      <select
        value={form.division}
        onChange={e =>
          setForm({ ...form, division: e.target.value, subDivision: '' })
        }
      >
        <option value="">-- Pilih Divisi --</option>
        {Object.entries(WORKFLOW_CONFIG).map(([k, v]) => (
          <option key={k} value={k}>{v.label}</option>
        ))}
      </select>

      {form.division && WORKFLOW_CONFIG[form.division].subs && (
        <select
          value={form.subDivision}
          onChange={e =>
            setForm({ ...form, subDivision: e.target.value })
          }
        >
          <option value="">-- Pilih Sub --</option>
          {Object.entries(WORKFLOW_CONFIG[form.division].subs).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      )}

      <button onClick={simpanProyek}>Simpan</button>
    </div>
  )
}
