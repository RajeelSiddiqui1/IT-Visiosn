import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import 'dotenv/config';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'path';
import { inngest } from './inngest/client.js';
import { serve } from 'inngest/express';
import { generateRoadmapFn } from './inngest/functions/roadmap.function.js';
import { evalFlow } from './inngest/functions/interview.function.js';
import {onTicketCreated} from "./inngest/functions/ticket-create.function.js"
import Interview from './models/Interview.js';
import { generateQuestion } from './inngest/agent.js';
import { protectRoute } from './middleware/auth.middleware.js'; 

// Routes
import authRoutes from './routes/auth.route.js';
import userRoutes from './routes/user.route.js';
import chatRoutes from './routes/chat.route.js';
import postRoutes from './routes/post.route.js';
import aiRoutes from './routes/ai.route.js';
import cvRoutes from './routes/cv.route.js';
import commentRoutes from './routes/comment.route.js';
import faceAuthRoutes from './routes/face-auth.route.js';
import roadMapRoutes from './routes/road-map.route.js';
import interviewRoutes from './routes/interview.route.js';
import resultRoutes from './routes/result.routes.js';
import chatboatRoutes from './routes/chatboat.route.js';
import leaderboardRoutes from './routes/leaderboard.route.js';
import ticketRoutes from "./routes/ticket.route.js"
import contactRoutes from "./routes/contact.route.js"
import paymentRoutes from "./routes/payment.route.js"
// import resumeRoutes from "./routes/resume.routes.js";
import reviewRoutes from "./routes/review.routes.js";
import jarvisRoutes from "./routes/jarvis.route.js";
import { setSocketIOInstance } from './controllers/post.controller.js';
import { connectDB } from './lib/db.js';


// admin 
import adminRoutes from "./routes/admin.route.js";

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'https://d9666bbk-5173.asse.devtunnels.ms',
  'http://153.92.209.177:5001',
  'http://153.92.209.177:5173',
  'http://153.92.209.177:5178',
  process.env.FRONTEND_URL
].filter(Boolean);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

io.on('connection', (socket) => {
  console.log('✅ Socket connected:', socket.id);

  socket.on('join_post', (postId) => {
    socket.join(postId);
    console.log(`🔗 User joined post room: ${postId}`);
  });

  socket.on('leave_post', (postId) => {
    socket.leave(postId);
    console.log(`❌ User left post room: ${postId}`);
  });

  socket.on('join-room', async (interviewId) => {
    if (!interviewId || typeof interviewId !== 'string') {
      console.error('Invalid interviewId for join-room:', interviewId);
      socket.emit('error', 'Invalid interview ID');
      return;
    }
    socket.join(interviewId);
    console.log(`🔗 User joined interview room: ${interviewId}`);

    try {
      const interview = await Interview.findById(interviewId);
      if (!interview) {
        socket.emit('error', 'Interview not found');
        return;
      }
      const { topic, level } = interview;
      const question = await generateQuestion(level, topic);
      console.log(`Emitting question for interview ${interviewId}:`, question);
      io.to(interviewId).emit('question', question);
    } catch (error) {
      console.error('Error generating question:', error);
      socket.emit('error', 'Failed to generate question');
    }
  });

  socket.on('answer', async ({ interviewId, question, answer }) => {
    if (!interviewId || !answer || typeof interviewId !== 'string' || typeof answer !== 'string') {
      console.error('Invalid answer data:', { interviewId, answer });
      socket.emit('error', 'Invalid answer data');
      return;
    }
    console.log(`📝 Answer submitted for interview ${interviewId}:`, { question, answer });
    io.to(interviewId).emit('transcript', answer);

    try {
      const interview = await Interview.findById(interviewId);
      if (!interview) {
        socket.emit('error', 'Interview not found');
        return;
      }
      const { topic, level } = interview;
      const nextQuestion = await generateQuestion(level, topic);
      console.log(`Emitting next question for interview ${interviewId}:`, nextQuestion);
      io.to(interviewId).emit('question', nextQuestion);
    } catch (error) {
      console.error('Error generating next question:', error);
      socket.emit('error', 'Failed to generate next question');
    }
  });

  socket.on('disconnect', () => {
    console.log('🔌 Socket disconnected:', socket.id);
  });
});

setSocketIOInstance(io);



// Middleware
const __dirname = path.resolve();
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://153.92.209.177') || origin.startsWith('http://localhost')) {
        callback(null, true);
      } else {
        console.warn(`⚠️ CORS blocked origin: ${origin}`);
        callback(null, false); // Pass false instead of throwing a noisy error
      }
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', protectRoute, userRoutes);
app.use('/api/chat', protectRoute, chatRoutes);
app.use('/api/post', protectRoute, postRoutes);
app.use('/api/ai', protectRoute, aiRoutes);
app.use('/api/cv', protectRoute, cvRoutes);
app.use('/api/comment', protectRoute, commentRoutes);
app.use('/api/face-auth', faceAuthRoutes);
app.use('/api/roadmap', protectRoute, roadMapRoutes); 
app.use('/api/interview', protectRoute, interviewRoutes);
app.use('/api/results', protectRoute, resultRoutes);
app.use('/api/chatbot', protectRoute, chatboatRoutes);
app.use('/api/ticket', protectRoute, ticketRoutes);
app.use('/api/leaderboard', protectRoute, leaderboardRoutes);
app.use('/api/contact', protectRoute, contactRoutes);
app.use('/api/payment', protectRoute, paymentRoutes); 
// app.use("/api/resumes", resumeRoutes);
app.use("/api/jarvis", jarvisRoutes);
app.use("/api/reviews", reviewRoutes);
app.use(
  '/api/inngest',
  serve({
    client: inngest,
    functions: [generateRoadmapFn, evalFlow,onTicketCreated],
  })
);


// admin 
app.use("/api/admin", adminRoutes);






// Static file serving in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  app.get('*', (req, res) =>
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'))
  );
}

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  connectDB();
});

export { io };