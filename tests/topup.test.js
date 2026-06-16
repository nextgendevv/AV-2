const fs = require('fs')
const path = require('path')

const file = fs.readFileSync(path.resolve(__dirname, '../Frontend/src/TopUp.jsx'), 'utf8')

const required = [
  'TopUp your Wallet',
  'Enter amount',
  'TopUp',
  'Payment Gateway Partner',
  'Razorpay'
]

const missing = required.filter(r => !file.includes(r))
if (missing.length) {
  console.error('Test failed. Missing expected TopUp content:', missing)
  process.exit(1)
}
console.log('TopUp static content test passed')
process.exit(0)
