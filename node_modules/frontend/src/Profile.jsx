import React from 'react'

export default function Profile({ user = null, onLogout = () => {} }) {
  const name = user ? user.name : 'Jayakaran'
  const contact = user ? user.contact : 'freeuser@example.com'

  const menu = [
    'Profile',
    'My Activity',
    'Change M-Pin',
    'Referral List',
    'Order History',
    'Purchase Wallet History',
    'Transaction History',
    'Earning History',
    'Referral Link',
    'Store Management',
  ]

  return (
    <div className="profile-page">
      <div className="profile-top">
        <div className="profile-hero">
          <div className="hero-avatar">{(name || 'U').charAt(0)}</div>
          <div className="hero-info">
            <div className="hero-name">{name}</div>
            <div className="hero-role">FREE USER</div>
          </div>
        </div>
      </div>

      <div className="profile-content">
        <aside className="profile-menu">
          {menu.map((m) => (
            <button className="menu-item" key={m}>{m}</button>
          ))}

          <div className="menu-actions">
            <button className="menu-action" onClick={onLogout}>Logout</button>
            <button className="menu-action danger">Delete Account</button>
          </div>
        </aside>

        <section className="profile-main">
          <div className="wallet-grid">
            <div className="wallet large">
              <div className="wallet-title">Available Balance</div>
              <div className="wallet-amount">₹ 0.00</div>
              <button className="btn primary small">Top Up</button>
            </div>

            <div className="wallet small-card">
              <div className="wallet-title">Cashback Wallet</div>
              <div className="wallet-amount">₹ 0.00</div>
            </div>

            <div className="wallet small-card">
              <div className="wallet-title">Earning Wallet</div>
              <div className="wallet-amount">₹ 0.00</div>
            </div>

            <div className="wallet small-card">
              <div className="wallet-title">Purchase Wallet</div>
              <div className="wallet-amount">₹ 0.00</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
