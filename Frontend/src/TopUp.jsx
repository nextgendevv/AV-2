import React, { useState } from 'react'

export default function TopUp({ user = null, onClose = () => {} }) {
  const [amount, setAmount] = useState('')

  function handleTopUp(e) {
    e.preventDefault()
    if (!amount) return
    // Simulate payment gateway integration
    alert(`Processing TopUp of ₹${amount} via Razorpay`)
    setAmount('')
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
