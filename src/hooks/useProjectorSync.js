import { useState, useEffect, useCallback, useRef } from 'react';

const CHANNEL_NAME = 'ortho-projection-channel-v2';
const STORAGE_KEY = 'ortho_live_slide_state_v2';

const DEFAULT_STATE = {
  activeSlide: null,
  isBlackout: false,
  isClear: false,
  theme: 'midnight-gold',
  fontSize: 48,
  highlights: [],
  highlightColor: '#f6d365',
  timestamp: Date.now()
};

export function useProjectorSync() {
  const [state, setState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_STATE;
  });

  const channelRef = useRef(null);
  const popupRef = useRef(null);
  const lastTimestampRef = useRef(state.timestamp || 0);

  // Sync state safely to localStorage and all channels
  const syncToAll = useCallback((newState) => {
    lastTimestampRef.current = newState.timestamp;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    } catch (e) {
      console.warn('Storage sync error:', e);
    }

    // 1. BroadcastChannel
    if (channelRef.current) {
      try {
        channelRef.current.postMessage(newState);
      } catch (e) {}
    }

    // 2. Direct popup window reference (if this is controller)
    if (popupRef.current && !popupRef.current.closed) {
      try {
        popupRef.current.postMessage({ type: 'PROJECTOR_SYNC_STATE', payload: newState }, '*');
      } catch (e) {}
    }

    // 3. Direct opener reference (if this is popup)
    if (typeof window !== 'undefined' && window.opener && !window.opener.closed) {
      try {
        window.opener.postMessage({ type: 'PROJECTOR_SYNC_STATE', payload: newState }, '*');
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    // Setup BroadcastChannel
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        channelRef.current = new BroadcastChannel(CHANNEL_NAME);
        channelRef.current.onmessage = (event) => {
          if (event?.data?.type === 'CLOSE_PROJECTOR_WINDOW') {
            if (typeof window !== 'undefined' && (window.location.hash === '#projector' || window.location.search.includes('projector=true'))) {
              window.close();
            }
            return;
          }
          if (event?.data && event.data.timestamp > lastTimestampRef.current) {
            lastTimestampRef.current = event.data.timestamp;
            setState(event.data);
          }
        };
      }
    } catch (e) {
      console.warn('BroadcastChannel initialization warning:', e);
    }

    // Storage Event Listener (cross-tab / cross-window)
    const handleStorage = (e) => {
      if (e.key === 'ortho_close_projector_trigger') {
        if (typeof window !== 'undefined' && (window.location.hash === '#projector' || window.location.search.includes('projector=true'))) {
          window.close();
        }
        return;
      }
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed.timestamp > lastTimestampRef.current) {
            lastTimestampRef.current = parsed.timestamp;
            setState(parsed);
          }
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);

    // Direct Window postMessage Listener
    const handleWindowMessage = (e) => {
      if (e.data?.type === 'CLOSE_PROJECTOR_WINDOW') {
        if (typeof window !== 'undefined' && (window.location.hash === '#projector' || window.location.search.includes('projector=true'))) {
          window.close();
        }
        return;
      }
      if (e.data?.type === 'PROJECTOR_SYNC_STATE' && e.data.payload) {
        const payload = e.data.payload;
        if (payload.timestamp > lastTimestampRef.current) {
          lastTimestampRef.current = payload.timestamp;
          setState(payload);
        }
      }
    };
    window.addEventListener('message', handleWindowMessage);

    // High-frequency polling backup (every 150ms) to ensure instant sync even if browser throttles events
    const pollInterval = setInterval(() => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.timestamp > lastTimestampRef.current) {
            lastTimestampRef.current = parsed.timestamp;
            setState(parsed);
          }
        }
      } catch {}
    }, 150);

    // Announce to other windows that this window is ready
    if (channelRef.current) {
      channelRef.current.postMessage({ type: 'REQUEST_LATEST_STATE' });
    }

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('message', handleWindowMessage);
      clearInterval(pollInterval);
      if (channelRef.current) {
        try {
          channelRef.current.close();
        } catch {}
      }
    };
  }, []);

  const broadcastState = useCallback((updater) => {
    setState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      const updated = { ...next, timestamp: Date.now() };
      syncToAll(updated);
      return updated;
    });
  }, [syncToAll]);

  const projectVerse = useCallback((verseData) => {
    const slide = {
      id: `bible-${verseData.bookCode}-${verseData.chapterNumber}-${verseData.verseNumber}`,
      type: 'bible',
      title: `${verseData.bookName} ${verseData.chapterNumber}:${verseData.verseNumber}`,
      reference: `${verseData.bookName} ${verseData.chapterNumber}:${verseData.verseNumber}`,
      subReference: verseData.englishBookName ? `${verseData.englishBookName} ${verseData.chapterNumber}:${verseData.verseNumber}` : '',
      text: verseData.text,
      englishText: verseData.englishText || '',
      page: verseData.page,
      bookCode: verseData.bookCode,
      bookName: verseData.bookName,
      chapterNumber: verseData.chapterNumber,
      verseNumber: verseData.verseNumber,
      allVerses: verseData.allVerses || []
    };

    broadcastState((prev) => ({
      ...prev,
      activeSlide: slide,
      highlights: [],
      isBlackout: false,
      isClear: false
    }));
  }, [broadcastState]);

  const projectSongStanza = useCallback((songData) => {
    const slide = {
      id: `song-${songData.songId}-${songData.sectionId}`,
      type: 'song',
      title: songData.songTitle,
      reference: songData.sectionLabel,
      subReference: songData.songTitle,
      text: songData.text,
      lines: songData.lines || [songData.text],
      songId: songData.songId,
      songTitle: songData.songTitle,
      sectionId: songData.sectionId,
      allSections: songData.allSections || []
    };

    broadcastState((prev) => ({
      ...prev,
      activeSlide: slide,
      highlights: [],
      isBlackout: false,
      isClear: false
    }));
  }, [broadcastState]);

  const projectSlide = useCallback((slide) => {
    broadcastState((prev) => ({
      ...prev,
      activeSlide: slide,
      highlights: [],
      isBlackout: false,
      isClear: false
    }));
  }, [broadcastState]);

  const toggleBlackout = useCallback(() => {
    broadcastState((prev) => ({
      ...prev,
      isBlackout: !prev.isBlackout
    }));
  }, [broadcastState]);

  const toggleClear = useCallback(() => {
    broadcastState((prev) => ({
      ...prev,
      isClear: !prev.isClear
    }));
  }, [broadcastState]);

  const unproject = useCallback(() => {
    broadcastState((prev) => ({
      ...prev,
      activeSlide: null,
      highlights: [],
      isBlackout: false,
      isClear: false
    }));
  }, [broadcastState]);

  const addHighlight = useCallback((text, color) => {
    const trimmed = String(text || '').trim();
    if (!trimmed) return;

    broadcastState((prev) => {
      const activeColor = color || prev.highlightColor || '#f6d365';
      const existing = prev.highlights || [];
      const alreadyExists = existing.some((h) => h.text.toLowerCase() === trimmed.toLowerCase());
      if (alreadyExists) return prev;

      const newHighlights = [...existing, { text: trimmed, color: activeColor }];
      return {
        ...prev,
        highlights: newHighlights,
        activeSlide: prev.activeSlide ? { ...prev.activeSlide, highlights: newHighlights } : prev.activeSlide
      };
    });
  }, [broadcastState]);

  const removeHighlight = useCallback((text) => {
    broadcastState((prev) => {
      const newHighlights = (prev.highlights || []).filter((h) => h.text !== text);
      return {
        ...prev,
        highlights: newHighlights,
        activeSlide: prev.activeSlide ? { ...prev.activeSlide, highlights: newHighlights } : prev.activeSlide
      };
    });
  }, [broadcastState]);

  const clearHighlights = useCallback(() => {
    broadcastState((prev) => ({
      ...prev,
      highlights: [],
      activeSlide: prev.activeSlide ? { ...prev.activeSlide, highlights: [] } : prev.activeSlide
    }));
  }, [broadcastState]);

  const setHighlightColor = useCallback((color) => {
    broadcastState((prev) => ({
      ...prev,
      highlightColor: color
    }));
  }, [broadcastState]);

  const setProjectorTheme = useCallback((themeName) => {
    broadcastState((prev) => ({ ...prev, theme: themeName }));
  }, [broadcastState]);

  const nextSlide = useCallback(() => {
    broadcastState((prev) => {
      const slide = prev.activeSlide;
      if (!slide) return prev;

      // 1. Unified slide deck navigation (Media, Bible, Song, Custom)
      if (slide.presentationSlides && slide.presentationSlides.length) {
        const currentIndex = slide.presentationSlides.findIndex((s) => s.id === slide.id);
        if (currentIndex >= 0 && currentIndex < slide.presentationSlides.length - 1) {
          const nextS = slide.presentationSlides[currentIndex + 1];
          return {
            ...prev,
            isBlackout: false,
            isClear: false,
            highlights: nextS.highlights || [],
            activeSlide: {
              ...slide,
              ...nextS,
              text: nextS.body || nextS.text || nextS.title || '',
              reference: nextS.reference || '',
              mediaPath: nextS.mediaPath || null,
              mediaType: nextS.mediaType || 'text',
              bgType: nextS.bgType || slide.bgType,
              textureSrc: nextS.textureSrc || slide.textureSrc,
              bgOverlayOpacity: nextS.bgOverlayOpacity ?? slide.bgOverlayOpacity,
              presentationSlides: slide.presentationSlides
            }
          };
        }
      }

      if (slide.type === 'bible' && slide.allVerses && slide.allVerses.length) {
        const currentIndex = slide.allVerses.findIndex((v) => v.number === slide.verseNumber);
        if (currentIndex >= 0 && currentIndex < slide.allVerses.length - 1) {
          const nextVerse = slide.allVerses[currentIndex + 1];
          return {
            ...prev,
            isBlackout: false,
            isClear: false,
            highlights: [],
            activeSlide: {
              ...slide,
              id: `bible-${slide.bookCode}-${slide.chapterNumber}-${nextVerse.number}`,
              verseNumber: nextVerse.number,
              title: `${slide.bookName} ${slide.chapterNumber}:${nextVerse.number}`,
              reference: `${slide.bookName} ${slide.chapterNumber}:${nextVerse.number}`,
              text: nextVerse.text,
              englishText: nextVerse.englishText || '',
              page: nextVerse.page || slide.page
            }
          };
        }
      }

      if (slide.type === 'song' && slide.allSections && slide.allSections.length) {
        const currentIndex = slide.allSections.findIndex((s) => s.id === slide.sectionId);
        if (currentIndex >= 0 && currentIndex < slide.allSections.length - 1) {
          const nextSection = slide.allSections[currentIndex + 1];
          return {
            ...prev,
            isBlackout: false,
            isClear: false,
            highlights: [],
            activeSlide: {
              ...slide,
              id: `song-${slide.songId}-${nextSection.id}`,
              sectionId: nextSection.id,
              reference: nextSection.label,
              text: nextSection.text,
              lines: nextSection.lines
            }
          };
        }
      }

      return prev;
    });
  }, [broadcastState]);

  const prevSlide = useCallback(() => {
    broadcastState((prev) => {
      const slide = prev.activeSlide;
      if (!slide) return prev;

      // 1. Unified slide deck navigation (Media, Bible, Song, Custom)
      if (slide.presentationSlides && slide.presentationSlides.length) {
        const currentIndex = slide.presentationSlides.findIndex((s) => s.id === slide.id);
        if (currentIndex > 0) {
          const prevS = slide.presentationSlides[currentIndex - 1];
          return {
            ...prev,
            isBlackout: false,
            isClear: false,
            highlights: prevS.highlights || [],
            activeSlide: {
              ...slide,
              ...prevS,
              text: prevS.body || prevS.text || prevS.title || '',
              reference: prevS.reference || '',
              mediaPath: prevS.mediaPath || null,
              mediaType: prevS.mediaType || 'text',
              bgType: prevS.bgType || slide.bgType,
              textureSrc: prevS.textureSrc || slide.textureSrc,
              bgOverlayOpacity: prevS.bgOverlayOpacity ?? slide.bgOverlayOpacity,
              presentationSlides: slide.presentationSlides
            }
          };
        }
      }

      if (slide.type === 'bible' && slide.allVerses && slide.allVerses.length) {
        const currentIndex = slide.allVerses.findIndex((v) => v.number === slide.verseNumber);
        if (currentIndex > 0) {
          const prevVerse = slide.allVerses[currentIndex - 1];
          return {
            ...prev,
            isBlackout: false,
            isClear: false,
            highlights: [],
            activeSlide: {
              ...slide,
              id: `bible-${slide.bookCode}-${slide.chapterNumber}-${prevVerse.number}`,
              verseNumber: prevVerse.number,
              title: `${slide.bookName} ${slide.chapterNumber}:${prevVerse.number}`,
              reference: `${slide.bookName} ${slide.chapterNumber}:${prevVerse.number}`,
              text: prevVerse.text,
              englishText: prevVerse.englishText || '',
              page: prevVerse.page || slide.page
            }
          };
        }
      }

      if (slide.type === 'song' && slide.allSections && slide.allSections.length) {
        const currentIndex = slide.allSections.findIndex((s) => s.id === slide.sectionId);
        if (currentIndex > 0) {
          const prevSection = slide.allSections[currentIndex - 1];
          return {
            ...prev,
            isBlackout: false,
            isClear: false,
            highlights: [],
            activeSlide: {
              ...slide,
              id: `song-${slide.songId}-${prevSection.id}`,
              sectionId: prevSection.id,
              reference: prevSection.label,
              text: prevSection.text,
              lines: prevSection.lines
            }
          };
        }
      }

      return prev;
    });
  }, [broadcastState]);

  const openProjectorWindow = useCallback(() => {
    const url = window.location.origin + window.location.pathname + '#projector';
    const features = 'width=1280,height=720,menubar=no,toolbar=no,location=no,status=no';
    
    // Save current state right before opening
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}

    const popup = window.open(url, 'WorshipCloudProjectorWindow', features);
    popupRef.current = popup;

    // Send immediate sync when popup loads
    setTimeout(() => {
      if (popup && !popup.closed) {
        try {
          popup.postMessage({ type: 'PROJECTOR_SYNC_STATE', payload: state }, '*');
        } catch {}
      }
    }, 500);
  }, [state]);

  const closeProjectorWindow = useCallback(() => {
    // 1. Direct popup ref if held
    if (popupRef.current && !popupRef.current.closed) {
      try {
        popupRef.current.close();
      } catch (e) {}
    }
    // 2. BroadcastChannel
    if (channelRef.current) {
      try {
        channelRef.current.postMessage({ type: 'CLOSE_PROJECTOR_WINDOW' });
      } catch (e) {}
    }
    // 3. Storage trigger
    try {
      localStorage.setItem('ortho_close_projector_trigger', String(Date.now()));
    } catch (e) {}
  }, []);

  return {
    ...state,
    projectSlide,
    projectVerse,
    projectSongStanza,
    toggleBlackout,
    toggleClear,
    unproject,
    nextSlide,
    prevSlide,
    addHighlight,
    removeHighlight,
    clearHighlights,
    setHighlightColor,
    setProjectorTheme,
    openProjectorWindow,
    closeProjectorWindow
  };
}
