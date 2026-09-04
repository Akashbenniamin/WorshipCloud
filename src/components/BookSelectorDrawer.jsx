import React, { useState, useMemo } from 'react';
import { X, Search, BookOpen, ChevronRight } from 'lucide-react';
import { normalizeSearch } from '../lib/searchParser';

export function BookSelectorDrawer({
  isOpen,
  onClose,
  booksMeta,
  currentBookCode,
  currentChapter,
  onSelectBookChapter
}) {
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'OT', 'NT'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState(null);

  // Initialize selectedBook when opening drawer
  React.useEffect(() => {
    if (isOpen && currentBookCode) {
      const found = booksMeta.find((b) => b.code === currentBookCode);
      if (found) setSelectedBook(found);
    }
  }, [isOpen, currentBookCode, booksMeta]);

  const filteredBooks = useMemo(() => {
    let list = booksMeta;
    if (activeTab === 'OT') list = list.filter((b) => b.testament === 'OT');
    if (activeTab === 'NT') list = list.filter((b) => b.testament === 'NT');

    if (!searchQuery.trim()) return list;
    const needle = normalizeSearch(searchQuery);
    return list.filter((b) => {
      if (normalizeSearch(b.name).includes(needle)) return true;
      if (normalizeSearch(b.english).includes(needle)) return true;
      if (normalizeSearch(b.code).includes(needle)) return true;
      return (b.aliases || []).some((a) => normalizeSearch(a).includes(needle));
    });
  }, [booksMeta, activeTab, searchQuery]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 100,
      backgroundColor: 'rgba(0, 0, 0, 0.55)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }} onClick={onClose}>
      <div style={{
        backgroundColor: 'var(--bg-canvas)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '860px',
        maxHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'var(--shadow-lg)',
        overflow: 'hidden'
      }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          padding: '1rem 1.25rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          backgroundColor: 'var(--bg-surface)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={20} style={{ color: 'var(--accent)' }} />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              புத்தகம் & அதிகாரம் தேர்ந்தெடுக்கவும்
            </h2>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-tertiary)', padding: '4px' }}>
            <X size={20} />
          </button>
        </div>

        {/* Content Body: Left Column Books, Right Column Chapters */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          {/* Books Column */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            borderRight: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-canvas)'
          }}>
            {/* Filter Tabs & Search */}
            <div style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{
                display: 'flex',
                backgroundColor: 'var(--bg-surface)',
                borderRadius: '8px',
                padding: '2px',
                marginBottom: '0.6rem'
              }}>
                <button
                  onClick={() => setActiveTab('all')}
                  style={{
                    flex: 1,
                    padding: '4px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    borderRadius: '6px',
                    color: activeTab === 'all' ? 'var(--accent-contrast)' : 'var(--text-secondary)',
                    backgroundColor: activeTab === 'all' ? 'var(--accent)' : 'transparent'
                  }}
                >
                  அனைத்தும் (66)
                </button>
                <button
                  onClick={() => setActiveTab('OT')}
                  style={{
                    flex: 1,
                    padding: '4px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    borderRadius: '6px',
                    color: activeTab === 'OT' ? 'var(--accent-contrast)' : 'var(--text-secondary)',
                    backgroundColor: activeTab === 'OT' ? 'var(--accent)' : 'transparent'
                  }}
                >
                  பழைய ஏற்பாடு (39)
                </button>
                <button
                  onClick={() => setActiveTab('NT')}
                  style={{
                    flex: 1,
                    padding: '4px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    borderRadius: '6px',
                    color: activeTab === 'NT' ? 'var(--accent-contrast)' : 'var(--text-secondary)',
                    backgroundColor: activeTab === 'NT' ? 'var(--accent)' : 'transparent'
                  }}
                >
                  புதிய ஏற்பாடு (27)
                </button>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '6px 10px'
              }}>
                <Search size={14} style={{ color: 'var(--text-tertiary)' }} />
                <input
                  type="text"
                  placeholder="புத்தகம் தேட..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    fontSize: '0.85rem',
                    color: 'var(--text-primary)',
                    width: '100%'
                  }}
                />
              </div>
            </div>

            {/* Books List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {filteredBooks.map((b) => {
                  const isSelected = selectedBook?.code === b.code;
                  return (
                    <button
                      key={b.code}
                      onClick={() => setSelectedBook(b)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        backgroundColor: isSelected ? 'var(--accent-light)' : 'transparent',
                        border: isSelected ? '1px solid var(--accent)' : '1px solid transparent',
                        textAlign: 'left',
                        transition: 'all 0.1s ease'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.92rem', color: isSelected ? 'var(--accent)' : 'var(--text-primary)' }}>
                          {b.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                          {b.english} · {b.chapters} அதிகாரம்
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{
                          fontSize: '0.72rem',
                          color: 'var(--page-tag-text)',
                          backgroundColor: 'var(--page-tag-bg)',
                          padding: '2px 6px',
                          borderRadius: '4px'
                        }}>
                          பக். {b.startPage}
                        </span>
                        <ChevronRight size={14} style={{ color: isSelected ? 'var(--accent)' : 'var(--text-tertiary)' }} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Chapters Column */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'var(--bg-surface)',
            padding: '1rem',
            overflowY: 'auto'
          }}>
            {selectedBook ? (
              <div>
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {selectedBook.name} ({selectedBook.english})
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                    அதிகாரத்தைத் தேர்ந்தெடுக்கவும் (1 முதல் {selectedBook.chapters}) · பக். {selectedBook.startPage}
                  </div>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(48px, 1fr))',
                  gap: '8px'
                }}>
                  {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map((chNum) => {
                    const isCurrent = currentBookCode === selectedBook.code && currentChapter === chNum;
                    return (
                      <button
                        key={chNum}
                        onClick={() => {
                          onSelectBookChapter(selectedBook.code, chNum);
                          onClose();
                        }}
                        style={{
                          height: '44px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '8px',
                          fontSize: '0.95rem',
                          fontWeight: 600,
                          backgroundColor: isCurrent ? 'var(--accent)' : 'var(--bg-canvas)',
                          color: isCurrent ? 'var(--accent-contrast)' : 'var(--text-primary)',
                          border: `1px solid ${isCurrent ? 'var(--accent)' : 'var(--border-subtle)'}`,
                          boxShadow: 'var(--shadow-sm)',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => {
                          if (!isCurrent) e.currentTarget.style.borderColor = 'var(--accent)';
                        }}
                        onMouseLeave={(e) => {
                          if (!isCurrent) e.currentTarget.style.borderColor = 'var(--border-subtle)';
                        }}
                      >
                        {chNum}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-tertiary)' }}>
                முதலில் ஒரு புத்தகத்தைத் தேர்ந்தெடுக்கவும்
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
