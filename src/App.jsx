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
  
  // Settings state
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
    autoPronounce: true
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
  const isVoicesLoadedRef = useRef(false);
  const voiceLoadAttemptsRef = useRef(0);
  const voiceLoadTimeoutRef = useRef(null);

  // Check if speech synthesis is supported
  const isSpeechSupported = () => {
    return typeof window !== 'undefined' && window.speechSynthesis !== undefined;
  };

  // Get current voice object from cache or available voices
  const getCurrentVoice = () => {
    if (!isSpeechSupported()) return null;
    
    // Always use the user's selected voice name
    const targetVoiceName = userSelectedVoiceNameRef.current || settings.selectedVoiceName;
    
    if (!targetVoiceName) return null;
    
    // If we have a cached voice and it matches the target name, use it
    if (cachedVoiceRef.current && cachedVoiceRef.current.name === targetVoiceName) {
      return cachedVoiceRef.current;
    }
    
    // Otherwise, find from available voices and cache it
    const voice = availableVoices.find(voice => voice.name === targetVoiceName);
    if (voice) {
      cachedVoiceRef.current = voice;
    }
    return voice || null;
  };

  // Enhanced voice loading for mobile browsers (including Edge Android)
  const forceLoadVoices = () => {
    if (!isSpeechSupported()) {
      setVoiceSupport(false);
      return;
    }
    
    // Clear any existing timeout
    if (voiceLoadTimeoutRef.current) {
      clearTimeout(voiceLoadTimeoutRef.current);
    }
    
    const tryLoadVoices = (attempt = 0) => {
      let voices = [];
      
      // Try multiple methods to get voices
      try {
        voices = window.speechSynthesis.getVoices();
      } catch (e) {
        console.warn('Error getting voices:', e);
      }
      
      if (voices && voices.length > 0) {
        handleVoicesLoaded(voices);
        return true;
      }
      
      // For Edge Android and other mobile browsers, we need to trigger voice loading
      if (attempt < 15) { // Increased attempts for mobile
        // Create a dummy utterance with text to force voice loading
        const dummyUtterance = new SpeechSynthesisUtterance(' ');
        dummyUtterance.lang = 'en-US';
        
        // Set up onvoiceschanged if available
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
          window.speechSynthesis.onvoiceschanged = () => {
            const newVoices = window.speechSynthesis.getVoices();
            if (newVoices && newVoices.length > 0) {
              handleVoicesLoaded(newVoices);
            }
          };
        }
        
        // Try to trigger voice loading by speaking and immediately canceling
        try {
          window.speechSynthesis.cancel();
          window.speechSynthesis.speak(dummyUtterance);
          // Cancel immediately to prevent actual speech
          setTimeout(() => {
            try {
              window.speechSynthesis.cancel();
            } catch (e) {}
          }, 100);
        } catch (e) {
          console.warn('Error triggering speech:', e);
        }
        
        // Retry with increasing delay
        voiceLoadTimeoutRef.current = setTimeout(() => {
          tryLoadVoices(attempt + 1);
        }, 300 + (attempt * 100));
      } else {
        console.warn('Could not load voices after multiple attempts');
        // Final attempt: try to get voices one last time
        const finalVoices = window.speechSynthesis.getVoices();
        if (finalVoices && finalVoices.length > 0) {
          handleVoicesLoaded(finalVoices);
        } else {
          setVoiceSupport(false);
        }
      }
      return false;
    };
    
    // Start loading attempts
    tryLoadVoices(0);
  };

  const handleVoicesLoaded = (voices) => {
    if (!voices || voices.length === 0) {
      console.warn('No voices loaded');
      return;
    }
    
    setAvailableVoices(voices);
    
    // CRITICAL: Preserve user's selected voice if it exists
    const userSelectedVoice = userSelectedVoiceNameRef.current || settings.selectedVoiceName;
    
    if (userSelectedVoice) {
      const voice = voices.find(v => v.name === userSelectedVoice);
      if (voice) {
        // User's selected voice exists in the new list - keep it
        cachedVoiceRef.current = voice;
        // Update settings to ensure it's set (in case it was lost)
        if (settings.selectedVoiceName !== userSelectedVoice) {
          setSettings(prev => ({ ...prev, selectedVoiceName: userSelectedVoice }));
        }
        setVoiceSupport(true);
      } else {
        // User's selected voice is not available - try to find similar or use default
        console.warn(`Selected voice "${userSelectedVoice}" not found in loaded voices`);
        const defaultVoice = voices.find(voice => voice.lang === 'en-US') || voices[0];
        if (defaultVoice && !userSelectedVoiceNameRef.current) {
          setSettings(prev => ({ ...prev, selectedVoiceName: defaultVoice.name }));
          cachedVoiceRef.current = defaultVoice;
          setVoiceSupport(true);
        }
      }
    } else if (!settings.selectedVoiceName && voices.length > 0) {
      // Only set default if no voice was ever selected by user
      const defaultVoice = voices.find(voice => voice.lang === 'en-US') || voices[0];
      setSettings(prev => ({ ...prev, selectedVoiceName: defaultVoice.name }));
      cachedVoiceRef.current = defaultVoice;
      setVoiceSupport(true);
    }
    
    isVoicesLoadedRef.current = true;
    
    // Test if voices actually work (for Edge Android)
    if (cachedVoiceRef.current) {
      const testUtterance = new SpeechSynthesisUtterance('test');
      testUtterance.voice = cachedVoiceRef.current;
      testUtterance.volume = 0; // Silent test
      try {
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(testUtterance);
      } catch (e) {
        console.warn('Voice test failed:', e);
      }
    }
  };

  // Load available voices - enhanced for mobile browsers
  useEffect(() => {
    if (!isSpeechSupported()) {
      setVoiceSupport(false);
      return;
    }
    
    // Initial load attempt with enhanced method
    forceLoadVoices();
    
    // Also listen for the voiceschanged event (works on some browsers)
    const handleVoicesChanged = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        handleVoicesLoaded(voices);
      }
    };
    
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
    }
    
    // Fallback: try again after page is fully loaded
    const handleLoad = () => {
      setTimeout(() => {
        const voices = window.speechSynthesis.getVoices();
        if (voices && voices.length > 0) {
          handleVoicesLoaded(voices);
        } else if (!isVoicesLoadedRef.current) {
          forceLoadVoices();
        }
      }, 1000);
    };
    
    window.addEventListener('load', handleLoad);
    
    // Cleanup function
    return () => {
      if (voiceLoadTimeoutRef.current) {
        clearTimeout(voiceLoadTimeoutRef.current);
      }
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
      }
      window.removeEventListener('load', handleLoad);
      if (isSpeechSupported()) {
        try {
          window.speechSynthesis.cancel();
        } catch (e) {}
      }
    };
  }, []);

  // Keep refs in sync with state
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    activeCardRef.current = activeCard;
  }, [activeCard]);

  useEffect(() => {
    allRecordsRef.current = allRecords;
  }, [allRecords]);

  useEffect(() => {
    isStudyingRef.current = isStudying;
  }, [isStudying]);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  // Function to add/remove continuous pulse class
  const setCardPulsing = (cardType, isPulsing) => {
    const cardElement = cardType === 'singular' ? singularCardRef.current : pluralCardRef.current;
    if (cardElement) {
      if (isPulsing) {
        cardElement.classList.add('active-pulse');
      } else {
        cardElement.classList.remove('active-pulse');
      }
    }
  };

  // Enhanced speak function for better mobile compatibility
  const speakText = (text, onComplete = null) => {
    if (!text) {
      if (onComplete) onComplete();
      return;
    }
    
    if (!isSpeechSupported()) {
      console.warn('Speech synthesis not supported');
      if (onComplete) onComplete();
      return;
    }
    
    const currentVoice = getCurrentVoice();
    if (!currentVoice) {
      console.warn('No voice selected for pronunciation');
      if (onComplete) onComplete();
      return;
    }
    
    // Cancel any ongoing speech
    try {
      window.speechSynthesis.cancel();
    } catch (e) {
      console.warn('Error canceling speech:', e);
    }
    
    const repeatCount = settings.repeatTimes || 1;
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
      utterance.lang = 'en-US';
      
      utterance.onend = () => {
        // Add a small delay between repetitions for mobile
        setTimeout(() => speakWithDelay(index + 1), 500);
      };
      
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        // For Edge Android, sometimes the first utterance fails, try again
        if (index === 0 && event.error === 'not-allowed') {
          setTimeout(() => speakWithDelay(index), 100);
        } else {
          setIsSpeaking(false);
          if (onComplete) onComplete();
        }
      };
      
      try {
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.error('Error speaking:', e);
        setIsSpeaking(false);
        if (onComplete) onComplete();
      }
    };
    
    // Small delay before speaking for mobile browsers
    setTimeout(() => speakWithDelay(0), 100);
  };

  // Function to pronounce current active word
  const pronounceCurrentWord = () => {
    if (!settings.autoPronounce) return;
    if (!isStudying) return;
    if (isSpeaking) return;
    if (!voiceSupport) return;
    
    // Check if voice is selected
    const currentVoice = getCurrentVoice();
    if (!currentVoice) return;
    
    // Get the current word based on active card
    let currentWord = '';
    if (activeCard === 'singular') {
      currentWord = currentRecord?.singular?.word || '';
    } else {
      currentWord = currentRecord?.plural?.word || '';
    }
    
    // Check if we already pronounced this specific card
    const currentKey = `${currentIndex}_${activeCard}`;
    if (lastSpokenRef.current === currentKey) return;
    
    if (currentWord && currentWord.trim() !== '') {
      lastSpokenRef.current = currentKey;
      speakText(currentWord);
    }
  };

  // Function to stop all pulsing and reset study state
  const resetStudyState = (showCompletionAlert = false) => {
    // Prevent multiple completions
    if (isCompletingRef.current) return;
    
    // Clear timer
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    
    // Cancel any ongoing speech
    if (isSpeechSupported()) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        console.warn('Error canceling speech:', e);
      }
    }
    setIsSpeaking(false);
    
    // Reset all state
    setIsStudying(false);
    setTimeRemaining(0);
    setActiveCard('singular');
    
    // Reset last spoken tracker
    lastSpokenRef.current = { index: -1, card: '' };
    initialStudyStartRef.current = false;
    
    // Remove pulse from both cards
    setCardPulsing('singular', false);
    setCardPulsing('plural', false);
    
    // Show completion alert only once
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

  // Function to move to next card
  const moveToNextCard = () => {
    const currentIdx = currentIndexRef.current;
    const currentActive = activeCardRef.current;
    const records = allRecordsRef.current;
    
    // Remove pulse from current card
    setCardPulsing(currentActive, false);
    
    if (currentActive === 'singular') {
      setActiveCard('plural');
      // Add pulse to new card after state update
      setTimeout(() => {
        setCardPulsing('plural', true);
        // Pronounce the plural word after card becomes active
        setTimeout(() => pronounceCurrentWord(), 200);
      }, 50);
    } else {
      if (currentIdx < records.length - 1) {
        setCurrentIndex(currentIdx + 1);
        setCurrentRecord(records[currentIdx + 1]);
        setActiveCard('singular');
        setTimeout(() => {
          setCardPulsing('singular', true);
          // Pronounce the singular word after card becomes active
          setTimeout(() => pronounceCurrentWord(), 200);
        }, 100);
      } else {
        // End of study session - reset everything with completion alert
        resetStudyState(true);
      }
    }
  };

  // Start study timer
  const startStudyTimer = () => {
    // Reset everything first
    resetStudyState(false);
    
    // Reset flags
    completionAlertShownRef.current = false;
    isCompletingRef.current = false;
    lastSpokenRef.current = { index: -1, card: '' };
    initialStudyStartRef.current = true;
    
    setTimeRemaining(settingsRef.current.studyTime);
    setIsStudying(true);
    setActiveCard('singular');
    
    // Add continuous pulse to active card
    setTimeout(() => {
      setCardPulsing('singular', true);
    }, 100);
    
    timerIntervalRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // Check if this is the last card and we're at the end
          const currentIdx = currentIndexRef.current;
          const currentActive = activeCardRef.current;
          const records = allRecordsRef.current;
          
          // If this is the last card (plural of last ID) - only move, don't show alert here
          if (currentActive === 'plural' && currentIdx === records.length - 1) {
            // Just move to next card, which will handle completion
            moveToNextCard();
            return settingsRef.current.studyTime;
          }
          
          moveToNextCard();
          return settingsRef.current.studyTime;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Stop study timer
  const stopStudyTimer = () => {
    resetStudyState(false);
  };

  // Restart timer when card changes
  useEffect(() => {
    if (isStudying && timerIntervalRef.current) {
      setTimeRemaining(settingsRef.current.studyTime);
      // Remove pulse from both, then add to active
      setCardPulsing('singular', false);
      setCardPulsing('plural', false);
      setTimeout(() => {
        setCardPulsing(activeCard, true);
        // Pronounce the word when card changes
        pronounceCurrentWord();
      }, 50);
    }
  }, [currentIndex, activeCard]);

  // Effect to handle initial pronunciation when study starts
  useEffect(() => {
    if (isStudying && initialStudyStartRef.current && currentRecord && activeCard === 'singular') {
      const currentKey = `${currentIndex}_singular`;
      if (lastSpokenRef.current !== currentKey) {
        const word = currentRecord.singular?.word;
        if (word && word.trim() !== '') {
          console.log('Initial pronunciation triggered via useEffect:', word);
          lastSpokenRef.current = currentKey;
          speakText(word);
          initialStudyStartRef.current = false;
        }
      }
    }
  }, [isStudying, currentRecord, activeCard, currentIndex]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (voiceLoadTimeoutRef.current) {
        clearTimeout(voiceLoadTimeoutRef.current);
      }
      // Cancel any ongoing speech on unmount
      if (isSpeechSupported()) {
        try {
          window.speechSynthesis.cancel();
        } catch (e) {
          console.warn('Error canceling speech on unmount:', e);
        }
      }
    };
  }, []);

  const handleMenuClick = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const openSettings = () => {
    setIsMenuOpen(false);
    setIsSettingsOpen(true);
  };

  const closeSettings = () => {
    setIsSettingsOpen(false);
  };

  const saveSettings = () => {
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
      card.style.width = `${settings.cardWidth}px`;
      card.style.height = `${settings.cardHeight}px`;
    });
    
    const cardsRow = document.querySelector('.cards-row');
    if (cardsRow) {
      cardsRow.style.gap = `${settings.cardGap}px`;
    }
    
    const englishWords = document.querySelectorAll('.english-word');
    englishWords.forEach(word => {
      word.style.fontSize = `${settings.fontSize}px`;
    });
    
    const transcriptions = document.querySelectorAll('.transcription');
    transcriptions.forEach(trans => {
      trans.style.display = settings.showTranscription ? 'block' : 'none';
    });
    
    const translations = document.querySelectorAll('.translation');
    translations.forEach(trans => {
      trans.style.display = settings.showTranslation ? 'block' : 'none';
    });
    
    if (settings.theme === 'light') {
      document.body.style.background = '#f5f5f5';
      document.querySelectorAll('.card').forEach(card => {
        card.style.background = '#ffffff';
        card.style.color = '#333';
      });
      document.querySelectorAll('.card-title, .english-word, .transcription, .translation').forEach(el => {
        el.style.color = '#333';
      });
    } else {
      document.body.style.background = '#000';
      document.querySelectorAll('.card').forEach(card => {
        card.style.background = '#4f4949';
        card.style.color = '#fff';
      });
      document.querySelectorAll('.card-title, .english-word, .transcription, .translation').forEach(el => {
        el.style.color = '#fff';
      });
    }
    
    if (isStudying) {
      resetStudyState(false);
      startStudyTimer();
    }
    
    alert('Settings saved successfully!');
    closeSettings();
  };

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleVoiceChange = (voiceName) => {
    console.log('User selected voice:', voiceName);
    
    // Store the user's selected voice name persistently
    userSelectedVoiceNameRef.current = voiceName;
    
    setSettings(prev => ({ ...prev, selectedVoiceName: voiceName }));
    
    // Update cached voice immediately
    if (voiceName) {
      const voice = availableVoices.find(v => v.name === voiceName);
      if (voice) {
        cachedVoiceRef.current = voice;
        const testText = "Hello! Voice selected successfully.";
        try {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(testText);
          utterance.voice = voice;
          utterance.rate = 0.9;
          utterance.pitch = 1.0;
          window.speechSynthesis.speak(utterance);
        } catch (e) {
          console.error('Error testing voice:', e);
        }
      }
    } else {
      cachedVoiceRef.current = null;
    }
  };

  const handleMainAction = () => {
    if (isStudying) {
      stopStudyTimer();
    } else {
      // Check if a database is loaded
      if (!dbLoaded || allRecords.length === 0) {
        alert('⚠️ No database loaded!\n\nPlease load a database file using the "Load DB" button before starting a study session.');
        return;
      }
      
      // Check if voice is supported
      if (!isSpeechSupported()) {
        alert('⚠️ Your browser does not support speech synthesis.\n\nPlease use a different browser like Firefox, Chrome, or Edge for voice features.');
        return;
      }
      
      // Check if voice is selected for pronunciation
      if (settings.autoPronounce && !settings.selectedVoiceName) {
        alert('⚠️ Please select a voice in Settings before starting the study session.\n\nGo to Settings → Voice Settings to select a voice.');
        return;
      }
      
      // If database is loaded, start study session
      if (dbLoaded && allRecords.length > 0) {
        startStudyTimer();
        if (settings.autoPronounce && settings.selectedVoiceName) {
          alert(`📖 Study session started!\n\nWords will be pronounced ${settings.repeatTimes} time(s) with: ${settings.selectedVoiceName}\n\nCards will pulse continuously while being studied.`);
        } else if (settings.autoPronounce && !settings.selectedVoiceName) {
          alert('📖 Study session started! But no voice selected. Words will not be pronounced.\n\nGo to Settings → Voice Settings to select a voice.');
        } else {
          alert('📖 Study session started! Auto-pronunciation is disabled.');
        }
      }
    }
  };

  // Function to render SVG with scoped CSS classes to prevent conflicts
  const renderSvgToContainer = (container, svgCode, uniqueId) => {
    if (!container) return;
    
    if (!svgCode || svgCode.trim() === '') {
      container.innerHTML = '';
      return;
    }
    
    try {
      if (svgCode.includes('<svg')) {
        // Create a unique ID for this SVG instance
        const scopeId = uniqueId || `svg-${Date.now()}-${Math.random()}`;
        
        // Insert the SVG
        container.innerHTML = svgCode;
        
        const svgElement = container.querySelector('svg');
        if (svgElement) {
          svgElement.setAttribute('width', '100%');
          svgElement.setAttribute('height', '100%');
          svgElement.style.maxWidth = '150px';
          svgElement.style.maxHeight = '150px';
          
          // Get all style elements in the SVG
          const styleElements = svgElement.querySelectorAll('style');
          styleElements.forEach(style => {
            let styleContent = style.innerHTML;
            // Replace class selectors with scoped versions
            styleContent = styleContent.replace(/\.st(\d+)/g, `.${scopeId}-st$1`);
            style.innerHTML = styleContent;
          });
          
          // Update all elements to use scoped classes
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
    if (isStudying) {
      stopStudyTimer();
    }
    
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
        
        if (records.length === 0) {
          throw new Error("Database file contains no records");
        }
        
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
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      setCurrentRecord(allRecords[newIndex]);
      setActiveCard('singular');
    }
  };

  const prevRecord = () => {
    if (allRecords.length > 0 && currentIndex > 0) {
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
        {/* Navigation buttons - Hidden when studying, shown when not studying */}
        {dbLoaded && allRecords.length > 0 && !isStudying && (
          <div className="navigation-buttons">
            <button onClick={prevRecord} className="nav-button">◀ Previous</button>
            <button onClick={nextRecord} className="nav-button">Next ▶</button>
          </div>
        )}

        <div className="cards-row">
          <div ref={singularCardRef} className="card">
            <div className="card-title">Singular</div>
            <div className="space-after-title"></div>
            <div className="english-word">{dbLoaded && currentRecord?.singular?.word ? currentRecord.singular.word : ""}</div>
            <div className="transcription">{dbLoaded && currentRecord?.singular?.transcription ? currentRecord.singular.transcription : ""}</div>
            <div className="svg-wrapper" ref={singularSvgRef}></div>
            <div className="translation">{dbLoaded && currentRecord?.singular?.translation ? currentRecord.singular.translation : ""}</div>
          </div>

          <div ref={pluralCardRef} className="card">
            <div className="card-title">Plural</div>
            <div className="space-after-title"></div>
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
                    <input 
                      type="checkbox" 
                      checked={settings.autoPronounce} 
                      onChange={(e) => handleSettingChange('autoPronounce', e.target.checked)} 
                    /> 
                    Auto-pronounce words during study
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
                  <select 
                    value={settings.selectedVoiceName}
                    onChange={(e) => {
                      handleVoiceChange(e.target.value);
                    }}
                    style={{
                      background: '#3c3c3c',
                      border: '1px solid #555',
                      color: 'white',
                      padding: '0.4rem 0.6rem',
                      borderRadius: '6px',
                      fontSize: '0.9rem',
                      width: '220px',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">-- Select a voice --</option>
                    {availableVoices.map((voice) => (
                      <option key={voice.name} value={voice.name}>
                        {voice.name} ({voice.lang})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="setting-item">
                  <label>Repeat English words:</label>
                  <input 
                    type="number" 
                    value={settings.repeatTimes} 
                    onChange={(e) => handleSettingChange('repeatTimes', parseInt(e.target.value) || 3)} 
                    min="1" 
                    max="5" 
                    step="1"
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
                <div className="setting-item">
                  <small style={{ color: '#4caf50', fontSize: '0.8rem', fontWeight: 'bold' }}>
                    ✓ Current voice: {settings.selectedVoiceName || "None selected"}
                  </small>
                </div>
                {!voiceSupport && (
                  <div className="setting-item">
                    <small style={{ color: '#f44336', fontSize: '0.8rem' }}>
                      ⚠️ Voice support not available in this browser. Please try Firefox or Chrome.
                    </small>
                  </div>
                )}
              </div>

              <div className="settings-section">
                <h3>Display Options</h3>
                <div className="setting-item checkbox">
                  <label>
                    <input type="checkbox" checked={settings.showTranscription} onChange={(e) => handleSettingChange('showTranscription', e.target.checked)} /> 
                    Show Transcription
                  </label>
                </div>
                <div className="setting-item checkbox">
                  <label>
                    <input type="checkbox" checked={settings.showTranslation} onChange={(e) => handleSettingChange('showTranslation', e.target.checked)} /> 
                    Show Translation
                  </label>
                </div>
              </div>

              <div className="settings-section">
                <h3>Theme</h3>
                <div className="setting-item radio-group">
                  <label>
                    <input type="radio" value="dark" checked={settings.theme === 'dark'} onChange={(e) => handleSettingChange('theme', e.target.value)} /> 
                    Dark Theme
                  </label>
                  <label>
                    <input type="radio" value="light" checked={settings.theme === 'light'} onChange={(e) => handleSettingChange('theme', e.target.value)} /> 
                    Light Theme
                  </label>
                </div>
              </div>
            </div>

            <div className="settings-footer">
              <button className="settings-cancel" onClick={closeSettings}>Cancel</button>
              <button className="settings-save" onClick={saveSettings}>Save Settings</button>
            </div>
          </div>
        </div>
      )}

      {isMenuOpen && (
        <div className="menu-dropdown">
          <div className="menu-item" onClick={handleMainAction}>{isStudying ? 'Stop Study' : 'Start Study'}</div>
          <div className="menu-item" onClick={loadDatabaseFromFile}>Load Database</div>
          <div className="menu-item" onClick={prevRecord}>Previous ID</div>
          <div className="menu-item" onClick={nextRecord}>Next ID</div>
          <div className="menu-item" onClick={stopStudyTimer}>Stop Study</div>
          <div className="menu-item">Home</div>
          <div className="menu-item">Words</div>
          <div className="menu-item" onClick={openSettings}>⚙️ Settings</div>
          <div className="menu-item">About</div>
        </div>
      )}
    </div>
  );
};

export default App;