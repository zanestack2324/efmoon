const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const store = require('../lib/storage');

const JWT_SECRET = process.env.JWT_SECRET || 'ef-moon-moonite-era-2026-secret';

// Ensure default admin on first run
(async function init() {
  try {
    const users = await store.read('users') || [];
    if (users.length === 0) {
      const hash = bcrypt.hashSync('moonite2026', 10);
      users.push({ id: 1, username: 'admin', password: hash, role: 'owner' });
      await store.write('users', users);
      console.log('[Auth] Default admin created (admin / moonite2026)');
    }
  } catch (e) {
    console.log('[Auth] Init note: ' + e.message);
  }
})();

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
    const users = await store.read('users') || [];
    const user = users.find(u => u.username === username);
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/verify', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'No token' });
  try {
    const decoded = jwt.verify(auth.replace('Bearer ', ''), JWT_SECRET);
    res.json({ valid: true, user: decoded });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

router.post('/change-password', async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'No token' });
  try {
    const decoded = jwt.verify(auth.replace('Bearer ', ''), JWT_SECRET);
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Current and new password required' });
    const users = await store.read('users') || [];
    const user = users.find(u => u.id === decoded.id);
    if (!user || !bcrypt.compareSync(currentPassword, user.password)) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    user.password = bcrypt.hashSync(newPassword, 10);
    await store.write('users', users);
    res.json({ success: true });
  } catch (e) {
    res.status(401).json({ error: 'Invalid token or server error' });
  }
});

module.exports = router;
