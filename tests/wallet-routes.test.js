/**
 * Wallet Route Existence & Response Test
 * Tests that the backend server exposes the correct /api/user/wallet endpoints.
 * Run from root: node tests/wallet-routes.test.js
 */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../Backend/.env") });
const mongoose = require("mongoose");
const request = require("supertest");
const app = require("../Backend/server");
const User = require("../Backend/models/User");
const assert = require("assert");

async function runTests() {
  console.log("\n========== WALLET ROUTE EXISTENCE TESTS ==========\n");

  let token;

  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI);
    }

    // Clean slate
    await User.deleteMany({ contact: "9988776655" });

    // ------------------------------------------------------------------
    // TEST 1: Route GET /api/user/wallet must NOT 404
    // ------------------------------------------------------------------
    // First register + login to get a token
    const regRes = await request(app)
      .post("/api/auth/register")
      .send({ name: "RouteTest User", contact: "9988776655", password: "Test1234" });

    assert.ok(regRes.status === 201, `Registration should return 201, got ${regRes.status}`);
    console.log("✓ TEST 1: User registered (pre-condition)");

    const logRes = await request(app)
      .post("/api/auth/login")
      .send({ identifier: "9988776655", password: "Test1234" });

    assert.strictEqual(logRes.status, 200, "Login should return 200");
    token = logRes.body.token;
    assert.ok(token, "Login should return a JWT token");
    console.log("✓ TEST 2: Login returned valid JWT token");

    // ------------------------------------------------------------------
    // TEST 3: GET /api/user/wallet → 200, not 404
    // ------------------------------------------------------------------
    const walletRes = await request(app)
      .get("/api/user/wallet")
      .set("Authorization", `Bearer ${token}`);

    assert.notStrictEqual(walletRes.status, 404, `GET /api/user/wallet must NOT be 404 — route is missing`);
    assert.strictEqual(walletRes.status, 200, `GET /api/user/wallet should return 200, got ${walletRes.status}`);
    assert.ok(typeof walletRes.body.availableBalance === "number", "Response must include availableBalance as a number");
    assert.ok(typeof walletRes.body.cashbackWallet === "number", "Response must include cashbackWallet as a number");
    assert.ok(typeof walletRes.body.earningWallet === "number", "Response must include earningWallet as a number");
    assert.ok(typeof walletRes.body.purchaseWallet === "number", "Response must include purchaseWallet as a number");
    assert.ok(typeof walletRes.body.onlineWallet === "number", "Response must include onlineWallet as a number");
    console.log("✓ TEST 3: GET /api/user/wallet → 200 with correct shape");
    console.log(`   availableBalance: ${walletRes.body.availableBalance}`);
    console.log(`   cashbackWallet:   ${walletRes.body.cashbackWallet}`);
    console.log(`   earningWallet:    ${walletRes.body.earningWallet}`);
    console.log(`   purchaseWallet:   ${walletRes.body.purchaseWallet}`);
    console.log(`   onlineWallet:     ${walletRes.body.onlineWallet} (welcome bonus)`);

    // ------------------------------------------------------------------
    // TEST 4: POST /api/user/wallet/transfer → must NOT 404
    // ------------------------------------------------------------------
    const transferRes = await request(app)
      .post("/api/user/wallet/transfer")
      .set("Authorization", `Bearer ${token}`)
      .send({ sourceWallet: "cashback", amount: 1 });

    assert.notStrictEqual(transferRes.status, 404, "POST /api/user/wallet/transfer must NOT be 404");
    // 400 is fine (insufficient balance) but 404 means route missing
    console.log(`✓ TEST 4: POST /api/user/wallet/transfer route exists (status: ${transferRes.status})`);

    // ------------------------------------------------------------------
    // TEST 5: POST /api/user/wallet/withdraw → must NOT 404
    // ------------------------------------------------------------------
    const withdrawRes = await request(app)
      .post("/api/user/wallet/withdraw")
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: 1 });

    assert.notStrictEqual(withdrawRes.status, 404, "POST /api/user/wallet/withdraw must NOT be 404");
    console.log(`✓ TEST 5: POST /api/user/wallet/withdraw route exists (status: ${withdrawRes.status})`);

    // ------------------------------------------------------------------
    // TEST 6: Wallet GET must return 401 without token (not 404)
    // ------------------------------------------------------------------
    const unauthRes = await request(app).get("/api/user/wallet");
    assert.notStrictEqual(unauthRes.status, 404, "Unauthenticated wallet request should NOT 404");
    assert.strictEqual(unauthRes.status, 401, "Unauthenticated wallet request should return 401");
    console.log("✓ TEST 6: Unauthenticated GET /api/user/wallet → 401 (not 404)");

    // ------------------------------------------------------------------
    // TEST 7: Frontend .env must point to /api (not /api/auth) so wallet can resolve
    // ------------------------------------------------------------------
    const envPath = path.join(__dirname, "../Frontend/.env");
    const envContent = require("fs").readFileSync(envPath, "utf8");
    const match = envContent.match(/VITE_API_URL\s*=\s*(.+)/);
    assert.ok(match, "Frontend/.env must define VITE_API_URL");
    const apiUrl = match[1].trim();
    assert.ok(!apiUrl.endsWith("/api/auth"), `VITE_API_URL must NOT end with /api/auth — it will break wallet routes. Got: ${apiUrl}`);
    assert.ok(apiUrl.endsWith("/api") || apiUrl.includes("/api"), `VITE_API_URL must include /api. Got: ${apiUrl}`);
    console.log(`✓ TEST 7: Frontend VITE_API_URL is correctly set to: ${apiUrl}`);

    console.log("\n========== ALL WALLET ROUTE TESTS PASSED ==========\n");
    process.exit(0);

  } catch (err) {
    console.error("\n❌ Test failed:", err.message);
    process.exit(1);
  } finally {
    await User.deleteMany({ contact: "9988776655" });
    await mongoose.connection.close();
  }
}

runTests();
