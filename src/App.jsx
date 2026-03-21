// App.js
import React, { useState } from 'react';
import './App.css';

const App = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleMenuClick = () => {
    setIsMenuOpen(!isMenuOpen);
    // You can add menu functionality here
    console.log('Menu clicked');
  };

  return (
    <div className="app">
      {/* HEADER (edges match cards exactly) */}
      <div className="top-bar-wrapper">
        <div className="top-bar">
          <button className="menu-button" onClick={handleMenuClick}>
            Menu
          </button>
          <div className="header-title">English Study</div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="page-content">
        <div className="cards-row">
          {/* SINGULAR CARD */}
          <div className="card">
            <div className="card-title">Singular</div>

            <div className="space-after-title">   </div>

            <div className="english-word">Apple</div>
            <div className="transcription">[ˈæp.əl]</div>

            <div className="svg-wrapper">

<svg width="200" height="200" viewBox="0 0 125 125" xmlns="http://www.w3.org/2000/svg">
  <path
    d="M50,30
       C30,30 10,40 10,65
       C10,95 35,100 45,95 
       C48,93 52,93 55,95
       C65,100 90,95 90,65
       C90,40 70,30 50,30 Z" 
    fill="green"
  />
  <path
    d="M50,30 Q51,15 58,10" 
    stroke="black"
    stroke-width="3" 
    fill="none"
    stroke-linecap="round" 
  />
  <path 
    d="M50,18 C40,5 20,5 12,15 C30,25 45,25 50,18 Z" 
    fill="darkgreen"
  />
</svg>



            </div>

            <div className="translation">яблоко</div>
          </div>

          {/* PLURAL CARD */}
          <div className="card">
            <div className="card-title">Plural</div>

            <div className="space-after-title">   </div>

            <div className="english-word">Apples</div>
            <div className="transcription">[ˈæp.əlz]</div>

            <div className="svg-wrapper">
              <svg viewBox="0 0 80 64" xmlns="http://www.w3.org/2000/svg">
                <g transform="translate(4,0)">
                  <path
                    d="M26 10c-2.5 0-5 1.5-6.5 3.2C18 11.5 16 10 13.5 10 10 10 7 13 7 17c0 2.7 1.2 5.3 3.2 7.1C8 25 6 27.5 6 31c0 7 5 17 12 17s12-10 12-17c0-3.5-2-6-4.2-6.9C27.8 21.3 29 18.7 29 16c0-4-3-6-7-6z"
                    fill="#e53935"
                  />
                  <path
                    d="M20 12c1-3 3-5 6-6"
                    stroke="#2e7d32"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                  />
                </g>
                <g transform="translate(26,4)">
                  <path
                    d="M26 10c-2.5 0-5 1.5-6.5 3.2C18 11.5 16 10 13.5 10 10 10 7 13 7 17c0 2.7 1.2 5.3 3.2 7.1C8 25 6 27.5 6 31c0 7 5 17 12 17s12-10 12-17c0-3.5-2-6-4.2-6.9C27.8 21.3 29 18.7 29 16c0-4-3-6-7-6z"
                    fill="#f4511e"
                  />
                  <path
                    d="M20 12c1-3 3-5 6-6"
                    stroke="#2e7d32"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                  />
                </g>
              </svg>
            </div>

            <div className="translation">яблоки</div>
          </div>
        </div>
      </div>

      {/* Optional: Menu dropdown if needed */}
      {isMenuOpen && (
        <div className="menu-dropdown">
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