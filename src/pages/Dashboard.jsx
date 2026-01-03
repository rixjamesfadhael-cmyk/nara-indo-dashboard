import { useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'

export default function Dashboard() {
  const [projects, setProjects] = useState([])

  useEffect(() => {
    const ref = collection(db, 'projects')
    const unsub = onSnapshot(ref, snap => {
      setProjects(snap.docs.map(d => d.data()))
    })
    return () => unsub()
  }, [])

  const total = projects.length
  const aktif = projects.filter(p => p.status === 'Aktif').length
  const selesai = projects.filter(p => p.status === 'Selesai').length
  const avgProgress =
    total === 0
      ? 0
      : Math.round(
          projects.reduce((a, b) => a + (Number(b.progress) || 0), 0) / total
        )

  return (
    <div style={grid}>
      <Card title="Total Proyek" value={total} />
      <Card title="Proyek Aktif" value={aktif} />
      <Card title="Proyek Selesai" value={selesai} />
      <Card title="Rata-rata Progress" value={`${avgProgress}%`} />
    </div>
  )
}

/* ===== COMPONENT ===== */

function Card({ title, value }) {
  return (
    <div style={card}>
      <small>{title}</small>
      <h2>{value}</h2>
    </div>
  )
}

/* ===== STYLE ===== */

const grid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 16
}

const card = {
  background: '#fff',
  border: '1px solid #ddd',
  padding: 20,
  borderRadius: 8
}
