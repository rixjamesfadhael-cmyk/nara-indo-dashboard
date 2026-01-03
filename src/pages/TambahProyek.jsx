import { useState } from 'react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

export default function TambahProyek({ onBack }) {
  const [name, setName] = useState('')
  const [client, setClient] = useState('')
  const [value, setValue] = useState('')
  const [status, setStatus] = useState('Aktif')
  const [progress, setProgress] = useState(0)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    await addDoc(collection(db, 'projects'), {
      name,
      client,
      value: Number(value),
      status,
      progress: Number(progress),
      createdAt: serverTimestamp()
    })

    setLoading(false)
    onBack() // kembali ke halaman Proyek
  }

  return (
    <div style={{ maxWidth: 400 }}>
      <h2>Tambah Proyek</h2>

      <form onSubmit={handleSubmit}>
        <div>
          <label>Nama Proyek</label><br />
          <input
            required
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>

        <br />

        <div>
          <label>Klien</label><br />
          <input
            required
            value={client}
            onChange={e => setClient(e.target.value)}
          />
        </div>

        <br />

        <div>
          <label>Nilai Kontrak</label><br />
          <input
            type="number"
            required
            value={value}
            onChange={e => setValue(e.target.value)}
          />
        </div>

        <br />

        <div>
          <label>Status</label><br />
          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
          >
            <option value="Aktif">Aktif</option>
            <option value="Selesai">Selesai</option>
          </select>
        </div>

        <br />

        <div>
          <label>Progress (%)</label><br />
          <input
            type="number"
            min="0"
            max="100"
            value={progress}
            onChange={e => setProgress(e.target.value)}
          />
        </div>

        <br />

        <button type="submit" disabled={loading}>
          {loading ? 'Menyimpan...' : 'Simpan'}
        </button>{' '}
        <button type="button" onClick={onBack}>
          Batal
        </button>
      </form>
    </div>
  )
}
