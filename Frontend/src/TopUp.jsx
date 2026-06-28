import React, { useState } from 'react'

export default function TopUp({ user = null, onTopUpSuccess = () => {}, onUnauthorized = () => {} }) {
  const [amount, setAmount] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleTopUp(e) {
    e.preventDefault()
    setError('')
    setMessage('')

    const topUpAmount = Number(amount)
    if (!topUpAmount || topUpAmount <= 0) {
      setError('Enter a valid amount to top up.')
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('authToken')
      if (!token) {
        setError('You must be logged in to top up.')
        return
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/user/activities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: 'purchase',
          title: 'Wallet TopUp',
          description: `Added ₹${topUpAmount} to wallet`,
          amount: topUpAmount,
          metadata: { method: 'Razorpay' },
        }),
      })

      if (response.status === 401) {
        onUnauthorized()
        return
      }

      const data = await response.json()
      if (!response.ok) {
        setError(data.message || 'Top up failed.')
        return
      }

      setMessage(`Top up successful: ₹${topUpAmount} added.`)
      setAmount('')
      onTopUpSuccess()
    } catch (err) {
      console.error(err)
      setError('Unable to process top up. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="topup-page">
      <div className="topup-container">
        <h1>TopUp your Wallet</h1>
        
        <div className="topup-form-section">
          <div className="topup-illustration">
            <div className="illustration-box">💳</div>
          </div>

          <form className="topup-form" onSubmit={handleTopUp}>
            <div className="form-group">
              <label htmlFor="amount">Enter amount</label>
              <div className="input-wrapper">
                <span className="rupee-icon">₹</span>
                <input
                  id="amount"
                  type="number"
                  className="topup-input"
                  placeholder="0"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  min="1"
                />
              </div>
            </div>

            <button className="btn topup-btn" type="submit">TopUp</button>
          </form>
        </div>

        <div className="payment-partner">
          <p className="partner-title">Payment Gateway Partner</p>
          <p className="razorpay-logo">Razorpay</p>
        </div>
      </div>
    </div>
  )
}
