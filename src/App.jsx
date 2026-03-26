// App.js
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

  // Refs for SVG containers
  const singularSvgRef = useRef(null);
  const pluralSvgRef = useRef(null);

  const handleMenuClick = () => {
    setIsMenuOpen(!isMenuOpen);
    console.log('Menu clicked');
  };

  // Function to render SVG directly to DOM
  const renderSvgToContainer = (container, svgCode) => {
    if (!container) return;
    
    if (!svgCode || svgCode.trim() === '') {
      container.innerHTML = '';
      return;
    }
    
    try {
      if (svgCode.includes('<svg')) {
        container.innerHTML = svgCode;
        const svgElement = container.querySelector('svg');
        if (svgElement) {
          svgElement.setAttribute('width', '100%');
          svgElement.setAttribute('height', '100%');
          svgElement.style.maxWidth = '150px';
          svgElement.style.maxHeight = '150px';
        }
      } else {
        container.innerHTML = '';
      }
    } catch (error) {
      console.error('Error rendering SVG:', error);
      container.innerHTML = '';
    }
  };

  // Function to load database from .json file
  const loadDatabaseFromFile = async () => {
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
        
        // Convert all records to card format
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
        setDbLoaded(true);
        setDbFileName(importedData.name || file.name.replace(/\.(json|dbms)$/, ''));
        
        alert(`✅ Database loaded successfully!\n\nFile: ${file.name}\nRecords: ${records.length}\nNow showing first record (ID: ${convertedRecords[0].id})`);
        
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

  // Navigation functions
  const nextRecord = () => {
    if (allRecords.length > 0 && currentIndex < allRecords.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      setCurrentRecord(allRecords[newIndex]);
    }
  };

  const prevRecord = () => {
    if (allRecords.length > 0 && currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      setCurrentRecord(allRecords[newIndex]);
    }
  };

  // Render SVGs whenever currentRecord changes
  useEffect(() => {
    if (currentRecord && dbLoaded) {
      setTimeout(() => {
        renderSvgToContainer(singularSvgRef.current, currentRecord.singular?.svgCode);
        renderSvgToContainer(pluralSvgRef.current, currentRecord.plural?.svgCode);
      }, 50);
    } else if (!dbLoaded) {
      if (singularSvgRef.current) singularSvgRef.current.innerHTML = '';
      if (pluralSvgRef.current) pluralSvgRef.current.innerHTML = '';
    }
  }, [currentRecord, dbLoaded]);

  return (
    <div className="app">
      {/* HEADER (edges match cards exactly) */}
      <div className="top-bar-wrapper">
        <div className="top-bar">
          <div className="header-left">
            <button className="menu-button" onClick={handleMenuClick}>
              Menu
            </button>
            <div className="header-title">English Study</div>
          </div>
          
          {/* Database info in header */}
          {dbLoaded && currentRecord && (
            <div className="header-db-info">
              <span className="db-info-label">📁</span>
              <span className="db-info-name">{dbFileName}</span>
              <span className="db-info-separator">|</span>
              <span className="db-info-id">ID: {currentRecord.id}</span>
              {allRecords.length > 1 && (
                <>
                  <span className="db-info-separator">|</span>
                  <span className="db-info-count">{currentIndex + 1}/{allRecords.length}</span>
                </>
              )}
            </div>
          )}
          
          <button className="load-db-button" onClick={loadDatabaseFromFile} disabled={isLoading}>
            {isLoading ? 'Loading...' : '📂 Load DB'}
          </button>
        </div>
      </div>

      {/* CONTENT - reduced top padding */}
      <div className="page-content">
        {/* Navigation buttons when multiple records */}
        {dbLoaded && allRecords.length > 1 && (
          <div className="navigation-buttons">
            <button onClick={prevRecord} className="nav-button" disabled={currentIndex === 0}>
              ◀ Previous
            </button>
            <span className="nav-counter">{currentIndex + 1} / {allRecords.length}</span>
            <button onClick={nextRecord} className="nav-button" disabled={currentIndex === allRecords.length - 1}>
              Next ▶
            </button>
          </div>
        )}

        <div className="cards-row">
          {/* SINGULAR CARD */}
          <div className="card">
            <div className="card-title">Singular</div>
            <div className="space-after-title">   </div>
            <div className="english-word">
              {dbLoaded && currentRecord?.singular?.word ? currentRecord.singular.word : ""}
            </div>
            <div className="transcription">
              {dbLoaded && currentRecord?.singular?.transcription ? currentRecord.singular.transcription : ""}
            </div>
            <div className="svg-wrapper" ref={singularSvgRef}>
              {/* SVG will be rendered here dynamically */}
            </div>
            <div className="translation">
              {dbLoaded && currentRecord?.singular?.translation ? currentRecord.singular.translation : ""}
            </div>
          </div>

          {/* PLURAL CARD */}
          <div className="card">
            <div className="card-title">Plural</div>
            <div className="space-after-title">   </div>
            <div className="english-word">
              {dbLoaded && currentRecord?.plural?.word ? currentRecord.plural.word : ""}
            </div>
            <div className="transcription">
              {dbLoaded && currentRecord?.plural?.transcription ? currentRecord.plural.transcription : ""}
            </div>
            <div className="svg-wrapper" ref={pluralSvgRef}>
              {/* SVG will be rendered here dynamically */}
            </div>
            <div className="translation">
              {dbLoaded && currentRecord?.plural?.translation ? currentRecord.plural.translation : ""}
            </div>
          </div>
        </div>
      </div>

      {/* Optional: Menu dropdown if needed */}
      {isMenuOpen && (
        <div className="menu-dropdown">
          <div className="menu-item" onClick={loadDatabaseFromFile}>Load Database</div>
          <div className="menu-item" onClick={prevRecord}>Previous Record</div>
          <div className="menu-item" onClick={nextRecord}>Next Record</div>
          <div className="menu-item">Home</div>
          <div className="menu-item">Words</div>
          <div className="menu-item">Settings</div>
          <div className="menu-item">About</div>
        </div>
      )}
    </div>
  );
};

export default App;