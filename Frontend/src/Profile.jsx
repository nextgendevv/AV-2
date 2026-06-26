import React, { useEffect, useMemo, useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL

if (!API_URL) {
  throw new Error('VITE_API_URL is not configured in environment variables')
}

const menuItems = [
  { key: 'profile', label: 'Profile' },
  { key: 'activity', label: 'My Activity' },
  { key: 'mpin', label: 'Change M-Pin' },
  { key: 'referrals', label: 'Referral List' },
  { key: 'orders', label: 'Order History' },
  { key: 'purchase-history', label: 'Purchase Wallet History' },
  { key: 'transactions', label: 'Transaction History' },
  { key: 'earnings', label: 'Earning History' },
  { key: 'referral-link', label: 'Referral Link' },
  { key: 'store-management', label: 'Store Management' },
]

const sectionRoute = {
  profile: '/user/profile',
  activity: '/user/activities',
  orders: '/user/orders',
  'purchase-history': '/user/purchase-history',
  transactions: '/user/transactions',
  earnings: '/user/earnings',
  referrals: '/user/referrals',
  'referral-link': '/user/referral-link',
  'store-management': '/user/store-management',
}

export default function Profile({ user = null, refreshKey = 0, onLogout = () => {} }) {
  const [selected, setSelected] = useState('profile')
  const [sectionData, setSectionData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mpin, setMpin] = useState('')
  const [message, setMessage] = useState('')

  const name = user ? user.name : 'Jayakaran'
  const contact = user ? user.contact : 'freeuser@example.com'

  const currentEndpoint = sectionRoute[selected] || '/user/profile'

  useEffect(() => {
    async function loadSection() {
      if (!user) return
      if (selected === 'mpin') {
        setSectionData(null)
        setError('')
        return
      }

      const token = localStorage.getItem('authToken')
      if (!token) {
        setError('Login required to view this section.')
        return
      }

      setLoading(true)
      setError('')
      setMessage('')

      try {
        const response = await fetch(`${API_URL}${currentEndpoint}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const data = await response.json()
        if (!response.ok) {
          setError(data.message || 'Unable to load section data.')
          setSectionData(null)
          return
        }

        setSectionData(data)
      } catch (err) {
        console.error(err)
        setError('Unable to load section data. Please try again.')
        setSectionData(null)
      } finally {
        setLoading(false)
      }
    }

    loadSection()
  }, [user, selected, currentEndpoint, refreshKey])

  const summary = useMemo(() => {
    if (!sectionData) return {}
    return sectionData.summary || {}
  }, [sectionData])

  const renderSectionContent = () => {
    if (loading) return <div className="activity-loading">Loading section data...</div>
    if (error) return <div className="error-message">{error}</div>

    if (selected === 'profile') {
      return (
        <div className="profile-details">
          <div className="detail-row"><strong>Name</strong><span>{sectionData?.user?.name || name}</span></div>
          <div className="detail-row"><strong>Contact</strong><span>{contact}</span></div>
          <div className="detail-row"><strong>Email</strong><span>{sectionData?.user?.email || 'Not provided'}</span></div>
          <div className="detail-row"><strong>Referral Link</strong><span>{sectionData?.referralLink || 'Not available'}</span></div>
        </div>
      )
    }

    if (selected === 'mpin') {
      return (
        <form className="mpin-form" onSubmit={saveMpin}>
          <div className="field">
            <label>New M-PIN</label>
            <input
              className="input"
              type="password"
              maxLength="6"
              value={mpin}
              onChange={(e) => setMpin(e.target.value)}
              placeholder="Enter 4 or more digits"
            />
          </div>
          {message && <div className="success-message">{message}</div>}
          <button className="btn primary" type="submit">Save M-PIN</button>
        </form>
      )
    }

    if (selected === 'referral-link') {
      return (
        <div className="profile-details">
          <div className="detail-row referral-link"><span>{sectionData?.referralLink || 'No referral link available'}</span></div>
        </div>
      )
    }

    const listData = sectionData?.activities ||
      sectionData?.orders ||
      sectionData?.purchases ||
      sectionData?.transactions ||
      sectionData?.earnings ||
      sectionData?.referrals ||
      sectionData?.storeManagement || []

    if (!listData || listData.length === 0) {
      return <div className="activity-empty">No records found for this section.</div>
    }

    return (
      <div className="activity-list">
        {listData.map((item, index) => {
          if (selected === 'activity') {
            return (
              <div className="activity-item" key={`${item.title}-${index}-${item.createdAt}`}>
                <div><strong>{item.title}</strong></div>
                <div>{item.description}</div>
                <div className="activity-meta">₹ {item.amount?.toFixed(2) ?? '0.00'} • {new Date(item.createdAt).toLocaleString()}</div>
              </div>
            )
          }

          if (selected === 'orders') {
            return (
              <div className="activity-item" key={item.orderId || index}>
                <div><strong>{item.title}</strong> ({item.status})</div>
                <div>Order ID: {item.orderId}</div>
                <div className="activity-meta">₹ {item.amount?.toFixed(2) ?? '0.00'} • {new Date(item.createdAt).toLocaleString()}</div>
              </div>
            )
          }

          if (selected === 'purchase-history') {
            return (
              <div className="activity-item" key={item.purchaseId || index}>
                <div><strong>{item.title}</strong></div>
                <div>Payment: {item.paymentMethod}</div>
                <div className="activity-meta">₹ {item.amount?.toFixed(2) ?? '0.00'} • {new Date(item.createdAt).toLocaleString()}</div>
              </div>
            )
          }

          if (selected === 'transactions') {
            return (
              <div className="activity-item" key={`${item.transactionType}-${index}-${item.createdAt}`}>
                <div><strong>{item.transactionType}</strong></div>
                <div>{item.description}</div>
                <div className="activity-meta">₹ {item.amount?.toFixed(2) ?? '0.00'} • {new Date(item.createdAt).toLocaleString()}</div>
              </div>
            )
          }

          if (selected === 'earnings') {
            return (
              <div className="activity-item" key={`${item.source}-${index}-${item.createdAt}`}>
                <div><strong>{item.source}</strong></div>
                <div>Status: {item.status}</div>
                <div className="activity-meta">₹ {item.amount?.toFixed(2) ?? '0.00'} • {new Date(item.createdAt).toLocaleString()}</div>
              </div>
            )
          }

          if (selected === 'referrals') {
            return (
              <div className="activity-item" key={`${item.contact}-${index}-${item.referredAt}`}>
                <div><strong>{item.name}</strong></div>
                <div>{item.contact}</div>
                <div className="activity-meta">{item.status} • {new Date(item.referredAt).toLocaleString()}</div>
              </div>
            )
          }

          if (selected === 'store-management') {
            return (
              <div className="activity-item" key={`${item.storeName}-${index}-${item.createdAt}`}>
                <div><strong>{item.storeName}</strong></div>
                <div>{item.details}</div>
                <div className="activity-meta">{item.status} • {new Date(item.createdAt).toLocaleString()}</div>
              </div>
            )
          }

          return null
        })}
      </div>
    )
  }

  async function saveMpin(e) {
    e.preventDefault()
    setError('')
    setMessage('')

    if (!mpin || String(mpin).length < 4) {
      setError('Enter a 4-digit M-PIN.')
      return
    }

    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_URL}/user/mpin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ mpin: String(mpin) }),
      })

      const data = await response.json()
      if (!response.ok) {
        setError(data.message || 'Unable to update M-PIN.')
        return
      }

      setMessage(data.message || 'M-PIN updated successfully.')
      setMpin('')
    } catch (err) {
      console.error(err)
      setError('Unable to update M-PIN. Please try again.')
    }
  }

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
          {menuItems.map((item) => (
            <button
              key={item.key}
              className={`menu-item ${selected === item.key ? 'active' : ''}`}
              onClick={() => setSelected(item.key)}
            >
              {item.label}
            </button>
          ))}

          <div className="menu-actions">
            <button className="menu-action" onClick={onLogout}>Logout</button>
            <button className="menu-action danger">Delete Account</button>
          </div>
        </aside>

        <section className="profile-main">
          <div className="section-heading">
            <h2>{menuItems.find((item) => item.key === selected)?.label || 'Profile'}</h2>
            <div className="section-sub">Live backend data for this section</div>
          </div>

          <div className="wallet-grid">
            <div className="wallet large">
              <div className="wallet-title">Current Section</div>
              <div className="wallet-amount">{menuItems.find((item) => item.key === selected)?.label}</div>
            </div>

            <div className="wallet small-card">
              <div className="wallet-title">Total Activities</div>
              <div className="wallet-amount">{sectionData?.summary?.totalActivities ?? 0}</div>
            </div>

            <div className="wallet small-card">
              <div className="wallet-title">Total Orders</div>
              <div className="wallet-amount">{sectionData?.summary?.totalOrders ?? 0}</div>
            </div>

            <div className="wallet small-card">
              <div className="wallet-title">Total Earnings</div>
              <div className="wallet-amount">₹ {(sectionData?.summary?.totalEarnings ?? 0).toFixed(2)}</div>
            </div>
          </div>

          <div className="activity-section">{renderSectionContent()}</div>
        </section>
      </div>
    </div>
  )
}
