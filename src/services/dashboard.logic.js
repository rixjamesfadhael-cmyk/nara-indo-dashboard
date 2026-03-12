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

/* ================= STATUS DISTRIBUTION ================= */

const safeProjects = activeProjects.filter(
  p => (p.progress || 0) >= 50 && (p.progress || 0) < 100
)

const dangerProjects = activeProjects.filter(
  p => (p.progress || 0) < 30
)

const doneProjects = activeProjects.filter(
  p => (p.progress || 0) === 100
)

/* ================= LOWEST PROGRESS ================= */

const lowestProgressProject = activeProjects
  .slice()
  .sort((a, b) => (a.progress || 0) - (b.progress || 0))[0]

/* ================= DEADLINE INSIGHT ================= */

const nearestDeadline = activeProjects
  .filter(p => p.tanggalSelesai)
  .slice()
  .sort(
    (a, b) =>
      new Date(a.tanggalSelesai) -
      new Date(b.tanggalSelesai)
  )
  .slice(0, 3)

  return {
  activeProjects,
  archivedProjects,
  totalNilaiAktif,
  avgProgress,
  butuhPerhatian,

  safeProjects,
  dangerProjects,
  doneProjects,
  lowestProgressProject,
  nearestDeadline
}
}
