import { useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'

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
    const ref = collection(db, 'projects')
    return onSnapshot(ref, snap => {
      setProjects(snap.docs.map(d => d.data()))
    })
  }, [])

  const aktif = projects.filter(p => p.status !== 'Selesai')
  const selesai = projects.filter(p => p.status === 'Selesai')

  const totalNilai = aktif.reduce(
    (a, b) => a + (Number(b.budget) || 0),
    0
  )

  const avgProgress =
    aktif.length === 0
      ? 0
      : (
          aktif.reduce((a, b) => a + (Number(b.progress) || 0), 0) /
          aktif.length
        ).toFixed(1)

  /* ===== CHART DATA ===== */

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
    labels: aktif.map((p, i) => p.name || `Proyek ${i + 1}`),
    datasets: [
      {
        label: 'Progress (%)',
        data: aktif.map(p => p.progress || 0),
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37,99,235,0.2)',
        tension: 0.4
      }
    ]
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* ===== CARDS ===== */}
      <div style={cardWrap}>
        <Card title="Proyek Aktif" value={aktif.length} />
        <Card title="Total Nilai Aktif" value={rupiah(totalNilai)} />
        <Card title="Proyek Selesai" value={selesai.length} />
        <Card title="Rata-rata Progress" value={`${avgProgress}%`} />
      </div>

      {/* ===== CHART ===== */}
      <div style={chartWrap}>
        <div style={chartCard}>
          <h3 style={chartTitle}>Komposisi Proyek</h3>
          <Pie data={pieData} />
        </div>

        <div style={chartCard}>
          <h3 style={chartTitle}>Progress Proyek Aktif</h3>
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

/* ===== STYLE ===== */

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
  letterSpacing: 1,
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

const chartTitle = {
  fontSize: 14,
  fontWeight: 700,
  marginBottom: 12,
  color: '#0f172a'
}
