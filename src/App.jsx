import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HomePage } from './components/HomePage';
import { BibleReader } from './components/BibleReader';
import { SongReader } from './components/SongReader';
import { ProjectorConsole } from './components/ProjectorConsole';
import { DailyVerseSection } from './components/DailyVerseSection';
import { ToolsSection } from './components/ToolsSection';
import { QuickSearchModal } from './components/QuickSearchModal';
import { SettingsModal } from './components/SettingsModal';
import { PresenterToolbar } from './components/PresenterToolbar';
import { ProjectorDisplay } from './components/ProjectorDisplay';
import { useProjectorSync } from './hooks/useProjectorSync';

export function App() {
  // Check if this window is running as dedicated projector output (for 2nd monitor)
  const [isProjectorRoute, setIsProjectorRoute] = useState(() => {
    return window.location.hash === '#projector' || window.location.search.includes('projector=true');
  });

  useEffect(() => {
    const handleHashChange = () => {
      setIsProjectorRoute(window.location.hash === '#projector' || window.location.search.includes('projector=true'));
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Shared projector sync hook instance
  const projector = useProjectorSync();

  // UI Language State: 'ta' (Tamil) or 'en' (English)
  const [uiLang, setUiLang] = useState(() => {
    return localStorage.getItem('worship_cloud_ui_lang') || 'ta';
  });

  // Navigation State: 'home' | 'bible' | 'songs' | 'projector' | 'daily' | 'tools'
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('worship_cloud_active_tab') || 'home';
  });

  const [booksMeta, setBooksMeta] = useState([]);
  const [songsIndex, setSongsIndex] = useState(null);

  // Bible Reader State
  const [currentBookCode, setCurrentBookCode] = useState(() => {
    return localStorage.getItem('ortho_current_book') || 'GEN';
  });
  const [currentChapter, setCurrentChapter] = useState(() => {
    return parseInt(localStorage.getItem('ortho_current_chapter') || '1', 10);
  });
  const [targetVerse, setTargetVerse] = useState(null);

  // Settings & Themes
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('ortho_theme');
    if (saved === 'emerald') return 'parchment';
    return saved || 'parchment';
  });
  const [fontSize, setFontSize] = useState(19);
  const [parallelMode, setParallelMode] = useState(false);

  // Modals
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedSongForViewer, setSelectedSongForViewer] = useState(null);

  // Apply theme to DOM
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ortho_theme', theme);
  }, [theme]);

  // Persist UI language
  useEffect(() => {
    localStorage.setItem('worship_cloud_ui_lang', uiLang);
  }, [uiLang]);

  // Persist active tab
  useEffect(() => {
    localStorage.setItem('worship_cloud_active_tab', activeTab);
  }, [activeTab]);

  // Persist current book/chapter
  useEffect(() => {
    localStorage.setItem('ortho_current_book', currentBookCode);
    localStorage.setItem('ortho_current_chapter', String(currentChapter));
  }, [currentBookCode, currentChapter]);

  // Load Bible metadata on mount
  useEffect(() => {
    fetch('./data/bible-meta.json')
      .then((r) => r.json())
      .then((data) => setBooksMeta(data))
      .catch((err) => console.error('Failed to load bible-meta:', err));
  }, []);

  // Load Songs Index lazily when needed
  useEffect(() => {
    if (activeTab === 'songs' || activeTab === 'projector' || activeTab === 'tools' || isSearchOpen) {
      if (!songsIndex) {
        fetch('./data/songs/songs-index.json')
          .then((r) => r.json())
          .then((data) => setSongsIndex(data))
          .catch((err) => console.error('Failed to load songs index:', err));
      }
    }
  }, [activeTab, isSearchOpen, songsIndex]);

  // Global Keyboard shortcut: Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Dedicated projector view (runs unconditionally after all hooks)
  if (isProjectorRoute) {
    return <ProjectorDisplay projector={projector} />;
  }

  const handleSelectBookChapter = (bookCode, chapter) => {
    setCurrentBookCode(bookCode);
    setCurrentChapter(chapter);
    setTargetVerse(1);
  };

  const handleSelectBibleReference = (bookCode, chapter, verse) => {
    setActiveTab('bible');
    setCurrentBookCode(bookCode);
    setCurrentChapter(chapter);
    setTargetVerse(verse || 1);
  };

  const handleSelectPage = (pageNum) => {
    if (!booksMeta.length) return;
    const targetBook = [...booksMeta].reverse().find((b) => b.startPage <= pageNum) || booksMeta[0];
    setActiveTab('bible');
    setCurrentBookCode(targetBook.code);
    setCurrentChapter(1);
    setTargetVerse(1);
  };

  const handleSelectSong = (song) => {
    setActiveTab('songs');
    setSelectedSongForViewer(song);
  };

  return (
    <div style={{ height: '100vh', maxHeight: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Top Global Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSearch={() => setIsSearchOpen(true)}
        theme={theme}
        setTheme={setTheme}
        fontSize={fontSize}
        setFontSize={setFontSize}
        activeSlide={projector.activeSlide}
        onOpenProjector={projector.openProjectorWindow}
        uiLang={uiLang}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Content Area */}
      <main style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {activeTab === 'home' && (
          <HomePage onNavigate={setActiveTab} uiLang={uiLang} />
        )}

        {activeTab === 'bible' && (
          <BibleReader
            booksMeta={booksMeta}
            currentBookCode={currentBookCode}
            currentChapter={currentChapter}
            onSelectBookChapter={handleSelectBookChapter}
            parallelMode={parallelMode}
            setParallelMode={setParallelMode}
            fontSize={fontSize}
            setFontSize={setFontSize}
            targetVerse={targetVerse}
            setTargetVerse={setTargetVerse}
            uiLang={uiLang}
          />
        )}

        {activeTab === 'songs' && (
          <SongReader
            songsIndex={songsIndex}
            fontSize={fontSize}
            selectedSongInit={selectedSongForViewer}
            uiLang={uiLang}
          />
        )}

        {activeTab === 'projector' && (
          <ProjectorConsole
            booksMeta={booksMeta}
            songsIndex={songsIndex}
            projector={projector}
            uiLang={uiLang}
          />
        )}

        {activeTab === 'daily' && (
          <DailyVerseSection
            booksMeta={booksMeta}
            onOpenInBible={handleSelectBibleReference}
            onProjectVerse={projector.projectVerse}
            uiLang={uiLang}
          />
        )}

        {activeTab === 'tools' && (
          <ToolsSection songsIndex={songsIndex} uiLang={uiLang} projector={projector} />
        )}
      </main>

      {/* Floating Presenter Toolbar */}
      {activeTab !== 'projector' && (
        <PresenterToolbar
          activeSlide={projector.activeSlide}
          isBlackout={projector.isBlackout}
          isClear={projector.isClear}
          onPrev={projector.prevSlide}
          onNext={projector.nextSlide}
          onToggleBlackout={projector.toggleBlackout}
          onToggleClear={projector.toggleClear}
          onUnproject={projector.unproject}
          onOpenProjectorWindow={projector.openProjectorWindow}
          uiLang={uiLang}
        />
      )}

      {/* Global Quick Search Modal */}
      <QuickSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        booksMeta={booksMeta}
        onSelectBibleReference={handleSelectBibleReference}
        onSelectPage={handleSelectPage}
        onSelectSong={handleSelectSong}
        songsIndex={songsIndex}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        uiLang={uiLang}
        setUiLang={setUiLang}
        theme={theme}
        setTheme={setTheme}
        fontSize={fontSize}
        setFontSize={setFontSize}
      />
    </div>
  );
}

export default App;
