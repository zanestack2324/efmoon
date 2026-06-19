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

router.get('/questions', async (req, res) => {
  try {
    const challenge = await store.read('challenge') || { questions: [], scores: [] };
    const safe = challenge.questions.map(q => ({
      id: q.id,
      question: q.question,
      options: q.options
    }));
    res.json(safe);
  } catch { res.status(500).json({ error: 'Failed to read questions' }); }
});

router.get('/questions/all', auth, async (req, res) => {
  try {
    const challenge = await store.read('challenge') || { questions: [], scores: [] };
    res.json(challenge.questions);
  } catch { res.status(500).json({ error: 'Failed to read questions' }); }
});

router.post('/questions', auth, async (req, res) => {
  try {
    const { question, options, answer } = req.body;
    if (!question || !options || !answer) {
      return res.status(400).json({ error: 'Question, options, and answer are required' });
    }
    const challenge = await store.read('challenge') || { questions: [], scores: [] };
    const q = {
      id: Date.now().toString(),
      question: question.trim(),
      options,
      answer: answer.trim()
    };
    challenge.questions.push(q);
    await store.write('challenge', challenge);
    res.json(q);
  } catch { res.status(500).json({ error: 'Failed to save question' }); }
});

router.put('/questions/:id', auth, async (req, res) => {
  try {
    const challenge = await store.read('challenge') || { questions: [], scores: [] };
    const idx = challenge.questions.findIndex(q => q.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Question not found' });
    challenge.questions[idx] = { ...challenge.questions[idx], ...req.body };
    await store.write('challenge', challenge);
    res.json(challenge.questions[idx]);
  } catch { res.status(500).json({ error: 'Failed to update question' }); }
});

router.delete('/questions/:id', auth, async (req, res) => {
  try {
    const challenge = await store.read('challenge') || { questions: [], scores: [] };
    challenge.questions = challenge.questions.filter(q => q.id !== req.params.id);
    await store.write('challenge', challenge);
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Failed to delete question' }); }
});

router.post('/submit', async (req, res) => {
  try {
    const { name, email, answers } = req.body;
    if (!name || !answers) {
      return res.status(400).json({ error: 'Name and answers are required' });
    }
    const challenge = await store.read('challenge') || { questions: [], scores: [] };
    let correct = 0;
    answers.forEach(a => {
      const q = challenge.questions.find(q => q.id === a.questionId);
      if (q && q.answer.toLowerCase() === (a.answer || '').toLowerCase()) correct++;
    });
    const total = challenge.questions.length;
    const score = Math.round((correct / total) * 100);
    const entry = {
      id: Date.now().toString(),
      name: name.trim(),
      email: (email || '').trim(),
      score,
      correct,
      total,
      date: new Date().toISOString()
    };
    challenge.scores.push(entry);
    await store.write('challenge', challenge);
    res.json({ success: true, score, correct, total, entryId: entry.id });
  } catch { res.status(500).json({ error: 'Failed to submit challenge' }); }
});

router.get('/leaderboard', async (req, res) => {
  try {
    const challenge = await store.read('challenge') || { questions: [], scores: [] };
    const sorted = challenge.scores.sort((a, b) => b.score - a.score || a.date.localeCompare(b.date));
    res.json(sorted.slice(0, 50));
  } catch { res.status(500).json({ error: 'Failed to read leaderboard' }); }
});

router.get('/results', auth, async (req, res) => {
  try {
    const challenge = await store.read('challenge') || { questions: [], scores: [] };
    res.json(challenge.scores);
  } catch { res.status(500).json({ error: 'Failed to read results' }); }
});

module.exports = router;
