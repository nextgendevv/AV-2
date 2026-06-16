const fs = require('fs')
const path = require('path')

const homeFile = fs.readFileSync(path.resolve(__dirname, '../Frontend/src/Home.jsx'), 'utf8')
const cssFile = fs.readFileSync(path.resolve(__dirname, '../Frontend/src/App.css'), 'utf8')

const requiredHome = [
  'Welcome to Online',
  'HOME DELIVERY',
  'Fresh products for every need',
  'Upload Bill',
  'ONLINE STORE',
  'OFFER DEALS',
  'RECHARGES',
  'TICKET BOOKINGS',
  'E-SHOPPING',
  'DISCOUNT VOUCHER',
  'REAL ESTATE',
  'TECH PARTNER'
]

const requiredCss = [
  '.home-shell',
  '.home-hero',
  '.hero-card',
  '.home-status',
  '.status-card',
  '.feature-grid',
  '.bottom-nav',
  '.upload-button',
  '.welcome-banner',
  '@media (max-width: 900px)',
  '@media (max-width: 720px)'
]

const missingHome = requiredHome.filter(r => !homeFile.includes(r))
const missingCss = requiredCss.filter(r => !cssFile.includes(r))

if (missingHome.length) {
  console.error('Test failed. Missing expected Home content:', missingHome)
  process.exit(1)
}

if (missingCss.length) {
  console.error('Test failed. Missing expected Home responsive CSS rules:', missingCss)
  process.exit(1)
}

console.log('Home static content and responsive layout test passed')
process.exit(0)
