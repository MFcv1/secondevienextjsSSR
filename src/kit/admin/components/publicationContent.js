import { parseStoryBlocks, tokenizeStoryInline } from '../../../lib/content/storyFormatting';

/** Aplati le recit enrichi en texte simple, comme le recoivent les reseaux. */
export function storyToPlainText(value) {
  return parseStoryBlocks(value).map((block) => {
    if (Array.isArray(block.items)) {
      return block.items.map((item) => tokenizeStoryInline(item).map((token) => token.text).join('')).join(' · ');
    }
    return tokenizeStoryInline(block.text || '').map((token) => token.text).join('');
  }).filter(Boolean).join(' ');
}

export const INSTAGRAM_MEDIA_LIMIT = 10;
export const FACEBOOK_MEDIA_LIMIT = 10;

/** Phrase de diffusion lisible : « le site », « le site et Instagram »… */
export function describeChannels({ instagram = false, facebook = false } = {}) {
  const extras = [instagram ? 'Instagram' : null, facebook ? 'Facebook' : null].filter(Boolean);
  if (extras.length === 0) return 'le site uniquement';
  if (extras.length === 1) return `le site et ${extras[0]}`;
  return `le site, ${extras[0]} et ${extras[1]}`;
}
