export const buildDashboardSummary = projects => {
  // 1. Proyek aktif (operasional)
  const aktif = projects.filter(p => p.archived !== true)

  // 2. Proyek selesai (final bisnis)
  const selesai = projects.filter(
    p =>
      p.archived === true &&
      Number(p.progress) === 100 &&
      p.paymentStatus === 'Lunas'
  )

  // 3. Total nilai proyek aktif
  const totalNilaiAktif = aktif.reduce(
    (a, b) => a + (Number(b.nilaiAnggaran) || 0),
    0
  )

  // 4. Rata-rata progress proyek aktif
  const avgProgress =
    aktif.length === 0
      ? 0
      : Math.round(
          aktif.reduce(
            (a, b) => a + (Number(b.progress) || 0),
            0
          ) / aktif.length
        )

  // 5. Proyek aktif yang perlu perhatian
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
