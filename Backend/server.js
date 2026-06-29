require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();

const corsOptions = {
  origin: true,
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api", (req, res) => {
  res.status(404).json({ message: "API route not found." });
});

const frontendDistPath = path.join(__dirname, "../Frontend/dist");

app.use(express.static(frontendDistPath));
app.get(/^(?!\/api(?:\/|$)).*/, (req, res, next) => {
  res.sendFile(path.join(frontendDistPath, "index.html"), (err) => {
    if (err) next(err);
  });
});

const PORT = process.env.PORT;

if (!PORT) {
  throw new Error("PORT is not configured in environment variables");
}

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server Running on ${PORT}`);
  });
};

if (require.main === module) {
  startServer();
}

module.exports = app;
