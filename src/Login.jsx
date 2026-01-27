import { useState } from 'react'
import { loginWithEmail } from './services/auth.service'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const login = async () => {
    setError('')
    setLoading(true)

    try {
      await loginWithEmail(email, password)
    } catch (err) {
      if (err.message === 'EMPTY_CREDENTIAL') {
        setError('Email dan password wajib diisi')
      } else {
        setError('Email atau password salah')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2>Login</h2>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />

      <br />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />

      <br />

      <button onClick={login} disabled={loading}>
        {loading ? 'Loading...' : 'Login'}
      </button>

      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  )
}
