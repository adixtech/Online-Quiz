import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Import routes
import quizRoutes from './routes/quizroutes.js';
import leaderboardRoutes from './routes/leaderboardroutes.js';
import resultRoutes from "./routes/resultroutes.js";
import authRoutes from './routes/authRoutes.js'; // ✅ Authentication routes
import Leaderboard from "./models/Leaderboard.js"; // ✅ Leaderboard model

dotenv.config();
const app = express();
const server = createServer(app);

// ✅ Initialize Socket.io with CORS settings
const io = new Server(server, {
    cors: {
        origin: "*",  // ✅ Change this to your frontend URL in production
        methods: ["GET", "POST"]
    }
});

// ✅ Handle WebSocket connections
io.on("connection", (socket) => {
    console.log("✅ New client connected:", socket.id);

    socket.on("disconnect", () => {
        console.log("❌ Client disconnected:", socket.id);
    });
});

// ✅ Middleware
app.use(express.json());
app.use(cors());

// ✅ Connect to MongoDB Atlas
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("✅ Connected to MongoDB Atlas"))
    .catch(err => console.log("❌ MongoDB Connection Error:", err));

// ✅ Function to emit real-time leaderboard updates
const updateLeaderboard = async () => {
    try {
        const leaderboard = await Leaderboard.find().sort({ score: -1 });
        io.emit("leaderboardUpdate", leaderboard);
    } catch (error) {
        console.error("❌ Error updating leaderboard:", error);
    }
};

// ✅ Middleware to attach `updateLeaderboard` to request
app.use((req, res, next) => {
    req.updateLeaderboard = updateLeaderboard;
    next();
});

// ✅ Use Routes
app.use('/api/auth', authRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use("/api/results", resultRoutes);

// ✅ Global Error Handler
app.use((err, req, res, next) => {
    console.error("❌ Global Error Handler:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
});

// ✅ Export `io` AFTER all configurations
export { io };

// ✅ Start Server
const PORT = process.env.PORT || 5500;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

app.post('/api/logout', (req, res) => {
    res.status(200).json({ message: "Logged out successfully" });
});
