const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

// ===== KV (Upstash Redis / Vercel KV) =====
const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '';
const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';
const useKV = !!(KV_URL && KV_TOKEN);

async function kvGet(key) {
  try {
    const res = await fetch(`${KV_URL}/get/${key}`, {
      headers: { Authorization: `Bearer ${KV_TOKEN}` }
    });
    const data = await res.json();
    return data.result ? JSON.parse(data.result) : null;
  } catch { return null; }
}

async function kvSet(key, value) {
  try {
    await fetch(`${KV_URL}/set/${key}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${KV_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(JSON.stringify(value))
    });
  } catch {}
}

async function kvDelete(key) {
  try {
    await fetch(`${KV_URL}/del/${key}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${KV_TOKEN}` }
    });
  } catch {}
}

// ===== JSON FILE (local dev) =====
function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function fileRead(name) {
  const file = path.join(DATA_DIR, `${name}.json`);
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch { return null; }
}

function fileWrite(name, data) {
  ensureDir();
  fs.writeFileSync(path.join(DATA_DIR, `${name}.json`), JSON.stringify(data, null, 2));
}

// ===== PUBLIC API =====
async function read(name) {
  if (useKV) {
    const data = await kvGet(name);
    if (data !== null) return data;
  }
  return fileRead(name);
}

async function write(name, data) {
  if (useKV) {
    await kvSet(name, data);
  }
  fileWrite(name, data);
}

async function remove(name) {
  if (useKV) {
    await kvDelete(name);
  }
  const file = path.join(DATA_DIR, `${name}.json`);
  if (fs.existsSync(file)) fs.unlinkSync(file);
}

async function exists(name) {
  if (useKV) {
    const data = await kvGet(name);
    if (data !== null) return true;
  }
  return fs.existsSync(path.join(DATA_DIR, `${name}.json`));
}

function isKV() { return useKV; }

module.exports = { read, write, remove, exists, isKV };
