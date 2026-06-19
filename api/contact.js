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
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required' });
    }
    const contacts = await store.read('contacts') || [];
    const entry = {
      id: Date.now().toString(),
      name: name.trim(),
      email: email.trim(),
      message: message.trim(),
      date: new Date().toISOString(),
      read: false
    };
    contacts.unshift(entry);
    await store.write('contacts', contacts);
    res.json({ success: true, id: entry.id });
  } catch { res.status(500).json({ error: 'Failed to save message' }); }
});

router.get('/', auth, async (req, res) => {
  try {
    const contacts = await store.read('contacts') || [];
    res.json(contacts);
  } catch { res.status(500).json({ error: 'Failed to read messages' }); }
});

router.put('/:id/read', auth, async (req, res) => {
  try {
    const contacts = await store.read('contacts') || [];
    const idx = contacts.findIndex(c => c.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Message not found' });
    contacts[idx].read = true;
    await store.write('contacts', contacts);
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Failed to update message' }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    let contacts = await store.read('contacts') || [];
    contacts = contacts.filter(c => c.id !== req.params.id);
    await store.write('contacts', contacts);
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Failed to delete message' }); }
});

module.exports = router;
