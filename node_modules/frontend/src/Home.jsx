import React from 'react'

export default function Home({ user = null }) {
  const displayName = user?.name || 'Jayakaran'
  const cards = [
    { title: 'ONLINE STORE', label: 'Explore', description: 'Shop daily essentials' },
    { title: 'OFFER DEALS', label: 'Explore', description: 'Save with top deals' },
    { title: 'RECHARGES', label: 'Explore', description: 'Mobile, DTH & more' },
    { title: 'TICKET BOOKINGS', label: 'Explore', description: 'Travel tickets on demand' },
    { title: 'E-SHOPPING', label: 'Explore', description: 'Discover trending products' },
    { title: 'DISCOUNT VOUCHER', label: 'Explore', description: 'Coupons for every purchase' },
    { title: 'REAL ESTATE', label: 'Explore', description: 'Property options made easy' },
    { title: 'TECH PARTNER', label: 'Explore', description: 'Support for your devices' }
  ]

  return (
    <div className="home-page">
      <div className="home-shell">
        <section className="welcome-banner">
          <div className="welcome-card">
            <div className="banner-avatar">{displayName.charAt(0)}</div>
            <div>
              <div className="banner-title">Welcome to Online</div>
              <div className="banner-subtitle">{displayName} · FREE USER</div>
            </div>
          </div>
          <button className="bell-banner" aria-label="notifications">🔔</button>
        </section>

        <section className="home-hero">
          <div className="hero-copy">
            <span className="hero-tag">HOME DELIVERY</span>
            <h1>Fresh products for every need</h1>
            <p>Discover daily essentials, recharge services, travel offers and exclusive discounts in one polished dashboard.</p>
            <div className="hero-actions">
              <button className="btn primary">Order Now</button>
              <button className="btn secondary">View Offers</button>
            </div>
            <div className="hero-summary">
              <div className="hero-stat">
                <strong>24/7</strong>
                <span>Support Ready</span>
              </div>
              <div className="hero-stat">
                <strong>7+</strong>
                <span>Categories Live</span>
              </div>
              <div className="hero-stat">
                <strong>1M+</strong>
                <span>Orders Delivered</span>
              </div>
            </div>
          </div>
          <div className="hero-preview">
            <div className="hero-image">
              <div className="hero-callout">UP TO 50% OFF</div>
            </div>
          </div>
        </section>

        <section className="home-status">
          <article className="status-card user-status">
            <div className="status-avatar">{displayName.charAt(0)}</div>
            <div>
              <div className="status-name">{displayName}</div>
              <div className="status-label">FREE USER</div>
            </div>
            <button className="bell-button">🔔</button>
          </article>

          <article className="status-card compact-card">
            <div className="status-label">Today’s Deal</div>
            <div className="status-value">Up to 50% off</div>
          </article>

          <article className="status-card compact-card">
            <div className="status-label">Orders</div>
            <div className="status-value">12 completed</div>
          </article>

          <article className="status-card compact-card">
            <div className="status-label">Wallet</div>
            <div className="status-value">₹ 0.00</div>
          </article>
        </section>

        <section className="notice-banner">
          This service is under maintenance. Kindly wait for a while
        </section>

        <section className="upload-section">
          <button className="btn upload-button">Upload Bill</button>
        </section>

        <section className="feature-grid">
          {cards.map(card => (
            <article className="feature-card" key={card.title}>
              <div>
                <div className="feature-title">{card.title}</div>
                <div className="feature-description">{card.description}</div>
              </div>
              <button className="btn card-action">{card.label}</button>
            </article>
          ))}
        </section>
      </div>
    </div>
  )
}
