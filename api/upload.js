const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const store = require('../lib/storage');

const JWT_SECRET = process.env.JWT_SECRET || 'ef-moon-moonite-era-2026-secret';

function auth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(auth.replace('Bearer ', ''), JWT_SECRET);
    next();
  } catch { res.status(401).json({ error: 'Invalid token' }); }
}

// Vercel Blob for production
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN || '';
const useBlob = !!(BLOB_TOKEN);

async function uploadToBlob(buffer, filename) {
  const res = await fetch('https://blob.vercel-storage.com/upload', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${BLOB_TOKEN}`,
      'Content-Type': 'application/octet-stream',
      'x-vercel-blob-filename': encodeURIComponent(filename)
    },
    body: buffer
  });
  const data = await res.json();
  return data.url;
}

// Local upload
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

// POST /api/upload
router.post('/', auth, async (req, res) => {
  try {
    const { file, name, type } = req.body;
    if (!file || !name) return res.status(400).json({ error: 'File data and name required' });

    const ext = path.extname(name) || '.png';
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    const buffer = Buffer.from(file.startsWith('data:') ? file.split(',')[1] : file, 'base64');

    if (useBlob) {
      const url = await uploadToBlob(buffer, safeName);
      return res.json({ url, name: safeName, storage: 'blob' });
    }

    if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    fs.writeFileSync(path.join(UPLOAD_DIR, safeName), buffer);
    res.json({ url: `/uploads/${safeName}`, name: safeName, storage: 'local' });
  } catch (e) {
    res.status(500).json({ error: 'Upload failed: ' + e.message });
  }
});

// GET /api/upload/list
router.get('/list', auth, async (req, res) => {
  try {
    if (useBlob) {
      const resp = await fetch('https://blob.vercel-storage.com/', {
        headers: { Authorization: `Bearer ${BLOB_TOKEN}` }
      });
      const data = await resp.json();
      return res.json(data.blobs?.map(b => ({ name: b.pathname, url: b.url, size: b.size, modified: b.uploadedAt })) || []);
    }
    if (!fs.existsSync(UPLOAD_DIR)) return res.json([]);
    const files = fs.readdirSync(UPLOAD_DIR).map(f => ({
      name: f, url: `/uploads/${f}`,
      size: fs.statSync(path.join(UPLOAD_DIR, f)).size,
      modified: fs.statSync(path.join(UPLOAD_DIR, f)).mtime
    }));
    res.json(files);
  } catch { res.status(500).json({ error: 'Failed to list files' }); }
});

// DELETE /api/upload/:name
router.delete('/:name', auth, async (req, res) => {
  try {
    if (useBlob) {
      await fetch(`https://blob.vercel-storage.com/${encodeURIComponent(req.params.name)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${BLOB_TOKEN}` }
      });
      return res.json({ success: true });
    }
    const filePath = path.join(UPLOAD_DIR, req.params.name);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'File not found' });
    }
  } catch { res.status(500).json({ error: 'Failed to delete file' }); }
});

module.exports = router;
