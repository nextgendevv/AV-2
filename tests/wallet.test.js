const fs = require('fs')
const path = require('path')

const file = fs.readFileSync(path.resolve(__dirname, '../Frontend/src/Wallet.jsx'), 'utf8')

const required = [
  'Available Balance',
  'Cashback Wallet',
  'Earning Wallet',
  'Purchase Wallet',
  'Online Wallet',
  'Top Up'
]

const missing = required.filter(r => !file.includes(r))
if (missing.length) {
  console.error('Test failed. Missing expected wallet content:', missing)
  process.exit(1)
}
console.log('Wallet static content test passed')
process.exit(0)
