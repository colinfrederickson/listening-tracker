// server.js - Listening tracker server with Spotify integration

// Import required packages
const express = require("express");
const path = require("path");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config(); // Load environment variables

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Spotify API configuration
const SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize";
const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
const SPOTIFY_API_BASE = "https://api.spotify.com/v1";

// Required scopes for accessing user data
const SPOTIFY_SCOPES = [
  "user-read-private",
  "user-read-email",
  "user-top-read",
  "user-read-recently-played",
  "user-library-read",
  "user-read-playback-state",
].join(" ");

// MIDDLEWARE
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Store user sessions (in production, use a proper session store)
const userSessions = new Map();

// UTILITY FUNCTIONS

// Generate random state for OAuth security
function generateRandomString(length) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Make authenticated Spotify API requests
async function spotifyRequest(endpoint, accessToken, params = {}) {
  try {
    const response = await axios.get(`${SPOTIFY_API_BASE}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params,
    });
    return response.data;
  } catch (error) {
    console.error(
      `Spotify API error for ${endpoint}:`,
      error.response?.data || error.message
    );
    throw new Error(
      `Spotify API request failed: ${error.response?.status || "Unknown error"}`
    );
  }
}

// ROUTES

// Main dashboard route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Listening Tracker server is running!",
    timestamp: new Date().toISOString(),
    spotify_configured: !!(
      process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET
    ),
  });
});

// SPOTIFY OAUTH ROUTES

// Initiate Spotify login
app.get("/login", (req, res) => {
  // Check if Spotify credentials are configured
  if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
    return res.status(500).json({
      error: "Spotify credentials not configured",
      message: "Please check your .env file",
    });
  }

  const state = generateRandomString(16);

  const authURL =
    `${SPOTIFY_AUTH_URL}?` +
    new URLSearchParams({
      response_type: "code",
      client_id: process.env.SPOTIFY_CLIENT_ID,
      scope: SPOTIFY_SCOPES,
      redirect_uri: process.env.REDIRECT_URI,
      state: state,
      show_dialog: true,
    });

  // Store state for verification
  userSessions.set(state, { timestamp: Date.now() });

  res.redirect(authURL);
});

// Handle Spotify OAuth callback
app.get("/callback", async (req, res) => {
  const { code, state, error } = req.query;

  // Handle OAuth errors
  if (error) {
    console.error("Spotify OAuth error:", error);
    return res.redirect("/?error=access_denied");
  }

  // Verify state parameter
  if (!state || !userSessions.has(state)) {
    console.error("Invalid state parameter");
    return res.redirect("/?error=invalid_state");
  }

  try {
    // Exchange authorization code for access token
    const tokenResponse = await axios.post(
      SPOTIFY_TOKEN_URL,
      new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: process.env.REDIRECT_URI,
        client_id: process.env.SPOTIFY_CLIENT_ID,
        client_secret: process.env.SPOTIFY_CLIENT_SECRET,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    // Store tokens in session
    userSessions.set(state, {
      access_token,
      refresh_token,
      expires_at: Date.now() + expires_in * 1000,
      timestamp: Date.now(),
    });

    // Redirect back to dashboard with session state
    res.redirect(`/?session=${state}`);
  } catch (error) {
    console.error(
      "Token exchange error:",
      error.response?.data || error.message
    );
    res.redirect("/?error=token_exchange_failed");
  }
});

// SPOTIFY API ENDPOINTS

// Get user's top tracks
app.get("/api/top-tracks", async (req, res) => {
  const { session, time_range = "short_term", limit = 50 } = req.query;

  if (!session || !userSessions.has(session)) {
    return res.status(401).json({ error: "Invalid session" });
  }

  const userSession = userSessions.get(session);

  try {
    const data = await spotifyRequest(
      "/me/top/tracks",
      userSession.access_token,
      {
        time_range,
        limit,
      }
    );
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's top artists
app.get("/api/top-artists", async (req, res) => {
  const { session, time_range = "short_term", limit = 50 } = req.query;

  if (!session || !userSessions.has(session)) {
    return res.status(401).json({ error: "Invalid session" });
  }

  const userSession = userSessions.get(session);

  try {
    const data = await spotifyRequest(
      "/me/top/artists",
      userSession.access_token,
      {
        time_range,
        limit,
      }
    );
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get recently played tracks
app.get("/api/recently-played", async (req, res) => {
  const { session, limit = 50 } = req.query;

  if (!session || !userSessions.has(session)) {
    return res.status(401).json({ error: "Invalid session" });
  }

  const userSession = userSessions.get(session);

  try {
    const data = await spotifyRequest(
      "/me/player/recently-played",
      userSession.access_token,
      {
        limit,
      }
    );
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's saved shows (podcasts)
app.get("/api/shows", async (req, res) => {
  const { session, limit = 50 } = req.query;

  if (!session || !userSessions.has(session)) {
    return res.status(401).json({ error: "Invalid session" });
  }

  const userSession = userSessions.get(session);

  try {
    const data = await spotifyRequest("/me/shows", userSession.access_token, {
      limit,
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get audio features for tracks
app.get("/api/audio-features", async (req, res) => {
  const { session, ids } = req.query;

  if (!session || !userSessions.has(session)) {
    return res.status(401).json({ error: "Invalid session" });
  }

  const userSession = userSessions.get(session);

  try {
    const data = await spotifyRequest(
      "/audio-features",
      userSession.access_token,
      {
        ids,
      }
    );
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current user profile
app.get("/api/me", async (req, res) => {
  const { session } = req.query;

  if (!session || !userSessions.has(session)) {
    return res.status(401).json({ error: "Invalid session" });
  }

  const userSession = userSessions.get(session);

  try {
    const data = await spotifyRequest("/me", userSession.access_token);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ERROR HANDLING
app.use((err, req, res, next) => {
  console.error("Server error:", err.stack);
  res.status(500).json({
    error: "Something went wrong!",
    message: "Check the server console for details",
  });
});

// Catch-all route
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// START SERVER
app.listen(PORT, () => {
  console.log("🎵 Listening Tracker Server Started!");
  console.log(`📡 Server running on: http://localhost:${PORT}`);
  console.log(`📊 Dashboard available at: http://localhost:${PORT}`);
  console.log(`❤️  Health check at: http://localhost:${PORT}/health`);
  console.log("");

  // Check Spotify configuration
  if (process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET) {
    console.log("✅ Spotify API configured");
    console.log(`🔐 Login at: http://localhost:${PORT}/login`);
  } else {
    console.log("⚠️  Spotify API not configured - check your .env file");
  }

  console.log("");
  console.log("📝 To stop the server, press Ctrl+C");
  console.log("🔄 To restart after changes, run: npm start");
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("👋 Server shutting down gracefully...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("👋 Server shutting down gracefully...");
  process.exit(0);
});
