const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const {
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
} = require("../controllers/userController");

router.use(authMiddleware);
router.get("/profile", getProfile);
router.get("/activities", getActivities);
router.get("/orders", getOrders);
router.get("/purchase-history", getPurchaseHistory);
router.get("/transactions", getTransactions);
router.get("/earnings", getEarnings);
router.get("/referrals", getReferralList);
router.get("/referral-link", getReferralLink);
router.get("/store-management", getStoreManagement);
router.post("/activities", addActivity);
router.post("/purchase", addPurchase);
router.post("/mpin", changeMpin);
router.get("/wallet", getWalletBalances);
router.post("/wallet/transfer", transferWalletBalance);
router.post("/wallet/withdraw", withdrawWalletBalance);

module.exports = router;
