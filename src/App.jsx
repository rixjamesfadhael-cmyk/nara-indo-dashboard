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

  return (
    <Layout
      theme={theme}
      sidebar={
        <Sidebar
          page={page}
          setPage={setPage}
          onLogout={() => signOut(auth)}
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
      {page === 'dashboard' && <Dashboard />}
      {page === 'projects' && <Proyek role={role} />}
      {page === 'history' && <Histori />}
    </Layout>
  )
}
