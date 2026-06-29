import React, { useEffect, useMemo, useState } from 'react'
import { API_URL, readApiJson } from './api'

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

export default function Profile({ user = null, refreshKey = 0, onLogout = () => {}, onUnauthorized = () => {} }) {
  const [selected, setSelected] = useState('profile')
  const [sectionData, setSectionData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mpin, setMpin] = useState('')
  const [message, setMessage] = useState('')

  // Store forms state
  const [storeFormOpen, setStoreFormOpen] = useState(false)
  const [storeName, setStoreName] = useState('')
  const [storeDetails, setStoreDetails] = useState('')
  const [storeLoading, setStoreLoading] = useState(false)

  // Referral form state
  const [refFormOpen, setRefFormOpen] = useState(false)
  const [refName, setRefName] = useState('')
  const [refContact, setRefContact] = useState('')
  const [refLoading, setRefLoading] = useState(false)

  const [copied, setCopied] = useState(false)

  const name = user ? user.name : 'Jayakaran'
  const contact = user ? user.contact : 'freeuser@example.com'

  const currentEndpoint = sectionRoute[selected] || '/user/profile'

  const loadSection = async () => {
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

      if (response.status === 401) {
        onUnauthorized()
        return
      }

      const data = await readApiJson(response)
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

  useEffect(() => {
    loadSection()
  }, [user, selected, currentEndpoint, refreshKey])

  const summary = useMemo(() => {
    if (!sectionData) return {}
    return sectionData.summary || {}
  }, [sectionData])

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

      if (response.status === 401) {
        onUnauthorized()
        return
      }

      const data = await readApiJson(response)
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

  async function createStore(e) {
    e.preventDefault()
    if (!storeName.trim()) {
      setError('Store Name is required.')
      return
    }

    setStoreLoading(true)
    setError('')
    setMessage('')
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_URL}/user/activities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          type: 'store',
          title: storeName.trim(),
          description: storeDetails.trim() || 'Active Store',
          status: 'Active'
        })
      })

      if (response.status === 401) {
        onUnauthorized()
        return
      }

      const data = await readApiJson(response)
      if (!response.ok) {
        setError(data.message || 'Failed to create store.')
        return
      }

      setMessage('Store registered successfully!')
      setStoreName('')
      setStoreDetails('')
      setStoreFormOpen(false)
      loadSection()
    } catch (err) {
      console.error(err)
      setError('Unable to register store. Please try again.')
    } finally {
      setStoreLoading(false)
    }
  }

  async function createReferral(e) {
    e.preventDefault()
    if (!refName.trim() || !refContact.trim()) {
      setError('Name and contact details are required.')
      return
    }

    setRefLoading(true)
    setError('')
    setMessage('')
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_URL}/user/activities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          type: 'referral',
          title: refName.trim(),
          description: `Manual referred: ${refName.trim()}`,
          status: 'Active',
          metadata: {
            name: refName.trim(),
            contact: refContact.trim()
          }
        })
      })

      if (response.status === 401) {
        onUnauthorized()
        return
      }

      const data = await readApiJson(response)
      if (!response.ok) {
        setError(data.message || 'Failed to create referral.')
        return
      }

      setMessage('Referral registered successfully!')
      setRefName('')
      setRefContact('')
      setRefFormOpen(false)
      loadSection()
    } catch (err) {
      console.error(err)
      setError('Unable to register referral. Please try again.')
    } finally {
      setRefLoading(false)
    }
  }

  const handleCopyLink = (shareUrl) => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

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
      const shareUrl = sectionData?.referralLink || `${window.location.origin}?ref=${user?.id || ''}`;
      return (
        <div className="profile-details" style={{ textAlign: 'left' }}>
          <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '14px' }}>
            Share this link to refer friends. When they register, you will instantly receive a ₹50.00 cash reward in your Earning Wallet!
          </p>
          <div className="detail-row referral-link" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '14px', padding: 0, border: 'none' }}>
            <span style={{ wordBreak: 'break-all', fontSize: '14px', background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontWeight: '600', color: '#aa3bff' }}>
              {shareUrl}
            </span>
            <button 
              className="btn primary" 
              onClick={() => handleCopyLink(shareUrl)}
            >
              {copied ? '✓ Copied to Clipboard!' : 'Copy Referral Link'}
            </button>
          </div>
        </div>
      )
    }

    if (selected === 'store-management') {
      const listData = sectionData?.storeManagement || []
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {message && <div className="success-message">{message}</div>}
          <button 
            className="btn primary" 
            style={{ alignSelf: 'flex-start' }}
            onClick={() => {
              setStoreFormOpen(!storeFormOpen)
              setError('')
              setMessage('')
            }}
          >
            {storeFormOpen ? 'Cancel' : 'Add New Store'}
          </button>
          
          {storeFormOpen && (
            <form onSubmit={createStore} style={{ background: '#f8fafc', padding: '20px', borderRadius: '14px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
              <div className="field">
                <label style={{ fontWeight: '600', fontSize: '14px', color: '#475569' }}>Store Name</label>
                <input 
                  className="input" 
                  value={storeName} 
                  onChange={e => setStoreName(e.target.value)} 
                  placeholder="Enter store name (e.g. Daily Fresh Groceries)" 
                  required 
                />
              </div>
              <div className="field">
                <label style={{ fontWeight: '600', fontSize: '14px', color: '#475569' }}>Store Details / Description</label>
                <input 
                  className="input" 
                  value={storeDetails} 
                  onChange={e => setStoreDetails(e.target.value)} 
                  placeholder="Enter store details (e.g. Fresh organic fruits and vegetables)" 
                />
              </div>
              <button className="btn primary" type="submit" disabled={storeLoading}>
                {storeLoading ? 'Saving...' : 'Register Store'}
              </button>
            </form>
          )}

          {listData.length === 0 ? (
            <div className="activity-empty">No stores found. Add one above!</div>
          ) : (
            <div className="activity-list">
              {listData.map((item, index) => (
                <div className="activity-item" key={`${item.storeName}-${index}-${item.createdAt}`}>
                  <div><strong>{item.storeName}</strong></div>
                  <div>{item.details}</div>
                  <div className="activity-meta">{item.status} • {new Date(item.createdAt).toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )
    }

    if (selected === 'referrals') {
      const listData = sectionData?.referrals || []
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {message && <div className="success-message">{message}</div>}
          <button 
            className="btn primary" 
            style={{ alignSelf: 'flex-start' }}
            onClick={() => {
              setRefFormOpen(!refFormOpen)
              setError('')
              setMessage('')
            }}
          >
            {refFormOpen ? 'Cancel' : 'Simulate Friend Referral'}
          </button>
          
          {refFormOpen && (
            <form onSubmit={createReferral} style={{ background: '#f8fafc', padding: '20px', borderRadius: '14px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
              <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>
                * Simulate registering a new referral. They will be added to your referral list immediately.
              </p>
              <div className="field">
                <label style={{ fontWeight: '600', fontSize: '14px', color: '#475569' }}>Friend's Name</label>
                <input 
                  className="input" 
                  value={refName} 
                  onChange={e => setRefName(e.target.value)} 
                  placeholder="Enter friend name" 
                  required 
                />
              </div>
              <div className="field">
                <label style={{ fontWeight: '600', fontSize: '14px', color: '#475569' }}>Friend's Contact (Phone or Email)</label>
                <input 
                  className="input" 
                  value={refContact} 
                  onChange={e => setRefContact(e.target.value)} 
                  placeholder="Enter contact details" 
                  required 
                />
              </div>
              <button className="btn primary" type="submit" disabled={refLoading}>
                {refLoading ? 'Simulating...' : 'Submit Referral'}
              </button>
            </form>
          )}

          {listData.length === 0 ? (
            <div className="activity-empty">No referrals recorded. Invite friends with your link!</div>
          ) : (
            <div className="activity-list">
              {listData.map((item, index) => (
                <div className="activity-item" key={`${item.contact}-${index}-${item.referredAt}`}>
                  <div><strong>{item.name}</strong></div>
                  <div>{item.contact}</div>
                  <div className="activity-meta">{item.status} • {new Date(item.referredAt).toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )
    }

    const listData = sectionData?.activities ||
      sectionData?.orders ||
      sectionData?.purchases ||
      sectionData?.transactions ||
      sectionData?.earnings || []

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

          return null
        })}
      </div>
    )
  }

  return (
    <div className="profile-page">
      <div className="profile-top">
        <div className="profile-hero">
          <div className="hero-avatar">{(name || 'U').charAt(0).toUpperCase()}</div>
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
              onClick={() => {
                setSelected(item.key)
                setError('')
                setMessage('')
                setStoreFormOpen(false)
                setRefFormOpen(false)
              }}
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
              <div className="wallet-title">Available Balance</div>
              <div className="wallet-amount">₹ {(sectionData?.user?.availableBalance !== undefined ? sectionData.user.availableBalance : (user?.availableBalance || 0)).toFixed(2)}</div>
            </div>

            <div className="wallet small-card">
              <div className="wallet-title">Total Activities</div>
              <div className="wallet-amount">{summary?.totalActivities ?? 0}</div>
            </div>

            <div className="wallet small-card">
              <div className="wallet-title">Total Orders</div>
              <div className="wallet-amount">{summary?.totalOrders ?? 0}</div>
            </div>

            <div className="wallet small-card">
              <div className="wallet-title">Total Earnings</div>
              <div className="wallet-amount">₹ {(summary?.totalEarnings ?? 0).toFixed(2)}</div>
            </div>
          </div>

          <div className="activity-section">{renderSectionContent()}</div>
        </section>
      </div>
    </div>
  )
}
