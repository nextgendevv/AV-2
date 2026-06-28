const APP_BASE_URL = process.env.APP_BASE_URL || "http://localhost:5173";

const getProfile = async (req, res) => {
  const {
    _id,
    name,
    email,
    contact,
    mpin,
    activities,
    orders,
    purchases,
    transactions,
    earnings,
    referrals,
    storeManagement,
  } = req.user;

  const summary = {
    totalOrders: (orders || []).length,
    totalPurchases: (purchases || []).length,
    totalTransactions: (transactions || []).length,
    totalEarnings: (earnings || []).reduce((sum, item) => sum + (item.amount || 0), 0),
    totalReferrals: (referrals || []).length,
    totalStoreItems: (storeManagement || []).length,
    totalActivities: (activities || []).length,
  };

  return res.json({
    user: {
      id: _id,
      name,
      email,
      contact,
      mpin,
      availableBalance: req.user.availableBalance || 0,
      cashbackWallet: req.user.cashbackWallet || 0,
      earningWallet: req.user.earningWallet || 0,
      purchaseWallet: req.user.purchaseWallet || 0,
      onlineWallet: req.user.onlineWallet || 0,
    },
    summary,
    referralLink: `${APP_BASE_URL}/ref/${_id}`,
  });
};

const getActivities = async (req, res) => {
  const sortedActivities = [...(req.user.activities || [])].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
  return res.json({ activities: sortedActivities });
};

const getOrders = async (req, res) => {
  const sortedOrders = [...(req.user.orders || [])].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
  return res.json({ orders: sortedOrders });
};

const getPurchaseHistory = async (req, res) => {
  const sortedPurchases = [...(req.user.purchases || [])].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
  return res.json({ purchases: sortedPurchases });
};

const getTransactions = async (req, res) => {
  const sortedTransactions = [...(req.user.transactions || [])].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
  return res.json({ transactions: sortedTransactions });
};

const getEarnings = async (req, res) => {
  const sortedEarnings = [...(req.user.earnings || [])].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
  return res.json({ earnings: sortedEarnings });
};

const getReferralList = async (req, res) => {
  const sortedReferrals = [...(req.user.referrals || [])].sort(
    (a, b) => new Date(b.referredAt) - new Date(a.referredAt)
  );
  return res.json({ referrals: sortedReferrals });
};

const getReferralLink = async (req, res) => {
  return res.json({ referralLink: `${APP_BASE_URL}/ref/${req.user._id}` });
};

const getStoreManagement = async (req, res) => {
  const sortedStoreItems = [...(req.user.storeManagement || [])].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
  return res.json({ storeManagement: sortedStoreItems });
};

const addActivity = async (req, res) => {
  try {
    const { type, title, description = '', amount = 0, metadata = {}, status = 'Completed' } = req.body;

    if (!type || !title) {
      return res.status(400).json({ message: "Activity type and title are required." });
    }

    const activity = {
      type,
      title,
      description,
      amount: Number(amount) || 0,
      metadata,
      createdAt: new Date(),
    };

    req.user.activities.unshift(activity);

    if (type === 'purchase') {
      const topupVal = Number(amount) || 0;
      req.user.availableBalance = (req.user.availableBalance || 0) + topupVal;
      req.user.purchaseWallet = (req.user.purchaseWallet || 0) + topupVal;

      // Reward 10% cashback
      const cashbackVal = Math.round(topupVal * 0.10 * 100) / 100;
      if (cashbackVal > 0) {
        req.user.cashbackWallet = (req.user.cashbackWallet || 0) + cashbackVal;
        req.user.activities.unshift({
          type: 'cashback',
          title: 'Cashback Received',
          description: `Received ₹${cashbackVal} cashback for TopUp`,
          amount: cashbackVal,
          createdAt: new Date()
        });
      }

      req.user.purchases.unshift({
        purchaseId: metadata.purchaseId || `PUR-${Date.now()}`,
        title,
        amount: topupVal,
        paymentMethod: metadata.method || 'Unknown',
        status,
        items: metadata.items || [],
        createdAt: new Date(),
      });

      req.user.transactions.unshift({
        transactionType: 'Credit',
        amount: topupVal,
        description: description || `Purchase completed: ${title}`,
        balanceAfter: req.user.availableBalance,
        createdAt: new Date(),
      });
    }

    if (type === 'order') {
      const orderVal = Number(amount) || 0;
      req.user.availableBalance = (req.user.availableBalance || 0) - orderVal;

      req.user.orders.unshift({
        orderId: metadata.orderId || `ORD-${Date.now()}`,
        title,
        amount: orderVal,
        status,
        items: metadata.items || [],
        createdAt: new Date(),
      });

      req.user.transactions.unshift({
        transactionType: 'Debit',
        amount: orderVal,
        description: description || `Order placed: ${title}`,
        balanceAfter: req.user.availableBalance,
        createdAt: new Date(),
      });
    }

    if (type === 'earning') {
      const earningVal = Number(amount) || 0;
      req.user.earningWallet = (req.user.earningWallet || 0) + earningVal;

      req.user.earnings.unshift({
        source: metadata.source || title,
        amount: earningVal,
        status,
        createdAt: new Date(),
      });

      req.user.transactions.unshift({
        transactionType: 'Credit',
        amount: earningVal,
        description: description || `Earning posted: ${title}`,
        balanceAfter: req.user.availableBalance,
        createdAt: new Date(),
      });
    }

    if (type === 'referral') {
      req.user.referrals.unshift({
        name: metadata.name || title,
        contact: metadata.contact || '',
        status,
        referredAt: new Date(),
      });
    }

    if (type === 'store') {
      req.user.storeManagement.unshift({
        storeName: title,
        status,
        details: description,
        createdAt: new Date(),
      });
    }

    await req.user.save();

    return res.status(201).json({ activity });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Unable to save activity." });
  }
};

const addPurchase = async (req, res) => {
  try {
    const { title, amount = 0, paymentMethod = 'Direct', items = [] } = req.body;
    if (!title) {
      return res.status(400).json({ message: "Purchase title is required." });
    }

    const purchase = {
      purchaseId: `PUR-${Date.now()}`,
      title,
      amount: Number(amount) || 0,
      paymentMethod,
      status: 'Completed',
      items,
      createdAt: new Date(),
    };

    req.user.purchases.unshift(purchase);
    req.user.activities.unshift({
      type: 'purchase',
      title,
      description: `Top up of ₹${purchase.amount}`,
      amount: purchase.amount,
      metadata: { method: paymentMethod, items },
      createdAt: new Date(),
    });

    const purchaseVal = Number(amount) || 0;
    req.user.availableBalance = (req.user.availableBalance || 0) + purchaseVal;
    req.user.purchaseWallet = (req.user.purchaseWallet || 0) + purchaseVal;

    // Reward 10% cashback
    const cashbackVal = Math.round(purchaseVal * 0.10 * 100) / 100;
    if (cashbackVal > 0) {
      req.user.cashbackWallet = (req.user.cashbackWallet || 0) + cashbackVal;
      req.user.activities.unshift({
        type: 'cashback',
        title: 'Cashback Received',
        description: `Received ₹${cashbackVal} cashback for TopUp`,
        amount: cashbackVal,
        createdAt: new Date()
      });
    }

    req.user.transactions.unshift({
      transactionType: 'Credit',
      amount: purchase.amount,
      description: `Top up: ${title}`,
      balanceAfter: req.user.availableBalance,
      createdAt: new Date(),
    });

    await req.user.save();

    return res.status(201).json({ purchase });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Unable to save purchase." });
  }
};

const changeMpin = async (req, res) => {
  try {
    const { mpin } = req.body;
    if (!mpin || String(mpin).length < 4) {
      return res.status(400).json({ message: "M-PIN must be at least 4 digits." });
    }

    req.user.mpin = String(mpin);
    await req.user.save();
    return res.json({ message: "M-PIN updated successfully." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Unable to update M-PIN." });
  }
};

const getWalletBalances = async (req, res) => {
  try {
    const {
      availableBalance = 0,
      cashbackWallet = 0,
      earningWallet = 0,
      purchaseWallet = 0,
      onlineWallet = 0
    } = req.user;

    return res.json({
      availableBalance,
      cashbackWallet,
      earningWallet,
      purchaseWallet,
      onlineWallet
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Unable to fetch wallet balances." });
  }
};

const transferWalletBalance = async (req, res) => {
  try {
    const { sourceWallet, amount } = req.body;
    if (!sourceWallet || !amount || Number(amount) <= 0) {
      return res.status(400).json({ message: "Source wallet and positive amount are required." });
    }

    const transferAmount = Number(amount);
    
    if (sourceWallet === 'cashback') {
      if ((req.user.cashbackWallet || 0) < transferAmount) {
        return res.status(400).json({ message: "Insufficient cashback wallet balance." });
      }
      req.user.cashbackWallet = Math.round((req.user.cashbackWallet - transferAmount) * 100) / 100;
    } else if (sourceWallet === 'earning') {
      if ((req.user.earningWallet || 0) < transferAmount) {
        return res.status(400).json({ message: "Insufficient earning wallet balance." });
      }
      req.user.earningWallet = Math.round((req.user.earningWallet - transferAmount) * 100) / 100;
    } else {
      return res.status(400).json({ message: "Invalid source wallet for transfer." });
    }

    req.user.availableBalance = Math.round((req.user.availableBalance + transferAmount) * 100) / 100;

    // Add activity
    req.user.activities.unshift({
      type: 'transfer',
      title: 'Wallet Transfer',
      description: `Transferred ₹${transferAmount} from ${sourceWallet} wallet to main balance`,
      amount: transferAmount,
      createdAt: new Date()
    });

    // Add transaction
    req.user.transactions.unshift({
      transactionType: 'Credit',
      amount: transferAmount,
      description: `Transfer from ${sourceWallet} wallet`,
      balanceAfter: req.user.availableBalance,
      createdAt: new Date()
    });

    await req.user.save();

    return res.json({
      message: "Transfer successful.",
      balances: {
        availableBalance: req.user.availableBalance,
        cashbackWallet: req.user.cashbackWallet,
        earningWallet: req.user.earningWallet,
        purchaseWallet: req.user.purchaseWallet,
        onlineWallet: req.user.onlineWallet
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Unable to process transfer." });
  }
};

const withdrawWalletBalance = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ message: "Positive withdrawal amount is required." });
    }

    const withdrawAmount = Number(amount);

    if ((req.user.earningWallet || 0) < withdrawAmount) {
      return res.status(400).json({ message: "Insufficient earning wallet balance." });
    }

    req.user.earningWallet = Math.round((req.user.earningWallet - withdrawAmount) * 100) / 100;

    // Add activity
    req.user.activities.unshift({
      type: 'withdrawal',
      title: 'Wallet Withdrawal',
      description: `Withdrew ₹${withdrawAmount} from earning wallet`,
      amount: withdrawAmount,
      createdAt: new Date()
    });

    // Add transaction
    req.user.transactions.unshift({
      transactionType: 'Debit',
      amount: withdrawAmount,
      description: `Withdrawal from earning wallet`,
      balanceAfter: req.user.availableBalance,
      createdAt: new Date()
    });

    await req.user.save();

    return res.json({
      message: "Withdrawal successful.",
      balances: {
        availableBalance: req.user.availableBalance,
        cashbackWallet: req.user.cashbackWallet,
        earningWallet: req.user.earningWallet,
        purchaseWallet: req.user.purchaseWallet,
        onlineWallet: req.user.onlineWallet
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Unable to process withdrawal." });
  }
};

module.exports = {
  getProfile,
  getActivities,
  getOrders,
  getPurchaseHistory,
  getTransactions,
  getEarnings,
  getReferralList,
  getReferralLink,
  getStoreManagement,
  addActivity,
  addPurchase,
  changeMpin,
  getWalletBalances,
  transferWalletBalance,
  withdrawWalletBalance,
};
