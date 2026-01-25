import { useEffect } from 'react'

/**
 * WORKFLOW RESMI
 * dipakai oleh:
 * - Konsultan
 * - Konstruksi
 * - Pengadaan
 * SELURUH TAHAP BISA:
 * - progress manual
 * - slider
 * - mundur
 * - naik otomatis
 */

export const WORKFLOW_TEMPLATE = {
  konsultan: {
    perencanaan: {
      label: 'Perencanaan',
      steps: [
        { key: 'survei', label: 'Survei & Pengumpulan Data', progress: 0 },
        { key: 'kak', label: 'Penyusunan KAK', progress: 0 },
        { key: 'ded', label: 'DED / Gambar Teknis', progress: 0 },
        { key: 'rab', label: 'RAB & Spesifikasi Teknis', progress: 0 }
      ]
    },
    pengawasan: {
      label: 'Pengawasan',
      steps: [
        { key: 'mingguan', label: 'Laporan Mingguan', progress: 0 },
        { key: 'bulanan', label: 'Laporan Bulanan', progress: 0 },
        { key: 'akhir', label: 'Laporan Akhir', progress: 0 }
      ]
    }
  },

  konstruksi: {
    pelaksanaan: {
      label: 'Pelaksanaan Konstruksi',
      steps: [
        { key: 'mobilisasi', label: 'Mobilisasi', progress: 0 },
        { key: 'struktur', label: 'Pekerjaan Struktur', progress: 0 },
        { key: 'arsitektur', label: 'Pekerjaan Arsitektur', progress: 0 },
        { key: 'mep', label: 'MEP', progress: 0 },
        { key: 'finishing', label: 'Finishing', progress: 0 },
        { key: 'pho', label: 'PHO', progress: 0 },
        { key: 'fho', label: 'FHO', progress: 0 }
      ]
    }
  },

  pengadaan: {
    proses: {
      label: 'Proses Pengadaan',
      steps: [
        { key: 'perencanaan', label: 'Perencanaan Pengadaan', progress: 0 },
        { key: 'pemilihan', label: 'Pemilihan Penyedia', progress: 0 },
        { key: 'kontrak', label: 'Kontrak', progress: 0 },
        { key: 'pengiriman', label: 'Pengiriman Barang/Jasa', progress: 0 },
        { key: 'serahterima', label: 'Serah Terima', progress: 0 }
      ]
    }
  }
}

/**
 * HITUNG PROGRESS GLOBAL
 */
export const hitungProgressWorkflow = workflow => {
  let total = 0
  let count = 0

  Object.values(workflow).forEach(section => {
    section.steps.forEach(step => {
      total += Number(step.progress || 0)
      count++
    })
  })

  return count === 0 ? 0 : Math.round(total / count)
}

/**
 * COMPONENT
 */
export default function ProjectWorkflow({ value, onChange }) {
  useEffect(() => {
    onChange({ ...value })
  }, [])

  const updateStep = (sectionKey, stepIndex, newProgress) => {
    const updated = { ...value }
    updated[sectionKey].steps[stepIndex].progress = newProgress
    onChange(updated)
  }

  return (
    <div style={{ marginTop: 12 }}>
      <strong>Workflow Proyek</strong>

      {Object.entries(value).map(([sectionKey, section]) => (
        <div key={sectionKey} style={{ marginTop: 12 }}>
          <strong>{section.label}</strong>

          {section.steps.map((step, i) => (
            <div key={step.key} style={{ marginTop: 6 }}>
              <small>{step.label}</small>
              <input
                type="number"
                min="0"
                max="100"
                value={step.progress}
                onChange={e =>
                  updateStep(
                    sectionKey,
                    i,
                    Math.max(0, Math.min(100, Number(e.target.value)))
                  )
                }
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
