import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { Server } from "socket.io";

// Load environment variables
dotenv.config();

import { connectDB } from "./config/db.js";
import { initSocket } from "./socket/socketHandler.js";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import conversationRoutes from "./routes/conversationRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const server = http.createServer(app);

// Render is behind a reverse proxy
app.set("trust proxy", 1);

// Frontend URL from Render Environment Variables
const CLIENT_URL =
  process.env.CLIENT_URL || "http://localhost:5173";

// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests without an origin
    // Example: Postman or server-to-server requests
    if (!origin) {
      return callback(null, true);
    }

    // Allow deployed frontend and local development
    if (
      origin === CLIENT_URL ||
      origin === "http://localhost:5173"
    ) {
      return callback(null, true);
    }

    console.log("Blocked CORS origin:", origin);

    return callback(new Error("Not allowed by CORS"));
  },

  credentials: true,
};

// Express CORS
app.use(cors(corsOptions));

// Socket.IO
const io = new Server(server, {
  cors: corsOptions,
});

// Parse JSON
app.use(express.json({ limit: "10mb" }));

// Static uploads
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Velora server is running",
  });
});

// API Routes
app.use("/api/auth", authRoutes);

app.use("/api/users", userRoutes);

app.use("/api/conversations", conversationRoutes);

app.use("/api/messages", messageRoutes);

app.use("/api/upload", uploadRoutes);

// Central error handler
app.use((err, req, res, next) => {
  console.error("Server Error:", err);

  res.status(err.status || 500).json({
    message: err.message || "Server error.",
  });
});

// Initialize Socket.IO
initSocket(io);

// Server port
const PORT = process.env.PORT || 5000;

// Connect MongoDB first, then start server
connectDB()
  .then(() => {
    server.listen(PORT, "0.0.0.0", () => {
      console.log(
        `Velora server running on port ${PORT}`
      );
    });
  })
  .catch((error) => {
    console.error(
      "Failed to start server:",
      error.message
    );

    process.exit(1);
  });