// App.jsx - FIXED: React 19 StrictMode guard for voice loading
// App.jsx - SVG XSS via innerHTML and show fixed code
// App.jsx - loadSettingsFromFile accepts any value for allowed keys
// App.jsx - renderSvgToContainer regex is fragile
// App.jsx - No role / aria attributes
// App.jsx - Fix #20 Revision: Allow Internal <use> References
// App.jsx - FIXED: header button order — Load DB before Start/Stop
// App.jsx - FIXED: recognized-word chip shows ONLY the recognized word(s)
// App.jsx - FIXED: strip trailing punctuation from recognized word
// App.jsx - FIXED: "Repeat after me" label + inline repeat-times input
// App.jsx - NEW: navigation-mode click runs repeat-after-me cycle when enabled
// App.jsx - NEW: "Load lesson locally" checkbox in Display Options
// App.jsx - NEW: gear button opens Settings modal directly (no menu dropdown)
// App.jsx - NEW: server mode fetches /lessons/index.json and lists lessons
// App.jsx - NEW: server mode opens a picker modal on Load DB click
// App.jsx - CLEANUP: manifest URL is a constant; not in settings or UI
// App.jsx - NEW: display-info block in Settings (viewport, screen, orientation)
// App.jsx - NEW: status pill icon reflects loadLessonLocally
// App.jsx - NEW: status pill is a clickable button; Load DB button removed
// App.jsx - NEW: "Repeat pronunciation if words not equal" checkbox (repeat-after-me contexts)
// App.jsx - NEW: status pill shows "ID: n / total" in loaded state
// App.jsx - REMOVED: "Lesson loaded!" success alert (server mode)
// App.jsx - RENAMED: repeatOnRecognizeFault → repeatOnWordsNotEqual
// App.jsx - RENAMED: "Repeat word:" label → "Attempt:"
// App.jsx - BEHAVIOR:
//   An "Attempt" = pronounce → listen → recognize → compare → write result.
//   Repeat-after-me must go through ALL Attempt values per card.
//   Checkbox ☐ unchecked: on fault, consume the attempt → pronounce again + listen
//                         for the next attempt. After the last attempt → advance.
//   Checkbox ✓ checked:   on fault, re-pronounce + listen again WITHOUT consuming
//                         the attempt (retry the same attempt until match).
// App.jsx - FIXED: When a DB is loaded (locally or from server), stop any leftover
//                 pulse on both cards.
// App.jsx - NEW: In Auto Study + Repeat-after-me, track cards that failed all
//                 attempts and report them at session completion.
//                 Report line format: `N. word - "recognized"` (or `N. word -`).
// App.jsx - NEW: "Auto align elements" checkbox.
//   When ON:
//     • The "Gap between cards (px)" field REMAINS VISIBLE.
//       Its default value is 10px.
//       It represents ALL paddings around the cards:
//         – top bar → cards
//         – cards → bottom
//         – between the two cards
//         – left/right inset of the cards row
//     • LANDSCAPE: two cards side by side.
//     • PORTRAIT: each card on its OWN ROW (stacked).
//       Card height is derived from the ACTUAL measured top-bar height,
//       so both cards exactly fill the remaining space.
//   When OFF: raw numeric settings are used as-is.
// App.jsx - NEW: When a Repeat-after-me session is active, the status pill
//                 hides the DB filename and ID info so only the repeat
//                 indicators (Listening / Matched / Retry / Repeat After Me)
//                 remain visible.
// App.jsx - RENAMED: "🎧 Repeat mode" → "🎧 Repeat After Me" in the pill.
// App.jsx - FIXED: navigation-mode click on an already-pulsing card now
//                 stops its pronunciation and pulse (toggle behavior).
// App.jsx - DEFAULT: "Repeat pronunciation if words not equal" now defaults
//                 to UNCHECKED (false).
// App.jsx - DEFAULT: when "🎤 Repeat after me" is enabled, "Attempt:" is
//                 forced to 1 (repeatTimes = 1).
// App.jsx - FIX #1: SpeechRecognition.startListening now uses continuous: true
//                 so the engine keeps context across attempts, improving
//                 recognition of minimal-pair words (e.g. "Bean" vs "Bin").
// App.jsx - FIX #3: The transcript is no longer reset per attempt. Each
//                 attempt now compares the expected word against the LAST
//                 CHUNK of the accumulated transcript (last N words),
//                 which preserves the engine's context window.
// App.jsx - MOVED: the recognized-word chip (.recognized-chip) now renders
//                 INSIDE the status pill, immediately after the repeat chip
//                 (.db-info-repeat), instead of next to the Start/Repeat
//                 button. This makes the pill self-contained during a
//                 repeat-after-me session.
// App.jsx - NEW: Minimum listening window (LISTEN_MIN_MS). The mic stays
//                 open for at least this long after startRepeatListening(),
//                 even if the engine emits a stale transcript or interim
//                 results too early. Guarantees the user always has time to
//                 pronounce the word.
//                 Implementation: transcriptBaselineRef + listenStartedAtRef
//                 are snapshotted in startRepeatListening(); the transcript
//                 effect bails while the transcript hasn't grown past the
//                 baseline AND while the min window hasn't elapsed (adding
//                 the remaining time to its existing 800 ms debounce).
// App.jsx - FIXED: the recognized-word chip now shows ONLY the words the
//                 user said AFTER the current attempt's mic opened. It slices
//                 the transcript at transcriptBaselineRef.current before
//                 running lastWords()/comparison, so previous attempts'
//                 words no longer accumulate in the chip.
// App.jsx - NEW: The "voices loaded" success alert itemizes only the
//                 Russian (ru-RU) and English (en-GB / en-US / en-AU) voices.
//                 The Russian group is listed FIRST, then the English group.
// App.jsx - NEW: On successful voice load, if no voice has been chosen yet,
//                 a RANDOM English voice (en-GB / en-US / en-AU) is selected
//                 for "Select Voice", and a RANDOM Russian voice (ru-RU)
//                 is selected for "Translation Voice".
// App.jsx - MOVED: All options from Settings / "Card Appearance" now render
//                 AFTER the "Display Options" section in the Settings modal.
//                 New section order: Study Settings → Voice Settings →
//                 Display Options → Card Appearance.
// App.jsx - CHANGED: The non-studying Start button now shows "🎧 Start"
//                 instead of "🚀 Start".
// App.jsx - DEFAULT: "Pronounce translation" now defaults to CHECKED (true).
// App.jsx - NEW: The DB file name is tracked via a cookie
//                 (`ecoCards.dbFileName`). It survives page refreshes.
// App.jsx - FIXED: The status pill now always shows the actual file name
//                 (without its extension), regardless of any "name" field
//                 in the lesson JSON.
// App.jsx - FIXED: The on-mount auto-load no longer compares the cookie
//                 value against the lessons index. Instead, when the cookie
//                 is set, the app builds the URL directly as
//                 `/lessons/<cookie-value>.json` and loads it. The lesson
//                 picker is only shown when there is no cookie, or when
//                 the direct fetch fails.
// App.jsx - NEW: "Hide alerts" checkbox in Settings, placed right after the
//                 "Display Options" section. Default is CHECKED (true).
//                 When checked, informational alerts are suppressed via a
//                 `notify()` helper that becomes a no-op. Session completion
//                 reports and error conditions are NOT suppressed — they use
//                 a separate `report()` helper / raw alert() respectively,
//                 because they carry results or actionable failures.
// App.jsx - FIXED: Session completion reports are no longer routed through
//                 `notify()`. They now use `report()`, which always shows
//                 the modal regardless of the `hideAlerts` setting.
// App.jsx - NEW: "Invisible Top bar" checkbox in Settings → Display Options,
//                 placed right after "Load lesson locally". Default is now
//                 CHECKED. When checked, the root <div class="app"> also
//                 carries the `invisible-top-bar` class, and App.css makes
//                 the top bar fully transparent (background and bottom
//                 border). When unchecked, the top bar uses the default
//                 `#484348a8` background (or white in light theme).
// App.jsx - CHANGED: The vertical gap between the top bar and the cards row
//                 is now a fixed 5 px (TOP_BAR_GAP_PX), independent from the
//                 other gaps. The gap between cards, the bottom gap, and the
//                 left/right inset keep using settings.cardGap. Implemented
//                 by setting topGap = TOP_BAR_GAP_PX inside the auto-align
//                 block; topGap already drives both the --landscape-top-gap
//                 CSS variable and the card-height math, so both stay in sync.
// App.jsx - FIXED (Option A): SVG sanitizer now ALLOWS <image> tags whose
//                 href is a safe inline data:image/*;base64 URI. External
//                 URLs (http/file/javascript/data:text/html) are still
//                 dropped. This lets base64-embedded PNG/JPEG/GIF/WebP/BMP/
//                 ICO/SVG images inside lesson SVGs render, while keeping
//                 the same XSS posture as before.
// App.jsx - CHANGED: A wordless card that carries only a translation is now
//                 pronounced (translation only) in Navigation mode when
//                 clicked, and in Auto Study mode when the study flow
//                 reaches it.
// App.jsx - CHANGED (Repeat-after-me + translation):
//   • "Pronounce translation" is respected in repeat-after-me mode.
//   • On a MATCHED attempt (final one for that word), the translation is
//     spoken once, then the study advances / the nav-repeat cycle ends.
//     On a FAULT, nothing is spoken — the existing retry/consume logic
//     is unchanged.
//   • A wordless card with a translation: the mic is skipped (nothing to
//     compare), the translation is spoken once (if enabled), then the
//     study advances / the nav-repeat cycle ends. If "Pronounce
//     translation" is off, the card advances silently.
//   • The "Pronounce translation" checkbox is no longer disabled while
//     repeat-after-me is on; the "(not used in repeat-after-me mode)"
//     hint has been removed, and the mode message in handleMainAction
//     now reflects the actual behaviour.
// App.jsx - NEW: Translation strings are now split by script when spoken.
//   Latin-script runs (English letters, digits, common Latin punctuation)
//   inside a translation are pronounced with the "Select Voice" voice,
//   while the remaining (non-Latin) runs keep using the "Translation
//   Voice" voice. Runs are spoken in order, chained so each one starts
//   only after the previous finishes. This applies to every translation
//   path: wordless cards, word+translation cards, and the repeat-after-me
//   success flow.
// App.jsx - FIXED (repeat-after-me navigation-mode hand-off):
//   Clicking a wordless card while a repeat-after-me cycle is still in
//   flight used to leave the previous cycle's mic/pipeline alive, which
//   produced a "phantom" listening session on the previous word. Now:
//     • cancelRepeatCycle() additionally clears the pulse on the card
//       that was cycling, so no stale .active-pulse can remain after
//       a hand-off.
//     • handleCardClick's repeat-after-me branch, when the clicked card
//       is wordless, cancels any in-flight cycle FIRST (which stops
//       speech, stops the mic, clears the refs, and resets the pulse),
//       and only then starts the translation playback for the newly
//       clicked card.
//   This closes the race where the previous card's scheduled
//   startRepeatListening('old word') could fire after the user had
//   already moved on to a different card.
// App.jsx - FIXED (wordless-card toggle in repeat-after-me navigation):
//   Clicking the same wordless card again while its translation is
//   being played back used to restart the utterance and toggle the
//   pulse class off/on in the same tick (which restarts the CSS
//   animation and looks like a flash). Now the wordless branch of
//   the repeat-after-me case checks `manualPulseCard === cardType`
//   first and treats the second click as a cancel: it stops the
//   speech, removes the pulse, clears manualPulseCard, and returns.
//   This gives wordless cards the same click-to-stop toggle behaviour
//   that word cards already have.
// App.jsx - FIXED (single-letter recognition):
//   The Web Speech API is tuned for words, not phonemes, so a bare
//   letter like "A", "B", "C" is almost always transcribed as a
//   neighbouring word ("be", "bee", "see", "sea", "you", ...). The
//   exact-match similarity check used to reject those, which made
//   single-letter cards nearly unusable. Now, when the expected
//   word is a single Latin letter, the transcript comparison also
//   accepts the common word forms the recognizer emits for that
//   letter (see LETTER_ALIASES). Genuine mismatches like "B" vs
//   "the" are still rejected, so the failure mode stays honest.
// App.jsx - FIXED (Android Desktop-mode portrait card width):
//   In Android Chrome's "Desktop site" mode the reported CSS viewport
//   is ~980 px even though the phone screen is much narrower. In the
//   portrait branch of the auto-align block, the card width used to be
//   clamped by `Math.min(settings.cardWidth, rowWidth)`, which meant
//   the card never grew past settings.cardWidth (default 400) and left
//   most of the wide viewport empty. The clamp has been removed: in
//   portrait auto-align the single card per row now fills the
//   available row width (bounded below by MIN_CARD_WIDTH and, for
//   sanity on very wide screens, above by the new MAX_AUTO_CARD_WIDTH).
//   This mirrors what the landscape branch already does, so one card
//   per row correctly expands to the available width on any viewport.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import SpeechRecognitionLib, { useSpeechRecognition } from 'react-speech-recognition';
import './App.css';

// =============================================================
// Constants
// =============================================================
const LESSONS_INDEX_URL = '/lessons/index.json';

// Auto-align constants
const AUTO_H_PADDING  = 24;
const MIN_CARD_WIDTH  = 180;
const MIN_CARD_HEIGHT = 180;
// Upper bound on the auto-aligned card width. Prevents the single
// portrait card from stretching to an absurd size on a 4K/ultrawide
// monitor, while still allowing it to fill ordinary desktop viewports
// (e.g. Android Chrome "Desktop site" reports ~980 CSS px).
const MAX_AUTO_CARD_WIDTH = 1000;

// Vertical space between the top bar and the cards row.
// Used ONLY for the top gap; the inter-card gap, the bottom gap,
// and the side inset keep using settings.cardGap.
const TOP_BAR_GAP_PX = 5;

// Fallback top bar heights (used only until the observer reports a real value)
const TOP_BAR_HEIGHT_LANDSCAPE = 52;
const TOP_BAR_HEIGHT_PORTRAIT  = 96;   // two rows

// When comparing against the accumulated transcript we take only the last N
// words. Six is enough for a short utterance, and small enough that stale
// audio from previous attempts does not dominate the comparison.
const TRANSCRIPT_CHUNK_WORDS = 6;

// Minimum time (ms) the mic stays open for a repeat-after-me attempt,
// measured from the moment startRepeatListening() fires. Guarantees the
// user always has a window to pronounce the word, even if the engine
// emits a stale transcript or produces interim results too early.
const LISTEN_MIN_MS = 2500;

// Voice-group language prefixes
const ENGLISH_LANG_PREFIXES = ['en-gb', 'en-us', 'en-au'];
const RUSSIAN_LANG_PREFIXES = ['ru-ru'];

// Cookie used to persist the DB file name across page refreshes.
const DB_FILENAME_COOKIE = 'ecoCards.dbFileName';
const DB_FILENAME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year, in seconds

// =============================================================
// Cookie helpers
// =============================================================
const setCookie = (name, value, maxAgeSeconds) => {
  if (typeof document === 'undefined') return;
  const encoded = encodeURIComponent(value ?? '');
  const parts = [
    `${name}=${encoded}`,
    'path=/',
    'SameSite=Lax',
  ];
  if (typeof maxAgeSeconds === 'number') {
    parts.push(`max-age=${maxAgeSeconds}`);
  }
  document.cookie = parts.join('; ');
};

const getCookie = (name) => {
  if (typeof document === 'undefined') return '';
  const prefix = name + '=';
  const found = document.cookie
    .split('; ')
    .find((row) => row.startsWith(prefix));
  if (!found) return '';
  try {
    return decodeURIComponent(found.slice(prefix.length));
  } catch (_) {
    return '';
  }
};

const deleteCookie = (name) => {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; path=/; SameSite=Lax; max-age=0`;
};

// =============================================================
// Utilities
// =============================================================
const normalizeForComparison = (str) => {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .replace(/[.,!?;:՝։…«»"'()\[\]{}]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

const levenshtein = (a, b) => {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[a.length][b.length];
};

const similarityRatio = (a, b) => {
  const na = normalizeForComparison(a);
  const nb = normalizeForComparison(b);
  if (!na && !nb) return 1;
  if (!na || !nb) return 0;
  const dist = levenshtein(na, nb);
  const maxLen = Math.max(na.length, nb.length);
  return 1 - dist / maxLen;
};

const normalizeVoiceName = (name) =>
  (name || '')
    .toLowerCase()
    .replace(/[\u00A0\u2000-\u200B]/g, ' ')
    .replace(/[–—−]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();

const stripTrailingPunctuation = (text) => {
  if (!text) return '';
  return String(text).replace(/[.,!?;:]+$/g, '').trim();
};

// Return the last N words of a transcript string, whitespace-collapsed.
const lastWords = (text, n) => {
  if (!text) return '';
  const words = String(text).trim().split(/\s+/).filter(Boolean);
  if (words.length <= n) return words.join(' ');
  return words.slice(-n).join(' ');
};

// -------------------------------------------------------------
// Script splitting for translations.
// We split a translation string into runs of Latin-script characters
// and everything else, so Latin runs can be spoken with the "Select
// Voice" voice and the rest with the "Translation Voice".
// -------------------------------------------------------------
const isLatinChar = (ch) => /[A-Za-z\u00C0-\u024F]/.test(ch);

const splitTranslationByScript = (text) => {
  if (!text) return [];
  const segments = [];
  let current = '';
  let currentIsLatin = null;

  const flush = () => {
    if (current.length === 0) return;
    segments.push({ text: current, isLatin: !!currentIsLatin });
    current = '';
    currentIsLatin = null;
  };

  for (const ch of String(text)) {
    if (isLatinChar(ch)) {
      if (currentIsLatin === false) flush();
      currentIsLatin = true;
      current += ch;
    } else if (/\s/.test(ch) || /[.,!?;:'"()\[\]{}\-–—…«»0-9]/.test(ch)) {
      // Whitespace or neutral punctuation/digits: keep with whatever
      // script we're currently in.
      if (currentIsLatin === null) currentIsLatin = false;
      current += ch;
    } else {
      // Non-Latin, non-neutral character (Cyrillic, Armenian, CJK, …).
      if (currentIsLatin === true) flush();
      currentIsLatin = false;
      current += ch;
    }
  }
  flush();

  return segments.filter((s) => s.text.trim() !== '');
};

// -------------------------------------------------------------
// Single-letter alias table.
// The Web Speech API is tuned for words, not phonemes, so a bare
// letter like "B" is almost always transcribed as a neighbouring
// word ("be", "bee", "the", "he"). The keys below are the
// normalized single-letter expected values, and the values are the
// normalized transcripts the recognizer is likely to emit for them.
// -------------------------------------------------------------
const LETTER_ALIASES = {
  a: ['a', 'eh', 'hey', 'ay'],
  b: ['b', 'be', 'bee'],
  c: ['c', 'see', 'sea'],
  d: ['d', 'dee'],
  e: ['e', 'ee'],
  f: ['f', 'eff'],
  g: ['g', 'gee', 'jee'],
  h: ['h', 'aitch', 'haitch'],
  i: ['i', 'eye', 'ay', 'hi'],
  j: ['j', 'jay'],
  k: ['k', 'kay'],
  l: ['l', 'el', 'ell'],
  m: ['m', 'em'],
  n: ['n', 'en'],
  o: ['o', 'oh', 'owe'],
  p: ['p', 'pee', 'pea'],
  q: ['q', 'cue', 'queue'],
  r: ['r', 'are', 'ar'],
  s: ['s', 'ess'],
  t: ['t', 'tee', 'tea'],
  u: ['u', 'you', 'ewe'],
  v: ['v', 'vee'],
  w: ['w', 'double you', 'double-u', 'doubleyou'],
  x: ['x', 'ex'],
  y: ['y', 'why', 'wye'],
  z: ['z', 'zee', 'zed'],
};

// Returns true when `expected` is a single Latin letter and `chunk`
// matches any of the recognizer-friendly word forms for that letter.
const isLetterMatch = (expected, chunk) => {
  const ne = normalizeForComparison(expected);
  const nc = normalizeForComparison(chunk);
  if (!ne || !nc) return false;

  // Only applies when the expected value is a single Latin letter.
  if (ne.length !== 1 || !/[a-z]/.test(ne)) return false;

  const aliases = LETTER_ALIASES[ne];
  if (!aliases) return false;
  return aliases.includes(nc);
};

const readDisplayInfo = () => {
  if (typeof window === 'undefined') return null;

  const s = window.screen;
  const dpr = window.devicePixelRatio || 1;
  const so = s && s.orientation ? s.orientation : null;

  return {
    viewportCssWidth: window.innerWidth,
    viewportCssHeight: window.innerHeight,
    viewportClientWidth: document.documentElement.clientWidth,
    viewportClientHeight: document.documentElement.clientHeight,
    screenCssWidth: s ? s.width : null,
    screenCssHeight: s ? s.height : null,
    screenDeviceWidth: s ? Math.round(s.width * dpr) : null,
    screenDeviceHeight: s ? Math.round(s.height * dpr) : null,
    devicePixelRatio: dpr,
    screenOrientationType: so ? so.type : null,
    screenOrientationAngle: so && typeof so.angle === 'number' ? so.angle : null,
  };
};

const useDisplayInfo = () => {
  const [info, setInfo] = useState(() => readDisplayInfo());

  useEffect(() => {
    const update = () => setInfo(readDisplayInfo());

    update();

    const onOrientation = () => {
      update();
      setTimeout(update, 150);
      setTimeout(update, 400);
    };

    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', onOrientation);

    const so = window.screen && window.screen.orientation;
    if (so && so.addEventListener) so.addEventListener('change', onOrientation);

    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', onOrientation);
      if (so && so.removeEventListener) so.removeEventListener('change', onOrientation);
    };
  }, []);

  return info;
};

// ---- Voice group helpers ----
const matchesLangPrefix = (lang, prefixes) => {
  const l = (lang || '').toLowerCase().replace('_', '-');
  return prefixes.some((p) => l === p || l.startsWith(p + '-'));
};

const filterVoicesByLangPrefixes = (voices, prefixes) =>
  voices.filter((v) => matchesLangPrefix(v.lang, prefixes));

// Pick a random element from an array (uniform). Returns null if empty.
const pickRandom = (arr) => {
  if (!arr || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
};

// Build a categorized summary of loaded voices for the success alert.
// Shows only voices whose language matches the Russian or English groups.
// Order: Russian (ru-RU) FIRST, then English (en-GB / en-US / en-AU).
const buildVoicesLoadedMessage = (voices) => {
  const englishVoices = filterVoicesByLangPrefixes(voices, ENGLISH_LANG_PREFIXES);
  const russianVoices = filterVoicesByLangPrefixes(voices, RUSSIAN_LANG_PREFIXES);

  const formatVoice = (v) => `  • ${v.name} (${v.lang})`;

  const lines = [`✅ ${voices.length} voice(s) loaded successfully!`];

  lines.push('');
  lines.push(`🇷🇺 Russian (ru-RU): ${russianVoices.length}`);
  if (russianVoices.length > 0) {
    russianVoices.forEach((v) => lines.push(formatVoice(v)));
  } else {
    lines.push('  (none)');
  }

  lines.push('');
  lines.push(`🇬🇧 English (en-GB / en-US / en-AU): ${englishVoices.length}`);
  if (englishVoices.length > 0) {
    englishVoices.forEach((v) => lines.push(formatVoice(v)));
  } else {
    lines.push('  (none)');
  }

  return lines.join('\n');
};

// =============================================================
// Component
// =============================================================
const App = () => {
  const [dbLoaded, setDbLoaded] = useState(false);
  // Seed the DB file name from the cookie so the pill shows the last
  // known name immediately, even before a real DB is loaded.
  const [dbFileName, setDbFileName] = useState(() => {
    try { return getCookie(DB_FILENAME_COOKIE) || ''; } catch (_) { return ''; }
  });
  const [currentRecord, setCurrentRecord] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [allRecords, setAllRecords] = useState([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLessonPickerOpen, setIsLessonPickerOpen] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isStudying, setIsStudying] = useState(false);
  const [activeCard, setActiveCard] = useState('singular');
  const [availableVoices, setAvailableVoices] = useState([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceSupport, setVoiceSupport] = useState(true);
  const [voicesLoaded, setVoicesLoaded] = useState(false);
  const [isLoadingVoices, setIsLoadingVoices] = useState(false);

  const [isListeningForRepeat, setIsListeningForRepeat] = useState(false);
  const [repeatStatus, setRepeatStatus] = useState('');
  const [repeatProgress, setRepeatProgress] = useState({ current: 0, total: 0 });
  const [lastRecognized, setLastRecognized] = useState('');

  const [lessonsList, setLessonsList] = useState([]);
  const [lessonsListError, setLessonsListError] = useState('');
  const [isLoadingLessonsList, setIsLoadingLessonsList] = useState(false);

  // Measured top bar height (updated via ResizeObserver).
  const [measuredTopBarHeight, setMeasuredTopBarHeight] = useState(null);

  // Tracks whether nav-repeat mode is currently active (for UI mirroring).
  const [navRepeatActive, setNavRepeatActive] = useState(false);

  // Flipped to true once the on-mount load decision (auto-load from cookie
  // vs. open the picker) has fully resolved. The pill stays disabled until
  // then so an early click cannot race the auto-load.
  const [initialLoadResolved, setInitialLoadResolved] = useState(false);

  const displayInfo = useDisplayInfo();

  const [settings, setSettings] = useState({
    autoAlign: true,
    topPanelWidth: 916,
    cardWidth: 400,
    cardHeight: 400,
    cardGap: 10,               // default gap for auto-align: all paddings around cards
    showTranscription: true,
    showTranslation: true,
    loadLessonLocally: false,
    selectedLessonFile: '',
    fontSize: 32,
    showSvgBorder: false,
    theme: 'dark',
    studyTime: 10,
    selectedVoiceName: "",
    repeatTimes: 3,
    autoPronounce: true,
    pronounceTranslation: true,   // default is CHECKED
    translationVoiceName: "",
    translationRepeatTimes: 1,
    randomOrder: false,
    repeatAfterMe: false,
    repeatOnWordsNotEqual: false,   // default is UNCHECKED
    hideAlerts: true,               // default is CHECKED
    invisibleTopBar: true,          // default is CHECKED
  });

  const singularSvgRef = useRef(null);
  const pluralSvgRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const currentIndexRef = useRef(0);
  const activeCardRef = useRef('singular');
  const allRecordsRef = useRef([]);
  const isStudyingRef = useRef(false);
  const settingsRef = useRef(settings);
  const singularCardRef = useRef(null);
  const pluralCardRef = useRef(null);
  const completionAlertShownRef = useRef(false);
  const isCompletingRef = useRef(false);
  const userSelectedVoiceNameRef = useRef("");
  const synthRef = useRef(null);
  const voiceLoadTimeoutRef = useRef(null);
  const timeRemainingRef = useRef(0);
  const [manualPulseCard, setManualPulseCard] = useState(null);

  const currentRecordRef = useRef(null);
  const availableVoicesRef = useRef(availableVoices);
  const studyStartIndexRef = useRef(0);
  const studyStartRecordRef = useRef(null);
  const shuffledRecordsRef = useRef([]);
  const studyIndexRef = useRef(0);
  const isRandomSessionRef = useRef(false);
  const settingsFileInputRef = useRef(null);
  const lastSpokenRef = useRef('');
  const cachedVoiceRef = useRef(null);
  const speechGenerationRef = useRef(0);
  const voicesInitializedRef = useRef(false);
  const mountedRef = useRef(true);

  const failedCardsRef = useRef([]);
  const expectingUserSpeechRef = useRef(false);
  const expectedWordRef = useRef('');
  const currentRepeatIndexRef = useRef(0);
  const totalRepeatsRef = useRef(1);
  const currentWordRef = useRef('');
  const currentTranslationRef = useRef('');
  const currentCardTypeRef = useRef('singular');
  const currentCardIndexRef = useRef(0);

  const navRepeatActiveRef = useRef(false);
  const navRepeatCardTypeRef = useRef('singular');

  // Minimum-window support: snapshot the transcript length and the moment
  // the mic opened, so the transcript effect can ignore stale content and
  // refuse to close the mic before LISTEN_MIN_MS has elapsed.
  const transcriptBaselineRef = useRef(0);
  const listenStartedAtRef = useRef(0);

  const speakTextRef = useRef(null);
  const startRepeatListeningRef = useRef(null);
  const pronounceAndMaybeListenRef = useRef(null);
  const finishNavRepeatRef = useRef(null);
  const speakTranslationThenDoneRef = useRef(null);

  // Guards so the on-mount decision runs exactly once per page load.
  const initialAutoLoadAttemptedRef = useRef(false);
  // Mirrors `initialLoadResolved` state into a ref so `loadDatabase` (which
  // is a useCallback and doesn't re-create on state change) can read it.
  const initialLoadResolvedRef = useRef(false);

  // Ref to the top bar DOM node so we can measure it.
  const topBarRef = useRef(null);

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  useEffect(() => { currentRecordRef.current = currentRecord; }, [currentRecord]);
  useEffect(() => { activeCardRef.current = activeCard; }, [activeCard]);
  useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);
  useEffect(() => { settingsRef.current = settings; }, [settings]);
  useEffect(() => { allRecordsRef.current = allRecords; }, [allRecords]);
  useEffect(() => { isStudyingRef.current = isStudying; }, [isStudying]);
  useEffect(() => { timeRemainingRef.current = timeRemaining; }, [timeRemaining]);
  useEffect(() => { availableVoicesRef.current = availableVoices; }, [availableVoices]);

  useEffect(() => {
    document.body.classList.remove('light', 'dark');
    document.body.classList.add(settings.theme);
  }, [settings.theme]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  // Keep the ref in sync with the state used to gate the pill.
  useEffect(() => {
    initialLoadResolvedRef.current = initialLoadResolved;
  }, [initialLoadResolved]);

  // ---- Persist the DB file name in a cookie whenever it changes ----
  useEffect(() => {
    if (dbFileName) {
      setCookie(DB_FILENAME_COOKIE, dbFileName, DB_FILENAME_COOKIE_MAX_AGE);
    } else {
      deleteCookie(DB_FILENAME_COOKIE);
    }
  }, [dbFileName]);

  // ---- Measure the actual rendered height of the top bar ----
  useEffect(() => {
    const node = topBarRef.current;
    if (!node || typeof ResizeObserver === 'undefined') {
      const measure = () => {
        if (topBarRef.current) {
          setMeasuredTopBarHeight(topBarRef.current.offsetHeight);
        }
      };
      measure();
      window.addEventListener('resize', measure);
      return () => window.removeEventListener('resize', measure);
    }

    const measure = () => {
      const h = node.getBoundingClientRect().height;
      setMeasuredTopBarHeight(h);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(node);
    window.addEventListener('resize', measure);
    window.addEventListener('orientationchange', measure);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
      window.removeEventListener('orientationchange', measure);
    };
  }, []);

  // =========================================================
  // On-mount decision:
  //   • Read the cookie `ecoCards.dbFileName`.
  //   • If it exists, build the URL directly as
  //         /lessons/<cookie-value>.json
  //     and load it — WITHOUT consulting the lessons index first.
  //   • If there is no cookie, OR the direct fetch fails, open the
  //     "📂 Choose a lesson" modal.
  // =========================================================
  useEffect(() => {
    let cancelled = false;

    const resolveInitialLoad = () => {
      initialLoadResolvedRef.current = true;
      setInitialLoadResolved(true);
    };

    // Fire-and-forget: populate the picker list in the background.
    setIsLoadingLessonsList(true);
    setLessonsListError('');
    fetch(LESSONS_INDEX_URL, { headers: { Accept: 'application/json' } })
      .then((res) => {
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data?.lessons) ? data.lessons : [];
        setLessonsList(list);
      })
      .catch((err) => {
        if (cancelled) return;
        setLessonsList([]);
        setLessonsListError(err.message || 'Failed to load lessons list');
      })
      .finally(() => {
        if (!cancelled) setIsLoadingLessonsList(false);
      });

    // Only decide once per page load (StrictMode double-invokes in dev).
    if (initialAutoLoadAttemptedRef.current) {
      return () => { cancelled = true; };
    }
    initialAutoLoadAttemptedRef.current = true;

    const remembered = (getCookie(DB_FILENAME_COOKIE) || '').trim();

    // --- Local-file mode: cannot auto-restore a user-picked File.
    if (settingsRef.current.loadLessonLocally) {
      if (remembered) {
        setSettings((prev) => ({
          ...prev,
          selectedLessonFile: prev.selectedLessonFile || remembered,
        }));
      }
      resolveInitialLoad();
      return () => { cancelled = true; };
    }

    // --- Server mode with NO cookie → open the picker.
    if (!remembered) {
      setIsLessonPickerOpen(true);
      resolveInitialLoad();
      return () => { cancelled = true; };
    }

    // --- Server mode WITH a cookie → build the URL directly and load.
    const fileName = /\.(json|dbms)$/i.test(remembered)
      ? remembered
      : `${remembered}.json`;

    setSettings((prev) => ({ ...prev, selectedLessonFile: fileName }));

    loadDatabaseFromServer(fileName)
      .then(() => {
        resolveInitialLoad();
      })
      .catch(() => {
        setIsLessonPickerOpen(true);
        resolveInitialLoad();
      });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isSpeechSupported = () =>
    typeof window !== 'undefined' && window.speechSynthesis !== undefined;

  const isRepeatCycleActive = () =>
    isStudyingRef.current || navRepeatActiveRef.current;

  // Suppressible informational alert. Uses `settingsRef.current.hideAlerts`
  // so it always sees the latest value, even inside stale closures.
  const notify = (message) => {
    if (settingsRef.current.hideAlerts) return;
    alert(message);
  };

  // Always-shown modal, used for session *results*. Not affected by
  // `hideAlerts`, because results are the output of the operation the user
  // asked for, not a transient notification about it.
  const report = (message) => {
    alert(message);
  };

  const cancelAllSpeech = () => {
    speechGenerationRef.current++;
    try { synthRef.current?.cancel(); } catch (err) { }
    setIsSpeaking(false);
  };

  const stopRepeatListening = useCallback(() => {
    expectingUserSpeechRef.current = false;
    setIsListeningForRepeat(false);
    setRepeatStatus('');
    setRepeatProgress({ current: 0, total: 0 });
    currentRepeatIndexRef.current = 0;
    try { SpeechRecognitionLib.stopListening(); } catch (err) { }
    try { SpeechRecognitionLib.abortListening(); } catch (err) { }
    resetTranscript();
  }, [resetTranscript]);

  // -------------------------------------------------------------
  // cancelRepeatCycle
  // Tear down an active repeat-after-me cycle.
  // NOTE: this also clears the pulse on the card that was cycling,
  // so no stale .active-pulse can remain after a hand-off (e.g. the
  // user clicked the other card mid-cycle).
  // -------------------------------------------------------------
  const cancelRepeatCycle = () => {
    navRepeatActiveRef.current = false;
    setNavRepeatActive(false);
    cancelAllSpeech();
    stopRepeatListening();
    setLastRecognized('');
    currentRepeatIndexRef.current = 0;
    totalRepeatsRef.current = 1;
    currentWordRef.current = '';
    currentTranslationRef.current = '';
    lastSpokenRef.current = '';

    // Clear the pulse on whichever card was cycling.
    if (navRepeatCardTypeRef.current) {
      setCardPulsing(navRepeatCardTypeRef.current, false);
    }
    setManualPulseCard(null);
  };

  // Apply loaded voices: update state, auto-pick default voices if the user
  // has not chosen any yet, then alert with the categorized summary.
  const applyLoadedVoices = (voices) => {
    setAvailableVoices(voices);
    setVoicesLoaded(true);
    setVoiceSupport(true);
    setIsLoadingVoices(false);

    const englishVoices = filterVoicesByLangPrefixes(voices, ENGLISH_LANG_PREFIXES);
    const russianVoices = filterVoicesByLangPrefixes(voices, RUSSIAN_LANG_PREFIXES);

    const currentSelected = settingsRef.current.selectedVoiceName || "";
    const currentTranslation = settingsRef.current.translationVoiceName || "";

    const nextSelectedVoiceName =
      currentSelected || (pickRandom(englishVoices)?.name ?? pickRandom(voices)?.name ?? "");
    const nextTranslationVoiceName =
      currentTranslation || (pickRandom(russianVoices)?.name ?? "");

    if (nextSelectedVoiceName !== currentSelected || nextTranslationVoiceName !== currentTranslation) {
      setSettings(prev => ({
        ...prev,
        selectedVoiceName: prev.selectedVoiceName || nextSelectedVoiceName,
        translationVoiceName: prev.translationVoiceName || nextTranslationVoiceName,
      }));
    }

    if (nextSelectedVoiceName) {
      const v = voices.find(x => x.name === nextSelectedVoiceName);
      if (v) cachedVoiceRef.current = v;
    }

    notify(buildVoicesLoadedMessage(voices));
  };

  const loadVoices = () => {
    if (!isSpeechSupported()) { setVoiceSupport(false); return; }
    setIsLoadingVoices(true);

    const loadWebVoices = () => {
      if (!mountedRef.current) return true;
      const voices = synthRef.current ? synthRef.current.getVoices() : [];
      if (voices && voices.length > 0) {
        applyLoadedVoices(voices);
        return true;
      }
      return false;
    };

    if (loadWebVoices()) return;

    const handleVoicesChanged = () => {
      if (!mountedRef.current) return;
      const voices = synthRef.current ? synthRef.current.getVoices() : [];
      if (voices && voices.length > 0) {
        applyLoadedVoices(voices);
        if (synthRef.current && synthRef.current.onvoiceschanged) {
          synthRef.current.onvoiceschanged = null;
        }
      }
    };

    if (synthRef.current) {
      synthRef.current.onvoiceschanged = handleVoicesChanged;
      try {
        const dummyUtterance = new SpeechSynthesisUtterance(' ');
        synthRef.current.cancel();
        synthRef.current.speak(dummyUtterance);
        setTimeout(() => { try { synthRef.current?.cancel(); } catch (err) { } }, 100);
      } catch (err) { console.warn('Error triggering voice loading:', err); }
    }

    let attempts = 0;
    const retryLoad = () => {
      if (!mountedRef.current) return;
      if (attempts < 10) {
        attempts++;
        setTimeout(() => {
          if (!mountedRef.current) return;
          if (!voicesLoaded && loadWebVoices()) {
            if (synthRef.current && synthRef.current.onvoiceschanged) {
              synthRef.current.onvoiceschanged = null;
            }
            setIsLoadingVoices(false);
          } else if (!voicesLoaded && attempts < 10) {
            retryLoad();
          } else if (!voicesLoaded && attempts >= 10) {
            setIsLoadingVoices(false);
            alert('⚠️ Could not load voices. Please tap the "Load Voices" button again.');
          }
        }, 500);
      }
    };

    retryLoad();
  };

  useEffect(() => {
    mountedRef.current = true;
    if (!isSpeechSupported()) {
      setVoiceSupport(false);
      return () => { mountedRef.current = false; };
    }
    if (!voicesInitializedRef.current) {
      voicesInitializedRef.current = true;
      loadVoices();
    }
    return () => {
      mountedRef.current = false;
      if (synthRef.current && synthRef.current.onvoiceschanged) {
        synthRef.current.onvoiceschanged = null;
      }
      const timeoutRef = voiceLoadTimeoutRef.current;
      if (timeoutRef) clearTimeout(timeoutRef);
      if (isSpeechSupported()) {
        try { window.speechSynthesis.cancel(); } catch (err) { }
      }
    };
  }, []);

  const getCurrentVoice = (voiceName = null) => {
    if (!isSpeechSupported()) return null;
    const targetVoiceName = voiceName || userSelectedVoiceNameRef.current || settings.selectedVoiceName;
    if (!targetVoiceName) return null;
    const voices = availableVoicesRef.current;
    if (cachedVoiceRef.current && cachedVoiceRef.current.name === targetVoiceName) {
      return cachedVoiceRef.current;
    }
    let voice = voices.find(v => v.name === targetVoiceName);
    if (!voice) {
      const target = normalizeVoiceName(targetVoiceName);
      voice = voices.find(v => normalizeVoiceName(v.name) === target);
    }
    if (voice) cachedVoiceRef.current = voice;
    return voice || null;
  };

  const setCardPulsing = (cardType, isPulsing) => {
    const cardElement = cardType === 'singular' ? singularCardRef.current : pluralCardRef.current;
    if (cardElement) {
      if (isPulsing) cardElement.classList.add('active-pulse');
      else cardElement.classList.remove('active-pulse');
    }
  };

  const clearManualPulse = () => {
    if (manualPulseCard) {
      setCardPulsing(manualPulseCard, false);
      setManualPulseCard(null);
    }
  };

  const speakText = (text, onComplete = null, voiceNameOverride = null,
                     repeatCountOverride = null, onEachUtteranceEnd = null) => {
    if (!text) { if (onComplete) onComplete(); return; }
    if (!isSpeechSupported() || !synthRef.current) { if (onComplete) onComplete(); return; }

    const myGeneration = ++speechGenerationRef.current;
    const isStale = () => myGeneration !== speechGenerationRef.current;

    try { synthRef.current.cancel(); } catch (err) { }

    const currentVoice = getCurrentVoice(voiceNameOverride);
    if (!currentVoice) { if (onComplete) onComplete(); return; }

    const repeatCount = repeatCountOverride !== null ? repeatCountOverride : (settings.repeatTimes || 1);
    setIsSpeaking(true);
    let currentRepeatIndex = 0;

    const speakNext = () => {
      if (isStale()) return;
      if (currentRepeatIndex >= repeatCount) {
        if (isStale()) return;
        setIsSpeaking(false);
        if (onComplete) onComplete();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = currentVoice;
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.lang = currentVoice.lang;

      utterance.onend = () => {
        if (isStale()) return;
        currentRepeatIndex++;
        if (onEachUtteranceEnd) {
          const handled = onEachUtteranceEnd(currentRepeatIndex, repeatCount);
          if (handled === true) { setIsSpeaking(false); return; }
        }
        setTimeout(() => { if (isStale()) return; speakNext(); }, 800);
      };

      utterance.onerror = (event) => {
        if (isStale()) return;
        if (event.error === 'not-allowed' || event.error === 'interrupted') {
          setTimeout(() => {
            if (isStale()) return;
            currentRepeatIndex++;
            setTimeout(() => { if (isStale()) return; speakNext(); }, 500);
          }, 200);
        } else if (event.error === 'canceled') {
          // superseded
        } else {
          setIsSpeaking(false);
          if (onComplete) onComplete();
        }
      };

      try { synthRef.current.speak(utterance); }
      catch (err) {
        if (isStale()) return;
        setIsSpeaking(false);
        if (onComplete) onComplete();
      }
    };

    setTimeout(() => { if (isStale()) return; speakNext(); }, 100);
  };

  useEffect(() => { speakTextRef.current = speakText; });

  // -------------------------------------------------------------
  // speakTranslationSmart
  // Speak a translation string, routing Latin-script segments through
  // the "Select Voice" voice and everything else through the
  // "Translation Voice". Segments are spoken in order.
  // -------------------------------------------------------------
  const speakTranslationSmart = useCallback((text, onComplete = null) => {
    if (!text || String(text).trim() === '') { if (onComplete) onComplete(); return; }

    const segments = splitTranslationByScript(text);
    if (segments.length === 0) { if (onComplete) onComplete(); return; }

    const s = settingsRef.current;
    const selectedVoiceName = s.selectedVoiceName || null;
    const translationVoiceName = s.translationVoiceName || null;
    const repeats = Math.max(1, s.translationRepeatTimes || 1);

    if (segments.length === 1) {
      const seg = segments[0];
      const voiceName = seg.isLatin ? selectedVoiceName : translationVoiceName;
      speakTextRef.current(seg.text, onComplete, voiceName, repeats);
      return;
    }

    let idx = 0;
    const speakNext = () => {
      if (idx >= segments.length) {
        if (onComplete) onComplete();
        return;
      }
      const seg = segments[idx++];
      const voiceName = seg.isLatin ? selectedVoiceName : translationVoiceName;
      speakTextRef.current(seg.text, speakNext, voiceName, repeats);
    };
    speakNext();
  }, []);

  const startRepeatListening = useCallback((expectedWord) => {
    if (typeof SpeechRecognitionLib?.startListening !== 'function') {
      console.error('[Repeat] SpeechRecognitionLib.startListening is not available.');
      setRepeatStatus('error');
      return;
    }
    if (!browserSupportsSpeechRecognition) { setRepeatStatus('error'); return; }

    expectedWordRef.current = expectedWord;
    expectingUserSpeechRef.current = true;
    setIsListeningForRepeat(true);
    setRepeatStatus('listening');
    setRepeatProgress({
      current: currentRepeatIndexRef.current + 1,
      total: totalRepeatsRef.current,
    });
    setLastRecognized('');

    transcriptBaselineRef.current = (transcript || '').length;
    listenStartedAtRef.current = Date.now();

    try {
      SpeechRecognitionLib.startListening({
        continuous: true,
        interimResults: true,
        language: 'en-US',
      });
    } catch (err) {
      console.error('SpeechRecognition start failed:', err);
      setRepeatStatus('error');
    }
  }, [browserSupportsSpeechRecognition, transcript]);

  useEffect(() => { startRepeatListeningRef.current = startRepeatListening; });

  const speakOneAndListen = useCallback((word, attemptIndex, totalAttempts) => {
    if (!isRepeatCycleActive()) return;
    currentRepeatIndexRef.current = attemptIndex;
    totalRepeatsRef.current = totalAttempts;
    speakTextRef.current(word, null, null, 1, () => {
      if (!isRepeatCycleActive()) return true;
      setTimeout(() => {
        if (!isRepeatCycleActive()) return;
        startRepeatListeningRef.current(word);
      }, 400);
      return true;
    });
  }, []);

  // ------------------------------------------------------------
  // speakTranslationThenDone
  // In repeat-after-me mode: called after a MATCHED attempt (final one
  // for that word) OR for a wordless card with a translation. Speaks the
  // translation (script-aware), then advances the study / finishes the
  // nav-repeat cycle.
  // ------------------------------------------------------------
  const speakTranslationThenDone = useCallback((translation) => {
    const step = () => {
      if (isStudyingRef.current) {
        moveToNextCardInStudy();
      } else if (navRepeatActiveRef.current) {
        finishNavRepeatRef.current?.();
      }
    };

    const hasTranslation =
      settingsRef.current.pronounceTranslation &&
      !!translation && translation.trim() !== '';

    if (!hasTranslation) { step(); return; }

    speakTranslationSmart(translation, () => {
      if (!isRepeatCycleActive()) return;
      step();
    });
  }, [speakTranslationSmart]);

  useEffect(() => {
    speakTranslationThenDoneRef.current = speakTranslationThenDone;
  }, [speakTranslationThenDone]);

  const getWordForRecord = (record, cardType) => {
    if (!record) return '';
    return cardType === 'singular' ? (record.singular?.word || '') : (record.plural?.word || '');
  };
  const getTranslationForRecord = (record, cardType) => {
    if (!record) return '';
    return cardType === 'singular' ? (record.singular?.translation || '') : (record.plural?.translation || '');
  };

  const moveToNextCardInStudy = () => {
    if (!isStudyingRef.current) return;
    const records = isRandomSessionRef.current ? shuffledRecordsRef.current : allRecordsRef.current;
    const currentIdx = isRandomSessionRef.current ? studyIndexRef.current : currentIndexRef.current;
    const currentActive = activeCardRef.current;
    setCardPulsing(currentActive, false);

    if (currentActive === 'singular') {
      setActiveCard('plural');
      const record = records[currentIdx];
      setTimeout(() => {
        if (!isStudyingRef.current) return;
        setCardPulsing('plural', true);
        setTimeout(() => {
          if (!isStudyingRef.current) return;
          pronounceAndMaybeListenRef.current?.('plural', currentIdx, record);
        }, 200);
      }, 100);
    } else {
      if (currentIdx < records.length - 1) {
        const nextIdx = currentIdx + 1;
        if (isRandomSessionRef.current) {
          studyIndexRef.current = nextIdx;
          setCurrentRecord(records[nextIdx]);
        } else {
          setCurrentIndex(nextIdx);
          setCurrentRecord(records[nextIdx]);
        }
        setActiveCard('singular');
        const record = records[nextIdx];
        setTimeout(() => {
          if (!isStudyingRef.current) return;
          setCardPulsing('singular', true);
          setTimeout(() => {
            if (!isStudyingRef.current) return;
            pronounceAndMaybeListenRef.current?.('singular', nextIdx, record);
          }, 200);
        }, 100);
      } else {
        setCardPulsing('plural', false);
        resetStudyState(true);
      }
    }
  };

  // ============================================================
  // pronounceAndMaybeListen
  // Auto Study (isStudying=true, repeat-after-me off): word → (translation)
  // → advance. A wordless card with only a translation speaks the
  // translation and then advances.
  // Repeat-after-me: word → mic listen → on MATCH speak the translation
  // (script-aware), then advance. Wordless cards speak the translation
  // (if enabled) and advance without opening the mic.
  // ============================================================
  const pronounceAndMaybeListen = (cardType, index, record) => {
    if (!settings.autoPronounce) return;
    if (!isStudyingRef.current) return;

    const word = getWordForRecord(record, cardType);
    const translation = getTranslationForRecord(record, cardType);

    const hasWord = !!word && word.trim() !== '';
    const hasTranslation =
      !!translation && translation.trim() !== '' && settings.pronounceTranslation;

    // Nothing to pronounce at all → advance.
    if (!hasWord && !hasTranslation) {
      setTimeout(() => moveToNextCardInStudy(), 300);
      return;
    }

    const key = `${index}_${cardType}`;
    if (lastSpokenRef.current === key) return;
    lastSpokenRef.current = key;

    currentCardTypeRef.current = cardType;
    currentCardIndexRef.current = index;
    currentWordRef.current = word;
    currentTranslationRef.current = translation;

    const repeatAfterMe = settings.repeatAfterMe;
    const totalRepeats = Math.max(1, settings.repeatTimes || 1);

    totalRepeatsRef.current = totalRepeats;

    // --- Repeat-after-me branch ---
    if (repeatAfterMe) {
      if (!hasWord) {
        // Wordless card: no mic comparison. Speak the translation (if
        // enabled) and advance, else advance silently.
        if (hasTranslation) {
          speakTranslationThenDoneRef.current?.(translation);
        } else {
          setTimeout(() => moveToNextCardInStudy(), 300);
        }
        return;
      }
      speakOneAndListen(word, 0, totalRepeats);
      return;
    }

    // --- Wordless card → speak only the translation, then advance ---
    if (!hasWord) {
      speakTranslationSmart(translation, () => {
        if (!isStudyingRef.current) return;
        setTimeout(() => moveToNextCardInStudy(), 300);
      });
      return;
    }

    // --- Normal word-card flow ---
    if (hasTranslation) {
      speakTextRef.current(word, () => {
        if (!isStudyingRef.current) return;
        setTimeout(() => {
          if (!isStudyingRef.current) return;
          speakTranslationSmart(translation, () => {
            if (!isStudyingRef.current) return;
            setTimeout(() => moveToNextCardInStudy(), 300);
          });
        }, 400);
      });
    } else {
      speakTextRef.current(word, () => {
        if (!isStudyingRef.current) return;
        setTimeout(() => moveToNextCardInStudy(), 300);
      });
    }
  };

  useEffect(() => { pronounceAndMaybeListenRef.current = pronounceAndMaybeListen; });

  const finishNavRepeat = useCallback(() => {
    navRepeatActiveRef.current = false;
    setNavRepeatActive(false);
    cancelAllSpeech();
    stopRepeatListening();
    setLastRecognized('');
    currentRepeatIndexRef.current = 0;
    totalRepeatsRef.current = 1;
    currentWordRef.current = '';
    currentTranslationRef.current = '';
    setCardPulsing(navRepeatCardTypeRef.current, false);
    setManualPulseCard(null);
  }, [stopRepeatListening]);

  useEffect(() => { finishNavRepeatRef.current = finishNavRepeat; }, [finishNavRepeat]);

  const startNavRepeatCycle = useCallback((cardType, word) => {
    if (!browserSupportsSpeechRecognition) {
      alert('⚠️ Repeat-after-me requires browser speech recognition, which is not supported in this browser.');
      return;
    }
    if (!word || word.trim() === '') return;
    if (!voicesLoaded || !settings.selectedVoiceName) {
      alert('⚠️ Please load voices and select a voice in Settings before using repeat-after-me.');
      return;
    }

    cancelRepeatCycle();

    navRepeatActiveRef.current = true;
    setNavRepeatActive(true);
    navRepeatCardTypeRef.current = cardType;

    currentCardTypeRef.current = cardType;
    currentWordRef.current = word;
    lastSpokenRef.current = `${currentIndexRef.current}_${cardType}`;

    // Remember the current card's translation for the match handler.
    const rec = currentRecordRef.current;
    currentTranslationRef.current = getTranslationForRecord(rec, cardType);

    const totalAttempts = Math.max(1, settings.repeatTimes || 1);
    totalRepeatsRef.current = totalAttempts;

    clearManualPulse();
    setCardPulsing(cardType, true);
    setManualPulseCard(cardType);

    speakOneAndListen(word, 0, totalAttempts);
  }, [browserSupportsSpeechRecognition, voicesLoaded, settings.selectedVoiceName,
      settings.repeatTimes, clearManualPulse]);

  const startNavRepeatCycleRef = useRef(null);

  useEffect(() => {
    startNavRepeatCycleRef.current = startNavRepeatCycle;
  }, [startNavRepeatCycle]);

  const resetStudyState = (showCompletionAlert = false) => {
    if (isCompletingRef.current) return;
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    cancelAllSpeech();
    stopRepeatListening();

    navRepeatActiveRef.current = false;
    setNavRepeatActive(false);

    setIsStudying(false);
    setTimeRemaining(0);
    timeRemainingRef.current = 0;
    lastSpokenRef.current = '';
    currentRepeatIndexRef.current = 0;
    totalRepeatsRef.current = 1;
    currentWordRef.current = '';
    currentTranslationRef.current = '';
    setLastRecognized('');

    if (isRandomSessionRef.current) {
      if (studyStartRecordRef.current) {
        setCurrentIndex(studyStartIndexRef.current);
        setCurrentRecord(studyStartRecordRef.current);
      }
      isRandomSessionRef.current = false;
      shuffledRecordsRef.current = [];
      studyIndexRef.current = 0;
    } else {
      if (showCompletionAlert && studyStartRecordRef.current) {
        setCurrentIndex(studyStartIndexRef.current);
        setCurrentRecord(studyStartRecordRef.current);
      }
    }

    setActiveCard('singular');
    setCardPulsing('singular', false);
    setCardPulsing('plural', false);
    clearManualPulse();

    if (showCompletionAlert && !completionAlertShownRef.current) {
      isCompletingRef.current = true;
      completionAlertShownRef.current = true;

      const failed = failedCardsRef.current;

      if (settingsRef.current.repeatAfterMe && failed.length > 0) {
        const lines = failed.map((entry, i) => {
          const heard = entry.heard && entry.heard.trim() !== ''
            ? ` "${entry.heard}"`
            : '';
          return `${i + 1}. ${entry.word} -${heard}`;
        });

        // Session result: shown even when hideAlerts is on.
        report(
          `🎉 Repeat After Me session completed!\n\n` +
          `Not passed ${failed.length} card(s):\n` +
          lines.join('\n')
        );
      } else if (settingsRef.current.repeatAfterMe) {
        report('🎉 Repeat After Me session completed!\n\nAll cards passed!');
      } else {
        report('🎉 Study session completed! Well done!');
      }

      failedCardsRef.current = [];

      setTimeout(() => {
        completionAlertShownRef.current = false;
        isCompletingRef.current = false;
      }, 500);
    }
  };

  const shuffleArray = (array) => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const startStudyTimer = () => {
    if (timerIntervalRef.current) { clearInterval(timerIntervalRef.current); timerIntervalRef.current = null; }

    studyStartIndexRef.current = currentIndex;
    studyStartRecordRef.current = currentRecord;

    cancelAllSpeech();
    stopRepeatListening();
    navRepeatActiveRef.current = false;
    setNavRepeatActive(false);
    setTimeRemaining(0);
    timeRemainingRef.current = 0;
    lastSpokenRef.current = '';
    currentRepeatIndexRef.current = 0;
    setLastRecognized('');

    completionAlertShownRef.current = false;
    isCompletingRef.current = false;

    failedCardsRef.current = [];

    let firstRecord = currentRecord;
    let firstIndex = currentIndex;

    if (settings.randomOrder && allRecords.length > 0) {
      const shuffled = shuffleArray(allRecords);
      shuffledRecordsRef.current = shuffled;
      isRandomSessionRef.current = true;
      studyIndexRef.current = 0;
      firstRecord = shuffled[0];
      firstIndex = 0;
      setCurrentRecord(shuffled[0]);
    } else {
      isRandomSessionRef.current = false;
      firstIndex = currentIndex;
      firstRecord = allRecords[currentIndex];
    }

    setCardPulsing('singular', false);
    setCardPulsing('plural', false);
    clearManualPulse();

    setIsStudying(true);
    isStudyingRef.current = true;
    setActiveCard('singular');
    setCardPulsing('singular', true);

    if (!settings.autoPronounce) {
      const initialTime = settingsRef.current.studyTime;
      setTimeRemaining(initialTime);
      timeRemainingRef.current = initialTime;

      timerIntervalRef.current = setInterval(() => {
        if (!isStudyingRef.current) {
          if (timerIntervalRef.current) { clearInterval(timerIntervalRef.current); timerIntervalRef.current = null; }
          return;
        }
        const currentTime = timeRemainingRef.current;
        if (currentTime <= 1) {
          const records = isRandomSessionRef.current ? shuffledRecordsRef.current : allRecordsRef.current;
          const currentIdx = isRandomSessionRef.current ? studyIndexRef.current : currentIndexRef.current;
          setCardPulsing(activeCardRef.current, false);
          if (activeCardRef.current === 'singular') {
            setActiveCard('plural');
            setTimeout(() => setCardPulsing('plural', true), 100);
          } else {
            if (currentIdx < records.length - 1) {
              const nextIdx = currentIdx + 1;
              if (isRandomSessionRef.current) {
                studyIndexRef.current = nextIdx;
                setCurrentRecord(records[nextIdx]);
              } else {
                setCurrentIndex(nextIdx);
                setCurrentRecord(records[nextIdx]);
              }
              setActiveCard('singular');
              setTimeout(() => setCardPulsing('singular', true), 100);
            } else {
              resetStudyState(true);
              if (timerIntervalRef.current) { clearInterval(timerIntervalRef.current); timerIntervalRef.current = null; }
              return;
            }
          }
          const newTime = settingsRef.current.studyTime;
          setTimeRemaining(newTime);
          timeRemainingRef.current = newTime;
        } else {
          const newTime = currentTime - 1;
          setTimeRemaining(newTime);
          timeRemainingRef.current = newTime;
        }
      }, 1000);
    } else {
      setTimeout(() => {
        if (!isStudyingRef.current) return;
        pronounceAndMaybeListenRef.current?.('singular', firstIndex, firstRecord);
      }, 500);
    }
  };

  const stopStudyTimer = () => {
    if (timerIntervalRef.current) { clearInterval(timerIntervalRef.current); timerIntervalRef.current = null; }
    resetStudyState(false);
  };

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      const timeoutRef = voiceLoadTimeoutRef.current;
      if (timeoutRef) clearTimeout(timeoutRef);
      speechGenerationRef.current++;
      if (isSpeechSupported() && synthRef.current) {
        try { synthRef.current.cancel(); } catch (err) { }
      }
      try { SpeechRecognitionLib.abortListening(); } catch (err) { }
    };
  }, []);

  // ---- Transcript handling ----
  useEffect(() => {
    if (!isListeningForRepeat) return;
    if (!transcript || transcript.trim() === '') return;
    if (transcript.length <= transcriptBaselineRef.current) return;

    const elapsed = Date.now() - listenStartedAtRef.current;
    const remaining = Math.max(0, LISTEN_MIN_MS - elapsed);

    const handle = setTimeout(() => {
      const expected = expectedWordRef.current;
      const spoken = transcript;
      const wordsSinceBaseline = spoken.slice(transcriptBaselineRef.current);
      const chunk = lastWords(wordsSinceBaseline, TRANSCRIPT_CHUNK_WORDS);
      const cleaned = stripTrailingPunctuation(chunk);
      setLastRecognized(cleaned);

      const ratio = similarityRatio(expected, chunk);
      // Also accept recognizer-friendly word forms for single letters
      // (e.g. "B" vs "be"/"bee", "C" vs "see"/"sea").
      const letterMatch = isLetterMatch(expected, chunk);
      const attemptIndex = currentRepeatIndexRef.current;
      const totalAttempts = totalRepeatsRef.current;

      if (ratio >= 0.7 || letterMatch) {
        setIsListeningForRepeat(false);
        expectingUserSpeechRef.current = false;
        try { SpeechRecognitionLib.stopListening(); } catch (err) { }
        const isLastAttempt = attemptIndex + 1 >= totalAttempts;
        setRepeatStatus('matched');
        setRepeatProgress({ current: attemptIndex + 1, total: totalAttempts });

        if (isLastAttempt) {
          setTimeout(() => {
            setRepeatStatus('');
            setRepeatProgress({ current: 0, total: 0 });
            // After the last MATCHED attempt, speak the translation
            // (script-aware), then advance / finish the cycle.
            speakTranslationThenDoneRef.current?.(currentTranslationRef.current || '');
          }, 700);
        } else {
          setTimeout(() => {
            if (!isRepeatCycleActive()) return;
            speakOneAndListen(expected, attemptIndex + 1, totalAttempts);
          }, 500);
        }
      } else {
        setIsListeningForRepeat(false);
        expectingUserSpeechRef.current = false;
        try { SpeechRecognitionLib.stopListening(); } catch (err) { }
        setRepeatStatus('retry');
        setRepeatProgress({ current: attemptIndex + 1, total: totalAttempts });

        setTimeout(() => {
          if (!isRepeatCycleActive()) return;
          const isLastAttempt = attemptIndex + 1 >= totalAttempts;

          if (settingsRef.current.repeatOnWordsNotEqual) {
            speakOneAndListen(expected, attemptIndex, totalAttempts);
          } else {
            if (isLastAttempt) {
              if (settingsRef.current.repeatAfterMe && isStudyingRef.current) {
                failedCardsRef.current.push({
                  word: expected,
                  heard: cleaned || '',
                });
              }
              setRepeatStatus('');
              setRepeatProgress({ current: 0, total: 0 });
              // Fault on the last attempt → advance WITHOUT speaking
              // the translation.
              if (isStudyingRef.current) {
                moveToNextCardInStudy();
              } else if (navRepeatActiveRef.current) {
                finishNavRepeatRef.current?.();
              }
            } else {
              speakOneAndListen(expected, attemptIndex + 1, totalAttempts);
            }
          }
        }, 700);
      }
    }, 800 + remaining);

    return () => clearTimeout(handle);
  }, [transcript, isListeningForRepeat, resetTranscript, speakOneAndListen]);

  useEffect(() => {
    if (!expectingUserSpeechRef.current) return;
    if (listening) return;
    if (isListeningForRepeat) {
      const handle = setTimeout(() => {
        if (!expectingUserSpeechRef.current) return;
        setRepeatStatus('retry');
        setIsListeningForRepeat(false);
        expectingUserSpeechRef.current = false;
        const attemptIndex = currentRepeatIndexRef.current;
        const totalAttempts = totalRepeatsRef.current;
        const word = currentWordRef.current;
        setTimeout(() => {
          if (!isRepeatCycleActive()) return;
          const isLastAttempt = attemptIndex + 1 >= totalAttempts;

          if (settingsRef.current.repeatOnWordsNotEqual) {
            speakOneAndListen(word, attemptIndex, totalAttempts);
          } else {
            if (isLastAttempt) {
              if (settingsRef.current.repeatAfterMe && isStudyingRef.current) {
                failedCardsRef.current.push({
                  word,
                  heard: '',
                });
              }
              setRepeatStatus('');
              setRepeatProgress({ current: 0, total: 0 });
              // Fault on the last attempt (no speech) → advance WITHOUT
              // speaking the translation.
              if (isStudyingRef.current) {
                moveToNextCardInStudy();
              } else if (navRepeatActiveRef.current) {
                finishNavRepeatRef.current?.();
              }
            } else {
              speakOneAndListen(word, attemptIndex + 1, totalAttempts);
            }
          }
        }, 600);
      }, 1500);
      return () => clearTimeout(handle);
    }
  }, [listening, isListeningForRepeat, speakOneAndListen]);

  const openSettings = () => setIsSettingsOpen(true);
  const closeSettings = () => setIsSettingsOpen(false);
  const toggleTheme = () => handleSettingChange('theme', settings.theme === 'dark' ? 'light' : 'dark');
  const handleOpenSettingsFile = () => { if (settingsFileInputRef.current) settingsFileInputRef.current.click(); };

  const SETTINGS_SCHEMA = {
    autoAlign: { type: 'boolean', default: true },
    topPanelWidth: { type: 'number', min: 300, max: 2000, default: 916 },
    cardWidth: { type: 'number', min: 150, max: 800, default: 400 },
    cardHeight: { type: 'number', min: 150, max: 800, default: 400 },
    cardGap: { type: 'number', min: 5, max: 100, default: 10 },
    fontSize: { type: 'number', min: 8, max: 48, default: 32 },
    showSvgBorder: { type: 'boolean', default: false },
    showTranscription: { type: 'boolean', default: true },
    showTranslation: { type: 'boolean', default: true },
    loadLessonLocally: { type: 'boolean', default: false },
    selectedLessonFile: { type: 'string', maxLength: 200, default: '' },
    theme: { type: 'enum', values: ['dark', 'light'], default: 'dark' },
    studyTime: { type: 'number', min: 3, max: 60, default: 10 },
    selectedVoiceName: { type: 'string', maxLength: 200, default: '' },
    repeatTimes: { type: 'number', min: 1, max: 5, default: 3 },
    autoPronounce: { type: 'boolean', default: true },
    pronounceTranslation: { type: 'boolean', default: true },
    translationVoiceName: { type: 'string', maxLength: 200, default: '' },
    translationRepeatTimes: { type: 'number', min: 1, max: 5, default: 3 },
    randomOrder: { type: 'boolean', default: true },
    repeatAfterMe: { type: 'boolean', default: false },
    repeatOnWordsNotEqual: { type: 'boolean', default: false }, // default UNCHECKED
    hideAlerts: { type: 'boolean', default: true },              // default CHECKED
    invisibleTopBar: { type: 'boolean', default: true },         // default CHECKED
  };

  const validateSettings = (raw) => {
    const valid = {};
    const rejected = [];
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      return { valid, rejected: ['(not an object)'] };
    }
    Object.keys(raw).forEach((key) => {
      const rule = SETTINGS_SCHEMA[key];
      if (!rule) return;
      const value = raw[key];
      if (rule.type === 'number') {
        const n = typeof value === 'number' ? value : Number(value);
        if (!Number.isFinite(n)) { rejected.push(`${key} (not a number)`); return; }
        if (n < rule.min || n > rule.max) {
          rejected.push(`${key} (out of range: ${n}, allowed ${rule.min}–${rule.max})`);
          return;
        }
        valid[key] = n; return;
      }
      if (rule.type === 'boolean') {
        if (typeof value !== 'boolean') { rejected.push(`${key} (not a boolean)`); return; }
        valid[key] = value; return;
      }
      if (rule.type === 'string') {
        if (typeof value !== 'string') { rejected.push(`${key} (not a string)`); return; }
        if (rule.maxLength && value.length > rule.maxLength) {
          rejected.push(`${key} (too long: ${value.length} chars)`); return;
        }
        valid[key] = value; return;
      }
      if (rule.type === 'enum') {
        if (!rule.values.includes(value)) {
          rejected.push(`${key} (invalid value: "${value}", allowed: ${rule.values.join(', ')})`);
          return;
        }
        valid[key] = value; return;
      }
    });
    return { valid, rejected };
  };

  const loadSettingsFromFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        const { valid, rejected } = validateSettings(parsed);
        const newSettings = { ...settings, ...valid };
        if (rejected.length > 0) console.warn('[Settings] Rejected invalid fields:', rejected);
        setSettings(newSettings);
        userSelectedVoiceNameRef.current = newSettings.selectedVoiceName || "";
        cachedVoiceRef.current = null;
        if (rejected.length > 0) {
          alert(
            `⚠️ Settings loaded with warnings\n\n` +
            `${rejected.length} field(s) were rejected and reverted to defaults:\n\n` +
            rejected.map((r) => `• ${r}`).join('\n')
          );
        } else {
          notify('✅ Settings loaded successfully!');
        }
      } catch (err) { alert('❌ Failed to parse settings file.'); }
    };
    reader.readAsText(file);
  };

  const applyAndClose = () => {
    if (isStudying) { stopStudyTimer(); setTimeout(() => startStudyTimer(), 100); }
    closeSettings();
  };

  const saveSettings = async () => {
    if (isStudying) { stopStudyTimer(); setTimeout(() => startStudyTimer(), 100); }
    const settingsToSave = {
      ...settings,
      dbFileName: dbLoaded ? dbFileName : "",
      savedAt: new Date().toISOString()
    };
    const jsonStr = JSON.stringify(settingsToSave, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });

    if ('showSaveFilePicker' in window) {
      try {
        const fileHandle = await window.showSaveFilePicker({
          suggestedName: 'cards.settings',
          types: [{ description: 'Settings File', accept: { 'application/json': ['.settings'] } }]
        });
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
        notify('Settings saved successfully!');
        closeSettings();
        return;
      } catch (err) {
        if (err.name !== 'AbortError') console.warn('Save file picker error:', err);
      }
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cards.settings';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    notify('Settings saved successfully!');
    closeSettings();
  };

  const handleSettingChange = (key, value) => setSettings(prev => ({ ...prev, [key]: value }));

  // When "🎤 Repeat after me" is enabled, force Attempt: = 1.
  const handleRepeatAfterMeToggle = (checked) => {
    setSettings(prev => ({
      ...prev,
      repeatAfterMe: checked,
      ...(checked ? { repeatTimes: 1 } : {}),
    }));
  };

  const handleVoiceChange = (voiceName) => {
    cancelAllSpeech();
    userSelectedVoiceNameRef.current = voiceName;
    setSettings(prev => ({ ...prev, selectedVoiceName: voiceName }));
    if (voiceName) {
      const voice = availableVoicesRef.current.find(v => v.name === voiceName);
      if (voice) {
        cachedVoiceRef.current = voice;
        const testText = "Hello! Voice selected successfully.";
        try {
          if (synthRef.current) {
            synthRef.current.cancel();
            const utterance = new SpeechSynthesisUtterance(testText);
            utterance.voice = voice;
            utterance.rate = 0.9;
            utterance.pitch = 1.0;
            synthRef.current.speak(utterance);
          }
        } catch (err) { console.error('Error testing voice:', err); }
      }
    } else {
      cachedVoiceRef.current = null;
    }
  };

  const handleMainAction = () => {
    if (!isStudying && isSpeaking) {
      alert('⚠️ Please wait for current pronunciation to finish before starting a study session.');
      return;
    }
    if (isStudying) { stopStudyTimer(); return; }

    if (!dbLoaded || allRecords.length === 0) {
      alert('⚠️ No database loaded!\n\nPlease load a database file using the "Load DB" button before starting a study session.');
      return;
    }
    if (!isSpeechSupported()) {
      alert('⚠️ Your browser does not support speech synthesis.\n\nPlease use a different browser.');
      return;
    }
    if (settings.autoPronounce && (!voicesLoaded || availableVoices.length === 0)) {
      alert('⚠️ Voices not loaded yet!\n\nPlease click the "Load Voices" button in Settings first.');
      return;
    }
    if (settings.autoPronounce && !settings.selectedVoiceName) {
      alert('⚠️ Please select a voice in Settings before starting the study session.');
      return;
    }
    if (settings.repeatAfterMe && !browserSupportsSpeechRecognition) {
      alert('⚠️ Repeat-after-me requires browser speech recognition, which is not supported in this browser.');
      return;
    }
    if (dbLoaded && allRecords.length > 0) {
      if (navRepeatActiveRef.current) cancelRepeatCycle();
      startStudyTimer();
      let modeMsg = '';
      if (settings.repeatAfterMe) {
        modeMsg = `🎤 Repeat-after-me mode:\n• Word is pronounced ${settings.repeatTimes} time(s)\n• After EACH pronunciation the mic listens\n• If each attempt matches, the study advances\n• If not, the same attempt repeats\n• ${settings.pronounceTranslation ? 'Translation is spoken after the word is matched' : 'Translation pronunciation is OFF'}${settings.randomOrder ? '\n\n🔀 Random order enabled.' : ''}`;
      } else if (settings.autoPronounce && settings.selectedVoiceName) {
        modeMsg = `🔊 Auto-pronunciation mode: Each card will be pronounced and auto-advance\n${settings.pronounceTranslation ? '🌐 Translation will also be pronounced\n' : ''}⏱️ No timer - progress after pronunciation completes${settings.randomOrder ? '\n\n🔀 Random order enabled.' : ''}`;
      } else {
        modeMsg = `⏱️ Timer mode: ${settings.studyTime} seconds per card\n🔇 Auto-pronunciation disabled${settings.randomOrder ? '\n\n🔀 Random order enabled.' : ''}`;
      }
      notify(`📖 Study session started!\n\n${modeMsg}`);
    }
  };

  // =============================================================
  // SVG sanitization (Option A: allow safe inline data:image/*)
  // =============================================================
  //
  // `image` is intentionally NOT in the always-strip list anymore. We
  // now allow <image> only when its href is a base64-encoded data URI of
  // a known safe raster/vector image type. External URLs (http, https,
  // file, ftp, javascript:, data:text/html, etc.) are still dropped.
  //
  // If you want to also forbid inline SVG data URIs (paranoid mode),
  // remove `svg\+xml|` from SAFE_DATA_IMAGE_RE below.
  const DANGEROUS_SVG_TAGS = [
    'script', 'foreignObject', 'iframe', 'object', 'embed',
    'audio', 'video', 'source', 'track',
    'animate', 'set', 'handler', 'listener',
  ];
  const DANGEROUS_ATTR_PREFIXES = ['on'];
  const DANGEROUS_ATTR_NAMES = ['src', 'data', 'formaction', 'action'];
  const isSafeInternalReference = (value) => /^#[A-Za-z_][\w:.-]*$/.test(value.trim());

  // Allow only inline, base64-encoded image data URIs.
  const SAFE_DATA_IMAGE_RE =
    /^data:image\/(png|jpe?g|gif|webp|bmp|x-icon|vnd\.microsoft\.icon|svg\+xml);base64,[A-Za-z0-9+/=\s]+$/i;

  const isSafeDataImage = (value) =>
    typeof value === 'string' && SAFE_DATA_IMAGE_RE.test(value.trim());

  const sanitizeSvgString = (rawSvg) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(rawSvg, 'image/svg+xml');
    if (doc.querySelector('parsererror')) return null;
    const svgEl = doc.documentElement;
    if (!svgEl || svgEl.tagName.toLowerCase() !== 'svg') return null;

    // 1. Remove always-dangerous tags.
    DANGEROUS_SVG_TAGS.forEach((tag) =>
      doc.querySelectorAll(tag).forEach((el) => el.remove())
    );

    // 2. <use> must point to an internal fragment (#id) only.
    doc.querySelectorAll('use').forEach((useEl) => {
      const href =
        useEl.getAttribute('href') ||
        useEl.getAttribute('xlink:href') ||
        '';
      if (!isSafeInternalReference(href)) useEl.remove();
    });

    // 3. <image> is allowed ONLY when its href is a safe inline data:image/*.
    doc.querySelectorAll('image').forEach((imgEl) => {
      const href =
        imgEl.getAttribute('href') ||
        imgEl.getAttribute('xlink:href') ||
        '';
      if (!isSafeDataImage(href)) imgEl.remove();
    });

    // 4. Per-attribute scrub.
    [svgEl, ...doc.querySelectorAll('*')].forEach((el) => {
      const attrsToRemove = [];
      const tagName = el.tagName.toLowerCase();

      Array.from(el.attributes).forEach((attr) => {
        const name = attr.name.toLowerCase();
        const value = (attr.value || '').trim();

        // on* event handlers
        if (DANGEROUS_ATTR_PREFIXES.some((p) => name.startsWith(p))) {
          attrsToRemove.push(attr.name);
          return;
        }

        // href / xlink:href
        if (name === 'href' || name === 'xlink:href') {
          if (tagName === 'use') return;            // already validated above
          if (tagName === 'image') {                // already validated above
            if (isSafeDataImage(value)) return;
            attrsToRemove.push(attr.name);
            return;
          }
          // any other element: only internal #id references allowed
          if (!isSafeInternalReference(value)) attrsToRemove.push(attr.name);
          return;
        }

        // src / data / formaction / action — block javascript:, data:, vbscript:
        if (DANGEROUS_ATTR_NAMES.includes(name)) {
          if (/^\s*(javascript|data|vbscript):/i.test(value)) {
            attrsToRemove.push(attr.name);
          }
          return;
        }

        // style="... url(javascript:...)"
        if (
          name === 'style' &&
          /url\s*\(\s*['"]?\s*javascript:/i.test(value)
        ) {
          attrsToRemove.push(attr.name);
        }
      });

      attrsToRemove.forEach((a) => el.removeAttribute(a));
    });

    // 5. Neutralize @import inside <style>.
    doc.querySelectorAll('style').forEach((styleEl) => {
      styleEl.textContent = (styleEl.textContent || '').replace(
        /@import[^;]+;/gi,
        ''
      );
    });

    return svgEl;
  };

  const CLASS_TOKEN_REGEX = /^st\d+$/;
  const rewriteStyleContent = (cssText, scopeId) =>
    cssText.replace(/\.st(\d+)(?![A-Za-z0-9_-])/g, `.${scopeId}-st$1`);
  const rewriteClassAttribute = (classValue, scopeId) =>
    classValue.split(/\s+/).filter(Boolean)
      .map(token => (CLASS_TOKEN_REGEX.test(token) ? `${scopeId}-${token}` : token))
      .join(' ');

  const renderSvgToContainer = (container, svgCode, uniqueId) => {
    if (!container) return;
    container.replaceChildren();
    if (!svgCode || svgCode.trim() === '') return;
    try {
      const sanitizedSvg = sanitizeSvgString(svgCode);
      if (!sanitizedSvg) return;
      sanitizedSvg.setAttribute('width', '100%');
      sanitizedSvg.setAttribute('height', '100%');
      const scopeId = uniqueId || `svg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      sanitizedSvg.querySelectorAll('style').forEach((style) => {
        style.textContent = rewriteStyleContent(style.textContent || '', scopeId);
      });
      sanitizedSvg.querySelectorAll('[class]').forEach((el) => {
        const oldClass = el.getAttribute('class');
        if (oldClass) el.setAttribute('class', rewriteClassAttribute(oldClass, scopeId));
      });
      container.appendChild(sanitizedSvg);
    } catch (error) {
      console.error('Error rendering SVG:', error);
      container.replaceChildren();
    }
  };

  const applyDatabasePayload = useCallback((importedData, sourceName) => {
    let records = [];
    if (importedData.records && Array.isArray(importedData.records)) records = importedData.records;
    else if (Array.isArray(importedData)) records = importedData;
    else throw new Error("Invalid database file format");
    if (records.length === 0) throw new Error("Database file contains no records");

    const convertedRecords = records.map((record, idx) => {
      if (record.card1 && record.card2) {
        return {
          id: record.id || idx + 1,
          singular: {
            word: record.card1.word || "",
            transcription: record.card1.transcription || "",
            translation: record.card1.translation || "",
            svgCode: record.card1.svgCode || ""
          },
          plural: {
            word: record.card2.word || "",
            transcription: record.card2.transcription || "",
            translation: record.card2.translation || "",
            svgCode: record.card2.svgCode || ""
          }
        };
      }
      if (record.singular && record.plural) {
        return {
          id: record.id || idx + 1,
          singular: {
            word: record.singular.word || "",
            transcription: record.singular.transcription || "",
            translation: record.singular.translation || "",
            svgCode: record.singular.svgCode || ""
          },
          plural: {
            word: record.plural.word || "",
            transcription: record.plural.transcription || "",
            translation: record.plural.translation || "",
            svgCode: record.plural.svgCode || ""
          }
        };
      }
      return {
        id: record.id || idx + 1,
        singular: {
          word: record.word || "",
          transcription: record.transcription || "",
          translation: record.translation || "",
          svgCode: record.svgCode || ""
        },
        plural: {
          word: record.word || "",
          transcription: record.transcription || "",
          translation: record.translation || "",
          svgCode: record.svgCode || ""
        }
      };
    });
    setAllRecords(convertedRecords);
    setCurrentIndex(0);
    setCurrentRecord(convertedRecords[0]);
    setActiveCard('singular');
    setDbLoaded(true);

    const cleanSourceName = String(sourceName || '')
      .replace(/\.(json|dbms)$/i, '')
      .trim();
    setDbFileName(cleanSourceName || importedData.name || '');

    setCardPulsing('singular', false);
    setCardPulsing('plural', false);
    setManualPulseCard(null);

    failedCardsRef.current = [];
  }, []);

  const loadDatabaseFromFile = useCallback(async () => {
    if (isStudying) stopStudyTimer();
    if (navRepeatActiveRef.current) cancelRepeatCycle();
    cancelAllSpeech();
    stopRepeatListening();

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json,.dbms';
    fileInput.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      setIsLoading(true);
      try {
        const contents = await file.text();
        const importedData = JSON.parse(contents);
        applyDatabasePayload(importedData, file.name.replace(/\.(json|dbms)$/, ''));
        notify(`✅ Database loaded successfully!\n\nFile: ${file.name}`);
      } catch (error) {
        alert(`❌ Failed to load database\n\nError: ${error.message}`);
        setDbLoaded(false);
        setCurrentRecord(null);
        setAllRecords([]);
      } finally {
        setIsLoading(false);
      }
    };
    fileInput.click();
  }, [applyDatabasePayload, stopStudyTimer, cancelRepeatCycle, cancelAllSpeech, stopRepeatListening]);

  const loadDatabaseFromServer = useCallback(async (fileOverride = null) => {
    const indexUrl = LESSONS_INDEX_URL;
    const file = (fileOverride || settingsRef.current.selectedLessonFile || '').trim();

    if (!file) {
      alert('⚠️ No lesson selected.\n\nPlease pick a lesson from the list, or enable "Load lesson locally" to pick a file from your device.');
      throw new Error('No lesson selected');
    }

    const baseDir = indexUrl.replace(/[^/]*$/, '');
    const lessonUrl = baseDir + file;

    if (isStudying) stopStudyTimer();
    if (navRepeatActiveRef.current) cancelRepeatCycle();
    cancelAllSpeech();
    stopRepeatListening();

    setIsLoading(true);
    try {
      const response = await fetch(lessonUrl, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) {
        throw new Error(`Server returned ${response.status} ${response.statusText}`);
      }
      const text = await response.text();
      const importedData = JSON.parse(text);
      const sourceName = file.replace(/\.(json|dbms)$/, '') || 'lesson';
      applyDatabasePayload(importedData, sourceName);

      setSettings((prev) => ({ ...prev, selectedLessonFile: file }));
      setIsLessonPickerOpen(false);
    } catch (err) {
      alert(`❌ Failed to load lesson\n\n${err.message}`);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [applyDatabasePayload, stopStudyTimer, cancelRepeatCycle, cancelAllSpeech, stopRepeatListening]);

  const loadDatabase = useCallback(() => {
    if (!initialLoadResolvedRef.current) return;

    if (settingsRef.current.loadLessonLocally) {
      loadDatabaseFromFile();
    } else {
      setIsLessonPickerOpen(true);
    }
  }, [loadDatabaseFromFile]);

  const handlePickLesson = useCallback((file) => {
    if (!file) return;
    setIsLessonPickerOpen(false);
    loadDatabaseFromServer(file).catch(() => { /* alert already shown */ });
  }, [loadDatabaseFromServer]);

  const nextRecord = () => {
    if (allRecords.length > 0 && currentIndex < allRecords.length - 1 && !isStudying) {
      if (navRepeatActiveRef.current) cancelRepeatCycle();
      cancelAllSpeech(); clearManualPulse();
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex); setCurrentRecord(allRecords[newIndex]); setActiveCard('singular');
    }
  };
  const prevRecord = () => {
    if (allRecords.length > 0 && currentIndex > 0 && !isStudying) {
      if (navRepeatActiveRef.current) cancelRepeatCycle();
      cancelAllSpeech(); clearManualPulse();
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex); setCurrentRecord(allRecords[newIndex]); setActiveCard('singular');
    }
  };

  useEffect(() => {
    if (currentRecord && dbLoaded) {
      const t = setTimeout(() => {
        renderSvgToContainer(singularSvgRef.current, currentRecord.singular?.svgCode, 'singular');
        renderSvgToContainer(pluralSvgRef.current, currentRecord.plural?.svgCode, 'plural');
      }, 50);
      return () => clearTimeout(t);
    } else if (!dbLoaded) {
      if (singularSvgRef.current) singularSvgRef.current.replaceChildren();
      if (pluralSvgRef.current) pluralSvgRef.current.replaceChildren();
    }
  }, [currentRecord, dbLoaded]);

  // ============================================================
  // handleCardClick (Navigation mode)
  // Non-repeat mode: word → (translation). Wordless card with a
  // translation: speak the translation only.
  // Repeat-after-me: word → mic listen → on match translation spoken
  // by the transcript effect. Wordless card with a translation:
  // speak the translation and end any active nav-repeat cycle.
  // Translations are spoken script-aware (see speakTranslationSmart).
  // ============================================================
  const handleCardClick = (cardType) => {
    if (isStudying) return;
    if (!dbLoaded || !currentRecord) return;
    if (!voiceSupport) return;

    let word = '';
    let translation = '';
    if (cardType === 'singular') {
      word = currentRecord.singular?.word || '';
      translation = currentRecord.singular?.translation || '';
    } else {
      word = currentRecord.plural?.word || '';
      translation = currentRecord.plural?.translation || '';
    }

    const hasWord = !!word && word.trim() !== '';
    const hasTranslation =
      !!translation && translation.trim() !== '' && settings.pronounceTranslation;

    // Nothing at all to say → silent no-op.
    if (!hasWord && !hasTranslation) return;

    // --- Repeat-after-me branch ---
    if (settings.repeatAfterMe) {
      if (!hasWord) {
        // Wordless card: no mic comparison possible.
        //
        // (a) If a repeat cycle is already in flight on the OTHER card,
        //     cancel it FIRST. Otherwise the previously-scheduled
        //     startRepeatListening(oldWord) would fire ~400 ms later and
        //     open the mic on a card the user has already moved on from
        //     — a "phantom" listening session. cancelRepeatCycle() also
        //     stops any speech, aborts the mic, clears the refs, and
        //     removes the pulse from the card that was cycling.
        if (navRepeatActiveRef.current) {
          cancelRepeatCycle();
        }

        // (b) Toggle-off: if this same wordless card is already pulsing
        //     because its translation is being played back, treat the
        //     click as a cancel — stop the speech, remove the pulse,
        //     and return. Without this check, a second click would
        //     restart the utterance and toggle the pulse class off/on
        //     in the same tick, restarting the CSS animation (which
        //     looks like a flash).
        if (manualPulseCard === cardType) {
          cancelAllSpeech();
          setCardPulsing(cardType, false);
          setManualPulseCard(null);
          return;
        }

        // (c) Otherwise start the translation playback, pulsing the
        //     clicked card during playback, and clear the pulse when done.
        if (hasTranslation) {
          clearManualPulse();
          setCardPulsing(cardType, true);
          setManualPulseCard(cardType);

          speakTranslationSmart(translation, () => {
            setCardPulsing(cardType, false);
            setManualPulseCard(null);
          });
        }
        return;
      }

      if (navRepeatActiveRef.current && navRepeatCardTypeRef.current === cardType) {
        cancelRepeatCycle();
        setCardPulsing(cardType, false);
        setManualPulseCard(null);
        return;
      }
      startNavRepeatCycleRef.current?.(cardType, word);
      return;
    }

    // --- Toggle-off branch ---
    if (manualPulseCard === cardType) {
      cancelAllSpeech();
      setCardPulsing(cardType, false);
      setManualPulseCard(null);
      return;
    }

    // --- Wordless card → speak only the translation ---
    if (!hasWord) {
      clearManualPulse();
      setCardPulsing(cardType, true);
      setManualPulseCard(cardType);
      const finishPronunciation = () => clearManualPulse();

      speakTranslationSmart(translation, finishPronunciation);
      return;
    }

    // --- Normal word-card flow ---
    const currentVoice = getCurrentVoice();
    if (!currentVoice) return;

    clearManualPulse();

    setCardPulsing(cardType, true);
    setManualPulseCard(cardType);
    const finishPronunciation = () => clearManualPulse();

    if (settings.pronounceTranslation && hasTranslation) {
      speakText(word, () => {
        speakTranslationSmart(translation, finishPronunciation);
      });
    } else {
      speakText(word, finishPronunciation);
    }
  };

  const handleCardKeyDown = (cardType) => (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCardClick(cardType);
    }
  };

  const startButtonLabel = () => {
    if (isStudying) return '⏹️ Stop';
    if (settings.repeatAfterMe) return '🎧🎤 Repeat';
    return '🎧 Start';
  };
  const startButtonAriaLabel = () => {
    if (isStudying) return 'Stop study session';
    if (settings.repeatAfterMe) return 'Start repeat-after-me study session';
    return 'Start study session';
  };

  const appClassName = [
    'app',
    !settings.showTranscription ? 'hide-transcription' : '',
    !settings.showTranslation ? 'hide-translation' : '',
    settings.invisibleTopBar ? 'invisible-top-bar' : '',
  ].filter(Boolean).join(' ');

  const viewportW = displayInfo
    ? (displayInfo.viewportClientWidth || displayInfo.viewportCssWidth || 0)
    : 0;
  const viewportH = displayInfo
    ? (displayInfo.viewportClientHeight || displayInfo.viewportCssHeight || 0)
    : 0;

  const isLandscape =
    displayInfo &&
    displayInfo.viewportClientWidth > displayInfo.viewportClientHeight;

  const fallbackTopBarHeight = isLandscape
    ? TOP_BAR_HEIGHT_LANDSCAPE
    : TOP_BAR_HEIGHT_PORTRAIT;
  const effectiveTopBarHeight =
    (measuredTopBarHeight && measuredTopBarHeight > 0)
      ? measuredTopBarHeight
      : fallbackTopBarHeight;

  const autoGap = Math.max(
    5,
    Math.min(100, Number(settings.cardGap) || 10)
  );

  let effectiveTopPanelWidth = settings.topPanelWidth;
  let effectiveCardWidth = settings.cardWidth;
  let effectiveCardHeight = settings.cardHeight;
  let effectiveGap = settings.cardGap;
  let sideInset = 0;
  let topGap = 0;
  let bottomGap = 0;

  if (settings.autoAlign && viewportW > 0) {
    effectiveGap = autoGap;
    topGap = TOP_BAR_GAP_PX;
    bottomGap = autoGap;
    sideInset = autoGap;

    if (isLandscape) {
      const rowWidth = viewportW - sideInset * 2;
      effectiveTopPanelWidth = Math.max(300, rowWidth);

      const wFromRow = Math.floor((rowWidth - effectiveGap) / 2);
      effectiveCardWidth = Math.max(MIN_CARD_WIDTH, wFromRow);

      const hAvail =
        viewportH - effectiveTopBarHeight - topGap - bottomGap;
      effectiveCardHeight = Math.max(MIN_CARD_HEIGHT, Math.floor(hAvail));
    } else {
      const rowWidth = viewportW - sideInset * 2;
      effectiveTopPanelWidth = Math.max(300, rowWidth);

      // One card per row: let it fill the available row width, bounded
      // below by MIN_CARD_WIDTH and above by MAX_AUTO_CARD_WIDTH.
      // This makes the card expand on wide viewports such as Android
      // Chrome's "Desktop site" mode, where the reported CSS width is
      // ~980 instead of the phone's ~360-420.
      effectiveCardWidth = Math.min(
        MAX_AUTO_CARD_WIDTH,
        Math.max(MIN_CARD_WIDTH, rowWidth)
      );

      const hAvail =
        viewportH
        - effectiveTopBarHeight
        - topGap        - effectiveGap
        - bottomGap;
      const hPerCard = Math.floor(hAvail / 2);
      effectiveCardHeight = Math.max(MIN_CARD_HEIGHT, hPerCard);
    }
  }

  const appStyle = {
    '--top-panel-width':     `${effectiveTopPanelWidth}px`,
    '--card-width':          `${effectiveCardWidth}px`,
    '--card-height':         `${effectiveCardHeight}px`,
    '--card-gap':            `${effectiveGap}px`,
    '--font-size':           `${settings.fontSize}px`,
    '--viewport-width':      viewportW ? `${viewportW}px` : '100vw',
    '--viewport-height':     viewportH ? `${viewportH}px` : '100vh',
    '--landscape-inset':     `${sideInset}px`,
    '--landscape-bottom':    `${bottomGap}px`,
    '--landscape-top-gap':   `${topGap}px`,
    '--measured-top-bar-height': `${effectiveTopBarHeight}px`,
  };

  const svgWrapperClass = settings.showSvgBorder ? 'svg-wrapper svg-bordered' : 'svg-wrapper';

  const showRepeatChip =
    (settings.repeatAfterMe && isStudying) ||
    (settings.repeatAfterMe && navRepeatActive);

  const repeatSessionActive =
    (settings.repeatAfterMe && isStudying) ||
    (settings.repeatAfterMe && navRepeatActive);

  return (
    <div
      className={appClassName}
      style={appStyle}
      data-orientation={isLandscape ? 'landscape' : 'portrait'}
      data-auto-align={settings.autoAlign ? 'on' : 'off'}
    >
      <div className="top-bar-wrapper">
        <div className="top-bar" role="banner" ref={topBarRef}>
          <div className="header-left">
            <button
              onClick={toggleTheme}
              className="nav-button theme-button"
              style={{ background: '#ff9800', padding: '6px 12px' }}
              aria-label={settings.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              title={settings.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              <span aria-hidden="true">{settings.theme === 'dark' ? '☀️' : '🌙'}</span>
            </button>

            <div className="header-title">Eco Cards</div>

            {!isStudying && (
              <button
                className="menu-button"
                onClick={openSettings}
                aria-label="Open settings"
                title="Settings"
              >
                <span aria-hidden="true">🔧</span>
              </button>
            )}

            <button
              type="button"
              className={`header-db-info header-db-info-button ${showRepeatChip ? `repeat-mode repeat-${repeatStatus || 'idle'}` : ''}`}
              onClick={loadDatabase}
              disabled={
                isLoading ||
                isStudying ||
                navRepeatActive ||
                (!initialLoadResolved && !settings.loadLessonLocally)
              }
              aria-live="polite"
              aria-atomic="true"
              aria-label={
                isLoading
                  ? 'Loading lesson'
                  : settings.loadLessonLocally
                    ? 'Load lesson from local files'
                    : 'Load lesson from server'
              }
              title={
                isLoading
                  ? 'Loading lesson'
                  : settings.loadLessonLocally
                    ? 'Load lesson locally'
                    : 'Load lesson from server'
              }
            >
              <span className="db-info-label" aria-hidden="true">
                {settings.loadLessonLocally ? '📁' : '🌐'}
              </span>

              {dbLoaded && currentRecord && !repeatSessionActive ? (
                <>
                  <span className="db-info-name">{dbFileName}</span>
                  <span className="db-info-separator" aria-hidden="true">|</span>
                  <span className="db-info-id">ID: {currentRecord.id} / {allRecords.length}</span>

                  {isSpeaking && (
                    <>
                      <span className="db-info-separator" aria-hidden="true">|</span>
                      <span className="db-info-timer" role="status" aria-live="polite"
                        aria-label="Currently speaking" title="Speaking">
                        <span aria-hidden="true">🔊</span>
                      </span>
                    </>
                  )}

                  {isListeningForRepeat && !showRepeatChip && (
                    <>
                      <span className="db-info-separator" aria-hidden="true">|</span>
                      <span className="db-info-timer" role="status" aria-live="polite"
                        aria-label="Listening for your voice" title="Listening">
                        <span aria-hidden="true">🎤</span>
                      </span>
                    </>
                  )}

                  {showRepeatChip && (
                    <>
                      <span className="db-info-separator" aria-hidden="true">|</span>
                      <span className="db-info-repeat" aria-live="polite">
                        {repeatStatus === 'listening' && (<><span aria-hidden="true">🎤</span><span>Listening ({repeatProgress.current}/{repeatProgress.total})…</span></>)}
                        {repeatStatus === 'matched' && (<><span aria-hidden="true">✅</span><span>Matched ({repeatProgress.current}/{repeatProgress.total})</span></>)}
                        {repeatStatus === 'retry' && (<><span aria-hidden="true">🔁</span><span>Retry ({repeatProgress.current}/{repeatProgress.total})</span></>)}
                        {repeatStatus === 'error' && (<><span aria-hidden="true">⚠️</span><span>Speech error</span></>)}
                        {!repeatStatus && (<><span aria-hidden="true">🎧</span><span>Repeat After Me</span></>)}
                      </span>

                      {lastRecognized && (
                        <span
                          className={`recognized-chip recognized-${repeatStatus || 'idle'}`}
                          role="status"
                          aria-live="polite"
                          aria-atomic="true"
                          title="Recognized word"
                        >
                          {lastRecognized}
                        </span>
                      )}
                    </>
                  )}
                </>
              ) : repeatSessionActive ? (
                <>
                  {showRepeatChip && (
                    <>
                      <span className="db-info-repeat" aria-live="polite">
                        {repeatStatus === 'listening' && (<><span aria-hidden="true">🎤</span><span>Listening ({repeatProgress.current}/{repeatProgress.total})…</span></>)}
                        {repeatStatus === 'matched' && (<><span aria-hidden="true">✅</span><span>Matched ({repeatProgress.current}/{repeatProgress.total})</span></>)}
                        {repeatStatus === 'retry' && (<><span aria-hidden="true">🔁</span><span>Retry ({repeatProgress.current}/{repeatProgress.total})</span></>)}
                        {repeatStatus === 'error' && (<><span aria-hidden="true">⚠️</span><span>Speech error</span></>)}
                        {!repeatStatus && (<><span aria-hidden="true">🎧</span><span>Repeat After Me</span></>)}
                      </span>

                      {lastRecognized && (
                        <span
                          className={`recognized-chip recognized-${repeatStatus || 'idle'}`}
                          role="status"
                          aria-live="polite"
                          aria-atomic="true"
                          title="Recognized word"
                        >
                          {lastRecognized}
                        </span>
                      )}
                    </>
                  )}
                </>
              ) : (
                isLoading ? (
                  <span className="db-info-name">Loading…</span>
                ) : null
              )}
            </button>
          </div>

          <div className="header-buttons">
            {dbLoaded && allRecords.length > 0 && (
              <>
                <button
                  onClick={prevRecord}
                  className={`nav-button ${isStudying ? 'hidden-but-reserved' : ''}`}
                  style={{ background: '#0078d4', padding: '6px 12px' }}
                  disabled={isStudying}
                  aria-label="Previous card" title="Previous card"
                >
                  <span aria-hidden="true">◀</span>
                </button>
                <button
                  onClick={nextRecord}
                  className={`nav-button ${isStudying ? 'hidden-but-reserved' : ''}`}
                  style={{ background: '#0078d4', padding: '6px 12px' }}
                  disabled={isStudying}
                  aria-label="Next card" title="Next card"
                >
                  <span aria-hidden="true">▶</span>
                </button>
              </>
            )}

            {dbLoaded && allRecords.length > 0 && (
              <button
                className={isStudying ? "stop-button" : "start-button"}
                onClick={handleMainAction}
                disabled={isLoading}
                aria-label={startButtonAriaLabel()}
                title={startButtonAriaLabel()}
              >
                {startButtonLabel()}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="page-content">
        <div className="cards-row" role="group" aria-label="Word cards">
          <div
            ref={singularCardRef}
            className="card"
            onClick={() => handleCardClick('singular')}
            onKeyDown={handleCardKeyDown('singular')}
            role="button"
            tabIndex={dbLoaded && !isStudying ? 0 : -1}
            aria-label={
              dbLoaded && currentRecord?.singular?.word
                ? `Pronounce singular word: ${currentRecord.singular.word}`
                : 'Singular word card'
            }
            aria-disabled={isStudying}
          >
            <div className="english-word">
              {dbLoaded && currentRecord?.singular?.word ? currentRecord.singular.word : ""}
            </div>
            <div className="card-content">
              <div className="transcription">
                {dbLoaded && currentRecord?.singular?.transcription ? currentRecord.singular.transcription : ""}
              </div>
              <div className={svgWrapperClass} ref={singularSvgRef} aria-hidden="true"></div>
            </div>
            <div className="translation">
              {dbLoaded && currentRecord?.singular?.translation ? currentRecord.singular.translation : ""}
            </div>
          </div>

          <div
            ref={pluralCardRef}
            className="card"
            onClick={() => handleCardClick('plural')}
            onKeyDown={handleCardKeyDown('plural')}
            role="button"
            tabIndex={dbLoaded && !isStudying ? 0 : -1}
            aria-label={
              dbLoaded && currentRecord?.plural?.word
                ? `Pronounce plural word: ${currentRecord.plural.word}`
                : 'Plural word card'
            }
            aria-disabled={isStudying}
          >
            <div className="english-word">
              {dbLoaded && currentRecord?.plural?.word ? currentRecord.plural.word : ""}
            </div>
            <div className="card-content">
              <div className="transcription">
                {dbLoaded && currentRecord?.plural?.transcription ? currentRecord.plural.transcription : ""}
              </div>
              <div className={svgWrapperClass} ref={pluralSvgRef} aria-hidden="true"></div>
            </div>
            <div className="translation">
              {dbLoaded && currentRecord?.plural?.translation ? currentRecord.plural.translation : ""}
            </div>
          </div>
        </div>
      </div>

      {isSettingsOpen && (
        <div className="settings-overlay" onClick={closeSettings} role="presentation">
          <div
            className="settings-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-title"
          >
            <div className="settings-header">
              <h2 id="settings-title">🔧 Settings</h2>
              <button className="settings-close" onClick={closeSettings} aria-label="Close settings" title="Close settings">
                <span aria-hidden="true">×</span>
              </button>
            </div>
            <div className="settings-content">
              <div className="settings-section">
                <h3>Study Settings</h3>
                <div className="setting-item">
                  <label htmlFor="setting-studyTime">Study Time per Card (seconds):</label>
                  <input id="setting-studyTime" type="number" value={settings.studyTime}
                    onChange={(e) => handleSettingChange('studyTime', parseInt(e.target.value) || 10)}
                    min="3" max="60" step="1" />
                </div>
                <div className="setting-item checkbox">
                  <label>
                    <input type="checkbox" checked={settings.autoPronounce}
                      onChange={(e) => handleSettingChange('autoPronounce', e.target.checked)} />
                    Auto-pronounce words during study
                  </label>
                </div>
                <div className="setting-item checkbox">
                  <label>
                    <input type="checkbox" checked={settings.randomOrder}
                      onChange={(e) => handleSettingChange('randomOrder', e.target.checked)} />
                    Random pair of cards study (shuffle all records)
                  </label>
                </div>

                <div className="setting-item checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={settings.repeatAfterMe}
                      onChange={(e) => handleRepeatAfterMeToggle(e.target.checked)}
                    />
                    🎤 Repeat after me
                  </label>
                </div>

                {settings.repeatAfterMe && (
                  <div className="setting-item">
                    <label htmlFor="setting-repeatAfterMeTimes">Attempt:</label>
                    <input
                      id="setting-repeatAfterMeTimes"
                      type="number"
                      value={settings.repeatTimes}
                      onChange={(e) => handleSettingChange('repeatTimes', parseInt(e.target.value) || 3)}
                      min="1" max="5" step="1"
                      style={{
                        background: '#3c3c3c',
                        border: '1px solid #555',
                        color: 'white',
                        padding: '0.4rem 0.6rem',
                        borderRadius: '6px',
                        fontSize: '0.9rem',
                        width: '80px'
                      }}
                    />
                    <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', color: '#aaa' }}>times</span>
                  </div>
                )}

                {settings.repeatAfterMe && !browserSupportsSpeechRecognition && (
                  <div className="setting-item">
                    <small style={{ color: '#f44336', fontSize: '0.8rem' }}>
                      ⚠️ Your browser doesn't support speech recognition. This mode won't work.
                    </small>
                  </div>
                )}

                {settings.repeatAfterMe && browserSupportsSpeechRecognition && (
                  <div className="setting-item">
                    <small style={{ color: '#4caf50', fontSize: '0.75rem' }}>
                      ✓ The word is pronounced {settings.repeatTimes} time(s). After each pronunciation the mic listens once. Each attempt must match before moving on.
                    </small>
                  </div>
                )}

                {settings.repeatAfterMe && browserSupportsSpeechRecognition && (
                  <div className="setting-item checkbox">
                    <label>
                      <input
                        type="checkbox"
                        checked={settings.repeatOnWordsNotEqual}
                        onChange={(e) => handleSettingChange('repeatOnWordsNotEqual', e.target.checked)}
                      />
                      Repeat pronunciation if words not equal
                    </label>
                  </div>
                )}

                <div className="setting-item">
                  <small style={{ color: '#aaa', fontSize: '0.7rem' }}>📖 Each card pulses during study</small>
                </div>
              </div>

              <div className="settings-section">
                <h3>Voice Settings</h3>
                <div className="setting-item">
                  <label htmlFor="setting-voice">Select Voice:</label>
                  <select id="setting-voice" value={settings.selectedVoiceName}
                    onChange={(e) => handleVoiceChange(e.target.value)}
                    disabled={!voicesLoaded}
                    style={{ background: '#3c3c3c', border: '1px solid #555', color: 'white', padding: '0.4rem 0.6rem', borderRadius: '6px', fontSize: '0.9rem', width: '220px', cursor: voicesLoaded ? 'pointer' : 'not-allowed', opacity: voicesLoaded ? 1 : 0.6 }}>
                    <option value="">-- Select a voice --</option>
                    {availableVoices.map((voice) => (<option key={voice.name} value={voice.name}>{voice.name} ({voice.lang})</option>))}
                  </select>
                </div>
                <div className="setting-item">
                  <button onClick={loadVoices} disabled={isLoadingVoices} aria-busy={isLoadingVoices}
                    aria-label={voicesLoaded ? 'Voices already loaded' : 'Load available voices'}
                    style={{ background: '#0078d4', border: 'none', color: 'white', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: isLoadingVoices ? 'wait' : 'pointer', fontSize: '0.9rem', width: 'auto', marginLeft: '0.5rem' }}>
                    {isLoadingVoices ? 'Loading...' : (voicesLoaded ? '✓ Voices Loaded' : '📢 Load Voices')}
                  </button>
                  {!voicesLoaded && (<span style={{ marginLeft: '0.5rem', fontSize: '0.7rem', color: '#ff9800' }}>⚠️ Required - Click to load</span>)}
                </div>
                <div className="setting-item">
                  <label htmlFor="setting-repeatTimes">Repeat English words:</label>
                  <input id="setting-repeatTimes" type="number" value={settings.repeatTimes}
                    onChange={(e) => handleSettingChange('repeatTimes', parseInt(e.target.value) || 3)}
                    min="1" max="5" step="1"
                    style={{ background: '#3c3c3c', border: '1px solid #555', color: 'white', padding: '0.4rem 0.6rem', borderRadius: '6px', fontSize: '0.9rem', width: '80px' }} />
                  <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', color: '#aaa' }}>times</span>
                </div>
                <div className="setting-item checkbox">
                  <label>
                    <input type="checkbox" checked={settings.pronounceTranslation}
                      onChange={(e) => handleSettingChange('pronounceTranslation', e.target.checked)} />
                    Pronounce translation
                  </label>
                </div>
                <div className="setting-item">
                  <label htmlFor="setting-translationVoice">Translation Voice:</label>
                  <select id="setting-translationVoice" value={settings.translationVoiceName || ""}
                    onChange={(e) => handleSettingChange('translationVoiceName', e.target.value)}
                    disabled={!voicesLoaded || !settings.pronounceTranslation}
                    style={{ background: '#3c3c3c', border: '1px solid #555', color: 'white', padding: '0.4rem 0.6rem', borderRadius: '6px', fontSize: '0.9rem', width: '220px', cursor: (voicesLoaded && settings.pronounceTranslation) ? 'pointer' : 'not-allowed', opacity: (voicesLoaded && settings.pronounceTranslation) ? 1 : 0.6 }}>
                    <option value="">-- Select a voice --</option>
                    {availableVoices.map((voice) => (<option key={voice.name} value={voice.name}>{voice.name} ({voice.lang})</option>))}
                  </select>
                </div>
                <div className="setting-item">
                  <label htmlFor="setting-translationRepeatTimes">Repeat translation Voice:</label>
                  <input id="setting-translationRepeatTimes" type="number" value={settings.translationRepeatTimes}
                    onChange={(e) => handleSettingChange('translationRepeatTimes', parseInt(e.target.value) || 1)}
                    min="1" max="5" step="1"
                    disabled={!settings.pronounceTranslation}
                    style={{ background: settings.pronounceTranslation ? '#3c3c3c' : '#2a2a2a', border: '1px solid #555', color: 'white', padding: '0.4rem 0.6rem', borderRadius: '6px', fontSize: '0.9rem', width: '80px', cursor: settings.pronounceTranslation ? 'pointer' : 'not-allowed', opacity: settings.pronounceTranslation ? 1 : 0.6 }} />
                  <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', color: '#aaa' }}>times</span>
                </div>
                <div className="setting-item">
                  <small style={{ color: voicesLoaded ? '#4caf50' : '#ff9800', fontSize: '0.8rem', fontWeight: 'bold' }}>
                    {voicesLoaded ? `✓ Current voice: ${settings.selectedVoiceName || "None selected"}` : '⚠️ Voices not loaded - Click "Load Voices" button'}
                  </small>
                </div>
                {!voiceSupport && (<div className="setting-item"><small style={{ color: '#f44336', fontSize: '0.8rem' }}>⚠️ Voice support not available</small></div>)}
              </div>

              <div className="settings-section">
                <h3>Display Options</h3>
                <div className="setting-item checkbox">
                  <label><input type="checkbox" checked={settings.showTranscription}
                    onChange={(e) => handleSettingChange('showTranscription', e.target.checked)} /> Show Transcription</label>
                </div>
                <div className="setting-item checkbox">
                  <label><input type="checkbox" checked={settings.showTranslation}
                    onChange={(e) => handleSettingChange('showTranslation', e.target.checked)} /> Show Translation</label>
                </div>
                <div className="setting-item checkbox">
                  <label><input type="checkbox" checked={settings.loadLessonLocally}
                    onChange={(e) => handleSettingChange('loadLessonLocally', e.target.checked)} /> Load lesson locally</label>
                </div>
                <div className="setting-item checkbox">
                  <label><input type="checkbox" checked={settings.invisibleTopBar}
                    onChange={(e) => handleSettingChange('invisibleTopBar', e.target.checked)} /> Invisible Top bar</label>
                </div>

                {displayInfo && (
                  <div
                    className="setting-item"
                    style={{
                      display: 'block',
                      fontFamily: 'monospace',
                      fontSize: '0.78rem',
                      lineHeight: 1.5,
                      color: '#aaa',
                      background: '#1f1f1f',
                      border: '1px solid #3c3c3c',
                      borderRadius: '8px',
                      padding: '0.6rem 0.8rem',
                      marginTop: '0.4rem',
                    }}
                  >
                    <div><strong style={{ color: '#e0e0e0' }}>CSS px — layout viewport</strong></div>
                    <div>
                      {displayInfo.viewportCssWidth} × {displayInfo.viewportCssHeight} px
                      {' '}(client: {displayInfo.viewportClientWidth} × {displayInfo.viewportClientHeight})
                    </div>

                    <div style={{ marginTop: '0.5rem' }}><strong style={{ color: '#e0e0e0' }}>Screen resolution</strong></div>
                    <div>
                      CSS: {displayInfo.screenCssWidth} × {displayInfo.screenCssHeight} px
                    </div>
                    <div>
                      Physical: {displayInfo.screenDeviceWidth} × {displayInfo.screenDeviceHeight} px
                      {' '}(DPR {displayInfo.devicePixelRatio})
                    </div>

                    <div style={{ marginTop: '0.5rem' }}><strong style={{ color: '#e0e0e0' }}>Screen orientation</strong></div>
                    <div>
                      {displayInfo.screenOrientationType || 'n/a'}
                      {displayInfo.screenOrientationAngle != null ? ` · ${displayInfo.screenOrientationAngle}°` : ''}
                    </div>

                    <div style={{ marginTop: '0.5rem' }}><strong style={{ color: '#e0e0e0' }}>Effective layout</strong></div>
                    <div>
                      auto align: {settings.autoAlign ? 'ON' : 'OFF'}
                      {' '}· orientation: {isLandscape ? 'landscape' : 'portrait'}
                    </div>
                    <div>
                      top bar (measured): {Math.round(effectiveTopBarHeight)}px
                      {' '}· top panel: {effectiveTopPanelWidth}px
                    </div>
                    <div>
                      card: {effectiveCardWidth}×{effectiveCardHeight}px
                      {' '}· gap between cards: {effectiveGap}px
                    </div>
                    {settings.autoAlign && (
                      <div>
                        gap top bar → cards: {topGap}px
                        {' '}· gap cards → bottom: {bottomGap}px
                        {' '}· side inset: {sideInset}px
                      </div>
                    )}
                    <div style={{ marginTop: '0.5rem' }}>
                      listening min: {LISTEN_MIN_MS} ms
                    </div>
                  </div>
                )}
              </div>

              <div className="settings-section">
                <h3>Alerts</h3>
                <div className="setting-item checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={settings.hideAlerts}
                      onChange={(e) => handleSettingChange('hideAlerts', e.target.checked)}
                    />
                    Hide alerts
                  </label>
                </div>
                <div className="setting-item">
                  <small style={{ color: '#aaa', fontSize: '0.7rem' }}>
                    When checked, informational popups are suppressed. Session results and errors are still shown.
                  </small>
                </div>
              </div>

              <div className="settings-section">
                <h3>Card Appearance</h3>
                <div className="setting-item checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={settings.autoAlign}
                      onChange={(e) => handleSettingChange('autoAlign', e.target.checked)}
                    />
                    Auto align elements
                  </label>
                </div>

                <div className="setting-item">
                  <label htmlFor="setting-cardGap">Gap between cards (px):</label>
                  <input id="setting-cardGap" type="number" value={settings.cardGap}
                    onChange={(e) => handleSettingChange('cardGap', parseInt(e.target.value) || 10)}
                    min="5" max="100" step="5" />
                </div>

                {!settings.autoAlign && (
                  <>
                    <div className="setting-item">
                      <label htmlFor="setting-topPanelWidth">Top panel width (px):</label>
                      <input id="setting-topPanelWidth" type="number" value={settings.topPanelWidth}
                        onChange={(e) => handleSettingChange('topPanelWidth', parseInt(e.target.value) || 916)}
                        min="300" max="2000" step="10" />
                    </div>
                    <div className="setting-item">
                      <label htmlFor="setting-cardWidth">Card Width (px):</label>
                      <input id="setting-cardWidth" type="number" value={settings.cardWidth}
                        onChange={(e) => handleSettingChange('cardWidth', parseInt(e.target.value) || 400)}
                        min="150" max="800" step="10" />
                    </div>
                    <div className="setting-item">
                      <label htmlFor="setting-cardHeight">Card Height (px):</label>
                      <input id="setting-cardHeight" type="number" value={settings.cardHeight}
                        onChange={(e) => handleSettingChange('cardHeight', parseInt(e.target.value) || 400)}
                        min="150" max="800" step="10" />
                    </div>
                  </>
                )}

                <div className="setting-item">
                  <label htmlFor="setting-fontSize">Font Size (px):</label>
                  <input id="setting-fontSize" type="number" value={settings.fontSize}
                    onChange={(e) => handleSettingChange('fontSize', parseInt(e.target.value) || 32)}
                    min="8" max="48" step="2" />
                </div>
                <div className="setting-item checkbox">
                  <label>
                    <input type="checkbox" checked={settings.showSvgBorder}
                      onChange={(e) => handleSettingChange('showSvgBorder', e.target.checked)} />
                    Show SVG canvas border
                  </label>
                </div>
              </div>
            </div>
            <div className="settings-footer">
              <button className="settings-open" onClick={handleOpenSettingsFile}>📂 Open Settings</button>
              <button className="settings-save" onClick={saveSettings}>Save Settings</button>
              <button className="settings-ok" onClick={applyAndClose}>Ok</button>
              <button className="settings-cancel" onClick={closeSettings}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {isLessonPickerOpen && (
        <div
          className="settings-overlay"
          onClick={() => { if (!isLoading) setIsLessonPickerOpen(false); }}
          role="presentation"
        >
          <div
            className="settings-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="lesson-picker-title"
          >
            <div className="settings-header">
              <h2 id="lesson-picker-title">📂 Choose a lesson</h2>
              <button
                className="settings-close"
                onClick={() => { if (!isLoading) setIsLessonPickerOpen(false); }}
                aria-label="Close lesson picker"
                title="Close"
                disabled={isLoading}
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>

            <div className="settings-content">
              {isLoadingLessonsList && (
                <div className="setting-item">
                  <small style={{ color: '#aaa', fontSize: '0.9rem' }}>Loading lessons…</small>
                </div>
              )}

              {!isLoadingLessonsList && lessonsListError && (
                <div className="setting-item">
                  <small style={{ color: '#f44336', fontSize: '0.85rem' }}>
                    ⚠️ Could not load lessons list: {lessonsListError}
                  </small>
                </div>
              )}

              {!isLoadingLessonsList && !lessonsListError && lessonsList.length === 0 && (
                <div className="setting-item">
                  <small style={{ color: '#aaa', fontSize: '0.9rem' }}>
                    No lessons available.
                  </small>
                </div>
              )}

              {!isLoadingLessonsList && lessonsList.map((lesson) => (
                <button
                  key={lesson.file}
                  type="button"
                  onClick={() => handlePickLesson(lesson.file)}
                  disabled={isLoading}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.7rem 0.9rem',
                    marginBottom: '0.5rem',
                    background: '#3c3c3c',
                    border: '1px solid #555',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '0.95rem',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    opacity: isLoading ? 0.6 : 1,
                    transition: 'background 0.2s ease, border-color 0.2s ease, transform 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoading) {
                      e.currentTarget.style.background = '#4a4a4a';
                      e.currentTarget.style.borderColor = '#0078d4';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#3c3c3c';
                    e.currentTarget.style.borderColor = '#555';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{ fontWeight: 600 }}>
                    {lesson.title || lesson.file}
                  </div>
                  {lesson.title && lesson.file !== lesson.title && (
                    <div style={{ fontSize: '0.75rem', color: '#aaa', marginTop: 2 }}>
                      {lesson.file}
                    </div>
                  )}
                </button>
              ))}
            </div>

            <div className="settings-footer">
              <button
                className="settings-cancel"
                onClick={() => { if (!isLoading) setIsLessonPickerOpen(false); }}
                disabled={isLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <input
        type="file"
        ref={settingsFileInputRef}
        accept=".settings,.json"
        style={{ display: 'none' }}
        aria-hidden="true"
        tabIndex={-1}
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            loadSettingsFromFile(e.target.files[0]);
            e.target.value = '';
          }
        }}
      />
    </div>
  );
};

export default App;