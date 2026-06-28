/**
 * Real-Time Integration Flow Tests
 * Tests referral signup crediting, order placement balance updates, and store registration.
 * Run from root: node tests/realtime-flow.test.js
 */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../Backend/.env") });
const mongoose = require("mongoose");
const request = require("supertest");
const app = require("../Backend/server");
const User = require("../Backend/models/User");
const assert = require("assert");

async function runTests() {
  console.log("\n========== REAL-TIME WORKFLOW INTEGRATION TESTS ==========\n");

  let referrerToken;
  let referrerId;
  let refereeToken;
  let refereeId;

  try {
    // Connect to DB
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI);
    }
    
    // Clear test users
    await User.deleteMany({
      $or: [
        { contact: "9900990099" },
        { contact: "8800880088" }
      ]
    });
    console.log("  Cleaned up existing test users from Database.");

    // 1. Register Referrer User
    const regReferrer = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Referrer Test User",
        email: "referrer@test.com",
        contact: "9900990099",
        password: "PassWord123"
      });
    
    assert.strictEqual(regReferrer.status, 201, "Referrer registration should succeed");
    referrerId = regReferrer.body.user.id;

    // Login Referrer to get Token
    const logReferrer = await request(app)
      .post("/api/auth/login")
      .send({
        identifier: "9900990099",
        password: "PassWord123"
      });
    
    assert.strictEqual(logReferrer.status, 200);
    referrerToken = logReferrer.body.token;
    console.log("✓ Referrer registered and logged in successfully");

    // 2. Register Referee User (with referredBy referrer ID)
    const regReferee = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Referee Test User",
        email: "referee@test.com",
        contact: "8800880088",
        password: "RefereePass123",
        referredBy: referrerId
      });

    assert.strictEqual(regReferee.status, 201, "Referee registration with referredBy should succeed");
    refereeId = regReferee.body.user.id;

    // Login Referee to get Token
    const logReferee = await request(app)
      .post("/api/auth/login")
      .send({
        identifier: "8800880088",
        password: "RefereePass123"
      });
    
    assert.strictEqual(logReferee.status, 200);
    refereeToken = logReferee.body.token;
    console.log("✓ Referee registered with referral link and logged in successfully");

    // 3. Verify Referrer User received Referral Earning and Record
    const referrerProfile = await request(app)
      .get("/api/user/profile")
      .set("Authorization", `Bearer ${referrerToken}`);
    
    assert.strictEqual(referrerProfile.status, 200);
    assert.strictEqual(referrerProfile.body.summary.totalReferrals, 1, "Referrer should have 1 total referral");
    assert.strictEqual(referrerProfile.body.summary.totalEarnings, 50, "Referrer should have ₹50 total referral earnings");
    
    const referrerWallet = await request(app)
      .get("/api/user/wallet")
      .set("Authorization", `Bearer ${referrerToken}`);
    
    assert.strictEqual(referrerWallet.status, 200);
    assert.strictEqual(referrerWallet.body.earningWallet, 50, "Referrer earning wallet should have ₹50");
    console.log("✓ Verified Referrer credited with ₹50 and referral list updated in real-time");

    // 4. Simulate Referee User Top-Up (purchase of ₹300)
    const topupRes = await request(app)
      .post("/api/user/activities")
      .set("Authorization", `Bearer ${refereeToken}`)
      .send({
        type: 'purchase',
        title: 'Wallet TopUp',
        description: 'Simulated Razorpay top-up of ₹300',
        amount: 300,
        metadata: { method: 'Razorpay', purchaseId: `PUR-${Date.now()}` }
      });
    
    assert.strictEqual(topupRes.status, 201);
    
    const refereeWalletBefore = await request(app)
      .get("/api/user/wallet")
      .set("Authorization", `Bearer ${refereeToken}`);
    
    assert.strictEqual(refereeWalletBefore.body.availableBalance, 300, "Referee available balance should be ₹300");
    assert.strictEqual(refereeWalletBefore.body.cashbackWallet, 30, "Referee cashback wallet should get ₹30 (10% of ₹300)");
    console.log("✓ Referee top-up and cashback credited successfully");

    // 5. Place an Order for Referee User (order of ₹120)
    const orderRes = await request(app)
      .post("/api/user/activities")
      .set("Authorization", `Bearer ${refereeToken}`)
      .send({
        type: 'order',
        title: 'Grocery Essentials Pack',
        description: 'Ordered Grocery Essentials Pack from Store',
        amount: 120,
        metadata: { orderId: `ORD-${Date.now()}`, items: ['Grocery Essentials Pack'] }
      });

    assert.strictEqual(orderRes.status, 201, "Order activity creation should succeed");

    const refereeWalletAfter = await request(app)
      .get("/api/user/wallet")
      .set("Authorization", `Bearer ${refereeToken}`);
    
    assert.strictEqual(refereeWalletAfter.body.availableBalance, 180, "Referee available balance should decrease to ₹180 (300 - 120)");

    const refereeProfileAfter = await request(app)
      .get("/api/user/profile")
      .set("Authorization", `Bearer ${refereeToken}`);
    
    assert.strictEqual(refereeProfileAfter.body.summary.totalOrders, 1, "Referee should have 1 total order recorded");
    console.log("✓ Referee order successfully placed, balance deducted, and order count updated in real-time");

    // 6. Create a Store for Referee User
    const storeRes = await request(app)
      .post("/api/user/activities")
      .set("Authorization", `Bearer ${refereeToken}`)
      .send({
        type: 'store',
        title: 'Fresh Fruits Bazaar',
        description: 'Store for organic local fresh produce',
        status: 'Active'
      });

    assert.strictEqual(storeRes.status, 201, "Store management activity should succeed");

    const refereeStore = await request(app)
      .get("/api/user/store-management")
      .set("Authorization", `Bearer ${refereeToken}`);
    
    assert.strictEqual(refereeStore.status, 200);
    assert.strictEqual(refereeStore.body.storeManagement.length, 1, "Referee should have 1 store item recorded");
    assert.strictEqual(refereeStore.body.storeManagement[0].storeName, "Fresh Fruits Bazaar");
    console.log("✓ Referee store registered successfully in store-management and fetched in real-time");

    console.log("\n========== ALL REAL-TIME WORKFLOW TESTS PASSED ==========\n");
    process.exit(0);

  } catch (err) {
    console.error("\n❌ Real-Time Workflow Integration Test Failed!");
    console.error(err);
    process.exit(1);
  } finally {
    // Clean up
    await User.deleteMany({
      $or: [
        { contact: "9900990099" },
        { contact: "8800880088" }
      ]
    });
    await mongoose.connection.close();
  }
}

runTests();
