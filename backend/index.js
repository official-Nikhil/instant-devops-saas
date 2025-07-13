// backend/index.js
//
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const User = require("./models/User"); // assumes User.js is in ./models

dotenv.config();

const app = express();
app.use(cors({ origin: "http://3.93.57.70:5173", credentials: true }));

// MongoDB connection
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
  }
}
connectDB();

const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

// GitHub Login Route
app.get("/api/login", (req, res) => {
  const redirectUri = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&scope=repo`;
  res.redirect(redirectUri);
});

// GitHub Callback Route
app.get("/api/auth/callback", async (req, res) => {
  const code = req.query.code;

  try {
    const tokenRes = await axios.post(
      `https://github.com/login/oauth/access_token`,
      {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
      },
      { headers: { accept: "application/json" } }
    );

    const accessToken = tokenRes.data.access_token;

    const userRes = await axios.get(`https://api.github.com/user`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const githubUser = userRes.data;

    await User.findOneAndUpdate(
      { githubId: githubUser.id },
      {
        githubId: githubUser.id,
        username: githubUser.login,
        accessToken: accessToken,
      },
      { upsert: true, new: true }
    );

    // 🔁 Updated with your new EC2 public IP
    res.redirect(`http://3.93.57.70:5173/dashboard?token=${accessToken}`);
  } catch (err) {
    console.error("GitHub auth failed:", err.message);
    res.status(500).send("Authentication failed");
  }
});

// Start server
app.listen(80, '0.0.0.0', () => {
  console.log("✅ Backend running on http://0.0.0.0:3000");
});

