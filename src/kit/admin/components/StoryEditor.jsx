'use client';

import React from 'react';
import { Bold, Eraser, Heading2, Highlighter, Italic, List, ListOrdered, Quote, Redo2, Undo2 } from 'lucide-react';
import {
  getStoryHighlightStyle,
  parseStoryBlocks,
  STORY_HIGHLIGHT_COLORS,
  STORY_HIGHLIGHT_MODES,
  tokenizeStoryInline,
} from '../../../lib/content/storyFormatting';
import RichTextStory from '../../shared/RichTextStory';

const TOOLS = [
  { id: 'bold', label: 'Gras', Icon: Bold, command: 'bold' },
  { id: 'italic', label: 'Italique', Icon: Italic, command: 'italic' },
  { id: 'highlight', label: 'Surligner', Icon: Highlighter },
  { id: 'heading', label: 'Intertitre', Icon: Heading2, command: 'formatBlock', value: 'h3' },
  { id: 'list', label: 'Liste', Icon: List, command: 'insertUnorderedList' },
  { id: 'ordered', label: 'Liste numérotée', Icon: ListOrdered, command: 'insertOrderedList' },
  { id: 'quote', label: 'Citation', Icon: Quote, command: 'formatBlock', value: 'blockquote' },
];

const escapeHtml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const styleObjectToCss = (style) => Object.entries(style)
  .map(([property, propertyValue]) => `${property.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}:${propertyValue}`)
  .join(';');

const setMarkAppearance = (mark, mode, color) => {
  mark.dataset.highlightMode = mode;
  mark.dataset.highlightColor = color;
  mark.setAttribute('style', styleObjectToCss(getStoryHighlightStyle(mode, color)));
};

const inlineMarkdownToHtml = (value) => tokenizeStoryInline(value).map((token) => {
  const text = escapeHtml(token.text);
  if (token.type === 'strong') return `<strong>${text}</strong>`;
  if (token.type === 'emphasis') return `<em>${text}</em>`;
  if (token.type === 'highlight') {
    const style = styleObjectToCss(getStoryHighlightStyle(token.mode, token.color));
    return `<mark data-highlight-mode="${token.mode}" data-highlight-color="${token.color}" style="${style}">${text}</mark>`;
  }
  return text;
}).join('');

const markdownToEditorHtml = (value) => parseStoryBlocks(value).map((block) => {
  if (block.type === 'heading') return `<h3>${inlineMarkdownToHtml(block.text)}</h3>`;
  if (block.type === 'quote') return `<blockquote>${inlineMarkdownToHtml(block.text)}</blockquote>`;
  if (block.type === 'unordered-list' || block.type === 'ordered-list') {
    const tag = block.type === 'ordered-list' ? 'ol' : 'ul';
    return `<${tag}>${block.items.map((item) => `<li>${inlineMarkdownToHtml(item)}</li>`).join('')}</${tag}>`;
  }
  return `<p>${inlineMarkdownToHtml(block.text)}</p>`;
}).join('');

const nodeToMarkdown = (node, listIndex = 0) => {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent || '';
  if (node.nodeType !== Node.ELEMENT_NODE) return '';

  const tag = node.tagName.toLowerCase();
  const children = Array.from(node.childNodes).map((child) => nodeToMarkdown(child)).join('');
  if (tag === 'strong' || tag === 'b') return children ? `**${children}**` : '';
  if (tag === 'em' || tag === 'i') return children ? `_${children}_` : '';
  const backgroundColor = String(node.style?.backgroundColor || '').toLowerCase();
  if (tag === 'mark') {
    const mode = STORY_HIGHLIGHT_MODES[node.dataset.highlightMode] ? node.dataset.highlightMode : 'fill';
    const color = STORY_HIGHLIGHT_COLORS[node.dataset.highlightColor] ? node.dataset.highlightColor : 'yellow';
    return children ? `==${mode}:${color}|${children}==` : '';
  }
  if (tag === 'span' && backgroundColor && !backgroundColor.includes('transparent') && backgroundColor !== 'rgba(0, 0, 0, 0)') return children ? `==fill:yellow|${children}==` : '';
  if (tag === 'br') return '\n';
  if (tag === 'h2' || tag === 'h3') return `## ${children.trim()}\n`;
  if (tag === 'blockquote') return `> ${children.trim()}\n`;
  if (tag === 'li') return `${listIndex ? `${listIndex}. ` : '- '}${children.trim()}\n`;
  if (tag === 'ul' || tag === 'ol') {
    const ordered = tag === 'ol';
    return Array.from(node.children).map((child, index) => nodeToMarkdown(child, ordered ? index + 1 : 0)).join('');
  }
  if (tag === 'p' || tag === 'div') return `${children.trim()}\n`;
  return children;
};

const editorHtmlToMarkdown = (editor) => Array.from(editor.childNodes)
  .map((node) => nodeToMarkdown(node))
  .join('')
  .replace(/\u00a0/g, ' ')
  .replace(/[ \t]+\n/g, '\n')
  .replace(/\n{3,}/g, '\n\n')
  .trimEnd()
  .slice(0, 10000);

export default function StoryEditor({ value, onChange, darkMode = false }) {
  const editorRef = React.useRef(null);
  const lastEmittedValueRef = React.useRef(null);
  const historyRef = React.useRef({ entries: [value], index: 0, lastInputAt: 0 });
  const [mode, setMode] = React.useState('write');
  const [activeFormats, setActiveFormats] = React.useState({});
  const [editorHint, setEditorHint] = React.useState('Mise en forme visuelle sans caractères techniques');
  const [highlightPaletteOpen, setHighlightPaletteOpen] = React.useState(false);
  const [highlightChoice, setHighlightChoice] = React.useState({ mode: 'fill', color: 'yellow' });
  const [historyAvailability, setHistoryAvailability] = React.useState({ canUndo: false, canRedo: false });

  React.useLayoutEffect(() => {
    const editor = editorRef.current;
    if (!editor || mode !== 'write') return;
    if (value === lastEmittedValueRef.current && editor.dataset.initialized === 'true') return;
    const externalValue = value !== lastEmittedValueRef.current;
    editor.innerHTML = markdownToEditorHtml(value);
    editor.dataset.initialized = 'true';
    if (externalValue) {
      historyRef.current = { entries: [value], index: 0, lastInputAt: 0 };
      setHistoryAvailability({ canUndo: false, canRedo: false });
    }
  }, [mode, value]);

  const updateHistoryAvailability = () => {
    const history = historyRef.current;
    setHistoryAvailability({
      canUndo: history.index > 0,
      canRedo: history.index < history.entries.length - 1,
    });
  };

  const emitValue = (nextValue, { boundary = false } = {}) => {
    const history = historyRef.current;
    const now = Date.now();
    if (nextValue !== history.entries[history.index]) {
      if (boundary || !history.lastInputAt || now - history.lastInputAt > 700) {
        history.entries = history.entries.slice(0, history.index + 1);
        history.entries.push(nextValue);
        if (history.entries.length > 80) history.entries.shift();
        history.index = history.entries.length - 1;
      } else {
        history.entries[history.index] = nextValue;
      }
    }
    history.lastInputAt = boundary ? 0 : now;
    lastEmittedValueRef.current = nextValue;
    onChange(nextValue);
    updateHistoryAvailability();
  };

  const syncFromEditor = (options) => {
    const editor = editorRef.current;
    if (!editor) return;
    const nextValue = editorHtmlToMarkdown(editor);
    emitValue(nextValue, options);
  };

  const restoreHistory = (direction) => {
    const history = historyRef.current;
    const nextIndex = direction === 'undo' ? history.index - 1 : history.index + 1;
    if (nextIndex < 0 || nextIndex >= history.entries.length) return;
    history.index = nextIndex;
    history.lastInputAt = 0;
    const nextValue = history.entries[nextIndex];
    lastEmittedValueRef.current = nextValue;
    if (editorRef.current) {
      editorRef.current.innerHTML = markdownToEditorHtml(nextValue);
      editorRef.current.dataset.initialized = 'true';
      editorRef.current.focus();
    }
    onChange(nextValue);
    setHighlightPaletteOpen(false);
    setEditorHint(direction === 'undo' ? 'Dernière modification annulée.' : 'Modification rétablie.');
    updateHistoryAvailability();
  };

  const refreshActiveFormats = () => {
    if (typeof document === 'undefined') return;
    const formatBlock = String(document.queryCommandValue('formatBlock') || '').toLowerCase();
    const selection = window.getSelection();
    const anchorElement = selection?.anchorNode?.nodeType === Node.ELEMENT_NODE
      ? selection.anchorNode
      : selection?.anchorNode?.parentElement;
    const activeMark = anchorElement?.closest?.('mark');
    if (activeMark && editorRef.current?.contains(activeMark)) {
      setHighlightChoice({
        mode: STORY_HIGHLIGHT_MODES[activeMark.dataset.highlightMode] ? activeMark.dataset.highlightMode : 'fill',
        color: STORY_HIGHLIGHT_COLORS[activeMark.dataset.highlightColor] ? activeMark.dataset.highlightColor : 'yellow',
      });
    }
    setActiveFormats({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      highlight: Boolean(activeMark && editorRef.current?.contains(activeMark)),
      heading: formatBlock === 'h3' || Boolean(anchorElement?.closest?.('h3')),
      quote: formatBlock === 'blockquote',
      list: document.queryCommandState('insertUnorderedList'),
      ordered: document.queryCommandState('insertOrderedList'),
    });
  };

  const getEditorRange = () => {
    const editor = editorRef.current;
    const selection = window.getSelection();
    if (!editor || !selection || selection.rangeCount === 0) return null;
    const range = selection.getRangeAt(0);
    return editor.contains(range.commonAncestorContainer) ? { editor, selection, range } : null;
  };

  const getActiveMark = (selectionState) => {
    if (!selectionState) return null;
    const anchorNode = selectionState.selection.anchorNode;
    const anchorElement = anchorNode?.nodeType === Node.ELEMENT_NODE ? anchorNode : anchorNode?.parentElement;
    const mark = anchorElement?.closest?.('mark');
    return mark && selectionState.editor.contains(mark) ? mark : null;
  };

  const openHighlightPalette = (forceOpen = false) => {
    const selectionState = getEditorRange();
    const activeMark = getActiveMark(selectionState);
    if (!selectionState || (selectionState.range.collapsed && !activeMark)) {
      setHighlightPaletteOpen(false);
      setEditorHint('Double-clique un mot ou sélectionne une phrase, puis ouvre le surligneur.');
      return;
    }

    if (activeMark) {
      setHighlightChoice({
        mode: STORY_HIGHLIGHT_MODES[activeMark.dataset.highlightMode] ? activeMark.dataset.highlightMode : 'fill',
        color: STORY_HIGHLIGHT_COLORS[activeMark.dataset.highlightColor] ? activeMark.dataset.highlightColor : 'yellow',
      });
    }
    setHighlightPaletteOpen((open) => forceOpen || !open);
    setEditorHint('Choisis un style puis une couleur.');
  };

  const applyHighlight = (modeValue, colorValue) => {
    const selectionState = getEditorRange();
    if (!selectionState) return;

    const { selection, range } = selectionState;
    const activeMark = getActiveMark(selectionState);
    if (range.collapsed && activeMark) {
      setMarkAppearance(activeMark, modeValue, colorValue);
      setHighlightChoice({ mode: modeValue, color: colorValue });
      setHighlightPaletteOpen(false);
      setEditorHint(`${STORY_HIGHLIGHT_MODES[modeValue]} · ${STORY_HIGHLIGHT_COLORS[colorValue].label}`);
      syncFromEditor({ boundary: true });
      refreshActiveFormats();
      return;
    }
    if (range.collapsed) {
      setEditorHint('Sélectionne d’abord le texte à mettre en valeur.');
      return;
    }

    const startElement = range.startContainer.nodeType === Node.ELEMENT_NODE ? range.startContainer : range.startContainer.parentElement;
    const endElement = range.endContainer.nodeType === Node.ELEMENT_NODE ? range.endContainer : range.endContainer.parentElement;
    const startBlock = startElement?.closest?.('p, h3, blockquote, li, div');
    const endBlock = endElement?.closest?.('p, h3, blockquote, li, div');
    if (startBlock !== endBlock) {
      setEditorHint('Le surlignage doit rester dans un même paragraphe.');
      return;
    }

    let mark = activeMark;
    if (mark) {
      setMarkAppearance(mark, modeValue, colorValue);
    } else {
      mark = document.createElement('mark');
      setMarkAppearance(mark, modeValue, colorValue);
      mark.appendChild(range.extractContents());
      range.insertNode(mark);
    }

    const caretRange = document.createRange();
    caretRange.setStartAfter(mark);
    caretRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(caretRange);
    setHighlightChoice({ mode: modeValue, color: colorValue });
    setHighlightPaletteOpen(false);
    setEditorHint(`${STORY_HIGHLIGHT_MODES[modeValue]} · ${STORY_HIGHLIGHT_COLORS[colorValue].label}`);
    syncFromEditor({ boundary: true });
    refreshActiveFormats();
  };

  const removeHighlight = () => {
    const selectionState = getEditorRange();
    const mark = getActiveMark(selectionState);
    if (!selectionState || !mark) {
      setEditorHint('Place le curseur dans un texte déjà mis en valeur.');
      return;
    }
    const parent = mark.parentNode;
    const caretTarget = mark.lastChild;
    while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
    mark.remove();
    parent.normalize();
    const caretRange = document.createRange();
    if (caretTarget?.parentNode) caretRange.setStartAfter(caretTarget);
    else caretRange.selectNodeContents(parent);
    caretRange.collapse(true);
    selectionState.selection.removeAllRanges();
    selectionState.selection.addRange(caretRange);
    setHighlightPaletteOpen(false);
    setEditorHint('Mise en valeur retirée.');
    syncFromEditor({ boundary: true });
    refreshActiveFormats();
  };

  const toggleHeading = () => {
    const selectionState = getEditorRange();
    if (!selectionState) return;
    const { editor, selection } = selectionState;
    const anchorElement = selection.anchorNode?.nodeType === Node.ELEMENT_NODE
      ? selection.anchorNode
      : selection.anchorNode?.parentElement;
    const block = anchorElement?.closest?.('p, h3, div');
    if (!block || block === editor || !editor.contains(block)) {
      setEditorHint('Place le curseur dans une ligne pour créer un intertitre.');
      return;
    }

    const selectedText = selection.toString().trim();
    const fullLineText = block.textContent.trim();
    if (selectedText && selectedText !== fullLineText) {
      setEditorHint('H2 s’applique à une ligne complète, pas à un seul mot.');
      return;
    }

    const replacement = document.createElement(block.tagName.toLowerCase() === 'h3' ? 'p' : 'h3');
    while (block.firstChild) replacement.appendChild(block.firstChild);
    block.replaceWith(replacement);
    const nextRange = document.createRange();
    nextRange.selectNodeContents(replacement);
    nextRange.collapse(false);
    selection.removeAllRanges();
    selection.addRange(nextRange);
    setEditorHint(replacement.tagName === 'H3' ? 'Ligne transformée en intertitre.' : 'Intertitre reconverti en paragraphe.');
    syncFromEditor({ boundary: true });
    refreshActiveFormats();
  };

  const applyTool = (tool) => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    if (tool.id === 'highlight') {
      openHighlightPalette();
      return;
    }
    if (tool.id === 'heading') {
      toggleHeading();
      return;
    }
    if (tool.id === 'quote' && activeFormats[tool.id]) {
      historyRef.current.lastInputAt = 0;
      document.execCommand('formatBlock', false, 'p');
    } else {
      historyRef.current.lastInputAt = 0;
      document.execCommand(tool.command, false, tool.value || null);
    }
    setEditorHint(`${tool.label} ${activeFormats[tool.id] ? 'retiré' : 'appliqué'}.`);
    syncFromEditor({ boundary: true });
    refreshActiveFormats();
  };

  return (
    <div className={`flex min-h-[220px] flex-1 flex-col overflow-hidden rounded-[18px] border ${darkMode ? 'border-white/10 bg-black/20' : 'border-stone-200 bg-[#F8F7F4]'}`}>
      <div className={`flex min-h-11 shrink-0 items-center justify-between gap-3 border-b px-2.5 ${darkMode ? 'border-white/10' : 'border-stone-200'}`}>
        <div className="flex items-center gap-0.5 overflow-x-auto py-1 no-scrollbar">
          {TOOLS.map(({ Icon, ...tool }) => (
            <button
              key={tool.id}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => applyTool(tool)}
              title={tool.label}
              aria-label={tool.label}
              aria-pressed={Boolean(activeFormats[tool.id] || (tool.id === 'highlight' && highlightPaletteOpen))}
              className={`grid h-8 w-8 shrink-0 place-items-center rounded-[9px] transition-colors ${activeFormats[tool.id] || (tool.id === 'highlight' && highlightPaletteOpen) ? (darkMode ? 'bg-white text-stone-950' : 'bg-stone-950 text-white') : (darkMode ? 'text-stone-400 hover:bg-white/10 hover:text-white' : 'text-stone-500 hover:bg-white hover:text-stone-950')}`}
            >
              <Icon size={14} strokeWidth={1.7} />
            </button>
          ))}
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <div className={`flex items-center gap-0.5 border-x px-2 ${darkMode ? 'border-white/10' : 'border-stone-200'}`} aria-label="Historique des modifications">
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => restoreHistory('undo')}
              disabled={!historyAvailability.canUndo}
              title="Annuler (⌘Z)"
              aria-label="Annuler la dernière modification"
              className={`grid h-8 w-8 place-items-center rounded-[9px] transition-colors disabled:cursor-not-allowed disabled:opacity-25 ${darkMode ? 'text-stone-400 hover:bg-white/10 hover:text-white' : 'text-stone-500 hover:bg-white hover:text-stone-950'}`}
            >
              <Undo2 size={14} strokeWidth={1.7} />
            </button>
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => restoreHistory('redo')}
              disabled={!historyAvailability.canRedo}
              title="Rétablir (⇧⌘Z)"
              aria-label="Rétablir la modification"
              className={`grid h-8 w-8 place-items-center rounded-[9px] transition-colors disabled:cursor-not-allowed disabled:opacity-25 ${darkMode ? 'text-stone-400 hover:bg-white/10 hover:text-white' : 'text-stone-500 hover:bg-white hover:text-stone-950'}`}
            >
              <Redo2 size={14} strokeWidth={1.7} />
            </button>
          </div>
          <div className={`flex shrink-0 rounded-full p-0.5 text-[8px] font-extrabold ${darkMode ? 'bg-white/[0.06]' : 'bg-stone-200/70'}`}>
            {['write', 'preview'].map((item) => <button key={item} type="button" onClick={() => setMode(item)} className={`rounded-full px-2.5 py-1.5 ${mode === item ? 'bg-white text-stone-950' : 'text-stone-500'}`}>{item === 'write' ? 'Écrire' : 'Aperçu'}</button>)}
          </div>
        </div>
      </div>

      {highlightPaletteOpen && (
        <div className={`flex shrink-0 flex-col gap-2.5 border-b px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between ${darkMode ? 'border-white/10 bg-white/[0.035]' : 'border-stone-200 bg-white/80'}`}>
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar" aria-label="Style de mise en valeur">
            {Object.entries(STORY_HIGHLIGHT_MODES).map(([modeId, modeLabel]) => (
              <button
                key={modeId}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => setHighlightChoice((choice) => ({ ...choice, mode: modeId }))}
                aria-pressed={highlightChoice.mode === modeId}
                className={`shrink-0 rounded-full px-3 py-1.5 text-[9px] font-extrabold transition-colors ${highlightChoice.mode === modeId ? (darkMode ? 'bg-white text-stone-950' : 'bg-stone-950 text-white') : (darkMode ? 'text-stone-500 hover:text-white' : 'text-stone-500 hover:bg-stone-100')}`}
              >
                {modeLabel}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5" aria-label="Couleur de mise en valeur">
              {Object.entries(STORY_HIGHLIGHT_COLORS).map(([colorId, colorMeta]) => (
                <button
                  key={colorId}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => applyHighlight(highlightChoice.mode, colorId)}
                  aria-label={colorMeta.label}
                  title={colorMeta.label}
                  className={`grid h-7 w-7 place-items-center rounded-full transition-transform hover:scale-105 ${highlightChoice.color === colorId ? 'ring-2 ring-stone-950 ring-offset-2 dark:ring-white dark:ring-offset-stone-900' : 'ring-1 ring-black/10'}`}
                  style={{ backgroundColor: colorMeta.fill }}
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: colorMeta.color }} />
                </button>
              ))}
            </div>
            <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={removeHighlight} className={`grid h-7 w-7 place-items-center rounded-full transition-colors ${darkMode ? 'text-stone-500 hover:bg-white/10 hover:text-white' : 'text-stone-400 hover:bg-stone-100 hover:text-red-500'}`} title="Retirer la mise en valeur" aria-label="Retirer la mise en valeur">
              <Eraser size={13} strokeWidth={1.7} />
            </button>
          </div>
        </div>
      )}

      {mode === 'write' ? (
        <div
          key="story-editor-write"
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          tabIndex={0}
          aria-label="Histoire de l’objet"
          aria-multiline="true"
          data-placeholder="Racontez l’origine, la restauration, les matières et les détails qui rendent cette pièce unique…"
          onInput={syncFromEditor}
          onKeyDown={(event) => {
            const modifierPressed = event.metaKey || event.ctrlKey;
            const key = event.key.toLowerCase();
            if (modifierPressed && key === 'z') {
              event.preventDefault();
              restoreHistory(event.shiftKey ? 'redo' : 'undo');
            } else if (modifierPressed && key === 'y') {
              event.preventDefault();
              restoreHistory('redo');
            }
          }}
          onKeyUp={refreshActiveFormats}
          onMouseUp={() => {
            refreshActiveFormats();
            const selectionState = getEditorRange();
            if (selectionState && !selectionState.range.collapsed) {
              setEditorHint('Sélection prête · ouvre le surligneur pour choisir son style.');
            }
          }}
          onDoubleClick={() => requestAnimationFrame(() => openHighlightPalette(true))}
          onPaste={(event) => {
            event.preventDefault();
            const plainText = event.clipboardData.getData('text/plain');
            historyRef.current.lastInputAt = 0;
            document.execCommand('insertText', false, plainText);
            syncFromEditor({ boundary: true });
          }}
          className={`story-wysiwyg min-h-[180px] flex-1 overflow-y-auto px-4 py-3.5 text-[13px] leading-6 outline-none ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}
        />
      ) : (
        <div key="story-editor-preview" className={`min-h-[180px] flex-1 overflow-y-auto px-4 py-3.5 text-[13px] leading-6 ${darkMode ? 'text-stone-300' : 'text-stone-700'}`}>
          {value.trim() ? <RichTextStory value={value} /> : <p className="text-stone-400">L’aperçu mis en forme apparaîtra ici.</p>}
        </div>
      )}

      <div className={`flex shrink-0 items-center justify-between border-t px-4 py-2 text-[8px] font-semibold ${darkMode ? 'border-white/10 text-stone-600' : 'border-stone-200 text-stone-400'}`}>
        <span aria-live="polite">{editorHint}</span>
        <span className="tabular-nums">{value.length} / 10 000</span>
      </div>
    </div>
  );
}
