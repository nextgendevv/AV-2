import React, { useState } from 'react'
import { API_URL, readApiJson } from './api'

export default function Register({ onSwitch = () => {} }) {
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [password, setPassword] = useState('')
  const [referredBy, setReferredBy] = useState(sessionStorage.getItem('referredBy') || '')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setError('')
    setMessage('')

    if (!name.trim() || !contact.trim() || !password) {
      setError('Name, phone/email and password are required.')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: name.trim(), contact: contact.trim(), password, referredBy })
      })

      const data = await readApiJson(response)
      if (!response.ok) {
        setError(data.message || 'Registration failed.')
        return
      }

      setMessage(data.message || 'Registration successful. Please login.')
      setName('')
      setContact('')
      setPassword('')
      sessionStorage.removeItem('referredBy')
      setTimeout(() => onSwitch('login'), 400)
    } catch (err) {
      console.error(err)
      setError('Unable to register. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <h2>Create account</h2>

        <div className="field">
          <label>Full name</label>
          <input
            className="input"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your name"
          />
        </div>

        <div className="field">
          <label>Phone or Email</label>
          <input
            className="input"
            value={contact}
            onChange={e => setContact(e.target.value)}
            placeholder="Phone or email"
          />
        </div>

        <div className="field">
          <label>Password</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Create password"
          />
        </div>

        {referredBy && (
          <div className="field" style={{ margin: '8px 0', fontSize: '13px', color: '#10b981', fontWeight: 600, textAlign: 'left' }}>
            ✓ Referral Applied (Code: {referredBy.slice(0, 8)}...)
          </div>
        )}

        {error && <div className="error-message">{error}</div>}
        {message && <div className="success-message">{message}</div>}

        <button className="btn primary" type="submit" disabled={loading}>
          {loading ? 'Registering...' : 'Register'}
        </button>

        <div className="auth-footer">
          Already have an account?{' '}
          <button type="button" className="link" onClick={() => onSwitch('login')}>
            Login
          </button>
        </div>
      </form>
    </div>
  )
}
