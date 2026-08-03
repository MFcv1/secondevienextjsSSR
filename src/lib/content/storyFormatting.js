const INLINE_PATTERN = /(\*\*[^*]+\*\*|==[^=]+==|_[^_]+_)/g;

export const STORY_HIGHLIGHT_COLORS = Object.freeze({
  yellow: { label: 'Vanille', color: '#7a5a00', fill: '#fde9a9' },
  mint: { label: 'Menthe', color: '#155e4b', fill: '#bdebdc' },
  rose: { label: 'Rose', color: '#9f3151', fill: '#f8cfdb' },
  blue: { label: 'Ciel', color: '#245b83', fill: '#cce6f7' },
  lilac: { label: 'Lilas', color: '#69458a', fill: '#e5d6f3' },
});

export const STORY_HIGHLIGHT_MODES = Object.freeze({
  fill: 'Fond',
  underline: 'Souligné',
  text: 'Texte',
});

export function getStoryHighlightStyle(mode = 'fill', color = 'yellow') {
  const palette = STORY_HIGHLIGHT_COLORS[color] || STORY_HIGHLIGHT_COLORS.yellow;
  if (mode === 'underline') {
    return {
      backgroundColor: 'transparent',
      backgroundImage: `linear-gradient(transparent 68%, ${palette.fill} 68%)`,
      color: 'inherit',
    };
  }
  if (mode === 'text') {
    return { backgroundColor: 'transparent', color: palette.color };
  }
  return { backgroundColor: palette.fill, color: 'inherit' };
}

export function tokenizeStoryInline(value = '') {
  return String(value)
    .split(INLINE_PATTERN)
    .filter(Boolean)
    .map((part) => {
      if (part.startsWith('**') && part.endsWith('**')) return { type: 'strong', text: part.slice(2, -2) };
      if (part.startsWith('==') && part.endsWith('==')) {
        const content = part.slice(2, -2);
        const styled = content.match(/^(fill|underline|text):(yellow|mint|rose|blue|lilac)\|([\s\S]+)$/);
        return styled
          ? { type: 'highlight', mode: styled[1], color: styled[2], text: styled[3] }
          : { type: 'highlight', mode: 'fill', color: 'yellow', text: content };
      }
      if (part.startsWith('_') && part.endsWith('_')) return { type: 'emphasis', text: part.slice(1, -1) };
      return { type: 'text', text: part };
    });
}

export function parseStoryBlocks(value = '') {
  const blocks = [];
  let activeList = null;

  const flushList = () => {
    if (activeList) blocks.push(activeList);
    activeList = null;
  };

  String(value).replace(/\r\n/g, '\n').split('\n').forEach((rawLine) => {
    const line = rawLine.trimEnd();
    if (!line.trim()) {
      flushList();
      return;
    }

    const unordered = line.match(/^\s*-\s+(.+)$/);
    const ordered = line.match(/^\s*\d+\.\s+(.+)$/);
    if (unordered || ordered) {
      const type = ordered ? 'ordered-list' : 'unordered-list';
      if (!activeList || activeList.type !== type) {
        flushList();
        activeList = { type, items: [] };
      }
      activeList.items.push((ordered || unordered)[1]);
      return;
    }

    flushList();
    if (/^\s*##\s+/.test(line)) blocks.push({ type: 'heading', text: line.replace(/^\s*##\s+/, '') });
    else if (/^\s*>\s+/.test(line)) blocks.push({ type: 'quote', text: line.replace(/^\s*>\s+/, '') });
    else blocks.push({ type: 'paragraph', text: line.trim() });
  });

  flushList();
  return blocks;
}

export function stripStoryFormatting(value = '') {
  return String(value)
    .replace(/^\s*(?:##|>|-|\d+\.)\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/==(?:(?:fill|underline|text):(?:yellow|mint|rose|blue|lilac)\|)?([^=]+)==/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}
