const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const register = async (req, res) => {
  try {
    const { name, email, contact, password } = req.body;

    if (!name || !contact || !password) {
      return res.status(400).json({ message: "Name, contact and password are required." });
    }

    const existingUser = await User.findOne({
      $or: [
        { email: email || null },
        { contact: contact }
      ]
    });

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

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "defaultsecret", {
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