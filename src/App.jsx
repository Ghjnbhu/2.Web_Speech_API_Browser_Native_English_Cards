// App.jsx - FIXED: React 19 StrictMode guard for voice loading
// App.jsx - SVG XSS via innerHTML and show fixed code
// App.jsx - loadSettingsFromFile accepts any value for allowed keys
// App.jsx - renderSvgToContainer regex is fragile
// App.jsx - No role / aria attributes
// App.jsx - Fix #20 Revision: Allow Internal <use> References


// App.jsx - FIXED: #1 StrictMode + #20 SVG XSS + #21 Settings validation + #18 Robust SVG class rewriting
// App.jsx - FIXED: #1 StrictMode + #18 SVG class rewriting + #20 SVG XSS + #21 Settings validation + #17 ARIA
// App.jsx - FIXED: #1 StrictMode + #17 ARIA + #18 SVG class rewriting + #20 (revised) SVG XSS + #21 Settings validation

// App.jsx - FIXED: #1 StrictMode + #17 ARIA + #18 SVG classes + #20 SVG XSS + #21 Settings + #22 Repeat-after-me
// App.jsx - FIXED: #1 StrictMode + #17 ARIA + #18 SVG classes + #20 SVG XSS + #21 Settings + #22 Repeat-after-me (per-repeat listening)

// App.jsx - FIXED: #1 StrictMode + #17 ARIA + #18 SVG classes + #20 SVG XSS + #21 Settings + #22 Repeat-after-me

// App.jsx - FIXED: repeat-after-me status moved into header DB pill (no layout shift)

// App.jsx - FIXED: renamed import to avoid collision with window.SpeechRecognition
// App.jsx - FIXED: auto-pronounce now speaks translation; repeat-after-me stays word-only
// import React, { useState, useEffect, useRef, useCallback } from 'react';
// import SpeechRecognitionLib, { useSpeechRecognition } from 'react-speech-recognition';
// import './App.css';

// App.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import SpeechRecognitionLib, { useSpeechRecognition } from 'react-speech-recognition';
import './App.css';

// =============================================================
// Utility: normalize text for comparison
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

// =============================================================
// Component
// =============================================================

const App = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [dbLoaded, setDbLoaded] = useState(false);
  const [dbFileName, setDbFileName] = useState("");
  const [currentRecord, setCurrentRecord] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [allRecords, setAllRecords] = useState([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
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

  const [settings, setSettings] = useState({
    cardWidth: 400,
    cardHeight: 400,
    cardGap: 50,
    showTranscription: true,
    showTranslation: true,
    fontSize: 32,
    showSvgBorder: false,
    theme: 'dark',
    studyTime: 10,
    selectedVoiceName: "",
    repeatTimes: 3,
    autoPronounce: true,
    pronounceTranslation: false,
    translationVoiceName: "",
    translationRepeatTimes: 1,
    randomOrder: false,
    repeatAfterMe: false,
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
  const activeCardForSpeechRef = useRef('singular');
  const currentIndexForSpeechRef = useRef(0);
  const isRandomSessionForSpeechRef = useRef(false);
  const studyIndexForSpeechRef = useRef(0);
  const shuffledRecordsForSpeechRef = useRef([]);
  const settingsForSpeechRef = useRef(settings);

  // ✅ NEW: always-current voices ref
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

  const expectingUserSpeechRef = useRef(false);
  const expectedWordRef = useRef('');
  const currentRepeatIndexRef = useRef(0);
  const totalRepeatsRef = useRef(1);
  const currentWordRef = useRef('');
  const currentCardTypeRef = useRef('singular');
  const currentCardIndexRef = useRef(0);

  const speakTextRef = useRef(null);
  const startRepeatListeningRef = useRef(null);

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  useEffect(() => { currentRecordRef.current = currentRecord; }, [currentRecord]);
  useEffect(() => { activeCardForSpeechRef.current = activeCard; }, [activeCard]);
  useEffect(() => { currentIndexForSpeechRef.current = currentIndex; }, [currentIndex]);
  useEffect(() => {
    isRandomSessionForSpeechRef.current = isRandomSessionRef.current;
    studyIndexForSpeechRef.current = studyIndexRef.current;
    shuffledRecordsForSpeechRef.current = shuffledRecordsRef.current;
  });
  useEffect(() => { settingsForSpeechRef.current = settings; }, [settings]);

  // ✅ NEW: keep voices ref in sync
  useEffect(() => { availableVoicesRef.current = availableVoices; }, [availableVoices]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);
  useEffect(() => { activeCardRef.current = activeCard; }, [activeCard]);
  useEffect(() => { allRecordsRef.current = allRecords; }, [allRecords]);
  useEffect(() => { isStudyingRef.current = isStudying; }, [isStudying]);
  useEffect(() => { settingsRef.current = settings; }, [settings]);
  useEffect(() => { timeRemainingRef.current = timeRemaining; }, [timeRemaining]);

  const isSpeechSupported = () => {
    return typeof window !== 'undefined' && window.speechSynthesis !== undefined;
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
    try { SpeechRecognitionLib.stopListening(); } catch (err) { /* ignore */ }
    try { SpeechRecognitionLib.abortListening(); } catch (err) { /* ignore */ }
    resetTranscript();
  }, [resetTranscript]);

  const loadVoices = () => {
    if (!isSpeechSupported()) {
      setVoiceSupport(false);
      return;
    }
    setIsLoadingVoices(true);

    const loadWebVoices = () => {
      if (!mountedRef.current) return true;
      const voices = synthRef.current ? synthRef.current.getVoices() : [];
      if (voices && voices.length > 0) {
        setAvailableVoices(voices);
        setVoicesLoaded(true);
        setVoiceSupport(true);
        setIsLoadingVoices(false);
        if (!settings.selectedVoiceName && voices.length > 0) {
          const defaultVoice = voices.find(voice =>
            voice.lang === 'en-US' && voice.name.includes('Google')
          ) || voices.find(voice => voice.lang === 'en-US') || voices[0];
          if (defaultVoice) {
            setSettings(prev => ({ ...prev, selectedVoiceName: defaultVoice.name }));
            cachedVoiceRef.current = defaultVoice;
          }
        }
        alert(`✅ ${voices.length} voice(s) loaded successfully!`);
        return true;
      }
      return false;
    };

    if (loadWebVoices()) return;

    const handleVoicesChanged = () => {
      if (!mountedRef.current) return;
      const voices = synthRef.current ? synthRef.current.getVoices() : [];
      if (voices && voices.length > 0) {
        setAvailableVoices(voices);
        setVoicesLoaded(true);
        setVoiceSupport(true);
        setIsLoadingVoices(false);
        if (!settings.selectedVoiceName && voices.length > 0) {
          const defaultVoice = voices.find(voice =>
            voice.lang === 'en-US' && voice.name.includes('Google')
          ) || voices.find(voice => voice.lang === 'en-US') || voices[0];
          if (defaultVoice) {
            setSettings(prev => ({ ...prev, selectedVoiceName: defaultVoice.name }));
            cachedVoiceRef.current = defaultVoice;
          }
        }
        alert(`✅ ${voices.length} voice(s) loaded successfully!`);
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

  // =============================================================
  // getCurrentVoice — reads from availableVoicesRef (never stale)
  // =============================================================
  const getCurrentVoice = (voiceName = null) => {
    if (!isSpeechSupported()) return null;
    const targetVoiceName = voiceName || userSelectedVoiceNameRef.current || settings.selectedVoiceName;
    if (!targetVoiceName) return null;

    const voices = availableVoicesRef.current;

    if (cachedVoiceRef.current && cachedVoiceRef.current.name === targetVoiceName) {
      return cachedVoiceRef.current;
    }

    // Exact match
    let voice = voices.find(v => v.name === targetVoiceName);

    // Loose match — normalizes dash/space/case
    if (!voice) {
      const target = normalizeVoiceName(targetVoiceName);
      voice = voices.find(v => normalizeVoiceName(v.name) === target);
      if (voice) {
        console.warn('[getCurrentVoice] loose match used for:', targetVoiceName);
      }
    }

    if (voice) cachedVoiceRef.current = voice;

    if (!voice) {
      console.warn('[getCurrentVoice] MISS', {
        targetVoiceName,
        totalVoices: voices.length,
      });
    }

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

  const speakText = (
    text,
    onComplete = null,
    voiceNameOverride = null,
    repeatCountOverride = null,
    onEachUtteranceEnd = null,
  ) => {
    if (!text) {
      if (onComplete) onComplete();
      return;
    }
    if (!isSpeechSupported() || !synthRef.current) {
      if (onComplete) onComplete();
      return;
    }

    const myGeneration = ++speechGenerationRef.current;
    const isStale = () => myGeneration !== speechGenerationRef.current;

    try { synthRef.current.cancel(); } catch (err) { }

    const currentVoice = getCurrentVoice(voiceNameOverride);
    if (!currentVoice) {
      if (onComplete) onComplete();
      return;
    }

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
          if (handled === true) {
            setIsSpeaking(false);
            return;
          }
        }

        setTimeout(() => {
          if (isStale()) return;
          speakNext();
        }, 800);
      };

      utterance.onerror = (event) => {
        if (isStale()) return;
        if (event.error === 'not-allowed' || event.error === 'interrupted') {
          setTimeout(() => {
            if (isStale()) return;
            currentRepeatIndex++;
            setTimeout(() => {
              if (isStale()) return;
              speakNext();
            }, 500);
          }, 200);
        } else if (event.error === 'canceled') {
          // superseded
        } else {
          setIsSpeaking(false);
          if (onComplete) onComplete();
        }
      };

      try {
        synthRef.current.speak(utterance);
      } catch (err) {
        if (isStale()) return;
        setIsSpeaking(false);
        if (onComplete) onComplete();
      }
    };

    setTimeout(() => {
      if (isStale()) return;
      speakNext();
    }, 100);
  };

  useEffect(() => {
    speakTextRef.current = speakText;
  });

  const startRepeatListening = useCallback((expectedWord) => {
    if (typeof SpeechRecognitionLib?.startListening !== 'function') {
      console.error(
        '[Repeat] SpeechRecognitionLib.startListening is not available. ' +
        'Check for a name collision with window.SpeechRecognition, or a broken library import.'
      );
      setRepeatStatus('error');
      return;
    }

    if (!browserSupportsSpeechRecognition) {
      setRepeatStatus('error');
      return;
    }

    expectedWordRef.current = expectedWord;
    expectingUserSpeechRef.current = true;
    setIsListeningForRepeat(true);
    setRepeatStatus('listening');
    setRepeatProgress({
      current: currentRepeatIndexRef.current + 1,
      total: totalRepeatsRef.current,
    });
    resetTranscript();
    try {
      SpeechRecognitionLib.startListening({
        continuous: false,
        interimResults: true,
        language: 'en-US',
      });
    } catch (err) {
      console.error('SpeechRecognition start failed:', err);
      setRepeatStatus('error');
    }
  }, [browserSupportsSpeechRecognition, resetTranscript]);

  useEffect(() => {
    startRepeatListeningRef.current = startRepeatListening;
  });

  const speakOneAndListen = useCallback((word, attemptIndex, totalAttempts) => {
    if (!isStudyingRef.current) return;

    currentRepeatIndexRef.current = attemptIndex;
    totalRepeatsRef.current = totalAttempts;

    speakTextRef.current(
      word,
      null,
      null,
      1,
      () => {
        if (!isStudyingRef.current) return true;
        setTimeout(() => {
          if (!isStudyingRef.current) return;
          startRepeatListeningRef.current(word);
        }, 400);
        return true;
      }
    );
  }, []);

  const getWordForRecord = (record, cardType) => {
    if (!record) return '';
    if (cardType === 'singular') return record.singular?.word || '';
    return record.plural?.word || '';
  };

  const getTranslationForRecord = (record, cardType) => {
    if (!record) return '';
    if (cardType === 'singular') return record.singular?.translation || '';
    return record.plural?.translation || '';
  };

  // =============================================================
  // pronounceAndMaybeListen — reads from state, not refs
  //   • repeat-after-me: word only
  //   • auto-pronounce: word → translation (with voice fallback)
  // =============================================================
  const pronounceAndMaybeListen = useCallback((cardType, index, record) => {
    if (!settings.autoPronounce) return;
    if (!isStudyingRef.current) return;

    const word = getWordForRecord(record, cardType);
    if (!word || word.trim() === '') {
      setTimeout(() => moveToNextCardInStudy(), 300);
      return;
    }

    const key = `${index}_${cardType}`;
    if (lastSpokenRef.current === key) return;
    lastSpokenRef.current = key;

    currentCardTypeRef.current = cardType;
    currentCardIndexRef.current = index;
    currentWordRef.current = word;

    const repeatAfterMe = settings.repeatAfterMe;
    const pronounceTranslation = settings.pronounceTranslation;
    const translationRepeatTimes = Math.max(1, settings.translationRepeatTimes || 1);
    const rawTranslationVoiceName = settings.translationVoiceName;
    const selectedVoiceName = settings.selectedVoiceName;
    const totalRepeats = Math.max(1, settings.repeatTimes || 1);

    // Fallback: if no translation voice set, use the primary selected voice
    const effectiveTranslationVoiceName =
      (rawTranslationVoiceName && rawTranslationVoiceName.trim() !== '')
        ? rawTranslationVoiceName
        : (selectedVoiceName || null);

    totalRepeatsRef.current = totalRepeats;

    // ── Repeat-after-me: word only ──────────────────────────────
    if (repeatAfterMe) {
      speakOneAndListen(word, 0, totalRepeats);
      return;
    }

    // ── Auto-pronounce: word → translation ──────────────────────
    const translation = getTranslationForRecord(record, cardType);
    const hasTranslation = translation && translation.trim() !== '';

    if (pronounceTranslation && hasTranslation) {
      speakTextRef.current(word, () => {
        if (!isStudyingRef.current) return;
        setTimeout(() => {
          if (!isStudyingRef.current) return;
          const translationVoice = getCurrentVoice(effectiveTranslationVoiceName);
          if (translationVoice) {
            speakTextRef.current(
              translation,
              () => {
                if (!isStudyingRef.current) return;
                setTimeout(() => moveToNextCardInStudy(), 300);
              },
              effectiveTranslationVoiceName,
              translationRepeatTimes
            );
          } else {
            console.warn('[PM] translation voice unresolved, advancing without translation');
            setTimeout(() => moveToNextCardInStudy(), 300);
          }
        }, 400);
      });
    } else {
      speakTextRef.current(word, () => {
        if (!isStudyingRef.current) return;
        setTimeout(() => moveToNextCardInStudy(), 300);
      });
    }
  }, [speakOneAndListen, settings, availableVoices]);

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
          pronounceAndMaybeListen('plural', currentIdx, record);
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
            pronounceAndMaybeListen('singular', nextIdx, record);
          }, 200);
        }, 100);
      } else {
        setCardPulsing('plural', false);
        resetStudyState(true);
      }
    }
  };

  const resetStudyState = (showCompletionAlert = false) => {
    if (isCompletingRef.current) return;
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    cancelAllSpeech();
    stopRepeatListening();

    setIsStudying(false);
    setTimeRemaining(0);
    timeRemainingRef.current = 0;
    lastSpokenRef.current = '';
    currentRepeatIndexRef.current = 0;
    totalRepeatsRef.current = 1;
    currentWordRef.current = '';

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
      alert('🎉 Study session completed! Well done!');
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
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    studyStartIndexRef.current = currentIndex;
    studyStartRecordRef.current = currentRecord;

    cancelAllSpeech();
    stopRepeatListening();
    setTimeRemaining(0);
    timeRemainingRef.current = 0;
    lastSpokenRef.current = '';
    currentRepeatIndexRef.current = 0;

    completionAlertShownRef.current = false;
    isCompletingRef.current = false;

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
      const records = allRecords;
      firstIndex = currentIndex;
      firstRecord = records[currentIndex];
    }

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
          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
          }
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
              if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
                timerIntervalRef.current = null;
              }
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
        pronounceAndMaybeListen('singular', firstIndex, firstRecord);
      }, 500);
    }
  };

  const stopStudyTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
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

  useEffect(() => {
    if (!isListeningForRepeat) return;
    if (!transcript || transcript.trim() === '') return;

    const handle = setTimeout(() => {
      const expected = expectedWordRef.current;
      const spoken = transcript;
      const ratio = similarityRatio(expected, spoken);
      const attemptIndex = currentRepeatIndexRef.current;
      const totalAttempts = totalRepeatsRef.current;

      if (ratio >= 0.7) {
        setIsListeningForRepeat(false);
        expectingUserSpeechRef.current = false;
        try { SpeechRecognitionLib.stopListening(); } catch (err) { }
        resetTranscript();

        const isLastAttempt = attemptIndex + 1 >= totalAttempts;
        setRepeatStatus('matched');
        setRepeatProgress({ current: attemptIndex + 1, total: totalAttempts });

        if (isLastAttempt) {
          setTimeout(() => {
            setRepeatStatus('');
            setRepeatProgress({ current: 0, total: 0 });
            if (!isStudyingRef.current) return;
            moveToNextCardInStudy();
          }, 700);
        } else {
          setTimeout(() => {
            if (!isStudyingRef.current) return;
            speakOneAndListen(expected, attemptIndex + 1, totalAttempts);
          }, 500);
        }
      } else {
        setIsListeningForRepeat(false);
        expectingUserSpeechRef.current = false;
        try { SpeechRecognitionLib.stopListening(); } catch (err) { }
        resetTranscript();
        setRepeatStatus('retry');
        setRepeatProgress({ current: attemptIndex + 1, total: totalAttempts });

        setTimeout(() => {
          if (!isStudyingRef.current) return;
          speakOneAndListen(expected, attemptIndex, totalAttempts);
        }, 700);
      }
    }, 800);

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
          if (!isStudyingRef.current) return;
          speakOneAndListen(word, attemptIndex, totalAttempts);
        }, 600);
      }, 1500);
      return () => clearTimeout(handle);
    }
  }, [listening, isListeningForRepeat, speakOneAndListen]);

  const handleMenuClick = () => setIsMenuOpen(!isMenuOpen);
  const openSettings = () => { setIsMenuOpen(false); setIsSettingsOpen(true); };
  const closeSettings = () => setIsSettingsOpen(false);

  const toggleTheme = () => {
    const newTheme = settings.theme === 'dark' ? 'light' : 'dark';
    handleSettingChange('theme', newTheme);
    applyThemeToDOM(newTheme);
  };

  const applyThemeToDOM = (theme) => {
    document.body.classList.remove('light', 'dark');
    document.body.classList.add(theme);

    if (theme === 'light') {
      document.body.style.background = '#f5f5f5';
      document.querySelectorAll('.card').forEach(card => {
        card.style.background = '#ffffff';
        card.style.color = '#333';
        card.style.border = '1px solid #e0e0e0';
        card.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
      });
      document.querySelectorAll('.english-word, .transcription, .translation').forEach(el => {
        el.style.color = '#333';
      });
    } else {
      document.body.style.background = '#000';
      document.querySelectorAll('.card').forEach(card => {
        card.style.background = '#4f4949';
        card.style.color = '#fff';
        card.style.border = 'none';
        card.style.boxShadow = '0 2px 6px rgba(0,0,0,0.06)';
      });
      document.querySelectorAll('.english-word, .transcription, .translation').forEach(el => {
        el.style.color = '#fff';
      });
    }
  };

  const applyVisualSettings = () => {
    const cards = document.querySelectorAll('.cards-row .card');
    cards.forEach(card => {
      card.style.width = `${settings.cardWidth}px`;
      card.style.height = `${settings.cardHeight}px`;
    });
    const cardsRow = document.querySelector('.cards-row');
    if (cardsRow) cardsRow.style.gap = `${settings.cardGap}px`;
    const englishWords = document.querySelectorAll('.english-word');
    englishWords.forEach(word => word.style.fontSize = `${settings.fontSize}px`);

    const transcriptions = document.querySelectorAll('.transcription');
    transcriptions.forEach(trans => trans.style.display = settings.showTranscription ? 'block' : 'none');

    const translations = document.querySelectorAll('.translation');
    translations.forEach(trans => trans.style.display = settings.showTranslation ? 'block' : 'none');

    const svgWrappers = document.querySelectorAll('.svg-wrapper');
    svgWrappers.forEach(wrapper => {
      if (settings.showSvgBorder) {
        wrapper.classList.add('svg-bordered');
      } else {
        wrapper.classList.remove('svg-bordered');
      }
    });

    applyThemeToDOM(settings.theme);
  };

  const handleOpenSettingsFile = () => {
    if (settingsFileInputRef.current) {
      settingsFileInputRef.current.click();
    }
  };

  const SETTINGS_SCHEMA = {
    cardWidth: { type: 'number', min: 200, max: 800, default: 400 },
    cardHeight: { type: 'number', min: 200, max: 800, default: 400 },
    cardGap: { type: 'number', min: 5, max: 100, default: 50 },
    fontSize: { type: 'number', min: 8, max: 48, default: 32 },
    showSvgBorder: { type: 'boolean', default: false },
    showTranscription: { type: 'boolean', default: true },
    showTranslation: { type: 'boolean', default: true },
    theme: { type: 'enum', values: ['dark', 'light'], default: 'dark' },
    studyTime: { type: 'number', min: 3, max: 60, default: 10 },
    selectedVoiceName: { type: 'string', maxLength: 200, default: '' },
    repeatTimes: { type: 'number', min: 1, max: 5, default: 3 },
    autoPronounce: { type: 'boolean', default: true },
    pronounceTranslation: { type: 'boolean', default: true },
    translationVoiceName: { type: 'string', maxLength: 200, default: '' },
    translationRepeatTimes: { type: 'number', min: 1, max: 5, default: 1 },
    randomOrder: { type: 'boolean', default: true },
    repeatAfterMe: { type: 'boolean', default: false },
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
        valid[key] = n;
        return;
      }
      if (rule.type === 'boolean') {
        if (typeof value !== 'boolean') { rejected.push(`${key} (not a boolean)`); return; }
        valid[key] = value;
        return;
      }
      if (rule.type === 'string') {
        if (typeof value !== 'string') { rejected.push(`${key} (not a string)`); return; }
        if (rule.maxLength && value.length > rule.maxLength) {
          rejected.push(`${key} (too long: ${value.length} chars)`);
          return;
        }
        valid[key] = value;
        return;
      }
      if (rule.type === 'enum') {
        if (!rule.values.includes(value)) {
          rejected.push(`${key} (invalid value: "${value}", allowed: ${rule.values.join(', ')})`);
          return;
        }
        valid[key] = value;
        return;
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

        if (rejected.length > 0) {
          console.warn('[Settings] Rejected invalid fields:', rejected);
        }

        setSettings(newSettings);

        setTimeout(() => {
          applyVisualSettings();
          userSelectedVoiceNameRef.current = newSettings.selectedVoiceName || "";
          cachedVoiceRef.current = null;
        }, 0);

        if (rejected.length > 0) {
          alert(
            `⚠️ Settings loaded with warnings\n\n` +
            `${rejected.length} field(s) were rejected and reverted to defaults:\n\n` +
            rejected.map((r) => `• ${r}`).join('\n')
          );
        } else {
          alert('✅ Settings loaded successfully!');
        }
      } catch (err) {
        alert('❌ Failed to parse settings file.');
      }
    };
    reader.readAsText(file);
  };

  const applyAndClose = () => {
    applyVisualSettings();
    if (isStudying) {
      stopStudyTimer();
      setTimeout(() => startStudyTimer(), 100);
    }
    closeSettings();
  };

  const saveSettings = async () => {
    applyVisualSettings();
    if (isStudying) {
      stopStudyTimer();
      setTimeout(() => startStudyTimer(), 100);
    }

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
        alert('Settings saved successfully!');
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
    alert('Settings saved successfully!');
    closeSettings();
  };

  const handleSettingChange = (key, value) => setSettings(prev => ({ ...prev, [key]: value }));

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

    if (isStudying) {
      stopStudyTimer();
    } else {
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
        startStudyTimer();
        let modeMsg = '';
        if (settings.repeatAfterMe) {
          modeMsg = `🎤 Repeat-after-me mode:\n• Word is pronounced ${settings.repeatTimes} time(s)\n• After EACH pronunciation the mic listens\n• If each attempt matches, the study advances\n• If not, the same attempt repeats\n• (Translation pronunciation is not used in this mode)${settings.randomOrder ? '\n\n🔀 Random order enabled.' : ''}`;
        } else if (settings.autoPronounce && settings.selectedVoiceName) {
          modeMsg = `🔊 Auto-pronunciation mode: Each card will be pronounced and auto-advance\n${settings.pronounceTranslation ? '🌐 Translation will also be pronounced\n' : ''}⏱️ No timer - progress after pronunciation completes${settings.randomOrder ? '\n\n🔀 Random order enabled.' : ''}`;
        } else {
          modeMsg = `⏱️ Timer mode: ${settings.studyTime} seconds per card\n🔇 Auto-pronunciation disabled${settings.randomOrder ? '\n\n🔀 Random order enabled.' : ''}`;
        }
        alert(`📖 Study session started!\n\n${modeMsg}`);
      }
    }
  };

  const DANGEROUS_SVG_TAGS = [
    'script', 'foreignObject', 'iframe', 'object', 'embed',
    'audio', 'video', 'source', 'track', 'image',
    'animate', 'set', 'handler', 'listener',
  ];
  const DANGEROUS_ATTR_PREFIXES = ['on'];
  const DANGEROUS_ATTR_NAMES = ['src', 'data', 'formaction', 'action'];

  const isSafeInternalReference = (value) => /^#[A-Za-z_][\w:.-]*$/.test(value.trim());

  const sanitizeSvgString = (rawSvg) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(rawSvg, 'image/svg+xml');

    const parseError = doc.querySelector('parsererror');
    if (parseError) return null;

    const svgEl = doc.documentElement;
    if (!svgEl || svgEl.tagName.toLowerCase() !== 'svg') return null;

    DANGEROUS_SVG_TAGS.forEach((tag) => {
      doc.querySelectorAll(tag).forEach((el) => el.remove());
    });

    doc.querySelectorAll('use').forEach((useEl) => {
      const href = useEl.getAttribute('href') || useEl.getAttribute('xlink:href') || '';
      if (!isSafeInternalReference(href)) useEl.remove();
    });

    const allEls = [svgEl, ...doc.querySelectorAll('*')];
    allEls.forEach((el) => {
      const attrsToRemove = [];
      const tagName = el.tagName.toLowerCase();

      Array.from(el.attributes).forEach((attr) => {
        const name = attr.name.toLowerCase();
        const value = (attr.value || '').trim();

        if (DANGEROUS_ATTR_PREFIXES.some((p) => name.startsWith(p))) {
          attrsToRemove.push(attr.name);
          return;
        }
        if (name === 'href' || name === 'xlink:href') {
          if (tagName === 'use') return;
          if (!isSafeInternalReference(value)) attrsToRemove.push(attr.name);
          return;
        }
        if (DANGEROUS_ATTR_NAMES.includes(name)) {
          if (/^\s*(javascript|data|vbscript):/i.test(value)) attrsToRemove.push(attr.name);
          return;
        }
        if (name === 'style' && /url\s*\(\s*['"]?\s*javascript:/i.test(value)) {
          attrsToRemove.push(attr.name);
        }
      });

      attrsToRemove.forEach((a) => el.removeAttribute(a));
    });

    doc.querySelectorAll('style').forEach((styleEl) => {
      const css = styleEl.textContent || '';
      styleEl.textContent = css.replace(/@import[^;]+;/gi, '');
    });

    return svgEl;
  };

  const CLASS_TOKEN_REGEX = /^st\d+$/;
  const rewriteStyleContent = (cssText, scopeId) =>
    cssText.replace(/\.st(\d+)(?![A-Za-z0-9_-])/g, `.${scopeId}-st$1`);
  const rewriteClassAttribute = (classValue, scopeId) =>
    classValue
      .split(/\s+/)
      .filter(Boolean)
      .map((token) => (CLASS_TOKEN_REGEX.test(token) ? `${scopeId}-${token}` : token))
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

  const loadDatabaseFromFile = async () => {
    if (isStudying) stopStudyTimer();
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
        let records = [];
        if (importedData.records && Array.isArray(importedData.records)) records = importedData.records;
        else if (Array.isArray(importedData)) records = importedData;
        else throw new Error("Invalid database file format");

        if (records.length === 0) throw new Error("Database file contains no records");

        const convertedRecords = records.map((record, idx) => {
          let cardData;
          if (record.card1 && record.card2) {
            cardData = {
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
          } else if (record.singular && record.plural) {
            cardData = {
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
          } else {
            cardData = {
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
          }
          return cardData;
        });
        setAllRecords(convertedRecords);
        setCurrentIndex(0);
        setCurrentRecord(convertedRecords[0]);
        setActiveCard('singular');
        setDbLoaded(true);
        setDbFileName(importedData.name || file.name.replace(/\.(json|dbms)$/, ''));
        alert(`✅ Database loaded successfully!\n\nFile: ${file.name}\nRecords: ${records.length}`);
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
  };

  const nextRecord = () => {
    if (allRecords.length > 0 && currentIndex < allRecords.length - 1 && !isStudying) {
      cancelAllSpeech();
      clearManualPulse();
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      setCurrentRecord(allRecords[newIndex]);
      setActiveCard('singular');
    }
  };

  const prevRecord = () => {
    if (allRecords.length > 0 && currentIndex > 0 && !isStudying) {
      cancelAllSpeech();
      clearManualPulse();
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      setCurrentRecord(allRecords[newIndex]);
      setActiveCard('singular');
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

  const handleCardClick = (cardType) => {
    if (isStudying) return;
    if (!dbLoaded || !currentRecord) return;
    if (!voiceSupport) return;

    const currentVoice = getCurrentVoice();
    if (!currentVoice) return;

    let word = '';
    let translation = '';
    if (cardType === 'singular') {
      word = currentRecord.singular?.word || '';
      translation = currentRecord.singular?.translation || '';
    } else {
      word = currentRecord.plural?.word || '';
      translation = currentRecord.plural?.translation || '';
    }
    if (!word || word.trim() === '') return;

    clearManualPulse();
    setCardPulsing(cardType, true);
    setManualPulseCard(cardType);

    const finishPronunciation = () => clearManualPulse();

    if (settings.pronounceTranslation && translation && translation.trim() !== '') {
      speakText(word, () => {
        const translationVoice = getCurrentVoice(settings.translationVoiceName);
        if (translationVoice) {
          speakText(translation, finishPronunciation, settings.translationVoiceName, settings.translationRepeatTimes);
        } else {
          finishPronunciation();
        }
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
    if (settings.repeatAfterMe) return '🎤 Repeat';
    return '🚀 Start';
  };

  const startButtonAriaLabel = () => {
    if (isStudying) return 'Stop study session';
    if (settings.repeatAfterMe) return 'Start repeat-after-me study session';
    return 'Start study session';
  };

  return (
    <div className="app">
      <div className="top-bar-wrapper">
        <div className="top-bar" role="banner">
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
                onClick={handleMenuClick}
                aria-label="Open main menu"
                aria-haspopup="true"
                aria-expanded={isMenuOpen}
              >
                Menu
              </button>
            )}
          </div>

          {dbLoaded && currentRecord && (
            <div
              className={`header-db-info ${settings.repeatAfterMe && isStudying ? `repeat-mode repeat-${repeatStatus || 'idle'}` : ''}`}
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              <span className="db-info-label" aria-hidden="true">📁</span>
              <span className="db-info-name">{dbFileName}</span>
              <span className="db-info-separator" aria-hidden="true">|</span>
              <span className="db-info-id">ID: {currentRecord.id}</span>

              {isSpeaking && (
                <>
                  <span className="db-info-separator" aria-hidden="true">|</span>
                  <span
                    className="db-info-timer"
                    role="status"
                    aria-live="polite"
                    aria-label="Currently speaking"
                    title="Speaking"
                  >
                    <span aria-hidden="true">🔊</span>
                  </span>
                </>
              )}

              {isListeningForRepeat && !(settings.repeatAfterMe && isStudying) && (
                <>
                  <span className="db-info-separator" aria-hidden="true">|</span>
                  <span
                    className="db-info-timer"
                    role="status"
                    aria-live="polite"
                    aria-label="Listening for your voice"
                    title="Listening"
                  >
                    <span aria-hidden="true">🎤</span>
                  </span>
                </>
              )}

              {settings.repeatAfterMe && isStudying && (
                <>
                  <span className="db-info-separator" aria-hidden="true">|</span>
                  <span className="db-info-repeat" aria-live="polite">
                    {repeatStatus === 'listening' && (
                      <>
                        <span aria-hidden="true">🎤</span>
                        <span>Listening ({repeatProgress.current}/{repeatProgress.total})…</span>
                      </>
                    )}
                    {repeatStatus === 'matched' && (
                      <>
                        <span aria-hidden="true">✅</span>
                        <span>Matched ({repeatProgress.current}/{repeatProgress.total})</span>
                      </>
                    )}
                    {repeatStatus === 'retry' && (
                      <>
                        <span aria-hidden="true">🔁</span>
                        <span>Retry ({repeatProgress.current}/{repeatProgress.total})</span>
                      </>
                    )}
                    {repeatStatus === 'error' && (
                      <>
                        <span aria-hidden="true">⚠️</span>
                        <span>Speech error</span>
                      </>
                    )}
                    {!repeatStatus && (
                      <>
                        <span aria-hidden="true">🎧</span>
                        <span>Repeat mode</span>
                      </>
                    )}
                  </span>
                </>
              )}
            </div>
          )}

          <div className="header-buttons">
            {dbLoaded && allRecords.length > 0 && (
              <>
                <button
                  onClick={prevRecord}
                  className={`nav-button ${isStudying ? 'hidden-but-reserved' : ''}`}
                  style={{ background: '#0078d4', padding: '6px 12px' }}
                  disabled={isStudying}
                  aria-label="Previous card"
                  title="Previous card"
                >
                  <span aria-hidden="true">◀</span>
                </button>
                <button
                  onClick={nextRecord}
                  className={`nav-button ${isStudying ? 'hidden-but-reserved' : ''}`}
                  style={{ background: '#0078d4', padding: '6px 12px' }}
                  disabled={isStudying}
                  aria-label="Next card"
                  title="Next card"
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

            <button
              className={`load-db-button ${isStudying ? 'hidden-but-reserved' : ''}`}
              onClick={loadDatabaseFromFile}
              disabled={isLoading || isStudying}
              aria-busy={isLoading}
              aria-label={isLoading ? 'Loading database' : 'Load database file'}
            >
              {isLoading ? (
                'Loading...'
              ) : (
                <>
                  <span aria-hidden="true">📂 </span>
                  Load DB
                </>
              )}
            </button>
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
              <div className="svg-wrapper" ref={singularSvgRef} aria-hidden="true"></div>
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
              <div className="svg-wrapper" ref={pluralSvgRef} aria-hidden="true"></div>
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
              <h2 id="settings-title">⚙️ Settings</h2>
              <button className="settings-close" onClick={closeSettings} aria-label="Close settings" title="Close settings">
                <span aria-hidden="true">×</span>
              </button>
            </div>
            <div className="settings-content">
              <div className="settings-section">
                <h3>Card Appearance</h3>
                <div className="setting-item">
                  <label htmlFor="setting-cardWidth">Card Width (px):</label>
                  <input id="setting-cardWidth" type="number" value={settings.cardWidth}
                    onChange={(e) => handleSettingChange('cardWidth', parseInt(e.target.value) || 400)}
                    min="300" max="600" step="10" />
                </div>
                <div className="setting-item">
                  <label htmlFor="setting-cardHeight">Card Height (px):</label>
                  <input id="setting-cardHeight" type="number" value={settings.cardHeight}
                    onChange={(e) => handleSettingChange('cardHeight', parseInt(e.target.value) || 400)}
                    min="300" max="600" step="10" />
                </div>
                <div className="setting-item">
                  <label htmlFor="setting-cardGap">Gap between cards (px):</label>
                  <input id="setting-cardGap" type="number" value={settings.cardGap}
                    onChange={(e) => handleSettingChange('cardGap', parseInt(e.target.value) || 50)}
                    min="20" max="100" step="5" />
                </div>
                <div className="setting-item">
                  <label htmlFor="setting-fontSize">Font Size (px):</label>
                  <input id="setting-fontSize" type="number" value={settings.fontSize}
                    onChange={(e) => handleSettingChange('fontSize', parseInt(e.target.value) || 32)}
                    min="20" max="48" step="2" />
                </div>
                <div className="setting-item checkbox">
                  <label>
                    <input type="checkbox" checked={settings.showSvgBorder}
                      onChange={(e) => handleSettingChange('showSvgBorder', e.target.checked)} />
                    Show SVG canvas border
                  </label>
                </div>
              </div>

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
                      onChange={(e) => handleSettingChange('repeatAfterMe', e.target.checked)}
                    />
                    🎤 Repeat after me (voice recognition)
                  </label>
                </div>
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
                      ✓ The word is pronounced {settings.repeatTimes} time(s). After each pronunciation the mic listens once. Each attempt must match before moving on. Translation pronunciation is not used in this mode.
                    </small>
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
                      onChange={(e) => handleSettingChange('pronounceTranslation', e.target.checked)}
                      disabled={settings.repeatAfterMe} />
                    Pronounce translation
                    {settings.repeatAfterMe && (
                      <small style={{ color: '#ff9800', marginLeft: '0.4rem' }}>(not used in repeat-after-me mode)</small>
                    )}
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

      {isMenuOpen && (
        <div className="menu-dropdown" role="menu" aria-label="Main menu">
          <button className="menu-item" role="menuitem" type="button">Home</button>
          <button className="menu-item" role="menuitem" type="button" onClick={openSettings}>⚙️ Settings</button>
          <button className="menu-item" role="menuitem" type="button">About</button>
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