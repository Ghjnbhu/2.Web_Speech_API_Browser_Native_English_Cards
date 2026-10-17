# 2.Web_Speech_API_Browser_Native_English_Cards
Web Speech API Browser Native English Cards

SVG Canvas Size Adapts to Available Vertical Space
Hide "Load DB" During Study, Keep Nav Arrows & Stop Button in Same Position
Hide Arrows During Study
CSS pixels — the browser's layout viewport

.top-bar-wrapper
└── .top-bar
    ├── .header-left
    │   ├── <button.nav-button.theme-button>  ☀️/🌙      ← toggleTheme
    │   ├── <div.header-title>                 Eco Cards
    │   ├── <button.menu-button>               🔧        ← openSettings
    │   └── <div.header-db-info>                          ← only if dbLoaded
    │       ├── .db-info-label                 📁
    │       ├── .db-info-name                  filename
    │       ├── .db-info-separator             |
    │       ├── .db-info-id                    ID: 42
    │       ├── .db-info-timer                 🔊 if speaking
    │       └── .db-info-repeat                status chip
    │
    └── .header-buttons
        ├── <button.nav-button>                ◀         ← prevRecord
        ├── <button.nav-button>                ▶         ← nextRecord
        ├── <button.load-db-button>            📁/🌐     ← loadDatabase
        ├── <span.recognized-chip>             apple     ← during repeat-after-me
        └── <button.start-button/stop-button>  🚀/⏹️     ← handleMainAction

Visual result — repeat-after-me with recognized chip
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                     │
│  [☀️] Eco Cards [🔧] [📁 myLesson | ID: 42 | 🎤 Listening (1/3)] [◀] [▶] [📁] apple [⏹️]│
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘


Result on a tablet or narrow desktop:
┌──────────────────────────────────────────────────┐
│  [☀️] Eco Cards [🔧] [📁 myLesson | ID: 42]     │
│                        [◀] [▶] [📁] [🚀 Start]  │
└──────────────────────────────────────────────────┘


Responsive — phone (≤600 px)
┌────────────────────────────────────────┐
│  [☀️] Eco [🔧] [📁 myL… | 42 | 🎤]     │
│                    [◀][▶][📁][🚀 Start]│
└────────────────────────────────────────┘

The status pill shows ✅ Matched (2/3) instead of the old ID-only content

Make the status pill clickable — same behavior as the Load lesson button
Change in App.jsx — the empty-state branch of the pill

When "Repeat pronunciation if words not equal" is unchecked, a recognition fault should not re-pronounce, re-listen, or re-compare — it should just advance like a normal wrong-answer pass.

In Repeat-after-me, the user should be allowed to go through all Attempt values for a card — e.g. if Attempt: 3, they should get 3 total tries on that card regardless of the checkbox.

Portrait (auto-align ON):
┌─────────────────────────────────────────────┐
│  ☀️  Eco Cards  🔧    ◀  ▶  🚀 Start      │  ← row 1
├─────────────────────────────────────────────┤
│  🌐 filename.dbms | ID: 5 / 120             │  ← row 2 (status pill)
└─────────────────────────────────────────────┘

Result — portrait, auto-align ON
text
┌────────────── top bar (row 1) ──────────────┐
│ ☀️  Eco Cards  🔧    ◀  ▶  🚀 Start        │
├────────────── top bar (row 2) ──────────────┤
│ 🌐 filename.dbms | ID: 5 / 120              │
└─────────────────────────────────────────────┘
                 ↕ 10px
┌─────────────────────────────────────────────┐
│              singular card                   │
│                (auto height)                 │
└─────────────────────────────────────────────┘
                 ↕ 10px
┌─────────────────────────────────────────────┐
│               plural card                    │
│                (auto height)                 │
└─────────────────────────────────────────────┘
                 ↕ 10px
           bottom of viewport

Clicking an Already-Active Card Should Stop Its Pronunciation and Flashing

Change: click on wordless card in Navigation mode pronounces only the translation

Behaviour summary after the patch
Card state	            Navigation mode (click)                 Auto Study (advance)	        Repeat-after-me
word + translation	    word → translation                      word → translation → advance	word only (attempts, mic)
word only	word	    word → advance	word only               translation only	            translation (pulse → speak → unpulse)
translation → advance	skipped (advances without speaking)     neither	silent no-op	        advance	skipped

DB pill button

<project-root>/public/lessons/raf-stats.json - for local server
<project-root>/api/raf-stats.json - for vercel

Upstash Redis Free Tier (current)
Limit	Free Tier
Price	$0 / month
Data size	256 MB
Monthly commands	500,000
Monthly bandwidth	10 GB
Max commands / sec	10,000
Databases	1
Credit card required?	No

SSR/SEO имеет смысл, если:
Вы хотите, чтобы уроки находились через Google (например, «английские карточки животные»)
У вас есть лендинг или блог с описанием приложения
Вы планируете публичный сервис с регистрацией пользователей

 SSR для скорости 