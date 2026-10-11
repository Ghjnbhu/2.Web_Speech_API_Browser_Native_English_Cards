// server/index.js
import express from 'express';
import { applyAttempts, getStore } from './rafStats.js';

const app = express();
app.use(express.json({ limit: '256kb' }));

app.post('/api/raf-stats', async (req, res) => {
  const body = req.body;
  const rows = Array.isArray(body) ? body : [body];

  if (rows.length === 0) return res.status(400).json({ error: 'empty payload' });
  if (rows.length > 500)  return res.status(413).json({ error: 'too many rows (max 500)' });

  for (const r of rows) {
    if (typeof r !== 'object' || r === null) return res.status(400).json({ error: 'bad row' });
    if (typeof r.word    !== 'string')       return res.status(400).json({ error: 'bad word' });
    if (typeof r.heard   !== 'string')       return res.status(400).json({ error: 'bad heard' });
    if (typeof r.matched !== 'boolean')      return res.status(400).json({ error: 'bad matched' });
  }

  try {
    await applyAttempts(rows);
    res.json({ ok: true, applied: rows.length });
  } catch (err) {
    console.error('[raf-stats] write failed:', err);
    res.status(500).json({ error: 'write failed' });
  }
});

// Read the whole store, enriched with derived `matched` / `mismatched`.
app.get('/api/raf-stats', (_req, res) => {
  const store = getStore();
  const enriched = {};
  for (const [word, entry] of Object.entries(store)) {
    const mismatched = Object.values(entry.unmatched || {})
      .reduce((a, b) => a + b, 0);
    enriched[word] = {
      attempts: entry.attempts,
      mismatched,
      matched: entry.attempts - mismatched,
      unmatched: entry.unmatched || {},
      lastUpdated: entry.lastUpdated || null,
    };
  }
  res.json(enriched);
});

// Optional: wipe the store.
app.delete('/api/raf-stats', async (_req, res) => {
  try {
    const { default: fs } = await import('node:fs');
    const { default: path } = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const DATA_FILE = path.join(__dirname, '..', 'public', 'lessons', 'raf-stats.json');
    fs.writeFileSync(DATA_FILE, '{}', 'utf8');
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`raf-stats server on http://localhost:${PORT}`));