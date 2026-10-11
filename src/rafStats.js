// src/rafStats.js
const ENDPOINT = '/api/raf-stats';

let autoBuffer = [];

/**
 * Record one attempt.
 *
 * Nav mode: immediate POST.
 * Auto mode: buffered, flushed at session end.
 *
 * @param {{word: string, heard: string, matched: boolean}} row
 * @param {{immediate: boolean}} opts
 */
export function recordAttempt({ word, heard, matched }, { immediate }) {
  const row = { word, heard: heard || '', matched: !!matched };

  if (immediate) {
    return fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([row]),
      keepalive: true,
    }).catch((err) => console.warn('[rafStats] nav post failed', err));
  }

  autoBuffer.push(row);
}

export async function flushAutoBuffer() {
  if (autoBuffer.length === 0) return;
  const payload = autoBuffer.splice(0, autoBuffer.length);
  try {
    await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch (err) {
    console.warn('[rafStats] auto flush failed', err);
    autoBuffer.unshift(...payload);
  }
}

export async function fetchStats() {
  const res = await fetch(ENDPOINT, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Server returned ${res.status}`);
  return res.json();
}