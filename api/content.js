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

// ===== SETTINGS =====
router.get('/settings', async (req, res) => {
  try {
    const settings = await store.read('settings') || {
      siteName: 'EF MOON',
      tagline: 'The Moonite Era',
      bio: '',
      stats: { followers: '28K+', singles: '15+', album: '1', since: '2023' },
      albumTitle: 'MOON 1',
      releaseDate: '2026-07-17',
      heroTitle: 'EF Moon',
      heroTagline: 'The Moonite Era',
      guidance: 'Welcome to EF MOON. Here you can explore the music, connect with the community, and dive into the Moonite universe. Stay tuned for updates, exclusive content, and more.'
    };
    res.json(settings);
  } catch { res.status(500).json({ error: 'Failed to read settings' }); }
});

router.post('/settings', auth, async (req, res) => {
  try {
    await store.write('settings', req.body);
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Failed to save settings' }); }
});

// ===== BIO =====
router.get('/bio', async (req, res) => {
  try {
    const settings = await store.read('settings');
    res.json(settings ? { text: settings.bio, stats: settings.stats } : { text: '', stats: {} });
  } catch { res.status(500).json({ error: 'Failed to read bio' }); }
});

router.post('/bio', auth, async (req, res) => {
  try {
    const settings = await store.read('settings') || {};
    settings.bio = req.body.text;
    if (req.body.stats) settings.stats = req.body.stats;
    if (req.body.guidance !== undefined) settings.guidance = req.body.guidance;
    await store.write('settings', settings);
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Failed to save bio' }); }
});

// ===== TRACKS =====
router.get('/tracks', async (req, res) => {
  try {
    const tracks = await store.read('tracks') || [];
    res.json(tracks);
  } catch { res.status(500).json({ error: 'Failed to read tracks' }); }
});

router.post('/tracks', auth, async (req, res) => {
  try {
    const tracks = await store.read('tracks') || [];
    const track = { id: Date.now().toString(), ...req.body };
    tracks.push(track);
    await store.write('tracks', tracks);
    res.json(track);
  } catch { res.status(500).json({ error: 'Failed to save track' }); }
});

router.put('/tracks/:id', auth, async (req, res) => {
  try {
    const tracks = await store.read('tracks') || [];
    const idx = tracks.findIndex(t => t.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Track not found' });
    tracks[idx] = { ...tracks[idx], ...req.body };
    await store.write('tracks', tracks);
    res.json(tracks[idx]);
  } catch { res.status(500).json({ error: 'Failed to update track' }); }
});

router.delete('/tracks/:id', auth, async (req, res) => {
  try {
    let tracks = await store.read('tracks') || [];
    tracks = tracks.filter(t => t.id !== req.params.id);
    await store.write('tracks', tracks);
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Failed to delete track' }); }
});

// ===== TOUR DATES =====
router.get('/tour', async (req, res) => {
  try {
    const tour = await store.read('tour') || [];
    res.json(tour);
  } catch { res.status(500).json({ error: 'Failed to read tour dates' }); }
});

router.post('/tour', auth, async (req, res) => {
  try {
    const tour = await store.read('tour') || [];
    const date = { id: Date.now().toString(), ...req.body };
    tour.push(date);
    await store.write('tour', tour);
    res.json(date);
  } catch { res.status(500).json({ error: 'Failed to save tour date' }); }
});

router.put('/tour/:id', auth, async (req, res) => {
  try {
    const tour = await store.read('tour') || [];
    const idx = tour.findIndex(t => t.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Date not found' });
    tour[idx] = { ...tour[idx], ...req.body };
    await store.write('tour', tour);
    res.json(tour[idx]);
  } catch { res.status(500).json({ error: 'Failed to update tour date' }); }
});

router.delete('/tour/:id', auth, async (req, res) => {
  try {
    let tour = await store.read('tour') || [];
    tour = tour.filter(t => t.id !== req.params.id);
    await store.write('tour', tour);
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Failed to delete tour date' }); }
});

// ===== MERCH =====
router.get('/merch', async (req, res) => {
  try {
    const merch = await store.read('merch') || [];
    res.json(merch);
  } catch { res.status(500).json({ error: 'Failed to read merch' }); }
});

router.post('/merch', auth, async (req, res) => {
  try {
    const merch = await store.read('merch') || [];
    const item = { id: Date.now().toString(), ...req.body };
    merch.push(item);
    await store.write('merch', merch);
    res.json(item);
  } catch { res.status(500).json({ error: 'Failed to save merch item' }); }
});

router.put('/merch/:id', auth, async (req, res) => {
  try {
    const merch = await store.read('merch') || [];
    const idx = merch.findIndex(m => m.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Item not found' });
    merch[idx] = { ...merch[idx], ...req.body };
    await store.write('merch', merch);
    res.json(merch[idx]);
  } catch { res.status(500).json({ error: 'Failed to update merch item' }); }
});

router.delete('/merch/:id', auth, async (req, res) => {
  try {
    let merch = await store.read('merch') || [];
    merch = merch.filter(m => m.id !== req.params.id);
    await store.write('merch', merch);
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Failed to delete merch item' }); }
});

module.exports = router;
