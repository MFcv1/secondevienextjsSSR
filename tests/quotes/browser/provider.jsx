import React from 'react';
export const ADMIN_QUOTES_CACHE_KEY = 'quotes';
const photo = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="#ded2bd"/><rect x="60" y="100" width="280" height="210" rx="8" fill="#957b57"/></svg>');
let quote = { quoteId: 'quote-local', requestNumber: 'DEV-LOCAL', version: 1, status: 'new', intakeStatus: 'submitted', createdAt: '2026-09-14T10:00:00Z', customer: { firstName: 'Camille', fullName: 'Camille Martin', email: 'camille@example.test', phone: '0600000000', location: 'Caen' }, project: { furnitureLabel: 'Buffet', condition: 'Rayures visibles', description: 'Un buffet familial à restaurer.', services: [{ label: 'Ponçage manuel', minCents: 4500, maxCents: 12000 }], indicativeEstimate: { minCents: 4500, maxCents: 12000 } }, photoCount: 2, photos: [{ photoId: 'one', url: photo, width: 400, height: 400 }, { photoId: 'two', url: photo, width: 400, height: 400 }] };
export const getAdminCachedData = () => ({ quotes: [quote], hasMore: false });
export const loadQuoteRequestsAdmin = async () => ({ quotes: [quote], hasMore: false });
export const getQuoteRequestAdmin = async () => ({ quote });
export async function updateQuoteRequestAdmin(payload) {
  window.actions = [...(window.actions || []), payload.action];
  if (payload.action === 'save' && window.failSave) throw new Error('Enregistrement indisponible. Réessayez.');
  quote = { ...quote, version: quote.version + 1 };
  if (payload.action === 'save') quote = { ...quote, status: payload.status, internalNotes: payload.internalNotes, proposal: payload.proposal };
  if (payload.action === 'trash') quote.deletedAt = '2026-09-14';
  if (payload.action === 'restore') quote.deletedAt = null;
  if (payload.action === 'send') quote = { ...quote, status: 'proposal_sent', proposalEmail: { status: 'sent', proposal: quote.proposal, completedAt: '2026-09-14T12:00:00Z' } };
  return { quote };
}
export default function Image({ fill, unoptimized: _unoptimized, ...props }) {
  return React.createElement('img', { ...props, style: fill ? { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' } : undefined });
}
