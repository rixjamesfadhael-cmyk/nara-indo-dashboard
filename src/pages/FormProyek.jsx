import { useEffect, useState } from 'react'

/**
 * TEMPLATE STAGE FINAL (UX)
 */
export const STAGE_TEMPLATE = {
  konsultan: {
    perencanaan: { label: 'Perencanaan', progress: 0 },
    pengawasan: { label: 'Pengawasan', progress: 0 }
  },
  konstruksi: {
    pelaksanaan: { label: 'Pelaksanaan', progress: 0 }
  },
  pengadaan: {
    persiapan: { label: 'Persiapan', progress: 0 },
    proses: { label: 'Proses Pengadaan', progress: 0 },
    serahterima: { label: 'Serah Terima', progress: 0 }
  }
}

/**
 * Hitung progress global (UX core)
 */
const hitungProgressGlobal = stages => {
  if (!stages) return 0
  const values = Object.values(stages).map(s => Number(s.progress) || 0)
  if (!values.length) return 0
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length)
}

export default function FormProyek({
  mode = 'add',           // add | edit
  initialData = null,     // data proyek lama
  onCancel,
  onSubmit
}) {
  /**
   * STATE UTAMA
   */
  const [data, setData] = useState({
    name: '',
    budget: '',
    category: 'konsultan',
    stages: STAGE_TEMPLATE.konsultan,
    paymentStatus: 'Belum Bayar',
    status: 'AKTIF'
  })

  /**
   * INIT DATA (EDIT / DATA LAMA)
   */
  useEffect(() => {
    if (!initialData) return

    const category = initialData.category || 'konsultan'
    const safeStages =
      initialData.stages && Object.keys(initialData.stages).length
        ? initialData.stages
        : STAGE_TEMPLATE[category]

    setData({
      ...initialData,
      category,
      stages: safeStages
    })
  }, [initialData])

  /**
   * GANTI KATEGORI
   */
  const handleCategoryChange = cat => {
    setData(prev => ({
      ...prev,
      category: cat,
      stages: STAGE_TEMPLATE[cat]
    }))
  }

  /**
   * UPDATE PROGRESS STAGE (MAJU / MUNDUR)
   */
  const updateStageProgress = (key, value) => {
    const val = Math.max(0, Math.min(100, Number(value)))

    setData(prev => ({
      ...prev,
      stages: {
        ...prev.stages,
        [key]: {
          ...prev.stages[key],
          progress: val
        }
      }
    }))
  }

  /**
   * SUBMIT (UX FINAL CHECK)
   */
  const handleSubmit = () => {
    if (!data.name) {
      alert('Nama proyek wajib diisi')
      return
    }

    const globalProgress = hitungProgressGlobal(data.stages)
    let status = data.status || 'AKTIF'

    // logic arsip
    if (
      globalProgress === 100 &&
      data.paymentStatus === 'Pelunasan'
    ) {
      const ok = confirm('Progress 100% & pembayaran lunas. Arsipkan proyek?')
      if (ok) status = 'ARSIP'
    }

    // rollback dari arsip
    if (status === 'ARSIP' && globalProgress < 100) {
      status = 'AKTIF'
    }

    onSubmit({
      ...data,
      progress: globalProgress,
      status
    })
  }

  /**
   * UI SENGAJA MINIMAL (UX FIRST)
   */
  return (
    <div>
      <h3>{mode === 'edit' ? 'Edit Proyek' : 'Tambah Proyek'}</h3>

      <input
        placeholder="Nama Proyek"
        value={data.name}
        onChange={e => setData({ ...data, name: e.target.value })}
      />

      <input
        type="number"
        placeholder="Nilai Kontrak"
        value={data.budget}
        onChange={e => setData({ ...data, budget: e.target.value })}
      />

      <select
        value={data.category}
        onChange={e => handleCategoryChange(e.target.value)}
      >
        <option value="konsultan">Konsultan</option>
        <option value="konstruksi">Konstruksi</option>
        <option value="pengadaan">Pengadaan</option>
      </select>

      <hr />

      {Object.entries(data.stages).map(([key, stage]) => (
        <div key={key}>
          <label>{stage.label}</label>
          <input
            type="number"
            min="0"
            max="100"
            value={stage.progress}
            onChange={e => updateStageProgress(key, e.target.value)}
          />
        </div>
      ))}

      <hr />

      <select
        value={data.paymentStatus}
        onChange={e =>
          setData({ ...data, paymentStatus: e.target.value })
        }
      >
        <option>Belum Bayar</option>
        <option>DP</option>
        <option>Termin 1</option>
        <option>Termin 2</option>
        <option>Termin 3</option>
        <option>Pelunasan</option>
      </select>

      <p>
        Progress Global:{' '}
        <strong>{hitungProgressGlobal(data.stages)}%</strong>
      </p>

      <button onClick={onCancel}>Batal</button>
      <button onClick={handleSubmit}>Simpan</button>
    </div>
  )
}
