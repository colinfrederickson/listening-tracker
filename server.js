// server.js - Basic web server for our listening tracker

// Import the packages we need
const express = require("express");
const path = require("path");

// Create our Express application
const app = express();

// Set the port - use environment variable or default to 3000
const PORT = process.env.PORT || 3000;

// MIDDLEWARE SETUP
// Serve static files (HTML, CSS, JS) from the 'public' directory
// This means when someone visits our site, Express will look in the 'public' folder
app.use(express.static(path.join(__dirname, "public")));

// Parse JSON in request bodies (we'll need this later for API calls)
app.use(express.json());

// ROUTES
// Main route - serve our HTML dashboard
app.get("/", (req, res) => {
  // Send the index.html file from the public directory
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Health check route - useful for testing if server is running
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Listening Tracker server is running!",
    timestamp: new Date().toISOString(),
  });
});

// Catch-all route for any other requests
app.get("*", (req, res) => {
  // If someone tries to visit a page that doesn't exist, send them to the main page
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ERROR HANDLING
// Handle any server errors gracefully
app.use((err, req, res, next) => {
  console.error("Server error:", err.stack);
  res.status(500).json({
    error: "Something went wrong!",
    message: "Check the server console for details",
  });
});

// START THE SERVER
app.listen(PORT, () => {
  console.log("🎵 Listening Tracker Server Started!");
  console.log(`📡 Server running on: http://localhost:${PORT}`);
  console.log(`📊 Dashboard available at: http://localhost:${PORT}`);
  console.log(`❤️  Health check at: http://localhost:${PORT}/health`);
  console.log("");
  console.log("📝 To stop the server, press Ctrl+C");
  console.log("🔄 To restart after changes, run: npm start");
});

// Handle graceful shutdown
process.on("SIGTERM", () => {
  console.log("👋 Server shutting down gracefully...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("👋 Server shutting down gracefully...");
  process.exit(0);
});
