// App.js - FIXED for Edge Android speech synthesis
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
    randomOrder: false,
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
  
  const studyStartIndexRef = useRef(0);
  const studyStartRecordRef = useRef(null);
  const shuffledRecordsRef = useRef([]);
  const studyIndexRef = useRef(0);
  const isRandomSessionRef = useRef(false);
  const settingsFileInputRef = useRef(null);
  const lastSpokenRef = useRef({ index: -1, card: '' });
  const cachedVoiceRef = useRef(null);

  useEffect(() => {
    currentRecordRef.current = currentRecord;
  }, [currentRecord]);
  
  useEffect(() => {
    activeCardForSpeechRef.current = activeCard;
  }, [activeCard]);
  
  useEffect(() => {
    currentIndexForSpeechRef.current = currentIndex;
  }, [currentIndex]);
  
  useEffect(() => {
    isRandomSessionForSpeechRef.current = isRandomSessionRef.current;
    studyIndexForSpeechRef.current = studyIndexRef.current;
    shuffledRecordsForSpeechRef.current = shuffledRecordsRef.current;
  });
  
  useEffect(() => {
    settingsForSpeechRef.current = settings;
  }, [settings]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  const isSpeechSupported = () => {
    return typeof window !== 'undefined' && window.speechSynthesis !== undefined;
  };

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
          // Prefer Google voices for Android
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

  // FIXED speakText for Edge Android - added cancel() at the beginning
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
    
    // CRITICAL FIX FOR EDGE ANDROID: Cancel any pending speech before starting new
    try { synthRef.current.cancel(); } catch (err) {}
    
    const currentVoice = getCurrentVoice(voiceNameOverride);
    if (!currentVoice) {
      console.warn('No voice selected for pronunciation');
      if (onComplete) onComplete();
      return;
    }
    
    const repeatCount = repeatCountOverride !== null ? repeatCountOverride : (settings.repeatTimes || 1);
    setIsSpeaking(true);
    
    let currentRepeatIndex = 0;
    
    const speakNext = () => {
      if (currentRepeatIndex >= repeatCount) {
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
        currentRepeatIndex++;
        // Longer delay for mobile browsers
        setTimeout(speakNext, 800);
      };
      
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        if (event.error === 'not-allowed' || event.error === 'interrupted') {
          setTimeout(() => {
            currentRepeatIndex++;
            setTimeout(speakNext, 500);
          }, 200);
        } else {
          setIsSpeaking(false);
          if (onComplete) onComplete();
        }
      };
      
      try {
        synthRef.current.speak(utterance);
      } catch (err) {
        console.error('Error speaking:', err);
        setIsSpeaking(false);
        if (onComplete) onComplete();
      }
    };
    
    setTimeout(speakNext, 100);
  };

  const getCurrentWordFromRefs = () => {
    const currentCard = activeCardForSpeechRef.current;
    const currentRecordData = currentRecordRef.current;
    
    if (!currentRecordData) return { word: '', translation: '' };
    
    if (currentCard === 'singular') {
      return {
        word: currentRecordData.singular?.word || '',
        translation: currentRecordData.singular?.translation || ''
      };
    } else {
      return {
        word: currentRecordData.plural?.word || '',
        translation: currentRecordData.plural?.translation || ''
      };
    }
  };

  const pronounceCurrentCard = () => {
    if (!settingsForSpeechRef.current.autoPronounce) return;
    if (!isStudyingRef.current) return;
    if (isSpeaking) {
      setTimeout(() => {
        if (isStudyingRef.current && !isSpeaking) {
          pronounceCurrentCard();
        }
      }, 500);
      return;
    }
    
    const { word, translation } = getCurrentWordFromRefs();
    const currentCard = activeCardForSpeechRef.current;
    const currentIdx = isRandomSessionForSpeechRef.current ? studyIndexForSpeechRef.current : currentIndexForSpeechRef.current;
    const currentSettings = settingsForSpeechRef.current;
    
    // Prevent duplicate pronunciation
    const currentKey = `${currentIdx}_${currentCard}`;
    if (lastSpokenRef.current === currentKey) return;
    lastSpokenRef.current = currentKey;
    
    if (!word || word.trim() === '') {
      console.log(`No word to pronounce for ${currentCard} at index ${currentIdx}, moving to next`);
      setTimeout(() => moveToNextCardInStudy(), 300);
      return;
    }
    
    console.log(`🔊 Pronouncing ${currentCard} at index ${currentIdx}: "${word}"`);
    
    if (currentSettings.pronounceTranslation && translation && translation.trim() !== '') {
      speakText(word, () => {
        if (!isStudyingRef.current) return;
        
        console.log(`✅ Finished pronouncing word, now pronouncing translation: "${translation}"`);
        const translationVoice = getCurrentVoice(currentSettings.translationVoiceName);
        if (translationVoice) {
          speakText(translation, () => {
            if (!isStudyingRef.current) return;
            console.log('Finished translation, moving to next');
            setTimeout(() => moveToNextCardInStudy(), 300);
          }, currentSettings.translationVoiceName, currentSettings.translationRepeatTimes);
        } else {
          console.log('No translation voice, moving to next');
          setTimeout(() => moveToNextCardInStudy(), 300);
        }
      });
    } else {
      speakText(word, () => {
        if (!isStudyingRef.current) return;
        console.log(`✅ Finished pronouncing ${currentCard}, moving to next`);
        setTimeout(() => moveToNextCardInStudy(), 300);
      });
    }
  };

  const moveToNextCardInStudy = () => {
    if (!isStudyingRef.current) return;
    
    const records = isRandomSessionRef.current ? shuffledRecordsRef.current : allRecordsRef.current;
    const currentIdx = isRandomSessionRef.current ? studyIndexRef.current : currentIndexRef.current;
    const currentActive = activeCardRef.current;
    
    console.log(`🔄 Moving from ${currentActive} at index ${currentIdx}`);
    setCardPulsing(currentActive, false);
    
    if (currentActive === 'singular') {
      setActiveCard('plural');
      setTimeout(() => {
        setCardPulsing('plural', true);
        setTimeout(() => pronounceCurrentCard(), 200);
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
        setTimeout(() => {
          setCardPulsing('singular', true);
          setTimeout(() => pronounceCurrentCard(), 200);
        }, 100);
      } else {
        console.log('Study complete!');
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
    
    if (isSpeechSupported() && synthRef.current) {
      try { synthRef.current.cancel(); } catch (err) {}
    }
    
    setIsSpeaking(false);
    setIsStudying(false);
    setTimeRemaining(0);
    timeRemainingRef.current = 0;
    lastSpokenRef.current = { index: -1, card: '' };
    
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
    
    resetStudyState(false);
    
    completionAlertShownRef.current = false;
    isCompletingRef.current = false;
    lastSpokenRef.current = { index: -1, card: '' };
    
    if (settings.randomOrder && allRecords.length > 0) {
      const shuffled = shuffleArray(allRecords);
      shuffledRecordsRef.current = shuffled;
      isRandomSessionRef.current = true;
      studyIndexRef.current = 0;
      setCurrentRecord(shuffled[0]);
    } else {
      isRandomSessionRef.current = false;
    }
    
    setIsStudying(true);
    setActiveCard('singular');
    setTimeout(() => setCardPulsing('singular', true), 100);
    
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
      setTimeRemaining(0);
      timeRemainingRef.current = 0;
      
      setTimeout(() => {
        console.log('Starting auto-pronunciation mode');
        if (isStudyingRef.current && currentRecordRef.current) {
          pronounceCurrentCard();
        }
      }, 500);
    }
  };

  const stopStudyTimer = () => {
    console.log('Stop button pressed');
    
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    
    if (isSpeechSupported() && synthRef.current) {
      try { synthRef.current.cancel(); } catch (err) {}
    }
    
    resetStudyState(false);
  };

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
        card.style.border = '1px solid #4caf50';
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
          types: [{
            description: 'Settings File',
            accept: { 'application/json': ['.settings'] }
          }]
        });
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
        alert('Settings saved successfully!');
        closeSettings();
        return;
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.warn('Save file picker error:', err);
        }
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
    // Don't allow starting if navigation speech is in progress
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
          alert(`📖 Study session started!\n\n🔊 Auto-pronunciation mode: Each card will be pronounced and auto-advance\n${settings.pronounceTranslation ? '🌐 Translation will also be pronounced\n' : ''}⏱️ No timer - progress after pronunciation completes\n\nCards will pulse continuously.${settings.randomOrder ? '\n\n🔀 Random order enabled.' : ''}`);
        } else {
          alert(`📖 Study session started!\n\n⏱️ Timer mode: ${settings.studyTime} seconds per card\n🔇 Auto-pronunciation disabled\n\nCards will auto-advance when timer expires.${settings.randomOrder ? '\n\n🔀 Random order enabled.' : ''}`);
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
        alert(`✅ Database loaded successfully!\n\nFile: ${file.name}\nRecords: ${records.length}`);
      } catch (error) {
        console.error("Error loading database:", error);
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
      clearManualPulse();
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      setCurrentRecord(allRecords[newIndex]);
      setActiveCard('singular');
    }
  };

  const prevRecord = () => {
    if (allRecords.length > 0 && currentIndex > 0 && !isStudying) {
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
    
    const finishPronunciation = () => {
      clearManualPulse();
    };
    
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

  return (
    <div className="app">
      <div className="top-bar-wrapper">
        <div className="top-bar">
          <div className="header-left">
            <button onClick={toggleTheme} className="nav-button theme-button" style={{ background: '#ff9800', padding: '6px 12px' }}>
              {settings.theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <div className="header-title">English Cards</div>
            {!isStudying && (
              <button className="menu-button" onClick={handleMenuClick}>Menu</button>
            )}
          </div>
          {dbLoaded && currentRecord && (
            <div className="header-db-info">
              <span className="db-info-label">📁</span>
              <span className="db-info-name">{dbFileName}</span>
              <span className="db-info-separator">|</span>
              <span className="db-info-id">ID: {currentRecord.id}</span>
              {isSpeaking && (
                    <>
                      <span className="db-info-separator">|</span>
                      <span className="db-info-timer">🔊</span>
                    </>
              )}
            </div>
          )}
          <div className="header-buttons">
            {dbLoaded && allRecords.length > 0 && !isStudying && (
              <>
                <button onClick={prevRecord} className="nav-button" style={{ background: '#0078d4', padding: '6px 12px' }}>◀</button>
                <button onClick={nextRecord} className="nav-button" style={{ background: '#0078d4', padding: '6px 12px' }}>▶</button>
              </>
            )}
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
                <div className="setting-item checkbox">
                  <label>
                    <input type="checkbox" checked={settings.randomOrder} onChange={(e) => handleSettingChange('randomOrder', e.target.checked)} /> 
                    Random pair of cards study (shuffle all records)
                  </label>
                </div>
                <div className="setting-item">
                  <small style={{ color: '#aaa', fontSize: '0.7rem' }}>📖 Each card pulses during study</small>
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
                  {!voicesLoaded && (<span style={{ marginLeft: '0.5rem', fontSize: '0.7rem', color: '#ff9800' }}>⚠️ Required - Click to load</span>)}
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
                {!voiceSupport && (<div className="setting-item"><small style={{ color: '#f44336', fontSize: '0.8rem' }}>⚠️ Voice support not available</small></div>)}
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