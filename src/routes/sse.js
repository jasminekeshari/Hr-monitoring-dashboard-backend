import express from 'express';

const router = express.Router();

// GET /api/stream (Server-Sent Events)
router.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');

  res.write('retry: 5000\n\n');

  // Initialize SSE client list if not exists
  if (!req.app.get('sseClients')) req.app.set('sseClients', []);
  const clients = req.app.get('sseClients');
  clients.push(res);

  req.on('close', () => {
    const idx = clients.indexOf(res);
    if (idx >= 0) clients.splice(idx, 1);
  });
});

export default router;
