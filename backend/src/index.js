import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { detectIntent, handleIntent } from './rule_engine.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 4000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const KB_PATH = path.join(__dirname, 'kb', 'hindi_v1.json');

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Health
app.get('/api/health', (req, res) => res.json({ ok: true, service: 'finance-mentor-backend' }));

// Serve KB for offline frontend fallback
app.get('/api/kb', (req, res) => {
  try {
    const data = fs.readFileSync(KB_PATH, 'utf-8');
    res.setHeader('Content-Type', 'application/json');
    res.send(data);
  } catch (e) {
    res.status(500).json({ message: 'KB not found' });
  }
});

// Main chat endpoint (rule-only, no external LLM)
app.post('/api/chat', async (req, res) => {
  try {
    const { text = '', lang = 'hi', meta = {} } = req.body || {};
    const t = String(text || '').toLowerCase().trim();
    const intent = detectIntent(t);
    const result = handleIntent(intent, t, meta);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'chat failed', error: String(err?.message || err) });
  }
});

app.listen(PORT, () => {
  console.log(`Finance Mentor backend listening on http://localhost:${PORT}`);
});
