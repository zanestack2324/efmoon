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
    const { items, name, email, phone, address, notes } = req.body;
    if (!items || !items.length || !name || !email) {
      return res.status(400).json({ error: 'Items, name, and email are required' });
    }
    const orders = await store.read('orders') || [];
    const order = {
      id: Date.now().toString(),
      items,
      name: name.trim(),
      email: email.trim(),
      phone: phone || '',
      address: address || '',
      notes: notes || '',
      total: items.reduce((sum, item) => sum + (parseFloat(item.price) * (item.qty || 1)), 0),
      status: 'pending',
      date: new Date().toISOString()
    };
    orders.unshift(order);
    await store.write('orders', orders);
    res.json({ success: true, id: order.id });
  } catch { res.status(500).json({ error: 'Failed to place order' }); }
});

router.get('/', auth, async (req, res) => {
  try {
    const orders = await store.read('orders') || [];
    res.json(orders);
  } catch { res.status(500).json({ error: 'Failed to read orders' }); }
});

router.put('/:id/status', auth, async (req, res) => {
  try {
    const orders = await store.read('orders') || [];
    const idx = orders.findIndex(o => o.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Order not found' });
    orders[idx].status = req.body.status || orders[idx].status;
    await store.write('orders', orders);
    res.json(orders[idx]);
  } catch { res.status(500).json({ error: 'Failed to update order' }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    let orders = await store.read('orders') || [];
    orders = orders.filter(o => o.id !== req.params.id);
    await store.write('orders', orders);
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Failed to delete order' }); }
});

module.exports = router;
