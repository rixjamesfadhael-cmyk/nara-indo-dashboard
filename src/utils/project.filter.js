// src/utils/project.filter.js

/**
 * Normalize value to searchable string
 */
const normalize = value => {
  if (value === null || value === undefined) return ''
  return String(value).toLowerCase()
}

/**
 * Global project filter
 * @param {Array} projects
 * @param {String} keyword
 * @param {Function} hitungStatusWaktu
 */
export const filterProjects = (projects, keyword, hitungStatusWaktu) => {
  if (!keyword || !keyword.trim()) return projects

  const q = keyword.toLowerCase()

  return projects.filter(p => {
    const status = hitungStatusWaktu(p)

    const fields = [
      p.name,
      p.nomorKontrak,
      p.instansi,
      p.lokasi,
      p.sumberDana,
      p.nilaiAnggaran,
      p.tahunAnggaran,
      p.division,
      p.subDivision,
      p.paymentStatus,
      status?.label,
      status?.info
    ]

    return fields.some(field =>
      normalize(field).includes(q)
    )
  })
}
