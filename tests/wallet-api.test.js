const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../Backend/.env") });
const mongoose = require("mongoose");
const request = require("supertest");
const app = require("../Backend/server");
const User = require("../Backend/models/User");
const assert = require("assert");

async function runTests() {
  console.log("\n========== WALLET FLOW INTEGRATION TESTS ==========\n");
  
  let token;

  try {
    // 1. Connect
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI);
    }
    await User.deleteMany({});
    console.log("  Connected to DB & cleared test users");

    // 2. Register & Initialize
    const regRes = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Wallet Test User",
        email: "wallettest@example.com",
        contact: "1112223334",
        password: "Password123"
      });
    
    assert.strictEqual(regRes.status, 201, "Registration should succeed");

    const logRes = await request(app)
      .post("/api/auth/login")
      .send({
        identifier: "wallettest@example.com",
        password: "Password123"
      });

    assert.strictEqual(logRes.status, 200, "Login should succeed");
    token = logRes.body.token;

    // Check defaults
    const walletRes = await request(app)
      .get("/api/user/wallet")
      .set("Authorization", `Bearer ${token}`);

    assert.strictEqual(walletRes.status, 200);
    assert.strictEqual(walletRes.body.availableBalance, 0, "Available balance should default to 0");
    assert.strictEqual(walletRes.body.cashbackWallet, 0, "Cashback wallet should default to 0");
    assert.strictEqual(walletRes.body.earningWallet, 0, "Earning wallet should default to 0");
    assert.strictEqual(walletRes.body.purchaseWallet, 0, "Purchase wallet should default to 0");
    assert.strictEqual(walletRes.body.onlineWallet, 50, "Online wallet should have a ₹50 welcome bonus");
    console.log("✓ User registered and defaults initialized successfully");

    // 3. Top Up & Cashback
    const topupRes = await request(app)
      .post("/api/user/activities")
      .set("Authorization", `Bearer ${token}`)
      .send({
        type: 'purchase',
        title: 'Wallet TopUp',
        description: 'Top up of ₹200',
        amount: 200,
        metadata: { method: 'Razorpay' }
      });

    assert.strictEqual(topupRes.status, 201, "Top-up activity should be created");

    // Verify balances
    const walletRes2 = await request(app)
      .get("/api/user/wallet")
      .set("Authorization", `Bearer ${token}`);

    assert.strictEqual(walletRes2.body.availableBalance, 200, "Available balance should increase to 200");
    assert.strictEqual(walletRes2.body.purchaseWallet, 200, "Purchase wallet should increase to 200");
    assert.strictEqual(walletRes2.body.cashbackWallet, 20, "Cashback wallet should receive 10% of top-up (₹20)");
    console.log("✓ Top-up performed and 10% cashback rewarded successfully");

    // 4. Transfer
    const transferRes = await request(app)
      .post("/api/user/wallet/transfer")
      .set("Authorization", `Bearer ${token}`)
      .send({
        sourceWallet: "cashback",
        amount: 20
      });

    assert.strictEqual(transferRes.status, 200, "Transfer should succeed");
    assert.strictEqual(transferRes.body.balances.cashbackWallet, 0, "Cashback wallet should be cleared");
    assert.strictEqual(transferRes.body.balances.availableBalance, 220, "Main available balance should increase by transfer amount to 220");
    console.log("✓ Cashback transferred to main balance successfully");

    // 5. Earnings & Withdrawal
    const earnRes = await request(app)
      .post("/api/user/activities")
      .set("Authorization", `Bearer ${token}`)
      .send({
        type: 'earning',
        title: 'Referral Bonus',
        description: 'Earned ₹100 from referral',
        amount: 100
      });

    assert.strictEqual(earnRes.status, 201, "Earning activity should succeed");

    const walletRes3 = await request(app)
      .get("/api/user/wallet")
      .set("Authorization", `Bearer ${token}`);
    
    assert.strictEqual(walletRes3.body.earningWallet, 100, "Earning wallet balance should be ₹100");

    // Withdraw ₹40
    const withdrawRes = await request(app)
      .post("/api/user/wallet/withdraw")
      .set("Authorization", `Bearer ${token}`)
      .send({
        amount: 40
      });

    assert.strictEqual(withdrawRes.status, 200, "Withdrawal should succeed");
    assert.strictEqual(withdrawRes.body.balances.earningWallet, 60, "Earning wallet balance should decrease to 60");
    assert.strictEqual(withdrawRes.body.balances.availableBalance, 220, "Main available balance should remain unchanged at 220");
    console.log("✓ Earning posted and withdrawal performed successfully");

    console.log("\n========== ALL WALLET TESTS PASSED ==========\n");
    process.exit(0);

  } catch (err) {
    console.error("\n❌ Wallet Test Failed!");
    console.error(err);
    process.exit(1);
  } finally {
    await User.deleteMany({});
    await mongoose.connection.close();
  }
}

runTests();
