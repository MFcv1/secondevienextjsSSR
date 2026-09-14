export const displayQuoteStatus = (status) => ({ qualifying: 'in_review', waiting_customer: 'in_review', proposal_ready: 'in_review', declined: 'closed' }[status] || status || 'new');

export const quoteDraft = (quote) => ({
  quoteId: quote.quoteId, expectedVersion: quote.version, status: displayQuoteStatus(quote.status),
  internalNotes: quote.internalNotes || '', proposal: quote.proposal || null,
});

export const euroRange = ({ minCents = 0, maxCents = 0 } = {}) => {
  const euro = value => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value / 100);
  return minCents === maxCents ? euro(minCents) : `${euro(minCents)} – ${euro(maxCents)}`;
};
