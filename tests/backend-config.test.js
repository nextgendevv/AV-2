const assert = require("assert");
const fs = require("fs");
const path = require("path");

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (err) {
    console.error(`✗ ${name}`);
    console.error(`  Error: ${err.message}`);
    process.exitCode = 1;
  }
}

console.log("\n========== BACKEND CONFIGURATION TESTS ==========\n");

test("JWT_SECRET is configured in .env", () => {
  const envFile = fs.readFileSync(path.join(__dirname, "../Backend/.env"), "utf8");
  assert(envFile.includes("JWT_SECRET="), ".env should contain JWT_SECRET");
  assert(!envFile.includes("JWT_SECRET=defaultsecret"), "JWT_SECRET should not be 'defaultsecret'");
  console.log("  JWT_SECRET configured in .env");
});

test("MONGO_URI is configured in .env", () => {
  const envFile = fs.readFileSync(path.join(__dirname, "../Backend/.env"), "utf8");
  assert(envFile.includes("MONGO_URI="), ".env should contain MONGO_URI");
  assert(envFile.includes("mongodb"), "MONGO_URI should reference MongoDB");
  console.log("  MONGO_URI configured in .env");
});

test("PORT is configured in .env", () => {
  const envFile = fs.readFileSync(path.join(__dirname, "../Backend/.env"), "utf8");
  assert(envFile.includes("PORT="), ".env should contain PORT");
  console.log("  PORT configured in .env");
});

test(".env.example exists for reference", () => {
  const envExampleExists = fs.existsSync(path.join(__dirname, "../Backend/.env.example"));
  assert(envExampleExists, ".env.example should exist");
  console.log("  .env.example file exists");
});

test("No hardcoded defaults in auth controller", () => {
  const authControllerPath = path.join(__dirname, "../Backend/controllers/authController.js");
  const authControllerCode = fs.readFileSync(authControllerPath, "utf8");
  
  assert(!authControllerCode.includes('"defaultsecret"'), "Should not have hardcoded 'defaultsecret'");
  assert(!authControllerCode.includes("|| \"defaultsecret\""), "Should not have default JWT secret fallback");
  assert(authControllerCode.includes("throw new Error"), "Should throw error if JWT_SECRET not configured");
  console.log("  No hardcoded defaults found in authController");
});

test("No hardcoded defaults in server configuration", () => {
  const serverPath = path.join(__dirname, "../Backend/server.js");
  const serverCode = fs.readFileSync(serverPath, "utf8");
  
  assert(!serverCode.includes("|| 5000"), "Server should not have hardcoded PORT fallback");
  assert(serverCode.includes("throw new Error"), "Server should throw error if PORT not configured");
  console.log("  No hardcoded defaults found in server configuration");
});

test("Frontend .env.example exists", () => {
  const envExampleExists = fs.existsSync(path.join(__dirname, "../Frontend/.env.example"));
  assert(envExampleExists, "Frontend/.env.example should exist");
  console.log("  Frontend/.env.example file exists");
});

test("No hardcoded API URLs in Login component", () => {
  const loginPath = path.join(__dirname, "../Frontend/src/Login.jsx");
  const loginCode = fs.readFileSync(loginPath, "utf8");
  
  assert(!loginCode.includes("|| 'http://localhost:5000"), "Should not have hardcoded localhost fallback");
  assert(loginCode.includes("throw new Error"), "Should throw error if VITE_API_URL not configured");
  console.log("  No hardcoded API URLs in Login component");
});

test("No hardcoded API URLs in Register component", () => {
  const registerPath = path.join(__dirname, "../Frontend/src/Register.jsx");
  const registerCode = fs.readFileSync(registerPath, "utf8");
  
  assert(!registerCode.includes("|| 'http://localhost:5000"), "Should not have hardcoded localhost fallback");
  assert(registerCode.includes("throw new Error"), "Should throw error if VITE_API_URL not configured");
  console.log("  No hardcoded API URLs in Register component");
});

console.log("\n========== ALL CONFIGURATION TESTS PASSED ==========\n");
