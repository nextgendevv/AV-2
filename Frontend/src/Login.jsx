import React, { useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  throw new Error("VITE_API_URL is not configured in environment variables");
}

export default function Login({ onSwitch = () => {}, onAuth = () => {} }) {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setError('')

    if (!identifier.trim() || !password) {
      setError('Enter phone/email and password.')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ identifier: identifier.trim(), password })
      })

      const data = await response.json()
      if (!response.ok) {
        setError(data.message || 'Login failed.')
        return
      }

      if (!data.user || !data.token) {
        setError('Login did not return valid user data.')
        return
      }

      localStorage.setItem('authToken', data.token)
      localStorage.setItem('authUser', JSON.stringify(data.user))
      onAuth(data.user)
    } catch (err) {
      console.error(err)
      setError('Unable to login. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <h2>Login</h2>

        <div className="field">
          <label>Phone or Email</label>
          <input
            className="input"
            value={identifier}
            onChange={e => setIdentifier(e.target.value)}
            placeholder="Enter phone or email"
          />
        </div>

        <div className="field">
          <label>Password</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Enter password"
          />
        </div>

        {error && <div className="error-message">{error}</div>}

        <button className="btn primary" type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>

        <div className="auth-footer">
          Don't have an account?{' '}
          <button type="button" className="link" onClick={() => onSwitch('register')}>
            Register
          </button>
        </div>
      </form>
    </div>
  )
}
