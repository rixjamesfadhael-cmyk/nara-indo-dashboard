import { useEffect, useState } from 'react'
import {
  Chart as ChartJS,
  ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, PointElement, LineElement
} from 'chart.js'
import { Pie, Line } from 'react-chartjs-2'
import { subscribeProjects } from '../services/project.service'
import { buildDashboardSummary } from '../services/dashboard.logic'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement)

const rupiah = (n = 0) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

function useIsDark() {
  const [isDark, setIsDark] = useState(
    () => document.body.getAttribute('data-theme') === 'dark'
  )
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.body.getAttribute('data-theme') === 'dark')
    })
    observer.observe(document.body, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [])
  return isDark
}

export default function Dashboard({ goToProject }) {
  const [projects, setProjects] = useState([])
  const isDark = useIsDark()

  useEffect(() => { return subscribeProjects(setProjects) }, [])

  const {
    activeProjects, archivedProjects, totalNilaiAktif,
    avgProgress, butuhPerhatian, safeProjects,
    dangerProjects, doneProjects, lowestProgressProject, nearestDeadline
  } = buildDashboardSummary(projects)

  const labelColor = isDark ? '#e2e8f0' : '#1e293b'
  const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'

  const chartOptions = {
    plugins: { legend: { labels: { color: labelColor, font: { size: 12 } } } }
  }

  const lineOptions = {
    plugins: { legend: { labels: { color: labelColor, font: { size: 12 } } } },
    scales: {
      x: { ticks: { color: labelColor }, grid: { color: gridColor } },
      y: { ticks: { color: labelColor }, grid: { color: gridColor } }
    }
  }

  const pieData = {
    labels: ['Aktif', 'Arsip'],
    datasets: [{ data: [activeProjects.length, archivedProjects.length], backgroundColor: ['#2563eb', '#16a34a'] }]
  }

  const statusData = {
    labels: ['Safe', 'Danger', 'Done'],
    datasets: [{ data: [safeProjects.length, dangerProjects.length, doneProjects.length], backgroundColor: ['#16a34a', '#dc2626', '#2563eb'] }]
  }

  const lineData = {
    labels: activeProjects.slice(0, 10).map(p => p.name),
    datasets: [{
      label: 'Progress (%)',
      data: activeProjects.slice(0, 10).map(p => p.progress || 0),
      borderColor: '#2563eb', backgroundColor: 'rgba(37,99,235,0.2)',
      tension: 0.4, fill: true
    }]
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* SUMMARY CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
        <Card title="Proyek Aktif" value={activeProjects.length} />
        <Card title="Total Nilai Aktif" value={rupiah(totalNilaiAktif)} />
        <Card title="Proyek Arsip" value={archivedProjects.length} />
        <Card title="Rata-rata Progress" value={`${avgProgress}%`} />
        <Card title="Perlu Perhatian" value={butuhPerhatian.length} />
        <Card title="Progress Terendah" value={lowestProgressProject ? `${lowestProgressProject.progress || 0}%` : '-'} />
      </div>

      {/* PERLU PERHATIAN */}
      <div className="app-card">
        <h3 style={{ margin: '0 0 12px', color: 'var(--text)' }}>Perlu Perhatian</h3>
        {butuhPerhatian.length === 0 ? (
          <small style={{ color: 'var(--text-muted)' }}>Semua proyek dalam kondisi baik</small>
        ) : (
          butuhPerhatian.map(p => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14, marginBottom: 6 }}>
              <span style={{ color: 'var(--text)' }}>• {p.name} ({p.progress || 0}%)</span>
              <button
                onClick={() => goToProject(p.id)}
                style={{ fontSize: 12, color: '#2563eb', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                Lihat
              </button>
            </div>
          ))
        )}
      </div>

      {/* DEADLINE */}
      <div className="app-card">
        <h3 style={{ margin: '0 0 12px', color: 'var(--text)' }}>Deadline Terdekat</h3>
        {nearestDeadline.length === 0 ? (
          <small style={{ color: 'var(--text-muted)' }}>Tidak ada deadline</small>
        ) : (
          nearestDeadline.map(p => (
            <div key={p.id} style={{ fontSize: 14, marginBottom: 6, color: 'var(--text)' }}>• {p.name}</div>
          ))
        )}
      </div>

      {/* CHARTS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        <div className="app-card">
          <h3 style={{ margin: '0 0 12px', color: 'var(--text)' }}>Komposisi Proyek</h3>
          <Pie data={pieData} options={chartOptions} />
        </div>
        <div className="app-card">
          <h3 style={{ margin: '0 0 12px', color: 'var(--text)' }}>Status Proyek</h3>
          <Pie data={statusData} options={chartOptions} />
        </div>
        <div className="app-card">
          <h3 style={{ margin: '0 0 12px', color: 'var(--text)' }}>Progress Proyek Aktif</h3>
          <Line data={lineData} options={lineOptions} />
        </div>
      </div>
    </div>
  )
}

function Card({ title, value }) {
  const length = String(value).length
  let size = 28
  if (length > 16) size = 18
  else if (length > 12) size = 22
  else if (length > 9) size = 24
  return (
    <div className="app-card">
      <div className="app-card-title">{title}</div>
      <div className="app-card-value" style={{ fontSize: size }}>{value}</div>
    </div>
  )
}