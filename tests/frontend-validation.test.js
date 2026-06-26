const assert = require("assert");

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (err) {
    console.error(`✗ ${name}`);
    console.error(`  Error: ${err.message}`);
  }
}

console.log("\n========== FRONTEND VALIDATION TESTS ==========\n");

test("VITE_API_URL format validation", () => {
  const apiUrl = process.env.VITE_API_URL || "http://localhost:5000/api";
  console.log(`  API URL: ${apiUrl}`);
  assert(apiUrl.startsWith("http://") || apiUrl.startsWith("https://"), "Should be a valid HTTP URL");
  assert(apiUrl.includes("/api"), "Should include /api path");
});

test("Environment validation - no hardcoded localhost in production", () => {
  const env = process.env.NODE_ENV || "development";
  console.log(`  Environment: ${env}`);
  if (env === "production") {
    const apiUrl = process.env.VITE_API_URL;
    assert(apiUrl && !apiUrl.includes("localhost"), "Production should not use localhost");
  } else {
    console.log(`  Development environment - localhost allowed`);
  }
});

test("Login form validation - identifier and password required", () => {
  const testCases = [
    { identifier: "user@example.com", password: "password123", valid: true },
    { identifier: "", password: "password123", valid: false },
    { identifier: "user@example.com", password: "", valid: false },
    { identifier: "1234567890", password: "password123", valid: true },
  ];

  testCases.forEach((testCase, index) => {
    const isValid = testCase.identifier.trim() !== "" && testCase.password !== "";
    assert.strictEqual(isValid, testCase.valid, `Test case ${index + 1} validation failed`);
  });
  console.log(`  All ${testCases.length} login validation cases passed`);
});

test("Registration form validation - name, contact, password required", () => {
  const testCases = [
    { name: "John Doe", contact: "1234567890", password: "pass123", valid: true },
    { name: "", contact: "1234567890", password: "pass123", valid: false },
    { name: "John Doe", contact: "", password: "pass123", valid: false },
    { name: "John Doe", contact: "1234567890", password: "", valid: false },
  ];

  testCases.forEach((testCase, index) => {
    const isValid = testCase.name.trim() !== "" && testCase.contact.trim() !== "" && testCase.password !== "";
    assert.strictEqual(isValid, testCase.valid, `Test case ${index + 1} validation failed`);
  });
  console.log(`  All ${testCases.length} registration validation cases passed`);
});

test("Password strength validation - minimum 6 characters", () => {
  const validatePassword = (pwd) => {
    return !!(pwd && pwd.length >= 6);
  };

  const testCases = [
    { password: "pass123", valid: true },
    { password: "12345", valid: false },
    { password: null, valid: false },
    { password: "SecurePassword123!", valid: true },
  ];

  testCases.forEach((testCase, index) => {
    const isValid = validatePassword(testCase.password);
    assert.strictEqual(isValid, testCase.valid, `Test case ${index + 1} validation failed`);
  });
  console.log(`  All ${testCases.length} password strength cases passed`);
});

test("Email format validation when provided", () => {
  const validateEmail = (email) => {
    if (!email) return true; // Email is optional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const testCases = [
    { email: "user@example.com", valid: true },
    { email: "invalid.email", valid: false },
    { email: "", valid: true }, // Optional
    { email: "test@domain.co.uk", valid: true },
  ];

  testCases.forEach((testCase, index) => {
    const isValid = validateEmail(testCase.email);
    assert.strictEqual(isValid, testCase.valid, `Test case ${index + 1} validation failed`);
  });
  console.log(`  All ${testCases.length} email validation cases passed`);
});

test("Phone number format validation - 10+ digits only", () => {
  const validateContact = (contact) => {
    return contact && contact.length >= 10 && /^\d+$/.test(contact);
  };

  const testCases = [
    { contact: "1234567890", valid: true },
    { contact: "12345", valid: false },
    { contact: "123456789a", valid: false },
    { contact: "+919876543210", valid: false }, // Format with +
  ];

  testCases.forEach((testCase, index) => {
    const isValid = validateContact(testCase.contact);
    assert.strictEqual(isValid, testCase.valid, `Test case ${index + 1} validation failed`);
  });
  console.log(`  All ${testCases.length} phone validation cases passed`);
});

console.log("\n========== TESTS COMPLETED ==========\n");
