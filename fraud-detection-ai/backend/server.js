import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import kycRoutes from './routes/kycRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import riskRoutes from './routes/riskRoutes.js';
import fs from 'fs';
import uploadRoute from './routes/uploadRoute.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 4800;

app.use(cors());
// Explicit CORS headers for all responses and handle OPTIONS
app.use((req, res, next) => {
  const origin = process.env.CORS_ORIGIN || '*';
  res.header('Access-Control-Allow-Origin', origin);
  res.header('Vary', 'Origin');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
app.use(express.json({ limit: '2mb' }));

// Mongo connection (optional). If no URI, continue without failing.
const MONGODB_URI = process.env.MONGODB_URI || '';
if (MONGODB_URI) {
  mongoose.connect(MONGODB_URI).then(()=>{
    console.log('Mongo connected');
  }).catch(err=>{
    console.warn('Mongo connection failed:', err.message);
  });
} else {
  console.warn('MONGODB_URI not set. Proceeding without DB persistence.');
}

// Ensure uploads folder exists for multer
try { fs.mkdirSync('uploads', { recursive: true }); } catch {}

// Routes
app.use('/api/kyc', kycRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/risk-summary', riskRoutes);
app.use('/api/upload', uploadRoute);

app.get('/api/health', (req, res) => res.json({ ok: true, service: 'fraud-detection-backend' }));
// Friendly root route
app.get('/', (req, res) => {
  res.type('text/plain').send(
    [
      'Fraud Detection Backend',
      'OK',
      '',
      'Useful endpoints:',
      '- GET  /api/health',
      '- POST /api/upload           (CSV file field: file)',
      '- POST /api/kyc              (image file field: file, form fields: user_id, name?, aliases?)',
      '- POST /api/transactions     (JSON: { user_id, transactions: [...] })',
      '- GET  /api/risk-summary/:id',
      ''
    ].join('\n')
  );
});

app.listen(PORT, () => {
  console.log(`Fraud backend listening on http://localhost:${PORT}`);
});
