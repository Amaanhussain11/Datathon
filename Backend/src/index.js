import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { connectDB } from './config/db.js';
import healthRouter from './routes/health.js';
import authRouter from './routes/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173', credentials: true }));
app.use(express.json());

// Routes
app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);

// Root
app.get('/', (req, res) => {
  res.json({ ok: true, message: 'Backend is running' });
});

// Start server after db
(async () => {
  try {
    await connectDB();
    app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
})();
