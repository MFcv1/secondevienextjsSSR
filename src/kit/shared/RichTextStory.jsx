import React from 'react';
import { getStoryHighlightStyle, parseStoryBlocks, tokenizeStoryInline } from '../../lib/content/storyFormatting';

function InlineStory({ value }) {
  return tokenizeStoryInline(value).map((token, index) => {
    const key = `${token.type}-${index}`;
    if (token.type === 'strong') return <strong key={key} className="font-extrabold text-inherit">{token.text}</strong>;
    if (token.type === 'emphasis') return <em key={key}>{token.text}</em>;
    if (token.type === 'highlight') return <mark key={key} className="rounded-[0.22em] px-[0.12em]" style={getStoryHighlightStyle(token.mode, token.color)}>{token.text}</mark>;
    return <React.Fragment key={key}>{token.text}</React.Fragment>;
  });
}

export default function RichTextStory({ value, className = '' }) {
  const blocks = parseStoryBlocks(value);
  if (!blocks.length) return null;

  return (
    <div className={`space-y-3 ${className}`}>
      {blocks.map((block, index) => {
        const key = `${block.type}-${index}`;
        if (block.type === 'heading') return <h3 key={key} className="text-[1.08em] font-extrabold tracking-[-0.02em]"><InlineStory value={block.text} /></h3>;
        if (block.type === 'quote') return <blockquote key={key} className="border-l-2 border-emerald-500/45 pl-3 italic opacity-80"><InlineStory value={block.text} /></blockquote>;
        if (block.type === 'unordered-list' || block.type === 'ordered-list') {
          const List = block.type === 'ordered-list' ? 'ol' : 'ul';
          return <List key={key} className={`space-y-1 pl-5 ${block.type === 'ordered-list' ? 'list-decimal' : 'list-disc'}`}>{block.items.map((item, itemIndex) => <li key={`${key}-${itemIndex}`}><InlineStory value={item} /></li>)}</List>;
        }
        return <p key={key}><InlineStory value={block.text} /></p>;
      })}
    </div>
  );
}
