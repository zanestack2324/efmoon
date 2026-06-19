const express = require('express');
const path = require('path');
const app = express();
const PORT = 5500;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// API routes (must come before static to avoid serving raw files)
app.use('/api/auth', require('./api/auth'));
app.use('/api/content', require('./api/content'));
app.use('/api/upload', require('./api/upload'));
app.use('/api/contact', require('./api/contact'));
app.use('/api/orders', require('./api/orders'));
app.use('/api/interact', require('./api/interact'));
app.use('/api/challenge', require('./api/challenge'));

// Static files (exclude api/, data/, node_modules/)
app.use(express.static(__dirname, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    } else if (!filePath.includes('node_modules')) {
      res.setHeader('Cache-Control', 'public, max-age=86400');
    }
  }
}));

// Admin fallback
app.get('/admin', (req, res) => res.redirect('/admin/index.html'));

// API health
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.listen(PORT, '127.0.0.1', () => {
  console.log(`EF Moon server running at http://127.0.0.1:${PORT}`);
});
