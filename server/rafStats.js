// server/rafStats.js
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR  = path.join(__dirname, '..', 'public', 'lessons');
const DATA_FILE = path.join(DATA_DIR, 'raf-stats.json');

fs.mkdirSync(DATA_DIR, { recursive: true });

let writeChain = Promise.resolve();

function readStore() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return (parsed && typeof parsed === 'object') ? parsed : {};
  } catch (_) {
    return {};
  }
}

function writeStore(store) {
  const tmp = DATA_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(store, null, 2), 'utf8');
  fs.renameSync(tmp, DATA_FILE);
}

export function applyAttempts(rows) {
  writeChain = writeChain.then(() => {
    const store = readStore();

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

    writeStore(store);
    return store;
  });
  return writeChain;
}

export function getStore() {
  return readStore();
}