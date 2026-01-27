import { useEffect, useState } from 'react'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement
} from 'chart.js'
import { Pie, Line } from 'react-chartjs-2'
import { subscribeProjects } from '../services/project.service'
import { buildDashboardSummary } from '../services/dashboard.logic'

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement
)

const rupiah = (n = 0) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(n)

export default function Dashboard() {
  const [projects, setProjects] = useState([])

  useEffect(() => {
    return subscribeProjects(setProjects)
  }, [])

  const {
    aktif,
    selesai,
    totalNilaiAktif,
    avgProgress,
    butuhPerhatian
  } = buildDashboardSummary(projects)

  const pieData = {
    labels: ['Aktif', 'Selesai'],
    datasets: [
      {
        data: [aktif.length, selesai.length],
        backgroundColor: ['#2563eb', '#16a34a']
      }
    ]
  }

  const lineData = {
    labels: aktif.slice(0, 10).map(p => p.name),
    datasets: [
      {
        label: 'Progress (%)',
        data: aktif.slice(0, 10).map(p => p.progress || 0),
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37,99,235,0.2)',
        tension: 0.4,
        fill: true
      }
    ]
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* SUMMARY */}
      <div style={cardWrap}>
        <Card title="Proyek Aktif" value={aktif.length} />
        <Card title="Total Nilai Aktif" value={rupiah(totalNilaiAktif)} />
        <Card title="Proyek Selesai" value={selesai.length} />
        <Card title="Rata-rata Progress" value={`${avgProgress}%`} />
      </div>

      {/* ACTIONABLE */}
      <div style={card}>
        <h3>Perlu Perhatian</h3>
        {butuhPerhatian.length === 0 ? (
          <small>Semua proyek dalam kondisi baik</small>
        ) : (
          butuhPerhatian.map(p => (
            <div key={p.id} style={{ fontSize: 14 }}>
              • {p.name} ({p.progress || 0}%)
            </div>
          ))
        )}
      </div>

      {/* CHART */}
      <div style={chartWrap}>
        <div style={chartCard}>
          <h3>Komposisi Proyek</h3>
          <Pie data={pieData} />
        </div>
        <div style={chartCard}>
          <h3>Progress Proyek Aktif</h3>
          <Line data={lineData} />
        </div>
      </div>
    </div>
  )
}

function Card({ title, value }) {
  return (
    <div style={card}>
      <div style={cardTitle}>{title}</div>
      <div style={cardValue}>{value}</div>
    </div>
  )
}

/* STYLE */
const cardWrap = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 20
}

const card = {
  background: '#fff',
  borderRadius: 16,
  padding: 20,
  boxShadow: '0 10px 25px rgba(0,0,0,0.05)'
}

const cardTitle = {
  fontSize: 12,
  textTransform: 'uppercase',
  color: '#64748b',
  marginBottom: 8,
  fontWeight: 700
}

const cardValue = {
  fontSize: 28,
  fontWeight: 800,
  color: '#0f172a'
}

const chartWrap = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  gap: 20
}

const chartCard = {
  background: '#fff',
  borderRadius: 16,
  padding: 20,
  boxShadow: '0 10px 25px rgba(0,0,0,0.05)'
}
