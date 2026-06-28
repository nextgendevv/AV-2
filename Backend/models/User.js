const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema({
  type: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ""
  },
  amount: {
    type: Number,
    default: 0
  },
  metadata: {
    type: Object,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const orderSchema = new mongoose.Schema({
  orderId: String,
  title: String,
  amount: Number,
  status: { type: String, default: 'Pending' },
  items: Array,
  createdAt: { type: Date, default: Date.now }
});

const purchaseSchema = new mongoose.Schema({
  purchaseId: String,
  title: String,
  amount: Number,
  paymentMethod: String,
  status: { type: String, default: 'Completed' },
  items: Array,
  createdAt: { type: Date, default: Date.now }
});

const transactionSchema = new mongoose.Schema({
  transactionType: { type: String, enum: ['Credit', 'Debit'] },
  amount: Number,
  description: String,
  balanceAfter: Number,
  createdAt: { type: Date, default: Date.now }
});

const earningSchema = new mongoose.Schema({
  source: String,
  amount: Number,
  status: { type: String, default: 'Completed' },
  createdAt: { type: Date, default: Date.now }
});

const referralSchema = new mongoose.Schema({
  name: String,
  contact: String,
  status: { type: String, default: 'Pending' },
  referredAt: { type: Date, default: Date.now }
});

const storeSchema = new mongoose.Schema({
  storeName: String,
  status: { type: String, default: 'Active' },
  details: String,
  createdAt: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },

    email: {
      type: String,
      unique: true,
      sparse: true
    },

    contact: {
      type: String,
      unique: true,
      sparse: true
    },

    password: {
      type: String,
      required: true
    },

    mpin: {
      type: String,
      default: ""
    },

    availableBalance: {
      type: Number,
      default: 0
    },

    cashbackWallet: {
      type: Number,
      default: 0
    },

    earningWallet: {
      type: Number,
      default: 0
    },

    purchaseWallet: {
      type: Number,
      default: 0
    },

    onlineWallet: {
      type: Number,
      default: 50.00
    },

    activities: {
      type: [activitySchema],
      default: []
    },

    orders: {
      type: [orderSchema],
      default: []
    },

    purchases: {
      type: [purchaseSchema],
      default: []
    },

    transactions: {
      type: [transactionSchema],
      default: []
    },

    earnings: {
      type: [earningSchema],
      default: []
    },

    referrals: {
      type: [referralSchema],
      default: []
    },

    storeManagement: {
      type: [storeSchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("User", userSchema);