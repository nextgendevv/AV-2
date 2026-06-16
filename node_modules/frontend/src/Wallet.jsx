import React from 'react'

export default function Wallet({ user = null }) {
  const name = user ? user.name : 'User'

  return (
    <div className="wallet-page">
      <div className="wallet-top">
        <h2>Wallet</h2>
        <p className="wallet-sub">Overview of your balances and actions</p>
      </div>

      <div className="wallet-grid-main">
        <div className="available-card">
          <div className="available-title">Available Balance</div>
          <div className="available-amount">₹ 0.00</div>
          <button className="btn primary">Top Up</button>
        </div>

        <div className="cards-grid">
          <div className="wallet-card">
            <div className="card-img">💜</div>
            <div className="card-title">Cashback Wallet</div>
            <div className="card-amount">₹ 0.00</div>
            <div className="card-actions"><button className="btn">Transfer</button></div>
          </div>

          <div className="wallet-card">
            <div className="card-img">💰</div>
            <div className="card-title">Earning Wallet</div>
            <div className="card-amount">₹ 0.00</div>
            <div className="card-actions"><button className="btn">Transfer</button> <button className="btn">Withdraw</button></div>
          </div>

          <div className="wallet-card">
            <div className="card-img">🛒</div>
            <div className="card-title">Purchase Wallet</div>
            <div className="card-amount">₹ 0.00</div>
          </div>

          <div className="wallet-card">
            <div className="card-img">🎁</div>
            <div className="card-title">Online Wallet</div>
            <div className="card-amount">₹ 0.00</div>
          </div>
        </div>
      </div>
    </div>
  )
}
