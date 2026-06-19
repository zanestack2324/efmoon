const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/api/auth', require('./auth'));
app.use('/api/content', require('./content'));
app.use('/api/upload', require('./upload'));
app.use('/api/contact', require('./contact'));
app.use('/api/orders', require('./orders'));
app.use('/api/interact', require('./interact'));
app.use('/api/challenge', require('./challenge'));

app.get('/api/health', (req, res) => {
  const store = require('../lib/storage');
  res.json({
    status: 'ok',
    time: new Date().toISOString(),
    storage: store.isKV() ? 'vercel-kv' : 'json-file'
  });
});

module.exports = app;
