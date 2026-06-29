import React, { useState, useEffect } from 'react'
import { API_URL, readApiJson } from './api'

export default function Wallet({ user = null, onSwitchView = () => {}, onUnauthorized = () => {} }) {
  const [balances, setBalances] = useState({
    availableBalance: 0,
    cashbackWallet: 0,
    earningWallet: 0,
    purchaseWallet: 0,
    onlineWallet: 0,
  })
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  
  // Modals state
  const [modalType, setModalType] = useState(null) // 'transfer' | 'withdraw' | null
  const [transferSource, setTransferSource] = useState('cashback')
  const [amount, setAmount] = useState('')

  const fetchBalances = async (showLoading = false) => {
    if (showLoading) setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('authToken')
      if (!token) {
        setError('Login required to view wallet balances.')
        return
      }
      const response = await fetch(`${API_URL}/user/wallet`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      if (response.status === 401) {
        onUnauthorized()
        return
      }
      const data = await readApiJson(response)
      if (!response.ok) {
        setError(data.message || 'Failed to load wallet balances.')
        return
      }
      setBalances(data)
    } catch (err) {
      console.error(err)
      setError('Unable to load wallet balances. Please try again.')
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  useEffect(() => {
    fetchBalances(true)
    const interval = setInterval(() => {
      fetchBalances(false)
    }, 10000) // Poll every 10s for real-time updates
    return () => clearInterval(interval)
  }, [])

  const handleTransfer = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')

    const transferAmount = Number(amount)
    if (!transferAmount || transferAmount <= 0) {
      setError('Please enter a valid amount to transfer.')
      return
    }

    const currentWalletBal = transferSource === 'cashback' ? balances.cashbackWallet : balances.earningWallet
    if (transferAmount > currentWalletBal) {
      setError(`Insufficient funds in ${transferSource} wallet.`)
      return
    }

    setActionLoading(true)
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_URL}/user/wallet/transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          sourceWallet: transferSource,
          amount: transferAmount
        })
      })
      if (response.status === 401) {
        onUnauthorized()
        return
      }
      const data = await readApiJson(response)
      if (!response.ok) {
        setError(data.message || 'Transfer failed.')
        return
      }
      
      setBalances(data.balances)
      setMessage(`Successfully transferred ₹${transferAmount.toFixed(2)} to Available Balance.`)
      setModalType(null)
      setAmount('')
    } catch (err) {
      console.error(err)
      setError('Transfer failed. Please try again.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleWithdraw = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')

    const withdrawAmount = Number(amount)
    if (!withdrawAmount || withdrawAmount <= 0) {
      setError('Please enter a valid amount to withdraw.')
      return
    }

    if (withdrawAmount > balances.earningWallet) {
      setError('Insufficient funds in Earning wallet.')
      return
    }

    setActionLoading(true)
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_URL}/user/wallet/withdraw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: withdrawAmount
        })
      })
      if (response.status === 401) {
        onUnauthorized()
        return
      }
      const data = await readApiJson(response)
      if (!response.ok) {
        setError(data.message || 'Withdrawal failed.')
        return
      }

      setBalances(data.balances)
      setMessage(`Successfully withdrew ₹${withdrawAmount.toFixed(2)} from Earning Wallet.`)
      setModalType(null)
      setAmount('')
    } catch (err) {
      console.error(err)
      setError('Withdrawal failed. Please try again.')
    } finally {
      setActionLoading(false)
    }
  }

  const openTransferModal = (source) => {
    setError('')
    setMessage('')
    setTransferSource(source)
    setAmount(source === 'cashback' ? balances.cashbackWallet.toString() : balances.earningWallet.toString())
    setModalType('transfer')
  }

  const openWithdrawModal = () => {
    setError('')
    setMessage('')
    setAmount(balances.earningWallet.toString())
    setModalType('withdraw')
  }

  if (loading) {
    return (
      <div className="wallet-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="loader">Loading balances...</div>
      </div>
    )
  }

  return (
    <div className="wallet-page">
      <style>{`
        .wallet-modal-backdrop {
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
        .wallet-modal {
          background: #ffffff;
          padding: 24px;
          border-radius: 16px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
          width: 100%;
          max-width: 400px;
          box-sizing: border-box;
          animation: scaleUp 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .wallet-modal h3 {
          margin-top: 0;
          font-size: 20px;
          color: #333;
          margin-bottom: 16px;
        }
        .wallet-modal-close {
          border: none;
          background: none;
          font-size: 20px;
          cursor: pointer;
          color: #888;
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .modal-body {
          margin-bottom: 20px;
        }
        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }
        .modal-input-group {
          margin-bottom: 16px;
        }
        .modal-input-group label {
          display: block;
          font-weight: 500;
          margin-bottom: 6px;
          color: #555;
          font-size: 14px;
        }
        .modal-input-group input, .modal-input-group select {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 16px;
          box-sizing: border-box;
        }
        .wallet-msg {
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 16px;
          font-size: 14px;
        }
        .wallet-msg.success {
          background: #e6f7ed;
          color: #1e7e34;
          border: 1px solid #c3e6cb;
        }
        .wallet-msg.error {
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

      <div className="wallet-top">
        <h2>Wallet</h2>
        <p className="wallet-sub">Overview of your balances and actions</p>
      </div>

      {message && <div className="wallet-msg success">{message}</div>}
      {error && <div className="wallet-msg error">{error}</div>}

      <div className="wallet-grid-main">
        <div className="available-card">
          <div className="available-title">Available Balance</div>
          <div className="available-amount">₹ {balances.availableBalance.toFixed(2)}</div>
          <button className="btn primary" onClick={() => onSwitchView('topup')}>Top Up</button>
        </div>

        <div className="cards-grid">
          <div className="wallet-card">
            <div className="card-img">💜</div>
            <div className="card-title">Cashback Wallet</div>
            <div className="card-amount">₹ {balances.cashbackWallet.toFixed(2)}</div>
            <div className="card-actions">
              <button 
                className="btn" 
                onClick={() => openTransferModal('cashback')}
                disabled={balances.cashbackWallet <= 0}
              >
                Transfer
              </button>
            </div>
          </div>

          <div className="wallet-card">
            <div className="card-img">💰</div>
            <div className="card-title">Earning Wallet</div>
            <div className="card-amount">₹ {balances.earningWallet.toFixed(2)}</div>
            <div className="card-actions">
              <button 
                className="btn" 
                onClick={() => openTransferModal('earning')}
                disabled={balances.earningWallet <= 0}
              >
                Transfer
              </button>
              <button 
                className="btn" 
                onClick={() => openWithdrawModal()}
                disabled={balances.earningWallet <= 0}
              >
                Withdraw
              </button>
            </div>
          </div>

          <div className="wallet-card">
            <div className="card-img">🛒</div>
            <div className="card-title">Purchase Wallet</div>
            <div className="card-amount">₹ {balances.purchaseWallet.toFixed(2)}</div>
          </div>

          <div className="wallet-card">
            <div className="card-img">🎁</div>
            <div className="card-title">Online Wallet</div>
            <div className="card-amount">₹ {balances.onlineWallet.toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Transfer Modal */}
      {modalType === 'transfer' && (
        <div className="wallet-modal-backdrop" onClick={() => setModalType(null)}>
          <div className="wallet-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Transfer to Main Balance</h3>
              <button className="wallet-modal-close" onClick={() => setModalType(null)}>×</button>
            </div>
            <form onSubmit={handleTransfer}>
              <div className="modal-body">
                <div className="modal-input-group">
                  <label>Source Wallet</label>
                  <select 
                    value={transferSource} 
                    onChange={e => {
                      setTransferSource(e.target.value)
                      setAmount(e.target.value === 'cashback' ? balances.cashbackWallet.toString() : balances.earningWallet.toString())
                    }}
                  >
                    <option value="cashback">Cashback Wallet (₹ {balances.cashbackWallet.toFixed(2)})</option>
                    <option value="earning">Earning Wallet (₹ {balances.earningWallet.toFixed(2)})</option>
                  </select>
                </div>
                <div className="modal-input-group">
                  <label>Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={transferSource === 'cashback' ? balances.cashbackWallet : balances.earningWallet}
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn outline" onClick={() => setModalType(null)}>Cancel</button>
                <button type="submit" className="btn primary" disabled={actionLoading}>
                  {actionLoading ? 'Transferring...' : 'Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {modalType === 'withdraw' && (
        <div className="wallet-modal-backdrop" onClick={() => setModalType(null)}>
          <div className="wallet-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Withdraw Earning Balance</h3>
              <button className="wallet-modal-close" onClick={() => setModalType(null)}>×</button>
            </div>
            <form onSubmit={handleWithdraw}>
              <div className="modal-body">
                <div className="modal-input-group">
                  <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#666' }}>
                    Available in Earning Wallet: <strong>₹ {balances.earningWallet.toFixed(2)}</strong>
                  </p>
                  <label>Amount to Withdraw (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={balances.earningWallet}
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn outline" onClick={() => setModalType(null)}>Cancel</button>
                <button type="submit" className="btn primary" disabled={actionLoading}>
                  {actionLoading ? 'Withdrawing...' : 'Withdraw'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
