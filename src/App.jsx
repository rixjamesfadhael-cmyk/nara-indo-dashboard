import { signInAnonymously } from 'firebase/auth'
import { auth } from './firebase'
import { useEffect } from 'react'

export default function App() {
  useEffect(() => {
    signInAnonymously(auth)
  }, [])

  return <h1>Aplikasi siap dijalankan</h1>
}
