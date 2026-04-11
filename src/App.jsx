// App.js (with scoped SVG CSS classes to prevent color conflicts)
import React, { useState, useEffect, useRef } from 'react';
import './App.css';

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
  
  // Settings state - added randomOrder
  const [settings, setSettings] = useState({
    cardWidth: 400,
    cardHeight: 400,
    cardGap: 50,
    showTranscription: true,
    showTranslation: true,
    fontSize: 32,
    theme: 'dark',
    studyTime: 10,
    selectedVoiceName: "",
    repeatTimes: 3,
    autoPronounce: true,
    pronounceTranslation: false,
    translationVoiceName: "",
    translationRepeatTimes: 1,
    randomOrder: false,          // NEW: random order during study
  });

  // Refs
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
  const lastSpokenRef = useRef({ index: -1, card: '' });
  const initialStudyStartRef = useRef(false);
  const cachedVoiceRef = useRef(null);
  const userSelectedVoiceNameRef = useRef("");
  const synthRef = useRef(null);
  const voiceLoadTimeoutRef = useRef(null);
  const timeRemainingRef = useRef(0);
  const [manualPulseCard, setManualPulseCard] = useState(null);
  
  // Store study start index and record to return after completion
  const studyStartIndexRef = useRef(0);
  const studyStartRecordRef = useRef(null);

  // NEW: session-specific shuffled list and index
  const shuffledRecordsRef = useRef([]);
  const studyIndexRef = useRef(0);      // position in shuffledRecordsRef during study
  const isRandomSessionRef = useRef(false);

  // Hidden file input for loading settings
  const settingsFileInputRef = useRef(null);

  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  // Check if speech synthesis is supported
  const isSpeechSupported = () => {
    return typeof window !== 'undefined' && window.speechSynthesis !== undefined;
  };

  // Get current voice object from cache or available voices
  const getCurrentVoice = (voiceName = null) => {
    if (!isSpeechSupported()) return null;
    
    const targetVoiceName = voiceName || userSelectedVoiceNameRef.current || settings.selectedVoiceName;
    
    if (!targetVoiceName) return null;
    
    if (cachedVoiceRef.current && cachedVoiceRef.current.name === targetVoiceName) {
      return cachedVoiceRef.current;
    }
    
    const voice = availableVoices.find(voice => voice.name === targetVoiceName);
    if (voice) {
      cachedVoiceRef.current = voice;
    }
    return voice || null;
  };

  // Load voices (unchanged)
  const loadVoices = () => {
    if (!isSpeechSupported()) {
      setVoiceSupport(false);
      return;
    }
    
    setIsLoadingVoices(true);
    
    const loadWebVoices = () => {
      const voices = synthRef.current ? synthRef.current.getVoices() : [];
      if (voices && voices.length > 0) {
        setAvailableVoices(voices);
        setVoicesLoaded(true);
        setVoiceSupport(true);
        setIsLoadingVoices(false);
        
        if (!settings.selectedVoiceName && voices.length > 0) {
          const defaultVoice = voices.find(voice => voice.lang === 'en-US') || voices[0];
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
      const voices = synthRef.current ? synthRef.current.getVoices() : [];
      if (voices && voices.length > 0) {
        setAvailableVoices(voices);
        setVoicesLoaded(true);
        setVoiceSupport(true);
        setIsLoadingVoices(false);
        
        if (!settings.selectedVoiceName && voices.length > 0) {
          const defaultVoice = voices.find(voice => voice.lang === 'en-US') || voices[0];
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
        setTimeout(() => {
          try {
            synthRef.current?.cancel();
          } catch (err) {}
        }, 100);
      } catch (err) {
        console.warn('Error triggering voice loading:', err);
      }
    }
    
    let attempts = 0;
    const retryLoad = () => {
      if (attempts < 10) {
        attempts++;
        setTimeout(() => {
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
    if (!isSpeechSupported()) {
      setVoiceSupport(false);
      return;
    }
    loadVoices();
    return () => {
      if (synthRef.current && synthRef.current.onvoiceschanged) {
        synthRef.current.onvoiceschanged = null;
      }
      const timeoutRef = voiceLoadTimeoutRef.current;
      if (timeoutRef) clearTimeout(timeoutRef);
      if (isSpeechSupported()) {
        try { window.speechSynthesis.cancel(); } catch (err) {}
      }
    };
  }, []);

  // Keep refs in sync
  useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);
  useEffect(() => { activeCardRef.current = activeCard; }, [activeCard]);
  useEffect(() => { allRecordsRef.current = allRecords; }, [allRecords]);
  useEffect(() => { isStudyingRef.current = isStudying; }, [isStudying]);
  useEffect(() => { settingsRef.current = settings; }, [settings]);
  useEffect(() => { timeRemainingRef.current = timeRemaining; }, [timeRemaining]);

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

  // Helper: get the list that is currently active (shuffled if studying with randomOrder)
  const getActiveRecordList = () => {
    if (isStudying && isRandomSessionRef.current) {
      return shuffledRecordsRef.current;
    }
    return allRecords;
  };

  // Helper: get current index in the active list
  const getActiveIndex = () => {
    if (isStudying && isRandomSessionRef.current) {
      return studyIndexRef.current;
    }
    return currentIndex;
  };

  const speakText = (text, onComplete = null, voiceNameOverride = null, repeatCountOverride = null) => {
    if (!text) {
      if (onComplete) onComplete();
      return;
    }
    if (!isSpeechSupported() || !synthRef.current) {
      console.warn('Speech synthesis not supported');
      if (onComplete) onComplete();
      return;
    }
    const currentVoice = getCurrentVoice(voiceNameOverride);
    if (!currentVoice) {
      console.warn('No voice selected for pronunciation');
      if (onComplete) onComplete();
      return;
    }
    try { synthRef.current.cancel(); } catch (err) {}
    const repeatCount = repeatCountOverride !== null ? repeatCountOverride : (settings.repeatTimes || 1);
    setIsSpeaking(true);
    const speakWithDelay = (index) => {
      if (index >= repeatCount) {
        setIsSpeaking(false);
        if (onComplete) onComplete();
        return;
      }
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = currentVoice;
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.lang = currentVoice.lang;
      utterance.onend = () => setTimeout(() => speakWithDelay(index + 1), 500);
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        if (index === 0 && event.error === 'not-allowed') {
          setTimeout(() => speakWithDelay(index), 200);
        } else {
          setIsSpeaking(false);
          if (onComplete) onComplete();
        }
      };
      try { synthRef.current.speak(utterance); } catch (err) {
        console.error('Error speaking:', err);
        setIsSpeaking(false);
        if (onComplete) onComplete();
      }
    };
    setTimeout(() => speakWithDelay(0), 100);
  };

  const pronounceCurrentWord = () => {
    if (!settings.autoPronounce) return;
    if (!isStudying) return;
    if (isSpeaking) return;
    if (!voiceSupport) return;
    const currentVoice = getCurrentVoice();
    if (!currentVoice) return;
    let currentWord = '';
    let currentTranslation = '';
    if (activeCard === 'singular') {
      currentWord = currentRecord?.singular?.word || '';
      currentTranslation = currentRecord?.singular?.translation || '';
    } else {
      currentWord = currentRecord?.plural?.word || '';
      currentTranslation = currentRecord?.plural?.translation || '';
    }
    const currentKey = `${getActiveIndex()}_${activeCard}`;
    if (lastSpokenRef.current === currentKey) return;
    if (currentWord && currentWord.trim() !== '') {
      lastSpokenRef.current = currentKey;
      speakText(currentWord, () => {
        if (settings.pronounceTranslation && currentTranslation && currentTranslation.trim() !== '') {
          const translationVoice = getCurrentVoice(settings.translationVoiceName);
          if (translationVoice) {
            speakText(currentTranslation, null, settings.translationVoiceName, settings.translationRepeatTimes);
          }
        }
      });
    }
  };

  const resetStudyState = (showCompletionAlert = false) => {
    if (isCompletingRef.current) return;
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (isSpeechSupported() && synthRef.current) {
      try { synthRef.current.cancel(); } catch (err) {}
    }
    setIsSpeaking(false);
    setIsStudying(false);
    setTimeRemaining(0);
    timeRemainingRef.current = 0;
    
    // Restore original order
    if (isRandomSessionRef.current) {
      // Return to the starting record (original index)
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
    
    lastSpokenRef.current = { index: -1, card: '' };
    initialStudyStartRef.current = false;
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

  // Fisher–Yates shuffle
  const shuffleArray = (array) => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const moveToNextCard = () => {
    const records = getActiveRecordList();
    const currentIdx = isRandomSessionRef.current ? studyIndexRef.current : currentIndexRef.current;
    const currentActive = activeCardRef.current;
    
    setCardPulsing(currentActive, false);
    
    if (currentActive === 'singular') {
      setActiveCard('plural');
      setTimeout(() => {
        setCardPulsing('plural', true);
        setTimeout(() => pronounceCurrentWord(), 200);
      }, 50);
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
        setTimeout(() => {
          setCardPulsing('singular', true);
          setTimeout(() => pronounceCurrentWord(), 200);
        }, 100);
      } else {
        resetStudyState(true);
      }
    }
  };

  const startStudyTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    
    // Remember where we started (original index/record)
    studyStartIndexRef.current = currentIndex;
    studyStartRecordRef.current = currentRecord;
    
    resetStudyState(false);
    
    completionAlertShownRef.current = false;
    isCompletingRef.current = false;
    lastSpokenRef.current = { index: -1, card: '' };
    initialStudyStartRef.current = true;
    
    // Handle random order
    if (settings.randomOrder && allRecords.length > 0) {
      const shuffled = shuffleArray(allRecords);
      shuffledRecordsRef.current = shuffled;
      isRandomSessionRef.current = true;
      studyIndexRef.current = 0;
      // Set current record to first shuffled item
      setCurrentRecord(shuffled[0]);
    } else {
      isRandomSessionRef.current = false;
    }
    
    const initialTime = settingsRef.current.studyTime;
    setTimeRemaining(initialTime);
    timeRemainingRef.current = initialTime;
    setIsStudying(true);
    setActiveCard('singular');
    setTimeout(() => setCardPulsing('singular', true), 100);
    
    timerIntervalRef.current = setInterval(() => {
      const currentTime = timeRemainingRef.current;
      if (currentTime <= 1) {
        const records = getActiveRecordList();
        const currentIdx = isRandomSessionRef.current ? studyIndexRef.current : currentIndexRef.current;
        const currentActive = activeCardRef.current;
        
        if (currentActive === 'plural' && currentIdx === records.length - 1) {
          resetStudyState(true);
          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
          }
          return;
        }
        moveToNextCard();
        const newTime = settingsRef.current.studyTime;
        setTimeRemaining(newTime);
        timeRemainingRef.current = newTime;
      } else {
        const newTime = currentTime - 1;
        setTimeRemaining(newTime);
        timeRemainingRef.current = newTime;
      }
    }, 1000);
  };

  const stopStudyTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    resetStudyState(false);
  };

  useEffect(() => {
    if (isStudying && timerIntervalRef.current) {
      const newTime = settingsRef.current.studyTime;
      setTimeRemaining(newTime);
      timeRemainingRef.current = newTime;
      setCardPulsing('singular', false);
      setCardPulsing('plural', false);
      setTimeout(() => {
        setCardPulsing(activeCard, true);
        pronounceCurrentWord();
      }, 50);
    }
  }, [currentIndex, activeCard, isStudying]);

  useEffect(() => {
    if (isStudying && initialStudyStartRef.current && currentRecord && activeCard === 'singular') {
      const currentKey = `${getActiveIndex()}_singular`;
      if (lastSpokenRef.current !== currentKey) {
        const word = currentRecord.singular?.word;
        if (word && word.trim() !== '') {
          lastSpokenRef.current = currentKey;
          speakText(word, () => {
            if (settings.pronounceTranslation && currentRecord.singular?.translation) {
              const translationVoice = getCurrentVoice(settings.translationVoiceName);
              if (translationVoice) {
                speakText(currentRecord.singular.translation, null, settings.translationVoiceName, settings.translationRepeatTimes);
              }
            }
          });
          initialStudyStartRef.current = false;
        }
      }
    }
  }, [isStudying, currentRecord, activeCard, currentIndex, settings.pronounceTranslation, settings.translationVoiceName, settings.translationRepeatTimes]);

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      const timeoutRef = voiceLoadTimeoutRef.current;
      if (timeoutRef) clearTimeout(timeoutRef);
      if (isSpeechSupported() && synthRef.current) {
        try { synthRef.current.cancel(); } catch (err) {}
      }
    };
  }, []);

  const handleMenuClick = () => setIsMenuOpen(!isMenuOpen);
  const openSettings = () => { setIsMenuOpen(false); setIsSettingsOpen(true); };
  const closeSettings = () => setIsSettingsOpen(false);

  const toggleTheme = () => {
    const newTheme = settings.theme === 'dark' ? 'light' : 'dark';
    handleSettingChange('theme', newTheme);
    applyThemeToDOM(newTheme);
  };
const applyThemeToDOM = (theme) => {
  if (theme === 'light') {
    document.body.style.background = '#f5f5f5';
    document.querySelectorAll('.card').forEach(card => {
      card.style.background = '#ffffff';
      card.style.color = '#333';
      // Green border for visibility in light theme
      card.style.border = '1px solid #4caf50';   // <-- Changed to green
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

  // Apply all visual settings to DOM
  const applyVisualSettings = () => {
    const cards = document.querySelectorAll('.card');
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
    applyThemeToDOM(settings.theme);
  };

  // ========== Load settings from file ==========
  const handleOpenSettingsFile = () => {
    if (settingsFileInputRef.current) {
      settingsFileInputRef.current.click();
    }
  };

  const loadSettingsFromFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const loaded = JSON.parse(e.target.result);
        const newSettings = { ...settings, ...loaded };
        delete newSettings.savedAt;
        const allowedKeys = [
          'cardWidth', 'cardHeight', 'cardGap', 'showTranscription', 'showTranslation',
          'fontSize', 'theme', 'studyTime', 'selectedVoiceName', 'repeatTimes',
          'autoPronounce', 'pronounceTranslation', 'translationVoiceName', 'translationRepeatTimes',
          'randomOrder'
        ];
        Object.keys(newSettings).forEach(key => {
          if (!allowedKeys.includes(key)) delete newSettings[key];
        });
        setSettings(newSettings);
        setTimeout(() => {
          applyVisualSettings();
          userSelectedVoiceNameRef.current = newSettings.selectedVoiceName || "";
          cachedVoiceRef.current = null;
        }, 0);
        alert('✅ Settings loaded successfully!');
      } catch (err) {
        alert('❌ Failed to parse settings file.');
      }
    };
    reader.readAsText(file);
  };

  // ========== Apply settings and close (without saving to file) ==========
  const applyAndClose = () => {
    applyVisualSettings();
    if (isStudying) {
      stopStudyTimer();
      setTimeout(() => startStudyTimer(), 100);
    }
    closeSettings();
  };

  // ========== Save Settings overwrites "cards.settings" using File System Access API ==========
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
          types: [{
            description: 'Settings File',
            accept: { 'application/json': ['.settings'] }
          }]
        });
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
        alert('Settings saved successfully! (overwrote cards.settings)');
        closeSettings();
        return;
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.warn('Save file picker error:', err);
        }
      }
    }
    
    // Fallback
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cards.settings';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    alert('Settings saved successfully! (cards.settings file downloaded)');
    closeSettings();
  };
  // =============================================================================

  const handleSettingChange = (key, value) => setSettings(prev => ({ ...prev, [key]: value }));

  const handleVoiceChange = (voiceName) => {
    userSelectedVoiceNameRef.current = voiceName;
    setSettings(prev => ({ ...prev, selectedVoiceName: voiceName }));
    if (voiceName) {
      const voice = availableVoices.find(v => v.name === voiceName);
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
    if (isStudying) {
      stopStudyTimer();
    } else {
      if (!dbLoaded || allRecords.length === 0) {
        alert('⚠️ No database loaded!\n\nPlease load a database file using the "Load DB" button before starting a study session.');
        return;
      }
      if (!isSpeechSupported()) {
        alert('⚠️ Your browser does not support speech synthesis.\n\nPlease use a different browser like Firefox, Chrome, or Edge for voice features.');
        return;
      }
      if (settings.autoPronounce && (!voicesLoaded || availableVoices.length === 0)) {
        alert('⚠️ Voices not loaded yet!\n\nPlease click the "Load Voices" button in Settings first to enable pronunciation.\n\nThis is required for Edge Android browser.');
        return;
      }
      if (settings.autoPronounce && !settings.selectedVoiceName) {
        alert('⚠️ Please select a voice in Settings before starting the study session.\n\nGo to Settings → Voice Settings to select a voice.');
        return;
      }
      if (dbLoaded && allRecords.length > 0) {
        startStudyTimer();
        if (settings.autoPronounce && settings.selectedVoiceName) {
          alert(`📖 Study session started!\n\nWords will be pronounced ${settings.repeatTimes} time(s) with: ${settings.selectedVoiceName}\n\nCards will pulse continuously while being studied.${settings.randomOrder ? '\n\n🔀 Random order enabled.' : ''}`);
        } else if (settings.autoPronounce && !settings.selectedVoiceName) {
          alert('📖 Study session started! But no voice selected. Words will not be pronounced.\n\nGo to Settings → Voice Settings to select a voice.');
        } else {
          alert('📖 Study session started! Auto-pronunciation is disabled.');
        }
      }
    }
  };

  const renderSvgToContainer = (container, svgCode, uniqueId) => {
    if (!container) return;
    if (!svgCode || svgCode.trim() === '') {
      container.innerHTML = '';
      return;
    }
    try {
      if (svgCode.includes('<svg')) {
        const scopeId = uniqueId || `svg-${Date.now()}-${Math.random()}`;
        container.innerHTML = svgCode;
        const svgElement = container.querySelector('svg');
        if (svgElement) {
          svgElement.setAttribute('width', '100%');
          svgElement.setAttribute('height', '100%');
          svgElement.style.maxWidth = '150px';
          svgElement.style.maxHeight = '150px';
          const styleElements = svgElement.querySelectorAll('style');
          styleElements.forEach(style => {
            let styleContent = style.innerHTML;
            styleContent = styleContent.replace(/\.st(\d+)/g, `.${scopeId}-st$1`);
            style.innerHTML = styleContent;
          });
          const allElements = svgElement.querySelectorAll('[class]');
          allElements.forEach(el => {
            const oldClass = el.getAttribute('class');
            if (oldClass && oldClass.match(/st\d+/)) {
              const newClass = oldClass.replace(/st(\d+)/g, `${scopeId}-st$1`);
              el.setAttribute('class', newClass);
            }
          });
        }
      } else {
        container.innerHTML = '';
      }
    } catch (error) {
      console.error('Error rendering SVG:', error);
      container.innerHTML = '';
    }
  };

  const loadDatabaseFromFile = async () => {
    if (isStudying) stopStudyTimer();
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
        if (importedData.records && Array.isArray(importedData.records)) {
          records = importedData.records;
        } else if (Array.isArray(importedData)) {
          records = importedData;
        } else {
          throw new Error("Invalid database file format: expected 'records' array or direct array");
        }
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
        alert(`✅ Database loaded successfully!\n\nFile: ${file.name}\nRecords: ${records.length}\nNow showing first record (ID: ${convertedRecords[0].id}) - Both cards displayed`);
      } catch (error) {
        console.error("Error loading database:", error);
        alert(`❌ Failed to load database\n\nError: ${error.message}\n\nMake sure the file is a valid database file.`);
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
    if (allRecords.length > 0 && currentIndex < allRecords.length - 1) {
      clearManualPulse();
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      setCurrentRecord(allRecords[newIndex]);
      setActiveCard('singular');
    }
  };

  const prevRecord = () => {
    if (allRecords.length > 0 && currentIndex > 0) {
      clearManualPulse();
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      setCurrentRecord(allRecords[newIndex]);
      setActiveCard('singular');
    }
  };

  useEffect(() => {
    if (currentRecord && dbLoaded) {
      setTimeout(() => {
        renderSvgToContainer(singularSvgRef.current, currentRecord.singular?.svgCode, 'singular');
        renderSvgToContainer(pluralSvgRef.current, currentRecord.plural?.svgCode, 'plural');
      }, 50);
    } else if (!dbLoaded) {
      if (singularSvgRef.current) singularSvgRef.current.innerHTML = '';
      if (pluralSvgRef.current) pluralSvgRef.current.innerHTML = '';
    }
  }, [currentRecord, dbLoaded]);

  const handleCardClick = (cardType) => {
    if (isStudying) return;
    if (!dbLoaded || !currentRecord) return;
    if (!settings.autoPronounce) return;
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
    
    if (!word.trim()) return;
    
    clearManualPulse();
    setCardPulsing(cardType, true);
    setManualPulseCard(cardType);
    
    const finishPronunciation = () => clearManualPulse();
    
    speakText(word, () => {
      if (settings.pronounceTranslation && translation && translation.trim() !== '') {
        const translationVoice = getCurrentVoice(settings.translationVoiceName);
        if (translationVoice) {
          speakText(translation, finishPronunciation, settings.translationVoiceName, settings.translationRepeatTimes);
        } else {
          finishPronunciation();
        }
      } else {
        finishPronunciation();
      }
    });
  };

  return (
    <div className="app">
      <div className="top-bar-wrapper">
        <div className="top-bar">
          <div className="header-left">
            <button className="menu-button" onClick={handleMenuClick}>Menu</button>
            <div className="header-title">English Study</div>
          </div>
          {dbLoaded && currentRecord && (
            <div className="header-db-info">
              <span className="db-info-label">📁</span>
              <span className="db-info-name">{dbFileName}</span>
              <span className="db-info-separator">|</span>
              <span className="db-info-id">ID: {currentRecord.id}</span>
              {isStudying && (
                <>
                  <span className="db-info-separator">|</span>
                  <span className="db-info-timer">⏱️ {timeRemaining}s</span>
                  {isSpeaking && (
                    <>
                      <span className="db-info-separator">|</span>
                      <span className="db-info-timer">🔊 Speaking...</span>
                    </>
                  )}
                </>
              )}
            </div>
          )}
          <div className="header-buttons">
            <button className={isStudying ? "stop-button" : "start-button"} onClick={handleMainAction} disabled={isLoading}>
              {isStudying ? '⏹️ Stop' : '🚀 Start'}
            </button>
            <button className="load-db-button" onClick={loadDatabaseFromFile} disabled={isLoading}>
              {isLoading ? 'Loading...' : '📂 Load DB'}
            </button>
          </div>
        </div>
      </div>

      <div className="page-content">
        {dbLoaded && allRecords.length > 0 && !isStudying && (
          <div className="navigation-buttons">
            <button onClick={prevRecord} className="nav-button">◀ Previous</button>
            <button onClick={toggleTheme} className="nav-button theme-button">
              {settings.theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
            </button>
            <button onClick={nextRecord} className="nav-button">Next ▶</button>
          </div>
        )}

        <div className="cards-row">
          <div ref={singularCardRef} className="card" onClick={() => handleCardClick('singular')}>
            <div className="english-word">{dbLoaded && currentRecord?.singular?.word ? currentRecord.singular.word : ""}</div>
            <div className="transcription">{dbLoaded && currentRecord?.singular?.transcription ? currentRecord.singular.transcription : ""}</div>
            <div className="svg-wrapper" ref={singularSvgRef}></div>
            <div className="translation">{dbLoaded && currentRecord?.singular?.translation ? currentRecord.singular.translation : ""}</div>
          </div>

          <div ref={pluralCardRef} className="card" onClick={() => handleCardClick('plural')}>
            <div className="english-word">{dbLoaded && currentRecord?.plural?.word ? currentRecord.plural.word : ""}</div>
            <div className="transcription">{dbLoaded && currentRecord?.plural?.transcription ? currentRecord.plural.transcription : ""}</div>
            <div className="svg-wrapper" ref={pluralSvgRef}></div>
            <div className="translation">{dbLoaded && currentRecord?.plural?.translation ? currentRecord.plural.translation : ""}</div>
          </div>
        </div>
      </div>

      {isSettingsOpen && (
        <div className="settings-overlay" onClick={closeSettings}>
          <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
            <div className="settings-header">
              <h2>⚙️ Settings</h2>
              <button className="settings-close" onClick={closeSettings}>×</button>
            </div>
            <div className="settings-content">
              <div className="settings-section">
                <h3>Card Appearance</h3>
                <div className="setting-item">
                  <label>Card Width (px):</label>
                  <input type="number" value={settings.cardWidth} onChange={(e) => handleSettingChange('cardWidth', parseInt(e.target.value) || 400)} min="300" max="600" step="10" />
                </div>
                <div className="setting-item">
                  <label>Card Height (px):</label>
                  <input type="number" value={settings.cardHeight} onChange={(e) => handleSettingChange('cardHeight', parseInt(e.target.value) || 400)} min="300" max="600" step="10" />
                </div>
                <div className="setting-item">
                  <label>Gap between cards (px):</label>
                  <input type="number" value={settings.cardGap} onChange={(e) => handleSettingChange('cardGap', parseInt(e.target.value) || 50)} min="20" max="100" step="5" />
                </div>
                <div className="setting-item">
                  <label>Font Size (px):</label>
                  <input type="number" value={settings.fontSize} onChange={(e) => handleSettingChange('fontSize', parseInt(e.target.value) || 32)} min="20" max="48" step="2" />
                </div>
              </div>

              <div className="settings-section">
                <h3>Study Settings</h3>
                <div className="setting-item">
                  <label>Study Time per Card (seconds):</label>
                  <input type="number" value={settings.studyTime} onChange={(e) => handleSettingChange('studyTime', parseInt(e.target.value) || 10)} min="3" max="60" step="1" />
                </div>
                <div className="setting-item checkbox">
                  <label>
                    <input type="checkbox" checked={settings.autoPronounce} onChange={(e) => handleSettingChange('autoPronounce', e.target.checked)} /> 
                    Auto-pronounce words during study
                  </label>
                </div>
                {/* NEW: Random order checkbox */}
                <div className="setting-item checkbox">
                  <label>
                    <input type="checkbox" checked={settings.randomOrder} onChange={(e) => handleSettingChange('randomOrder', e.target.checked)} /> 
                    Random pair of cards study (shuffle all records)
                  </label>
                </div>
                <div className="setting-item">
                  <small style={{ color: '#aaa', fontSize: '0.7rem' }}>⏱️ Each card pulses continuously during study</small>
                </div>
              </div>

              <div className="settings-section">
                <h3>Voice Settings</h3>
                <div className="setting-item">
                  <label>Select Voice:</label>
                  <select value={settings.selectedVoiceName} onChange={(e) => handleVoiceChange(e.target.value)} disabled={!voicesLoaded} style={{ background: '#3c3c3c', border: '1px solid #555', color: 'white', padding: '0.4rem 0.6rem', borderRadius: '6px', fontSize: '0.9rem', width: '220px', cursor: voicesLoaded ? 'pointer' : 'not-allowed', opacity: voicesLoaded ? 1 : 0.6 }}>
                    <option value="">-- Select a voice --</option>
                    {availableVoices.map((voice) => (<option key={voice.name} value={voice.name}>{voice.name} ({voice.lang})</option>))}
                  </select>
                </div>
                <div className="setting-item">
                  <button onClick={loadVoices} disabled={isLoadingVoices} style={{ background: '#0078d4', border: 'none', color: 'white', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: isLoadingVoices ? 'wait' : 'pointer', fontSize: '0.9rem', width: 'auto', marginLeft: '0.5rem' }}>
                    {isLoadingVoices ? 'Loading...' : (voicesLoaded ? '✓ Voices Loaded' : '📢 Load Voices')}
                  </button>
                  {!voicesLoaded && (<span style={{ marginLeft: '0.5rem', fontSize: '0.7rem', color: '#ff9800' }}>⚠️ Required for Edge Android - Click to load</span>)}
                </div>
                <div className="setting-item">
                  <label>Repeat English words:</label>
                  <input type="number" value={settings.repeatTimes} onChange={(e) => handleSettingChange('repeatTimes', parseInt(e.target.value) || 3)} min="1" max="5" step="1" style={{ background: '#3c3c3c', border: '1px solid #555', color: 'white', padding: '0.4rem 0.6rem', borderRadius: '6px', fontSize: '0.9rem', width: '80px' }} />
                  <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', color: '#aaa' }}>times</span>
                </div>
                <div className="setting-item checkbox">
                  <label>
                    <input type="checkbox" checked={settings.pronounceTranslation} onChange={(e) => handleSettingChange('pronounceTranslation', e.target.checked)} /> 
                    Pronounce translation
                  </label>
                </div>
                <div className="setting-item">
                  <label>Translation Voice:</label>
                  <select value={settings.translationVoiceName || ""} onChange={(e) => handleSettingChange('translationVoiceName', e.target.value)} disabled={!voicesLoaded || !settings.pronounceTranslation} style={{ background: '#3c3c3c', border: '1px solid #555', color: 'white', padding: '0.4rem 0.6rem', borderRadius: '6px', fontSize: '0.9rem', width: '220px', cursor: (voicesLoaded && settings.pronounceTranslation) ? 'pointer' : 'not-allowed', opacity: (voicesLoaded && settings.pronounceTranslation) ? 1 : 0.6 }}>
                    <option value="">-- Select a voice --</option>
                    {availableVoices.map((voice) => (<option key={voice.name} value={voice.name}>{voice.name} ({voice.lang})</option>))}
                  </select>
                </div>
                <div className="setting-item">
                  <label>Repeat translation Voice:</label>
                  <input type="number" value={settings.translationRepeatTimes} onChange={(e) => handleSettingChange('translationRepeatTimes', parseInt(e.target.value) || 1)} min="1" max="5" step="1" disabled={!settings.pronounceTranslation} style={{ background: settings.pronounceTranslation ? '#3c3c3c' : '#2a2a2a', border: '1px solid #555', color: 'white', padding: '0.4rem 0.6rem', borderRadius: '6px', fontSize: '0.9rem', width: '80px', cursor: settings.pronounceTranslation ? 'pointer' : 'not-allowed', opacity: settings.pronounceTranslation ? 1 : 0.6 }} />
                  <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', color: '#aaa' }}>times</span>
                </div>
                <div className="setting-item">
                  <small style={{ color: voicesLoaded ? '#4caf50' : '#ff9800', fontSize: '0.8rem', fontWeight: 'bold' }}>
                    {voicesLoaded ? `✓ Current voice: ${settings.selectedVoiceName || "None selected"}` : '⚠️ Voices not loaded - Click "Load Voices" button'}
                  </small>
                </div>
                {!voiceSupport && (<div className="setting-item"><small style={{ color: '#f44336', fontSize: '0.8rem' }}>⚠️ Voice support not available in this browser. Please try Firefox or Chrome.</small></div>)}
              </div>

              <div className="settings-section">
                <h3>Display Options</h3>
                <div className="setting-item checkbox">
                  <label><input type="checkbox" checked={settings.showTranscription} onChange={(e) => handleSettingChange('showTranscription', e.target.checked)} /> Show Transcription</label>
                </div>
                <div className="setting-item checkbox">
                  <label><input type="checkbox" checked={settings.showTranslation} onChange={(e) => handleSettingChange('showTranslation', e.target.checked)} /> Show Translation</label>
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
        <div className="menu-dropdown">
          <div className="menu-item">Home</div>
          <div className="menu-item" onClick={openSettings}>⚙️ Settings</div>
          <div className="menu-item">About</div>
        </div>
      )}

      {/* Hidden file input for loading settings */}
      <input
        type="file"
        ref={settingsFileInputRef}
        accept=".settings,.json"
        style={{ display: 'none' }}
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