const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const store = require('../lib/storage');

const JWT_SECRET = process.env.JWT_SECRET || 'ef-moon-moonite-era-2026-secret';

function auth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(auth.replace('Bearer ', ''), JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

router.post('/', async (req, res) => {
  try {
    const { name, message } = req.body;
    if (!name || !message) {
      return res.status(400).json({ error: 'Name and message are required' });
    }
    const wall = await store.read('interact') || [];
    const entry = {
      id: Date.now().toString(),
      name: name.trim(),
      message: message.trim(),
      date: new Date().toISOString(),
      approved: false
    };
    wall.unshift(entry);
    await store.write('interact', wall);
    res.json({ success: true, id: entry.id, message: 'Your message has been submitted for review!' });
  } catch { res.status(500).json({ error: 'Failed to post message' }); }
});

router.get('/approved', async (req, res) => {
  try {
    const wall = await store.read('interact') || [];
    res.json(wall.filter(w => w.approved));
  } catch { res.status(500).json({ error: 'Failed to read messages' }); }
});

router.get('/', auth, async (req, res) => {
  try {
    const wall = await store.read('interact') || [];
    res.json(wall);
  } catch { res.status(500).json({ error: 'Failed to read messages' }); }
});

router.put('/:id/approve', auth, async (req, res) => {
  try {
    const wall = await store.read('interact') || [];
    const idx = wall.findIndex(w => w.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Message not found' });
    wall[idx].approved = !wall[idx].approved;
    await store.write('interact', wall);
    res.json({ success: true, approved: wall[idx].approved });
  } catch { res.status(500).json({ error: 'Failed to update message' }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    let wall = await store.read('interact') || [];
    wall = wall.filter(w => w.id !== req.params.id);
    await store.write('interact', wall);
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Failed to delete message' }); }
});

module.exports = router;
