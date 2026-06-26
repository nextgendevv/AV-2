const { execSync } = require("child_process");
const path = require("path");

console.log("\n╔════════════════════════════════════════════════════════╗");
console.log("║          COMPREHENSIVE APPLICATION TEST SUITE          ║");
console.log("╚════════════════════════════════════════════════════════╝\n");

const tests = [
  {
    name: "Backend Configuration Tests",
    file: "tests/backend-config.test.js"
  },
  {
    name: "Frontend Validation Tests",
    file: "tests/frontend-validation.test.js"
  },
  {
    name: "Wallet Flow Integration Tests",
    file: "tests/wallet-api.test.js"
  }
];

let totalPassed = 0;
let totalFailed = 0;

tests.forEach((test, index) => {
  console.log(`\n[${index + 1}/${tests.length}] Running: ${test.name}`);
  console.log("─".repeat(60));
  
  try {
    const env = {
      ...process.env,
      NODE_PATH: path.join(__dirname, "Backend/node_modules")
    };
    execSync(`node ${test.file}`, {
      cwd: __dirname,
      stdio: "inherit",
      env
    });
    totalPassed++;
  } catch (err) {
    totalFailed++;
    console.error(`\n✗ Test failed: ${test.name}`);
  }
});

console.log("\n╔════════════════════════════════════════════════════════╗");
console.log("║                    TEST SUMMARY                        ║");
console.log("╚════════════════════════════════════════════════════════╝\n");
console.log(`✓ Passed: ${totalPassed}/${tests.length}`);
console.log(`✗ Failed: ${totalFailed}/${tests.length}`);

if (totalFailed === 0) {
  console.log("\n🎉 All tests passed! No hardcodes detected.\n");
  process.exit(0);
} else {
  console.log(`\n❌ ${totalFailed} test(s) failed. Please review.\n`);
  process.exit(1);
}
