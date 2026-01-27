export const buildDashboardSummary = projects => {
  const aktif = projects.filter(p => p.status !== 'Selesai')
  const selesai = projects.filter(p => p.status === 'Selesai')

  const totalNilaiAktif = aktif.reduce(
    (a, b) => a + (Number(b.budget) || 0),
    0
  )

  const avgProgress =
    aktif.length === 0
      ? 0
      : Math.round(
          aktif.reduce(
            (a, b) => a + (Number(b.progress) || 0),
            0
          ) / aktif.length
        )

  const butuhPerhatian = aktif
    .filter(p => (p.progress || 0) < 50)
    .sort((a, b) => (a.progress || 0) - (b.progress || 0))
    .slice(0, 5)

  return {
    aktif,
    selesai,
    totalNilaiAktif,
    avgProgress,
    butuhPerhatian
  }
}
