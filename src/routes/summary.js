import express from 'express';
import Log from '../models/Log.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { preset } = req.query;

    let startTime;
    if (preset === 'last24h') {
      startTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
    } else if (preset === 'last7d') {
      startTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    } else {
      return res.status(400).json({ error: 'Invalid preset' });
    }

    const logs = await Log.find({ createdAt: { $gte: startTime } }).sort({ createdAt: -1 });
    res.json({ count: logs.length, logs });
  } catch (err) {
    console.error('Summary fetch error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
