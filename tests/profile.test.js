const fs = require('fs')
const path = require('path')

const file = fs.readFileSync(path.resolve(__dirname, '../Frontend/src/Profile.jsx'), 'utf8')

const required = [
  'Order History',
  'Transaction History',
  'Available Balance',
  'Profile',
  'Logout',
]

const missing = required.filter(r => !file.includes(r))
if (missing.length) {
  console.error('Test failed. Missing expected profile content:', missing)
  process.exit(1)
}
console.log('Profile static content test passed')
process.exit(0)
