import express from 'express';
import apicache from 'apicache';
import Log from '../models/Log.js';
import { parseDateRange } from '../utils/validateRange.js';
import { buildQuery } from '../utils/buildQuery.js';
import nodemailer from 'nodemailer';

const router = express.Router();
const cache = apicache.middleware;

function getSort(sortBy = 'createdAt', sortDir = 'desc') {
  const dir = sortDir === 'asc' ? 1 : -1;
  const allowed = ['createdAt', 'interfaceName', 'integrationKey', 'status', 'severity'];
  const field = allowed.includes(sortBy) ? sortBy : 'createdAt';
  return { [field]: dir };
}

// GET /api/logs/summary
router.get('/summary', cache('30 seconds'), async (req, res) => {
  try {
    const { preset, from, to } = req.query;
    const { start, end } = parseDateRange(preset, from, to);

    const match = { createdAt: { $gte: start, $lte: end } };
    const [counts, trend] = await Promise.all([
      Log.aggregate([
        { $match: match },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Log.aggregate([
        { $match: match },
        {
          $group: {
            _id: { hour: { $dateTrunc: { date: '$createdAt', unit: 'hour' } }, status: '$status' },
            count: { $sum: 1 }
          }
        },
        {
          $group: {
            _id: '$_id.hour',
            buckets: { $push: { status: '$_id.status', count: '$count' } }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    const summary = { SUCCESS: 0, FAILURE: 0, PENDING: 0 };
    counts.forEach(c => (summary[c._id] = c.count));

    res.json({ range: { start, end }, summary, trend });
  } catch (err) {
    console.error('Summary error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/logs
router.get('/', async (req, res) => {
  try {
    const {
      preset, from, to,
      interfaceName, integrationKey, status, severity, search,
      page = 1, limit = 50,
      sortBy = 'createdAt', sortDir = 'desc'
    } = req.query;

    const { start, end } = parseDateRange(preset, from, to);
    const query = buildQuery({ interfaceName, integrationKey, status, severity, search, start, end });

    const pageNum = Math.max(1, parseInt(page));
    const perPage = Math.min(200, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * perPage;

    const [items, total] = await Promise.all([
      Log.find(query).sort(getSort(sortBy, sortDir)).skip(skip).limit(perPage).lean(),
      Log.countDocuments(query)
    ]);

    res.json({ page: pageNum, limit: perPage, total, items });
  } catch (err) {
    console.error('Logs fetch error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/logs
router.post('/', async (req, res) => {
  try {
    const { interfaceName, integrationKey, status, severity, message, meta } = req.body;
    const doc = await Log.create({ interfaceName, integrationKey, status, severity, message, meta, createdAt: new Date() });

    // Send email if FAILURE
    if (status === 'FAILURE' && process.env.SMTP_HOST && process.env.ALERT_EMAIL_TO) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 587),
          secure: false,
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        });
        await transporter.sendMail({
          from: process.env.ALERT_EMAIL_FROM || process.env.SMTP_USER,
          to: process.env.ALERT_EMAIL_TO,
          subject: `Interface FAILURE: ${interfaceName} (${integrationKey})`,
          text: message || 'Failure detected'
        });
      } catch (e) {
        console.warn('Email failed:', e.message);
      }
    }

    // Push SSE updates
    const clients = req.app.get('sseClients') || [];
    clients.forEach(resSSE => resSSE.write(`data: ${JSON.stringify(doc)}\n\n`));

    res.status(201).json(doc);
  } catch (err) {
    console.error('Log creation error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
