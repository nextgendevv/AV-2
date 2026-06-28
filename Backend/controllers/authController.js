const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const register = async (req, res) => {
  try {
    const { name, email, contact, password, referredBy } = req.body;

    if (!name || !contact || !password) {
      return res.status(400).json({ message: "Name, contact and password are required." });
    }

    // Build the OR query — only include email when it is actually supplied
    const orConditions = [{ contact }];
    if (email) orConditions.push({ email });

    const existingUser = await User.findOne({ $or: orConditions });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this email or contact." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email: email || null,
      contact,
      password: hashedPassword
    });

    // Check if user registered via a referral link
    if (referredBy) {
      const mongoose = require("mongoose");
      if (mongoose.Types.ObjectId.isValid(referredBy)) {
        const referrer = await User.findById(referredBy);
        if (referrer) {
          // 1. Add referral record
          referrer.referrals.unshift({
            name: user.name,
            contact: user.contact,
            status: "Active",
            referredAt: new Date()
          });

          // 2. Add Earning (₹50 referral bonus)
          const referralBonus = 50.00;
          referrer.earningWallet = Math.round((referrer.earningWallet + referralBonus) * 100) / 100;
          referrer.earnings.unshift({
            source: `Referral Reward: ${user.name}`,
            amount: referralBonus,
            status: "Completed",
            createdAt: new Date()
          });

          // 3. Add Transaction Log
          referrer.transactions.unshift({
            transactionType: "Credit",
            amount: referralBonus,
            description: `Referral bonus for referring ${user.name}`,
            balanceAfter: referrer.availableBalance, // availableBalance doesn't change directly until transfer
            createdAt: new Date()
          });

          // 4. Add Activity Log
          referrer.activities.unshift({
            type: "earning",
            title: "Referral Bonus Received",
            description: `Earned ₹${referralBonus} for referring ${user.name}`,
            amount: referralBonus,
            createdAt: new Date()
          });

          await referrer.save();
        }
      }
    }

    return res.status(201).json({
      message: "Registration successful. Please login.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        contact: user.contact
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error while registering user." });
  }
};

const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ message: "Identifier and password are required." });
    }

    const user = await User.findOne({
      $or: [
        { email: identifier },
        { contact: identifier }
      ]
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials." });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured in environment variables");
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d"
    });

    return res.json({
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        contact: user.contact
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error while logging in." });
  }
};

module.exports = {
  register,
  login
};