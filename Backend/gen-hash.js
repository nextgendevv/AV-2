// Helper script to generate a bcrypt hash for use in tests
const bcrypt = require("bcryptjs");
bcrypt.hash("password123", 10).then(h => console.log(h));
