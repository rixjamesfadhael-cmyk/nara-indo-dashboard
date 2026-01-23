import { useEffect, useState } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from './firebase'

import Login from './Login'
import Layout from './components/Layout'
import Sidebar from './components/Sidebar'
import Header from './components/Header'

import Dashboard from './pages/Dashboard'
import Proyek from './pages/Proyek'
import Histori from './pages/Histori'
import Arsip from './pages/Arsip'

export default function App() {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState('viewer')
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState('dashboard')
  const [theme, setTheme] = useState('light')

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async currentUser => {
      if (currentUser) {
        setUser(currentUser)

        const ref = doc(db, 'users', currentUser.uid)
        const snap = await getDoc(ref)

        if (snap.exists()) {
          setRole(snap.data().role || 'viewer')
        } else {
          setRole('viewer')
        }
      } else {
        setUser(null)
      }

      setLoading(false)
    })

    return () => unsub()
  }, [])

  if (loading) return <p>Loading...</p>
  if (!user) return <Login />

  let content = null

  switch (page) {
    case 'dashboard':
      content = <Dashboard />
      break
    case 'projects':
      content = <Proyek role={role} />
      break
    case 'history':
      content = <Histori />
      break
    case 'archives':
      content = <Arsip role={role} />
      break
    default:
      content = <Dashboard />
  }

  return (
    <Layout
      theme={theme}
      sidebar={
        <Sidebar
          page={page}
          setPage={setPage}
        />
      }
      header={
        <Header
          title={`Aplikasi Manajemen Proyek (${role.toUpperCase()})`}
          theme={theme}
          toggleTheme={() =>
            setTheme(t => (t === 'light' ? 'dark' : 'light'))
          }
        />
      }
    >
      <div key={page}>
        {content}
      </div>
    </Layout>
  )
}
