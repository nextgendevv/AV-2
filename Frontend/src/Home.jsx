import React, { useState, useEffect } from 'react'

const API_URL = import.meta.env.VITE_API_URL

if (!API_URL) {
  throw new Error('VITE_API_URL is not configured in environment variables')
}

export default function Home({ user = null, onUnauthorized = () => {} }) {
  const [profileData, setProfileData] = useState(null)
  const [walletBalances, setWalletBalances] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Order modal state
  const [orderModalOpen, setOrderModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [orderError, setOrderError] = useState('')
  const [orderSuccess, setOrderSuccess] = useState('')
  const [orderLoading, setOrderLoading] = useState(false)

  // Bill upload modal state
  const [billModalOpen, setBillModalOpen] = useState(false)
  const [billAmount, setBillAmount] = useState('')
  const [merchantName, setMerchantName] = useState('')
  const [billError, setBillError] = useState('')
  const [billSuccess, setBillSuccess] = useState('')
  const [billLoading, setBillLoading] = useState(false)

  const products = [
    { id: '1', name: 'Grocery Essentials Pack', price: 120, category: 'ONLINE STORE' },
    { id: '2', name: 'Flat 50% Off E-Shopping Voucher', price: 50, category: 'E-SHOPPING' },
    { id: '3', name: 'Mobile Super Recharge Plan', price: 299, category: 'RECHARGES' },
    { id: '4', name: 'Multiplex Movie Ticket', price: 250, category: 'TICKET BOOKINGS' },
    { id: '5', name: 'Premium Tech Device Support', price: 499, category: 'TECH PARTNER' }
  ]

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

  const fetchData = async (showLoading = false) => {
    if (showLoading) setLoading(true)
    const token = localStorage.getItem('authToken')
    if (!token) {
      setLoading(false)
      return
    }
    try {
      // Fetch Profile (orders count, etc.)
      const profileRes = await fetch(`${API_URL}/user/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (profileRes.status === 401) {
        onUnauthorized()
        return
      }
      const profileJson = await profileRes.json()
      if (profileRes.ok) {
        setProfileData(profileJson)
      }

      // Fetch Wallet
      const walletRes = await fetch(`${API_URL}/user/wallet`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (walletRes.status === 401) {
        onUnauthorized()
        return
      }
      const walletJson = await walletRes.json()
      if (walletRes.ok) {
        setWalletBalances(walletJson)
      }
    } catch (err) {
      console.error('Home page data fetching error:', err)
      setError('Unable to sync real-time data.')
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  useEffect(() => {
    if (!user) return
    fetchData(true)
    const interval = setInterval(() => {
      fetchData(false)
    }, 10000)
    return () => clearInterval(interval)
  }, [user])

  const handlePlaceOrder = async (e) => {
    e.preventDefault()
    if (!selectedProduct) return

    setOrderError('')
    setOrderSuccess('')

    const token = localStorage.getItem('authToken')
    if (!token) {
      setOrderError('You must be logged in to place an order.')
      return
    }

    const currentBalance = walletBalances?.availableBalance || 0
    if (currentBalance < selectedProduct.price) {
      setOrderError(`Insufficient funds! Need ₹${selectedProduct.price.toFixed(2)}, but you only have ₹${currentBalance.toFixed(2)}. Please Top Up.`)
      return
    }

    setOrderLoading(true)
    try {
      const response = await fetch(`${API_URL}/user/activities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          type: 'order',
          title: selectedProduct.name,
          description: `Ordered ${selectedProduct.name} from store`,
          amount: selectedProduct.price,
          metadata: {
            orderId: `ORD-${Date.now()}`,
            items: [selectedProduct.name]
          }
        })
      })

      if (response.status === 401) {
        onUnauthorized()
        return
      }

      const data = await response.json()
      if (!response.ok) {
        setOrderError(data.message || 'Order failed.')
        return
      }

      setOrderSuccess(`Order placed successfully! ₹${selectedProduct.price} deducted.`)
      fetchData(false)
      setTimeout(() => {
        setOrderModalOpen(false)
        setOrderSuccess('')
        setSelectedProduct(null)
      }, 1500)
    } catch (err) {
      console.error(err)
      setOrderError('Unable to complete purchase. Please try again.')
    } finally {
      setOrderLoading(false)
    }
  }

  const handleUploadBill = async (e) => {
    e.preventDefault()
    setBillError('')
    setBillSuccess('')

    const amt = Number(billAmount)
    if (!amt || amt <= 0) {
      setBillError('Please enter a valid bill amount.')
      return
    }
    if (!merchantName.trim()) {
      setBillError('Please enter the merchant name.')
      return
    }

    const token = localStorage.getItem('authToken')
    if (!token) {
      setBillError('You must be logged in to upload bills.')
      return
    }

    setBillLoading(true)
    try {
      const response = await fetch(`${API_URL}/user/activities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          type: 'purchase',
          title: `Bill Upload: ${merchantName.trim()}`,
          description: `Uploaded shopping receipt from ${merchantName.trim()}`,
          amount: amt,
          metadata: {
            purchaseId: `PUR-${Date.now()}`,
            method: 'Bill Upload'
          }
        })
      })

      if (response.status === 401) {
        onUnauthorized()
        return
      }

      const data = await response.json()
      if (!response.ok) {
        setBillError(data.message || 'Bill upload failed.')
        return
      }

      setBillSuccess(`Bill approved! ₹${amt} added to balance. Received 10% cashback (₹${(amt * 0.1).toFixed(2)})!`)
      setBillAmount('')
      setMerchantName('')
      fetchData(false)
      setTimeout(() => {
        setBillModalOpen(false)
        setBillSuccess('')
      }, 2000)
    } catch (err) {
      console.error(err)
      setBillError('Unable to process bill. Please try again.')
    } finally {
      setBillLoading(false)
    }
  }

  const handleCardAction = (cardTitle) => {
    const matchedProduct = products.find(p => p.category === cardTitle)
    if (matchedProduct) {
      setSelectedProduct(matchedProduct)
      setOrderError('')
      setOrderSuccess('')
      setOrderModalOpen(true)
    } else {
      // Fallback
      setSelectedProduct(products[0])
      setOrderError('')
      setOrderSuccess('')
      setOrderModalOpen(true)
    }
  }

  const displayName = profileData?.user?.name || user?.name || 'Jayakaran'
  const liveBalance = walletBalances?.availableBalance !== undefined 
    ? `₹ ${walletBalances.availableBalance.toFixed(2)}` 
    : '₹ 0.00'
  const liveOrdersCount = profileData?.summary?.totalOrders !== undefined 
    ? `${profileData.summary.totalOrders} completed` 
    : '0 completed'

  return (
    <div className="home-page">
      <style>{`
        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(4px);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          animation: fadeIn 0.2s ease-out;
        }
        .modal-box {
          background: #ffffff;
          padding: 24px;
          border-radius: 20px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
          width: 100%;
          max-width: 440px;
          box-sizing: border-box;
          animation: scaleUp 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .modal-box h3 {
          margin-top: 0;
          font-size: 20px;
          color: #333;
          margin-bottom: 16px;
        }
        .modal-close-btn {
          border: none;
          background: none;
          font-size: 24px;
          cursor: pointer;
          color: #888;
          line-height: 1;
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        .modal-body {
          margin-bottom: 20px;
          text-align: left;
        }
        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }
        .modal-group {
          margin-bottom: 16px;
        }
        .modal-group label {
          display: block;
          font-weight: 600;
          margin-bottom: 6px;
          color: #475569;
          font-size: 14px;
        }
        .modal-group input, .modal-group select {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 10px;
          font-size: 15px;
          box-sizing: border-box;
          background: #f9fafb;
        }
        .modal-group input:focus {
          border-color: #aa3bff;
          outline: none;
        }
        .prod-select-box {
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          padding: 14px;
          margin-bottom: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
        }
        .prod-select-box.active {
          border-color: #aa3bff;
          background: rgba(170, 59, 255, 0.05);
        }
        .prod-select-box:hover {
          background: #f8fafc;
        }
        .toast-msg {
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 16px;
          font-size: 14px;
        }
        .toast-msg.success {
          background: #e6f7ed;
          color: #1e7e34;
          border: 1px solid #c3e6cb;
        }
        .toast-msg.error {
          background: #fdf2f2;
          color: #c53030;
          border: 1px solid #f8b4b4;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleUp {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>

      <div className="home-shell">
        <section className="welcome-banner">
          <div className="welcome-card">
            <div className="banner-avatar">{displayName.charAt(0).toUpperCase()}</div>
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
              <button 
                className="btn primary"
                onClick={() => {
                  setSelectedProduct(products[0])
                  setOrderError('')
                  setOrderSuccess('')
                  setOrderModalOpen(true)
                }}
              >
                Order Now
              </button>
              <button className="btn secondary" onClick={() => handleCardAction('OFFER DEALS')}>View Offers</button>
            </div>
            <div className="hero-summary">
              <div className="hero-stat">
                <strong>24/7</strong>
                <span>Support Ready</span>
              </div>
              <div className="hero-stat">
                <strong>{products.length}+</strong>
                <span>Products Live</span>
              </div>
              <div className="hero-stat">
                <strong>1M+</strong>
                <span>Orders Delivered</span>
              </div>
            </div>
          </div>
          <div className="hero-preview">
            <div className="hero-image">
              <div className="hero-callout">UP TO 10% CASHBACK</div>
            </div>
          </div>
        </section>

        <section className="home-status">
          <article className="status-card user-status">
            <div className="status-avatar">{displayName.charAt(0).toUpperCase()}</div>
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
            <div className="status-value">{liveOrdersCount}</div>
          </article>

          <article className="status-card compact-card">
            <div className="status-label">Wallet</div>
            <div className="status-value">{liveBalance}</div>
          </article>
        </section>

        <section className="notice-banner">
          This service is fully active. Place orders, upload receipts, and earn cashback in real time.
        </section>

        <section className="upload-section">
          <button 
            className="btn upload-button"
            onClick={() => {
              setBillError('')
              setBillSuccess('')
              setBillModalOpen(true)
            }}
          >
            Upload Bill
          </button>
        </section>

        <section className="feature-grid">
          {cards.map(card => (
            <article className="feature-card" key={card.title}>
              <div>
                <div className="feature-title">{card.title}</div>
                <div className="feature-description">{card.description}</div>
              </div>
              <button className="btn card-action" onClick={() => handleCardAction(card.title)}>{card.label}</button>
            </article>
          ))}
        </section>
      </div>

      {/* Order Placement Modal */}
      {orderModalOpen && (
        <div className="modal-backdrop" onClick={() => setOrderModalOpen(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Place an Order</h3>
              <button className="modal-close-btn" onClick={() => setOrderModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handlePlaceOrder}>
              <div className="modal-body">
                {orderSuccess && <div className="toast-msg success">{orderSuccess}</div>}
                {orderError && <div className="toast-msg error">{orderError}</div>}
                
                <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#666' }}>
                  Your Available Balance: <strong>{liveBalance}</strong>
                </p>

                <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px', fontSize: '14px', color: '#475569' }}>
                  Select Product to Buy:
                </label>

                {products.map(p => (
                  <div 
                    key={p.id}
                    className={`prod-select-box ${selectedProduct?.id === p.id ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedProduct(p)
                      setOrderError('')
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '15px' }}>{p.name}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '13px' }}>
                      <span style={{ color: '#aa3bff', fontWeight: 700 }}>₹ {p.price.toFixed(2)}</span>
                      <span style={{ color: '#888' }}>{p.category}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="modal-actions">
                <button type="button" className="btn outline" onClick={() => setOrderModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn primary" disabled={orderLoading || !selectedProduct}>
                  {orderLoading ? 'Processing...' : `Place Order (₹${selectedProduct ? selectedProduct.price : 0})`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bill Upload Simulation Modal */}
      {billModalOpen && (
        <div className="modal-backdrop" onClick={() => setBillModalOpen(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Simulate Bill Upload</h3>
              <button className="modal-close-btn" onClick={() => setBillModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleUploadBill}>
              <div className="modal-body">
                {billSuccess && <div className="toast-msg success">{billSuccess}</div>}
                {billError && <div className="toast-msg error">{billError}</div>}
                
                <div className="modal-group">
                  <label htmlFor="merchantName">Merchant / Store Name</label>
                  <input
                    id="merchantName"
                    type="text"
                    placeholder="e.g. Amazon, DMart, Starbucks"
                    value={merchantName}
                    onChange={e => setMerchantName(e.target.value)}
                    required
                  />
                </div>

                <div className="modal-group">
                  <label htmlFor="billAmount">Bill Amount (₹)</label>
                  <input
                    id="billAmount"
                    type="number"
                    min="1"
                    placeholder="e.g. 500"
                    value={billAmount}
                    onChange={e => setBillAmount(e.target.value)}
                    required
                  />
                </div>

                <p style={{ fontSize: '12px', color: '#666', margin: '8px 0 0 0' }}>
                  * Approved bills will immediately add the amount to your Available Balance and reward 10% Cashback!
                </p>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn outline" onClick={() => setBillModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn primary" style={{ background: '#10b981' }} disabled={billLoading}>
                  {billLoading ? 'Uploading...' : 'Submit Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
