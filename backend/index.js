const express = require("express");
const axios = require("axios");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const User = require("./models/User");

dotenv.config();

const app = express();
app.use(cors({ origin: "http://34.238.161.30:5173", credentials: true }));
app.use(express.json()); // Needed to parse POST JSON body

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

    res.redirect(`http://34.238.161.30:5173/dashboard?token=${accessToken}`);
  } catch (err) {
    console.error("GitHub auth failed:", err.message);
    res.status(500).send("Authentication failed");
  }
});

// Route: Setup CI/CD workflow in selected repo
app.post("/api/setup-cicd", async (req, res) => {
  const { token, repoFullName } = req.body;

  if (!token || !repoFullName) {
    return res.status(400).json({ error: "Missing token or repo name" });
  }

  const [owner, repo] = repoFullName.split("/");
  const filePath = ".github/workflows/deploy.yml";

  const workflowYml = `
name: CI/CD Pipeline
on:
  push:
    branches: [ main ]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run Node.js app
        run: echo "Deploying ${repo}"
`;

  let sha = null;

  // Step 1: Check if file exists (get sha if it does)
  try {
    const existingFile = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "User-Agent": "instant-devops-saas",
        },
        params: { branch: "main" },
      }
    );
    sha = existingFile.data.sha;
    console.log("📄 Existing file found. SHA:", sha);
  } catch (err) {
    if (err.response?.status === 404) {
      console.log("📂 File does not exist, will create new one.");
    } else {
      console.error("❌ Error checking file:", err.message);
      return res.status(500).json({ error: "Failed to check existing file" });
    }
  }

  // Step 2: Create or update file
  try {
    await axios.put(
      `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
      {
        message: "Add CI/CD workflow",
        content: Buffer.from(workflowYml).toString("base64"),
        ...(sha && { sha }), // only include sha if updating
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "User-Agent": "instant-devops-saas",
        },
        params: { branch: "main" },
      }
    );

    res.json({ message: `✅ CI/CD workflow added to ${repo}` });
  } catch (err) {
    console.error("❌ CI/CD error:", err.response?.status, err.response?.data || err.message);
    res.status(500).json({
      error: "Failed to setup CI/CD",
      reason: err.response?.data || err.message,
    });
  }
});

// Start server
app.listen(3000, "0.0.0.0", () => {
  console.log("✅ Backend running on http://0.0.0.0:3000");
});
