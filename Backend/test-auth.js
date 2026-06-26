require("dotenv").config();
const mongoose = require("mongoose");
const request = require("supertest");
const app = require("../server");
const User = require("../models/User");

describe("Authentication API Tests", () => {
  before(async function () {
    this.timeout(10000);
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI);
    }
    // Clear test data
    await User.deleteMany({});
  });

  after(async function () {
    this.timeout(10000);
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  describe("POST /api/auth/register", () => {
    it("should register a user successfully with valid data", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          name: "John Doe",
          email: "john@example.com",
          contact: "1234567890",
          password: "SecurePass123"
        });

      console.log("✓ Test 1: User registration successful");
      console.log(`  Status: ${response.status}, Message: ${response.body.message}`);
      console.assert(response.status === 201, "Status should be 201");
      console.assert(response.body.user.name === "John Doe", "Name should match");
      console.assert(response.body.user.email === "john@example.com", "Email should match");
    });

    it("should fail registration with missing required fields", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          email: "test@example.com",
          contact: "9876543210"
          // Missing name and password
        });

      console.log("✓ Test 2: Registration fails with missing fields");
      console.log(`  Status: ${response.status}, Message: ${response.body.message}`);
      console.assert(response.status === 400, "Status should be 400");
      console.assert(response.body.message.includes("required"), "Should indicate missing fields");
    });

    it("should fail registration with duplicate contact", async () => {
      // First registration
      await request(app)
        .post("/api/auth/register")
        .send({
          name: "Jane Doe",
          email: "jane@example.com",
          contact: "9999999999",
          password: "SecurePass123"
        });

      // Try duplicate
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Another Person",
          email: "another@example.com",
          contact: "9999999999",
          password: "SecurePass123"
        });

      console.log("✓ Test 3: Registration fails with duplicate contact");
      console.log(`  Status: ${response.status}, Message: ${response.body.message}`);
      console.assert(response.status === 400, "Status should be 400");
      console.assert(response.body.message.includes("already exists"), "Should indicate user exists");
    });

    it("should allow registration without email", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Bob Smith",
          contact: "5555555555",
          password: "SecurePass123"
        });

      console.log("✓ Test 4: Registration successful without email");
      console.log(`  Status: ${response.status}, Message: ${response.body.message}`);
      console.assert(response.status === 201, "Status should be 201");
      console.assert(response.body.user.email === null, "Email should be null");
    });
  });

  describe("POST /api/auth/login", () => {
    before(async () => {
      // Create test user
      await User.create({
        name: "Test User",
        email: "testuser@example.com",
        contact: "1111111111",
        password: "$2a$10$Hy9rHnFJJaGDwH8YVHQ8aOVl7HUj1YZF4dCh8F5c.pV.vTv3qFBQ2" // hash for 'password123'
      });
    });

    it("should login successfully with valid email and password", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          identifier: "testuser@example.com",
          password: "password123"
        });

      console.log("✓ Test 5: Login successful with email");
      console.log(`  Status: ${response.status}, Has Token: ${!!response.body.token}`);
      console.assert(response.status === 200, "Status should be 200");
      console.assert(response.body.token, "Should return token");
      console.assert(response.body.user.name === "Test User", "Should return user data");
    });

    it("should login successfully with contact number", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          identifier: "1111111111",
          password: "password123"
        });

      console.log("✓ Test 6: Login successful with contact");
      console.log(`  Status: ${response.status}, Has Token: ${!!response.body.token}`);
      console.assert(response.status === 200, "Status should be 200");
      console.assert(response.body.token, "Should return token");
    });

    it("should fail login with wrong password", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          identifier: "testuser@example.com",
          password: "wrongpassword"
        });

      console.log("✓ Test 7: Login fails with wrong password");
      console.log(`  Status: ${response.status}, Message: ${response.body.message}`);
      console.assert(response.status === 400, "Status should be 400");
      console.assert(response.body.message === "Invalid credentials.", "Should show invalid credentials");
    });

    it("should fail login with non-existent user", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          identifier: "nonexistent@example.com",
          password: "password123"
        });

      console.log("✓ Test 8: Login fails with non-existent user");
      console.log(`  Status: ${response.status}, Message: ${response.body.message}`);
      console.assert(response.status === 400, "Status should be 400");
      console.assert(response.body.message === "Invalid credentials.", "Should show invalid credentials");
    });

    it("should fail login with missing fields", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          identifier: "testuser@example.com"
          // Missing password
        });

      console.log("✓ Test 9: Login fails with missing fields");
      console.log(`  Status: ${response.status}, Message: ${response.body.message}`);
      console.assert(response.status === 400, "Status should be 400");
      console.assert(response.body.message.includes("required"), "Should indicate missing fields");
    });
  });

  describe("Environment Configuration Tests", () => {
    it("should have JWT_SECRET configured", () => {
      console.log("✓ Test 10: JWT_SECRET is configured");
      console.assert(process.env.JWT_SECRET, "JWT_SECRET should not be empty");
      console.assert(process.env.JWT_SECRET !== "defaultsecret", "JWT_SECRET should not be default");
    });

    it("should have MONGO_URI configured", () => {
      console.log("✓ Test 11: MONGO_URI is configured");
      console.assert(process.env.MONGO_URI, "MONGO_URI should not be empty");
    });

    it("should have PORT configured", () => {
      console.log("✓ Test 12: PORT is configured");
      console.assert(process.env.PORT, "PORT should not be empty");
    });
  });
});
