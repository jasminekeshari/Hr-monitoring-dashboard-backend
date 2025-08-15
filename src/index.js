import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';

import logsRouter from './routes/logs.js';
import summaryRouter from './routes/summary.js';

dotenv.config();
const app = express();

// CORS
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://hrmonitoringdashboard.netlify.app/"
    ],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);

// Parse JSON
app.use(express.json());

// Initialize SSE clients array
app.set('sseClients', []);

// MongoDB connect
mongoose.connect(process.env.MONGO_URI, { dbName: 'hr_monitoring' })
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/logs', logsRouter);
app.use('/api/summary', summaryRouter);

// SSE stream
app.get('/api/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Send initial comment to keep connection alive
  res.write('retry: 5000\n\n');

  const clients = app.get('sseClients');
  clients.push(res);

  req.on('close', () => {
    const idx = clients.indexOf(res);
    if (idx >= 0) clients.splice(idx, 1);
  });
});

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
