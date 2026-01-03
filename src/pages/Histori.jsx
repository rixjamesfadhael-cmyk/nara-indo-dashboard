import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db } from '../firebase'

export default function Histori() {
  const [logs, setLogs] = useState([])

  useEffect(() => {
    const q = query(
      collection(db, 'activity_logs'),
      orderBy('createdAt', 'desc')
    )

    const unsub = onSnapshot(q, snapshot => {
      setLogs(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
    })

    return () => unsub()
  }, [])

  return (
    <div style={{ padding: 20 }}>
      <h2>Histori Aktivitas</h2>

      {logs.length === 0 && <p>Belum ada histori</p>}

      {logs.map(log => (
        <div
          key={log.id}
          style={{
            border: '1px solid #ddd',
            padding: 12,
            marginBottom: 10,
            borderRadius: 6
          }}
        >
          <strong>{log.action}</strong>
          <p>Proyek: {log.projectName}</p>
          <small>
            {log.createdAt
              ? new Date(log.createdAt.seconds * 1000).toLocaleString('id-ID')
              : '-'}
          </small>
        </div>
      ))}
    </div>
  )
}
