import React, { useEffect, useState } from 'react'
import './App.css'
import Login from './Login'
import Register from './Register'
import Profile from './Profile'
import Wallet from './Wallet'
import TopUp from './TopUp'
import Home from './Home'

function App() {
  const [view, setView] = useState('login')
  const [user, setUser] = useState(null)

  useEffect(() => {
    const storedUser = localStorage.getItem('authUser')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
      setView('home')
    }
  }, [])

  useEffect(() => {
    if (user && view === 'login') {
      setView('home')
    }
  }, [user, view])

  function handleAuth(userData) {
    setUser(userData)
    setView('home')
  }

  function handleLogout() {
    localStorage.removeItem('authToken')
    localStorage.removeItem('authUser')
    setUser(null)
    setView('login')
    setMobileMenuOpen(false)
  }

  if (view === 'login') return <Login onSwitch={setView} onAuth={handleAuth} />
  if (view === 'register') return <Register onSwitch={setView} />

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <div className="logo">Online</div>
          <div className="header-tag">Your digital lifestyle platform</div>
        </div>

        <nav className="header-nav">
          <button className={`nav-link ${view === 'home' ? 'active' : ''}`} onClick={() => setView('home')}>Home</button>
          <button className={`nav-link ${view === 'topup' ? 'active' : ''}`} onClick={() => setView(user ? 'topup' : 'login')}>Top Up</button>
          <button className={`nav-link ${view === 'wallet' ? 'active' : ''}`} onClick={() => setView(user ? 'wallet' : 'login')}>Wallet</button>
          <button className={`nav-link ${view === 'profile' ? 'active' : ''}`} onClick={() => setView(user ? 'profile' : 'login')}>Profile</button>
        </nav>

        <div className="header-right">
          {user ? (
            <>
              <div className="header-user">{user.name}</div>
              <button className="btn outline" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <button className="btn" onClick={() => setView('login')}>Login</button>
              <button className="btn" onClick={() => setView('register')}>Register</button>
            </>
          )}
          <button className="bell" aria-label="Notifications">🔔</button>
        </div>
      </header>

      <main className="container">
        {view === 'home' && <Home user={user} />}
        {view === 'profile' && <Profile user={user} onLogout={handleLogout} />}
        {view === 'wallet' && <Wallet user={user} />}
        {view === 'topup' && <TopUp user={user} />}
      </main>

      <nav className="bottom-nav">
        <button className={`nav-item ${view === 'home' ? 'active' : ''}`} onClick={() => setView('home')}>Home</button>
        <button className={`nav-item ${view === 'topup' ? 'active' : ''}`} onClick={() => setView(user ? 'topup' : 'login')}>Top Up</button>
        <button className={`nav-item ${view === 'wallet' ? 'active' : ''}`} onClick={() => setView(user ? 'wallet' : 'login')}>Wallet</button>
        <button className={`nav-item ${view === 'profile' ? 'active' : ''}`} onClick={() => setView(user ? 'profile' : 'login')}>Profile</button>
      </nav>
    </div>
  )
}

export default App
