/**
 * Auth API Tests — Register & Login
 * Uses: Jest + Supertest
 * Run:  npm test (from Backend directory)
 *
 * Covers:
 *  - POST /api/auth/register  (success + all 400 failure paths)
 *  - POST /api/auth/login     (success + all 400 failure paths)
 *  - Environment variable sanity checks
 */

require("dotenv").config();

const request  = require("supertest");
const mongoose = require("mongoose");
const app      = require("./server");
const User     = require("./models/User");

// ─── Helpers ─────────────────────────────────────────────────────────────────
const VALID_USER = {
  name    : "Alice Tester",
  email   : "alice@test.local",
  contact : "9000000001",
  password: "StrongPass@1"
};

// Pre-hashed "password123" with bcrypt (10 rounds)
const HASHED_PW = "$2a$10$hy7n/8OjvYsBBn43qb7xMOq0e0GxOL8Qk8T1KP.iRJExwh.DYQvmO";

// ─── DB Setup ─────────────────────────────────────────────────────────────────
beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
  }
  // Clean slate — only remove docs created by this test suite's email/contact
  await User.deleteMany({
    $or: [
      { email  : { $in: ["alice@test.local", "bob@test.local", "charlie@test.local", "login@test.local"] } },
      { contact: { $in: ["9000000001","9000000002","9000000003","9000000004","9000000005"] } }
    ]
  });
}, 20000);

afterAll(async () => {
  await User.deleteMany({
    $or: [
      { email  : { $in: ["alice@test.local", "bob@test.local", "charlie@test.local", "login@test.local"] } },
      { contact: { $in: ["9000000001","9000000002","9000000003","9000000004","9000000005"] } }
    ]
  });
  await mongoose.connection.close();
}, 15000);

// ─────────────────────────────────────────────────────────────────────────────
// REGISTER TESTS
// ─────────────────────────────────────────────────────────────────────────────
describe("POST /api/auth/register", () => {

  // ── Happy paths ──────────────────────────────────────────────────────────
  test("TC-R01 | should register a new user with all valid fields (201)", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send(VALID_USER)
      .set("Content-Type", "application/json");

    console.log("TC-R01 response:", res.status, res.body.message);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("message", "Registration successful. Please login.");
    expect(res.body.user).toMatchObject({
      name   : VALID_USER.name,
      email  : VALID_USER.email,
      contact: VALID_USER.contact
    });
    expect(res.body.user).toHaveProperty("id");
  });

  test("TC-R02 | should register without email (email optional) (201)", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Bob Nomail", contact: "9000000002", password: "StrongPass@1" })
      .set("Content-Type", "application/json");

    console.log("TC-R02 response:", res.status, res.body.message);
    expect(res.status).toBe(201);
    expect(res.body.user.email).toBeNull();
  });

  // ── Validation / 400 paths ────────────────────────────────────────────────
  test("TC-R03 | should return 400 when name is missing", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "charlie@test.local", contact: "9000000003", password: "StrongPass@1" })
      .set("Content-Type", "application/json");

    console.log("TC-R03 response:", res.status, res.body.message);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/required/i);
  });

  test("TC-R04 | should return 400 when contact is missing", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Ghost User", email: "ghost@test.local", password: "StrongPass@1" })
      .set("Content-Type", "application/json");

    console.log("TC-R04 response:", res.status, res.body.message);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/required/i);
  });

  test("TC-R05 | should return 400 when password is missing", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "No Pass", email: "nopass@test.local", contact: "9000000099" })
      .set("Content-Type", "application/json");

    console.log("TC-R05 response:", res.status, res.body.message);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/required/i);
  });

  test("TC-R06 | should return 400 when all fields are missing (empty body)", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({})
      .set("Content-Type", "application/json");

    console.log("TC-R06 response:", res.status, res.body.message);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/required/i);
  });

  test("TC-R07 | should return 400 on duplicate contact number", async () => {
    // TC-R01 already created contact 9000000001 — try to register again
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        name    : "Duplicate Contact",
        contact : "9000000001",        // same as TC-R01
        password: "AnotherPass@1"
      })
      .set("Content-Type", "application/json");

    console.log("TC-R07 response:", res.status, res.body.message);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already exists/i);
  });

  test("TC-R08 | should return 400 on duplicate email", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        name    : "Duplicate Email",
        email   : "alice@test.local",  // same as TC-R01
        contact : "9000000004",
        password: "AnotherPass@1"
      })
      .set("Content-Type", "application/json");

    console.log("TC-R08 response:", res.status, res.body.message);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already exists/i);
  });

  test("TC-R09 | should register with valid referredBy ObjectId (201)", async () => {
    // first register the referrer
    const referrerRes = await request(app)
      .post("/api/auth/register")
      .send({ name: "Referrer", contact: "9000000005", password: "StrongPass@1" })
      .set("Content-Type", "application/json");
    
    expect(referrerRes.status).toBe(201);
    const referrerId = referrerRes.body.user.id;

    const res = await request(app)
      .post("/api/auth/register")
      .send({
        name      : "Charlie Referred",
        email     : "charlie@test.local",
        contact   : "9000000003",
        password  : "StrongPass@1",
        referredBy: referrerId
      })
      .set("Content-Type", "application/json");

    console.log("TC-R09 response:", res.status, res.body.message);
    expect(res.status).toBe(201);

    // Verify referrer got the bonus
    const referrer = await User.findById(referrerId);
    expect(referrer.earningWallet).toBe(50);
    expect(referrer.referrals).toHaveLength(1);
    expect(referrer.referrals[0].name).toBe("Charlie Referred");
  });
});


// ─────────────────────────────────────────────────────────────────────────────
// LOGIN TESTS
// ─────────────────────────────────────────────────────────────────────────────
describe("POST /api/auth/login", () => {

  beforeAll(async () => {
    // Seed a known login user (password: "password123")
    await User.deleteMany({ contact: "8000000001" });
    await User.create({
      name    : "Login User",
      email   : "login@test.local",
      contact : "8000000001",
      password: HASHED_PW
    });
  });

  afterAll(async () => {
    await User.deleteMany({ contact: "8000000001" });
  });

  // ── Happy paths ──────────────────────────────────────────────────────────
  test("TC-L01 | should login with valid email + password (200)", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ identifier: "login@test.local", password: "password123" })
      .set("Content-Type", "application/json");

    console.log("TC-L01 response:", res.status, res.body.message);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(typeof res.body.token).toBe("string");
    expect(res.body.user).toMatchObject({ name: "Login User" });
  });

  test("TC-L02 | should login with valid contact + password (200)", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ identifier: "8000000001", password: "password123" })
      .set("Content-Type", "application/json");

    console.log("TC-L02 response:", res.status, res.body.message);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
  });

  test("TC-L03 | should return a valid JWT (verifiable structure)", async () => {
    const jwt = require("jsonwebtoken");
    const res = await request(app)
      .post("/api/auth/login")
      .send({ identifier: "login@test.local", password: "password123" })
      .set("Content-Type", "application/json");

    const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET);
    console.log("TC-L03 decoded token id:", decoded.id);
    expect(decoded).toHaveProperty("id");
    expect(decoded.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });

  // ── Failure paths / 400 ──────────────────────────────────────────────────
  test("TC-L04 | should return 400 for wrong password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ identifier: "login@test.local", password: "wrongpassword" })
      .set("Content-Type", "application/json");

    console.log("TC-L04 response:", res.status, res.body.message);
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid credentials.");
  });

  test("TC-L05 | should return 400 for non-existent user", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ identifier: "nobody@test.local", password: "password123" })
      .set("Content-Type", "application/json");

    console.log("TC-L05 response:", res.status, res.body.message);
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid credentials.");
  });

  test("TC-L06 | should return 400 when identifier is missing", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ password: "password123" })
      .set("Content-Type", "application/json");

    console.log("TC-L06 response:", res.status, res.body.message);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/required/i);
  });

  test("TC-L07 | should return 400 when password is missing", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ identifier: "login@test.local" })
      .set("Content-Type", "application/json");

    console.log("TC-L07 response:", res.status, res.body.message);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/required/i);
  });

  test("TC-L08 | should return 400 when body is completely empty", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({})
      .set("Content-Type", "application/json");

    console.log("TC-L08 response:", res.status, res.body.message);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/required/i);
  });

  test("TC-L09 | should return 400 for empty-string credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ identifier: "", password: "" })
      .set("Content-Type", "application/json");

    console.log("TC-L09 response:", res.status, res.body.message);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/required/i);
  });
});


// ─────────────────────────────────────────────────────────────────────────────
// ENVIRONMENT CONFIGURATION SANITY
// ─────────────────────────────────────────────────────────────────────────────
describe("Environment variables", () => {

  test("TC-E01 | JWT_SECRET must be set and not a weak default", () => {
    console.log("TC-E01: JWT_SECRET present:", !!process.env.JWT_SECRET);
    expect(process.env.JWT_SECRET).toBeTruthy();
    expect(process.env.JWT_SECRET).not.toBe("defaultsecret");
    expect(process.env.JWT_SECRET).not.toBe("secret");
  });

  test("TC-E02 | MONGO_URI must be set", () => {
    console.log("TC-E02: MONGO_URI present:", !!process.env.MONGO_URI);
    expect(process.env.MONGO_URI).toBeTruthy();
    expect(process.env.MONGO_URI).toMatch(/^mongodb/);
  });

  test("TC-E03 | PORT must be set and numeric", () => {
    console.log("TC-E03: PORT =", process.env.PORT);
    expect(process.env.PORT).toBeTruthy();
    expect(Number(process.env.PORT)).toBeGreaterThan(0);
  });
});
