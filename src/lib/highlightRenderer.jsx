import React from 'react';

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function renderHighlightedContent(text, highlights = []) {
  if (!text) return null;
  const validHighlights = (highlights || []).filter((h) => h && h.text);
  if (!validHighlights.length) return text;

  const terms = [...new Set(validHighlights.map((h) => h.text))].sort((a, b) => b.length - a.length);
  const lookup = new Map(validHighlights.map((h) => [h.text.toLowerCase(), h]));

  try {
    const pattern = new RegExp(`(${terms.map(escapeRegExp).join('|')})`, 'gi');
    const parts = String(text).split(pattern);

    return parts.map((part, index) => {
      const match = lookup.get(part.toLowerCase());
      if (match) {
        return (
          <mark
            key={index}
            style={{
              backgroundColor: match.color || '#f6d365',
              color: '#090d14',
              borderRadius: '6px',
              padding: '2px 6px',
              fontWeight: 700,
              boxShadow: '0 0 10px rgba(246, 211, 101, 0.4)'
            }}
          >
            {part}
          </mark>
        );
      }
      return part;
    });
  } catch (e) {
    return text;
  }
}
