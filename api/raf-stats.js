// api/raf-stats.js
// Vercel Serverless Function.
// Serves GET / POST / DELETE at /api/raf-stats.
//
// Storage: Upstash Redis (installed from the Vercel Marketplace).
// The env vars UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
// are injected automatically by Vercel when the store is connected
// to this project. For local development, run `vercel env pull .env.local`.

import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();
const KEY = 'raf-stats';

export default async function handler(req, res) {
  // CORS — only matters for local dev. Same-origin in production.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  // ─────────────────────────────────────────────────────────────
  // GET — return the Option C shape, enriched for the modal.
  // ─────────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    try {
      const store = (await redis.get(KEY)) || {};
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
      return res.status(200).json(enriched);
    } catch (err) {
      console.error('[raf-stats] GET failed:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  // ─────────────────────────────────────────────────────────────
  // POST — accept one row or an array of rows.
  // ─────────────────────────────────────────────────────────────
  if (req.method === 'POST') {
    try {
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

      const store = (await redis.get(KEY)) || {};

      for (const row of rows) {
        const { word, heard, matched } = row;
        if (!word) continue;

        const entry = store[word] || { attempts: 0, unmatched: {} };
        entry.attempts += 1;

        if (!matched) {
          const key = heard || '';
          entry.unmatched[key] = (entry.unmatched[key] || 0) + 1;
        }

        entry.lastUpdated = Date.now();
        store[word] = entry;
      }

      await redis.set(KEY, store);
      return res.status(200).json({ ok: true, applied: rows.length });
    } catch (err) {
      console.error('[raf-stats] POST failed:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  // ─────────────────────────────────────────────────────────────
  // DELETE — wipe all statistics.
  // ─────────────────────────────────────────────────────────────
  if (req.method === 'DELETE') {
    try {
      await redis.set(KEY, {});
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error('[raf-stats] DELETE failed:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  res.setHeader('Allow', 'GET, POST, DELETE, OPTIONS');
  return res.status(405).json({ error: 'method not allowed' });
}