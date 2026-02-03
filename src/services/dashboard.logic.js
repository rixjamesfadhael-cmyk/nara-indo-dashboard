export const buildDashboardSummary = projects => {
  const activeProjects = projects.filter(
    p => p.archived !== true
  )

  const archivedProjects = projects.filter(
    p => p.archived === true
  )

  const totalNilaiAktif = activeProjects.reduce(
    (a, b) => a + (Number(b.nilaiAnggaran) || 0),
    0
  )

  const avgProgress =
    activeProjects.length === 0
      ? 0
      : Math.round(
          activeProjects.reduce(
            (a, b) => a + (Number(b.progress) || 0),
            0
          ) / activeProjects.length
        )

  const butuhPerhatian = activeProjects
    .filter(p => (p.progress || 0) < 50)
    .sort((a, b) => (a.progress || 0) - (b.progress || 0))
    .slice(0, 5)

  return {
    activeProjects,
    archivedProjects,
    totalNilaiAktif,
    avgProgress,
    butuhPerhatian
  }
}
