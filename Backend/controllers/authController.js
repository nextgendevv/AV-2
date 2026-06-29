const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

// ================= REGISTER =================
const register = async (req, res) => {
  console.log("REGISTER HIT");
  console.log(req.body);

  try {
    const { name, contact, password, referredBy } = req.body;

    if (!name || !contact || !password) {
      return res.status(400).json({
        message: "Name, phone/email and password are required."
      });
    }

    // Check if input is email or phone
    const isEmail = contact.includes("@");

    const query = isEmail
      ? { email: contact.toLowerCase() }
      : { contact };

    const existingUser = await User.findOne(query);

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists."
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userData = {
      name,
      password: hashedPassword
    };

    if (isEmail) {
      userData.email = contact.toLowerCase();
    } else {
      userData.contact = contact;
    }

    const user = await User.create(userData);

    // Referral Bonus
    if (
      referredBy &&
      mongoose.Types.ObjectId.isValid(referredBy)
    ) {
      const referrer = await User.findById(referredBy);

      if (referrer) {
        const bonus = 50;

        referrer.referrals.unshift({
          name: user.name,
          contact: user.contact || user.email,
          status: "Active"
        });

        referrer.earningWallet += bonus;

        referrer.earnings.unshift({
          source: `Referral Reward: ${user.name}`,
          amount: bonus,
          status: "Completed"
        });

        referrer.transactions.unshift({
          transactionType: "Credit",
          amount: bonus,
          description: `Referral bonus for ${user.name}`,
          balanceAfter: referrer.availableBalance
        });

        referrer.activities.unshift({
          type: "earning",
          title: "Referral Bonus",
          description: `Earned ₹${bonus}`,
          amount: bonus
        });

        await referrer.save();
      }
    }

    res.status(201).json({
      message: "Registration successful. Please login."
    });

  } catch (error) {
    console.error("REGISTER ERROR");
    console.error(error);

    res.status(500).json({
      message: error.message
    });
  }
};

// ================= LOGIN =================
const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        message: "Identifier and password are required."
      });
    }

    const isEmail = identifier.includes("@");

    const user = await User.findOne(
      isEmail
        ? { email: identifier.toLowerCase() }
        : { contact: identifier }
    );

    if (!user) {
      return res.status(400).json({
        message: "Invalid credentials."
      });
    }

    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid credentials."
      });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
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
    console.error("LOGIN ERROR");
    console.error(error);

    res.status(500).json({
      message: error.message
    });
  }
};

module.exports = {
  register,
  login
};